/**
 * CoatSurface —— 把一张猫身照片变成"可变形毛皮"
 *
 * 做法：照片不做逐像素重绘，而是当作一张可形变的贴图（76×48 网格）。
 *  - xy：每个网格顶点在贴图里的采样位置（被按压/塌陷时由 OverheadCat 改写）
 *  - light：每个顶点的光照向量（着色用）
 *  - lift：隆起量（长毛猫的毛束被压弯的程度）
 *
 * 三条通道各有一张"材质图"：
 *  - strand：毛流方向（R 通道），决定高光往哪边扫
 *  - locks：发束的偏移与隆起（长毛猫按毛流方向撒"毛束"生成；短毛猫用邻域高光梯度）
 *  - napFactor：毛向因子表，光线逆毛和顺毛的亮度差（猫毛"丝绒感"的关键）
 *
 * 两种渲染路径，输出完全一致：
 *  - WebGL：顶点着色器把网格铺到画布，片元着色器做毛束位移 + 光照 + 毛向叠加
 *  - Canvas2D：warp() 用逆向映射逐像素采样（没有 WebGL 时的兜底，也用于导出静态帧）
 *
 * 怎么读：先看 setImage() 了解三张材质图怎么来的，再看 warp() 或 program() 里的片元着色器。
 */

'use strict';
const { CoatSurface } = (() => {
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const napFactor = new Float64Array(512);
  for (let i = 0; i < 256; i++) {
    const fibre = i / 127.5 - 1;
    napFactor[i] = -6.885 + 3.06 + 8.16 * fibre;
    napFactor[256 + i] = -6.885 - 3.06 - 8.16 * fibre - 3.825 * Math.max(fibre, 0);
  }
  const surfaceTile = 12;
  function alphaCoverage(pixels, width, height) {
    const cols = Math.ceil(width / surfaceTile),
      rows = Math.ceil(height / surfaceTile),
      stride = cols + 1;
    const visible = new Uint32Array(stride * (rows + 1)),
      translucent = new Uint32Array(visible.length);
    for (let row = 0; row < rows; row++) {
      let visibleCount = 0,
        translucentCount = 0;
      for (let col = 0; col < cols; col++) {
        const left = col * surfaceTile,
          right = Math.min(left + surfaceTile, width);
        const top = row * surfaceTile,
          bottom = Math.min(top + surfaceTile, height);
        let min = 255,
          max = 0;
        for (let y = top; y < bottom && (min === 255 || max <= 1); y++) {
          for (let n = 4 * (y * width + left) + 3, end = 4 * (y * width + right); n < end; n += 4) {
            min = Math.min(min, pixels[n]);
            max = Math.max(max, pixels[n]);
          }
        }
        const i = (row + 1) * stride + col + 1;
        if (max > 1) visibleCount++;
        if (min < 255) translucentCount++;
        visible[i] = visible[i - stride] + visibleCount;
        translucent[i] = translucent[i - stride] + translucentCount;
      }
    }
    return { visible, translucent, stride, cols, rows };
  }
  function coverageAt(map, left, top, right, bottom) {
    const { visible, translucent, stride, cols, rows } = map;
    const x = clamp(Math.floor((left - 2) / surfaceTile), 0, cols),
      X = clamp(Math.ceil((right + 2) / surfaceTile), 0, cols);
    const y = clamp(Math.floor((top - 2) / surfaceTile), 0, rows) * stride,
      Y = clamp(Math.ceil((bottom + 2) / surfaceTile), 0, rows) * stride;
    if (visible[Y + X] - visible[y + X] - visible[Y + x] + visible[y + x] === 0) return 0;
    return translucent[Y + X] - translucent[y + X] - translucent[Y + x] + translucent[y + x] === 0
      ? 255
      : 1;
  }
  function sampleChannel(src, top, bottom, fx, fy) {
    const a = src[top] + (src[top + 4] - src[top]) * fx;
    const b = src[bottom] + (src[bottom + 4] - src[bottom]) * fx;
    return a + (b - a) * fy;
  }
  function surfaceGrid(cols, rows) {
    const uv = new Float32Array((cols + 1) * (rows + 1) * 2),
      idx = new Uint16Array(cols * rows * 6);
    let k = 0;
    for (let y = 0; y <= rows; y++)
      for (let x = 0; x <= cols; x++) {
        const n = y * (cols + 1) + x;
        uv[n * 2] = x / cols;
        uv[n * 2 + 1] = y / rows;
        if (y < rows && x < cols) {
          idx.set([n, n + 1, n + cols + 1, n + 1, n + cols + 2, n + cols + 1], k);
          k += 6;
        }
      }
    return { uv, idx };
  }
  function lockTexture(data, luma, strand, w, h) {
    const map = new Uint8Array(w * h * 4),
      weight = new Uint16Array(w * h),
      underfur = new Uint8Array(w * h);
    for (let i = 0; i < w * h; i++) {
      map[i * 4] = strand[i];
      map[i * 4 + 1] = map[i * 4 + 2] = map[i * 4 + 3] = 128;
    }
    let seed = 873713;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    const scale = w / 970,
      step = 12 * scale;
    for (let row = step; row < h - step; row += step * 0.63) {
      for (let col = step; col < w - step; col += step) {
        const x = Math.round(col + (random() - 0.5) * step),
          y = Math.round(row + (random() - 0.5) * step * 0.7);
        if (data[4 * (y * w + x) + 3] < 160) continue;
        const side = clamp((y / h - 0.48) * 3.5, -1, 1);
        const angle = Math.atan2(side, 0.83),
          gx = Math.cos(angle),
          gy = Math.sin(angle);
        let xx = 0,
          xy = 0,
          yy = 0;
        for (let j = -6; j <= 6; j += 3)
          for (let i = -6; i <= 6; i += 3) {
            const n = (y + j) * w + x + i;
            if (data[4 * n + 3] < 240) continue;
            const dx = luma[n + 1] - luma[n - 1],
              dy = luma[n + w] - luma[n - w];
            xx += dx * dx;
            xy += dx * dy;
            yy += dy * dy;
          }
        const grain = 0.5 * Math.atan2(2 * xy, xx - yy) + Math.PI / 2;
        const coherence = Math.min(0.85, Math.hypot(xx - yy, 2 * xy) / (xx + yy + 75));
        let tx = Math.cos(grain),
          ty = Math.sin(grain);
        if (tx * gx + ty * gy < 0) {
          tx = -tx;
          ty = -ty;
        }
        tx = gx * (1 - coherence) + tx * coherence;
        ty = gy * (1 - coherence) + ty * coherence;
        const norm = Math.hypot(tx, ty);
        tx /= norm;
        ty /= norm;
        const deep = random() < 0.17;
        const length = (12 + 15 * random() + (deep ? 15 : 0)) * scale,
          width = (2.1 + 4.2 * random() + (deep ? 3 : 0)) * scale;
        const lean = (random() - 0.5) * 1.4,
          travel = 0.52 + 0.44 * random();
        const endX = x + length * tx,
          endY = y + length * ty,
          pad = Math.ceil(2 * width + 1);
        const top = Math.max(0, Math.floor(Math.min(y, endY)) - pad),
          bottom = Math.min(h - 1, Math.ceil(Math.max(y, endY)) + pad);
        const left = Math.max(0, Math.floor(Math.min(x, endX)) - pad),
          right = Math.min(w - 1, Math.ceil(Math.max(x, endX)) + pad);
        for (let py = top; py <= bottom; py++)
          for (let px = left; px <= right; px++) {
            const dx = px - x,
              dy = py - y,
              t = (dx * tx + dy * ty) / length;
            if (t <= 0 || t >= 1) continue;
            const bow = t * (1 - t) * 4;
            const cross = (-dx * ty + dy * tx) / width - lean * bow;
            const envelope = clamp(1 - Math.abs(cross) / (0.45 + 0.69 * bow), 0, 1);
            const lift =
              t * (2 - t) * Math.min(1, (1 - t) * 5) * envelope * envelope * (3 - 2 * envelope);
            const n = py * w + px,
              coverage = Math.round(255 * lift * lift);
            if (deep && envelope > 0) {
              const fold = t - 0.46 - 0.15 * cross * cross,
                along = Math.max(0, 1 - (fold * fold) / 0.082);
              const edge = cross + (lean < 0 ? -0.26 : 0.26),
                across = Math.max(0, 1 - (edge * edge) / 0.63);
              const shade = along * along * across * across;
              if (shade) underfur[n] = Math.max(underfur[n], Math.round(109 * shade * envelope));
            }
            if (!coverage) continue;
            weight[n] += coverage;
            const mix = coverage / weight[n],
              k = 4 * n;
            const forward = lift * travel,
              splay = forward * (lean * 1.36 + cross * 0.25);
            const ux = 128 + 124 * clamp(forward * tx - splay * ty, -1, 1),
              uy = 128 + 124 * clamp(forward * ty + splay * tx, -1, 1);
            map[k + 1] = Math.round(map[k + 1] + (ux - map[k + 1]) * mix);
            map[k + 2] = Math.round(map[k + 2] + (uy - map[k + 2]) * mix);
            const ridge = 128 + 90 * lift * (0.22 - 1.42 * cross);
            map[k + 3] = Math.round(map[k + 3] + (ridge - map[k + 3]) * mix);
          }
      }
    }
    for (let n = 0; n < underfur.length; n++)
      if (underfur[n]) map[4 * n + 3] = Math.max(0, map[4 * n + 3] - underfur[n]);
    return map;
  }
  function shortCoatTexture(data, luma, strand, w, h) {
    const map = new Uint8Array(4 * w * h);
    const radius = Math.max(1, Math.round(w * 0.003)),
      border = 2 * radius + 2;
    for (let y = 0; y < h; y++) {
      const side = clamp((y / h - 0.48) * 3.5, -1, 1),
        length = Math.hypot(0.83, side);
      const tx = 0.83 / length,
        ty = side / length;
      const along = Math.round(radius * tx) + w * Math.round(radius * ty);
      const cross = Math.round(-radius * ty) + w * Math.round(radius * tx);
      for (let x = 0; x < w; x++) {
        const i = y * w + x,
          k = 4 * i;
        map[k] = strand[i];
        map[k + 1] = map[k + 2] = map[k + 3] = 128;
        if (x < border || x >= w - border || y < border || y >= h - border || data[k + 3] < 240)
          continue;
        if (
          data[(i + along) * 4 + 3] < 240 ||
          data[(i - along) * 4 + 3] < 240 ||
          data[(i + cross) * 4 + 3] < 240 ||
          data[(i - cross) * 4 + 3] < 240
        )
          continue;
        const core = (2 * luma[i] + luma[i - along] + luma[i + along]) * 0.25;
        const left =
          (2 * luma[i - cross] + luma[i - cross - along] + luma[i - cross + along]) * 0.25;
        const right =
          (2 * luma[i + cross] + luma[i + cross - along] + luma[i + cross + along]) * 0.25;
        const range = 8 + 0.06 * core;
        const crest = clamp((core - 0.5 * (left + right)) / range, -1, 1);
        const slope = clamp((left - right) / (2 * range), -1, 1);
        const travel = 21 + 11 * crest,
          splay = 8 * slope;
        map[k + 1] = Math.round(128 + travel * tx - splay * ty);
        map[k + 2] = Math.round(128 + travel * ty + splay * tx);
        const shade = 38 * crest + 12 * slope - 14;
        map[k + 3] = Math.round(128 + shade * (1 - 0.75 * clamp((core - 110) / 95, 0, 1)));
      }
    }
    return map;
  }
  function program(gl) {
    const shaders = [
      [
        gl.VERTEX_SHADER,
        `attribute vec2 texel;attribute vec2 position;attribute vec2 lighting;attribute float lift;
varying vec2 uv;varying vec2 light;varying float raised;uniform vec4 rectangle;
void main(){uv=texel;light=lighting;raised=lift;gl_Position=vec4((rectangle.xy+position*rectangle.zw)*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);}`,
      ],
      [
        gl.FRAGMENT_SHADER,
        `precision mediump float;varying vec2 uv;varying vec2 light;varying float raised;
uniform sampler2D photo; uniform sampler2D fibres;
void main(){vec4 fur=texture2D(fibres,uv);
vec2 offset=(fur.gb-vec2(128./255.))*vec2(.030,.04868)*raised;
vec4 p=texture2D(photo,uv+offset);float nap=fur.r*2.-1.;
float ridge=(fur.a-128./255.)*.40*raised;
vec3 c=p.rgb*(1.+.92*light.x+ridge)+p.a*vec3(1.,.96,.90)*(.073*light.x-.027*light.y+abs(light.y)*(.012+.032*nap)+.015*max(-light.y,0.)*max(nap,0.));
gl_FragColor=vec4(clamp(c,vec3(0.),vec3(p.a)),p.a);}`,
      ],
    ];
    const p = gl.createProgram();
    for (const [type, source] of shaders) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        throw Error(gl.getShaderInfoLog(shader));
      gl.attachShader(p, shader);
      gl.deleteShader(shader);
    }
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(p));
    return p;
  }
  class CoatSurface {
    constructor(canvas, cols, rows) {
      this.canvas = canvas;
      this.cols = cols;
      this.rows = rows;
      this.inverseIterations = 3;
      Object.assign(this, surfaceGrid(cols, rows));
      this.gl = canvas.getContext('webgl', {
        alpha: true,
        depth: false,
        stencil: false,
        antialias: false,
        premultipliedAlpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'low-power',
      });
      if (this.gl) {
        this.initGL();
        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          this.lost = true;
        });
        canvas.addEventListener('webglcontextrestored', () => {
          this.lost = false;
          this.initGL();
          if (this.img) this.upload();
        });
      } else {
        this.ctx = canvas.getContext('2d');
        this.output = document.createElement('canvas');
        this.outCtx = this.output.getContext('2d');
      }
    }
    initGL() {
      const gl = this.gl,
        p = program(gl);
      gl.useProgram(p);
      const attr = (name, data, mode, size = 2) => {
        const buf = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, data, mode);
        const loc = gl.getAttribLocation(p, name);
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
        return buf;
      };
      attr('texel', this.uv, gl.STATIC_DRAW);
      this.xyBuffer = attr('position', this.uv, gl.DYNAMIC_DRAW);
      this.lightBuffer = attr('lighting', this.uv, gl.DYNAMIC_DRAW);
      this.liftBuffer = attr('lift', new Float32Array(this.uv.length / 2), gl.DYNAMIC_DRAW, 1);
      this.liftLoc = gl.getAttribLocation(p, 'lift');
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.idx, gl.STATIC_DRAW);
      this.rectLoc = gl.getUniformLocation(p, 'rectangle');
      for (const [i, name] of ['photo', 'fibres'].entries()) {
        gl.activeTexture(gl.TEXTURE0 + i);
        gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.uniform1i(gl.getUniformLocation(p, name), i);
        for (const k of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER])
          gl.texParameteri(gl.TEXTURE_2D, k, gl.LINEAR);
        for (const k of [gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T])
          gl.texParameteri(gl.TEXTURE_2D, k, gl.CLAMP_TO_EDGE);
      }
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.clearColor(0, 0, 0, 0);
    }
    setImage(img, rasterWidth, longCoat, shortCoat = false) {
      this.img = img;
      this.stillFrame = null;
      const imgW = img.naturalWidth || img.width,
        imgH = img.naturalHeight || img.height;
      const w = (this.sw = Math.min(imgW, this.gl ? 970 : rasterWidth)),
        h = (this.sh = Math.round((w * imgH) / imgW));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const cx = canvas.getContext('2d', { willReadFrequently: true });
      cx.drawImage(img, 0, 0, w, h);
      const data = (this.src = cx.getImageData(0, 0, w, h).data);
      const strand = (this.strand = new Uint8Array(w * h)),
        luma = new Uint8Array(w * h);
      for (let i = 0; i < luma.length; i++) {
        const byte = i * 4;
        luma[i] = (2 * data[byte] + 5 * data[byte + 1] + data[byte + 2]) * 0.125;
      }
      for (let y = 1; y < h - 1; y++)
        for (let x = 1; x < w - 1; x++) {
          const i = y * w + x,
            a = luma[i - w - 1],
            b = luma[i + w + 1],
            c = luma[i];
          strand[i] =
            128 +
            127 * clamp((2.1 * (c - 0.5 * (a + b)) + 0.65 * (b - a)) / (13 + 0.095 * c), -1, 1);
        }
      if (shortCoat) this.locks = shortCoatTexture(data, luma, strand, w, h);
      else this.locks = longCoat ? lockTexture(data, luma, strand, w, h) : null;
      if (this.gl) {
        if (!this.lost) this.upload();
      } else {
        this.coverage = alphaCoverage(data, w, h);
        this.frame = null;
      }
    }
    resizeOutput(displayWidth) {
      const width = Math.max(1, Math.min(this.sw, Math.ceil(displayWidth)));
      const height = Math.max(1, Math.round((width * this.sh) / this.sw));
      if (this.frame && this.frame.width === width && this.frame.height === height) return;
      this.output.width = width;
      this.output.height = height;
      this.frame = this.outCtx.createImageData(width, height);
      this.packed = new Uint32Array(this.frame.data.buffer);
      this.outputStep = Math.max(4, Math.round((surfaceTile * width) / this.sw));
      this.cs = Math.ceil(width / this.outputStep) + 1;
      this.rs = Math.ceil(height / this.outputStep) + 1;
      this.field = new Float32Array(this.cs * this.rs * 5);
    }
    upload() {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.img);
      gl.activeTexture(gl.TEXTURE1);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      const format = this.locks ? gl.RGBA : gl.LUMINANCE;
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        format,
        this.sw,
        this.sh,
        0,
        format,
        gl.UNSIGNED_BYTE,
        this.locks || this.strand,
      );
      if (this.locks) gl.enableVertexAttribArray(this.liftLoc);
      else {
        gl.disableVertexAttribArray(this.liftLoc);
        gl.vertexAttrib1f(this.liftLoc, 0);
      }
    }
    bodyMatches(view, xy, light, lift, hasRaised) {
      const frame = (this.stillFrame ??= {
        xy: new Float32Array(xy.length),
        light: new Float32Array(light.length),
        lift: new Float32Array(lift.length),
      });
      if (frame.view === view && frame.hasRaised === hasRaised) {
        const dx = 0.3 / (view.w * view.dpr),
          dy = 0.3 / (view.h * view.dpr);
        let i = 0;
        for (; i < lift.length; i++) {
          const j = 2 * i;
          if (
            Math.abs(xy[j] - frame.xy[j]) > dx ||
            Math.abs(xy[j + 1] - frame.xy[j + 1]) > dy ||
            Math.abs(light[j] - frame.light[j]) > 0.0015 ||
            Math.abs(light[j + 1] - frame.light[j + 1]) > 0.003 ||
            (hasRaised && Math.abs(lift[i] - frame.lift[i]) > 0.0015)
          )
            break;
        }
        if (i === lift.length) return true;
      }
      frame.view = view;
      frame.hasRaised = hasRaised;
      frame.xy.set(xy);
      frame.light.set(light);
      frame.lift.set(lift);
      return false;
    }
    draw(view, xy, light, lift, hasRaised = true, tailOnly = false) {
      if (!this.img || this.lost || !view.width || !view.height) return;
      const { width, height, x = 0, y = 0, w = width, h = height } = view,
        dpr = view.dpr || 1,
        canvas = this.canvas;
      const tw = Math.max(1, Math.round(width * dpr)),
        th = Math.max(1, Math.round(height * dpr));
      if (canvas.width !== tw || canvas.height !== th) {
        canvas.width = tw;
        canvas.height = th;
      }
      const gl = this.gl;
      if (gl) {
        gl.viewport(0, 0, tw, th);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.xyBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, xy);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.lightBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, light);
        if (this.locks) {
          gl.bindBuffer(gl.ARRAY_BUFFER, this.liftBuffer);
          gl.bufferSubData(gl.ARRAY_BUFFER, 0, lift);
        }
        gl.uniform4f(this.rectLoc, x / width, y / height, w / width, h / height);
        gl.drawElements(gl.TRIANGLES, this.idx.length, gl.UNSIGNED_SHORT, 0);
      } else {
        if (tailOnly) {
          if (this.bodyMatches(view, xy, light, lift, hasRaised)) return;
        } else if (this.stillFrame) this.stillFrame.view = null;
        this.resizeOutput(w * dpr);
        this.warp(xy, light, hasRaised ? lift : null);
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, tw, th);
        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx.drawImage(this.output, x, y, w, h);
      }
    }
    sample(data, u, v, k, stride = 2) {
      const gx = clamp(u * this.cols, 0, this.cols - 0.00001),
        gy = clamp(v * this.rows, 0, this.rows - 0.00001);
      const x = gx | 0,
        y = gy | 0,
        fx = gx - x,
        fy = gy - y,
        a = stride * (y * (this.cols + 1) + x) + k,
        b = a + stride * (this.cols + 1);
      const t = data[a] + (data[a + stride] - data[a]) * fx,
        bot = data[b] + (data[b + stride] - data[b]) * fx;
      return t + (bot - t) * fy;
    }
    warp(xy, light, lift) {
      const w = this.sw,
        h = this.sh,
        step = this.outputStep,
        cs = this.cs,
        rs = this.rs,
        f = this.field;
      const width = this.frame.width,
        height = this.frame.height,
        locks = lift && this.locks;
      for (let row = 0; row < rs; row++)
        for (let col = 0; col < cs; col++) {
          const index = (row * cs + col) * 5,
            U = (col * step + 0.5) / width,
            V = (row * step + 0.5) / height;
          let u = U,
            v = V;
          for (let n = 0; n < this.inverseIterations; n++) {
            const px = this.sample(xy, u, v, 0),
              py = this.sample(xy, u, v, 1);
            u += U - px;
            v += V - py;
            if (Math.abs(U - px) + Math.abs(V - py) < 0.0001) break;
          }
          f[index] = u * w - 0.5;
          f[index + 1] = v * h - 0.5;
          f[index + 2] = this.sample(light, u, v, 0);
          f[index + 3] = this.sample(light, u, v, 1);
          f[index + 4] = locks ? this.sample(lift, u, v, 0, 1) : 0;
        }
      const data = this.frame.data,
        src = this.src,
        strand = this.strand;
      this.packed.fill(0);
      for (let j = 0; j < rs - 1; j++)
        for (let i = 0; i < cs - 1; i++) {
          const a = 5 * (j * cs + i),
            b = a + 5,
            c = a + 5 * cs,
            d = c + 5;
          const peakLift = locks ? Math.max(f[a + 4], f[b + 4], f[c + 4], f[d + 4]) : 0;
          const margin = peakLift * w * 0.016;
          const minX = Math.min(f[a], f[b], f[c], f[d]) - margin,
            minY = Math.min(f[a + 1], f[b + 1], f[c + 1], f[d + 1]) - margin;
          const maxX = Math.max(f[a], f[b], f[c], f[d]) + margin,
            maxY = Math.max(f[a + 1], f[b + 1], f[c + 1], f[d + 1]) + margin;
          const coverage = coverageAt(this.coverage, minX, minY, maxX, maxY);
          if (!coverage) continue;
          const interior = coverage === 255 && minX > 0 && minY > 0 && maxX < w - 1 && maxY < h - 1;
          const shifted = peakLift > 0.001;
          const hasNap = f[a + 3] || f[b + 3] || f[c + 3] || f[d + 3];
          const left = i * step,
            endX = Math.min(left + step, width),
            top = j * step,
            endY = Math.min(top + step, height);
          for (let y = top; y < endY; y++) {
            const q = (y - top) / step;
            let sx = f[a] + (f[c] - f[a]) * q,
              sy = f[a + 1] + (f[c + 1] - f[a + 1]) * q,
              lit = f[a + 2] + (f[c + 2] - f[a + 2]) * q,
              nap = f[a + 3] + (f[c + 3] - f[a + 3]) * q;
            const dx = (f[b] + (f[d] - f[b]) * q - sx) / step,
              dy = (f[b + 1] + (f[d + 1] - f[b + 1]) * q - sy) / step;
            const dl = (f[b + 2] + (f[d + 2] - f[b + 2]) * q - lit) / step,
              dn = (f[b + 3] + (f[d + 3] - f[b + 3]) * q - nap) / step;
            let raised = f[a + 4] + (f[c + 4] - f[a + 4]) * q;
            const dr = (f[b + 4] + (f[d + 4] - f[b + 4]) * q - raised) / step;
            let dest = 4 * (y * width + left);
            for (
              let x = left;
              x < endX;
              x++, dest += 4, sx += dx, sy += dy, lit += dl, nap += dn, raised += dr
            ) {
              if (!interior && (sx < 0 || sy < 0 || sx >= w - 1 || sy >= h - 1)) continue;
              let u = sx,
                v = sy,
                ridge = 0;
              const p = (sy | 0) * w + (sx | 0);
              if (shifted && raised > 0.001) {
                const n = 4 * p,
                  m = n + w * 4,
                  fx = sx - (sx | 0),
                  fy = sy - (sy | 0),
                  gain = (raised * w * 0.03) / 255;
                const a = (1 - fx) * (1 - fy),
                  b = fx * (1 - fy),
                  c = (1 - fx) * fy,
                  d = fx * fy;
                u +=
                  (locks[n + 1] * a +
                    locks[n + 5] * b +
                    locks[m + 1] * c +
                    locks[m + 5] * d -
                    128) *
                  gain;
                v +=
                  (locks[n + 2] * a +
                    locks[n + 6] * b +
                    locks[m + 2] * c +
                    locks[m + 6] * d -
                    128) *
                  gain;
                ridge =
                  (locks[n + 3] * a +
                    locks[n + 7] * b +
                    locks[m + 3] * c +
                    locks[m + 7] * d -
                    128) *
                  (0.4 / 255) *
                  raised;
                if (!interior && (u < 0 || v < 0 || u >= w - 1 || v >= h - 1)) continue;
              }
              const X = u | 0,
                Y = v | 0,
                n = 4 * (Y * w + X),
                m = n + 4 * w,
                fx = u - X,
                fy = v - Y;
              if (!interior && !(src[n + 3] | src[n + 7] | src[m + 3] | src[m + 7])) continue;
              const gain = 1 + 0.92 * lit + ridge,
                add = 18.62 * lit + (hasNap ? nap * napFactor[strand[p] + (nap < 0 ? 256 : 0)] : 0);
              data[dest] = sampleChannel(src, n, m, fx, fy) * gain + add;
              data[dest + 1] = sampleChannel(src, n + 1, m + 1, fx, fy) * gain + add;
              data[dest + 2] = sampleChannel(src, n + 2, m + 2, fx, fy) * gain + add;
              data[dest + 3] = interior ? 255 : sampleChannel(src, n + 3, m + 3, fx, fy);
            }
          }
        }
      this.outCtx.putImageData(this.frame, 0, 0);
    }
  }
  return { CoatSurface };
})();
