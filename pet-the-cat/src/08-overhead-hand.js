/**
 * OverheadHand —— 手部照片的分层绘制与落点
 *
 * 手是一张俯拍照片（手掌 + 五指 + 手指阴影）。load() 时把它拆成掌、指、阴影三层：
 *  - separateFingers()：沿指缝把相邻手指分开，避免手指互相穿插时出现硬边
 *  - digitShadow()：取出指缝的暗部做成阴影层
 * configure()/point()：根据接触点、猫的厚度、透视缩放，把三层贴合到猫身上
 * digitPoint()/contacts()：给每根手指算出落点，供 FurContact 生成接触毛边
 */

'use strict';
const { OverheadHand } = (() => {
  const pad = [169, 119];
  const wrist = [429, 572];
  const artWidth = 1024,
    artHeight = 1536;
  const sizeRatio = 0.5166;
  const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
  const smooth = (a, b, x) => {
    const t = clamp((x - a) / (b - a));
    return t * t * (3 - 2 * t);
  };
  const xs = [0, 62, 101, 146, 193, 247, 317, 381, 453, 538, 638, 785, 916, 1024];
  const ys = [
    0, 67, 91, 113, 137, 169, 213, 278, 351, 434, 522, 618, 729, 854, 1004, 1191, 1375, 1536,
  ];
  const nx = xs.length,
    ny = ys.length;
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  function shadowMasks(photo) {
    const w = 300,
      h = 450,
      margin = 15;
    const shapes = [];
    for (const upper of [false, true]) {
      const shape = canvas(w, h),
        s = shape.getContext('2d');
      s.drawImage(photo, 0, 0, w, h);
      s.globalCompositeOperation = 'source-in';
      const gradient = s.createLinearGradient(0, 0, 0, h);
      gradient.addColorStop(0, upper ? '#39291c' : 'transparent');
      gradient.addColorStop(0.36, upper ? '#39291c' : 'transparent');
      gradient.addColorStop(0.53, upper ? 'transparent' : '#39291c');
      gradient.addColorStop(1, upper ? 'transparent' : '#39291c');
      s.fillStyle = gradient;
      s.fillRect(0, 0, w, h);
      const soft = canvas(w + 2 * margin, h + 2 * margin),
        ctx = soft.getContext('2d');
      ctx.filter = 'blur(2.8px)';
      ctx.drawImage(shape, margin, margin);
      const tight = canvas(w + 2 * margin, h + 2 * margin),
        tc = tight.getContext('2d');
      tc.filter = 'blur(.85px)';
      tc.drawImage(shape, margin, margin);
      shapes.push({ soft, tight, upper, margin: (margin * artWidth) / w });
    }
    return shapes;
  }
  const baseDigits = [
    { m: [250, 310], p: [166, 231], tip: [93, 162], splay: -0.225, curl: 0.98 },
    { m: [306, 294], p: [217, 179], tip: [145, 102], splay: -0.064, curl: 0.74 },
    { m: [359, 270], p: [297, 160], tip: [217, 90], splay: 0.071, curl: 1.02 },
    { m: [414, 267], p: [391, 185], tip: [338, 122], splay: 0.232, curl: 1.24 },
    { m: [207, 473], p: [140, 415], tip: [84, 350], splay: -0.24, curl: 0.81 },
  ];
  function poseDigits(tips) {
    return baseDigits.map((f, i) => {
      const tip = tips?.[i] ?? f.tip,
        dx = tip[0] - f.m[0],
        dy = tip[1] - f.m[1],
        length = Math.hypot(dx, dy);
      return {
        ...f,
        tip,
        ax: dx / length,
        ay: dy / length,
        prox: Math.hypot(f.p[0] - f.m[0], f.p[1] - f.m[1]),
      };
    });
  }
  const smallHand = {
    size: 0.87,
    anchor: [305, 323],
    tips: [
      [90, 157],
      [144, 97],
      [217, 84],
      [340, 120],
      [83, 350],
    ],
    thumb: [
      [0, 320],
      [148, 320],
      [181, 376],
      [214, 437],
      [232, 465],
      [246, 514],
      [0, 514],
    ],
    gaps: [
      [0, 50, 123, 284],
      [77, 66, 163, 292],
      [90, 75, 176, 293],
      [100, 83, 185, 293],
      [111, 90, 195, 303],
      [126, 100, 210, 308],
      [141, 113, 228, 318],
      [150, 122, 239, 328],
      [160, 136, 252, 340],
      [175, 155, 268, 352],
      [185, 164, 276, 356],
      [198, 178, 285, 363],
      [211, 196, 294, 372],
      [235, 214, 309, 381],
      [259, 231, 328, 394],
      [278, 245, 356, 406],
      [300, 275, 361, 424],
      [320, 292, 375, 431],
    ],
  };
  function separateFingers(photo, fingers, gapRows, thumb) {
    const palm = canvas(artWidth, artHeight),
      p = palm.getContext('2d');
    p.drawImage(photo, 0, 0);
    p.clearRect(0, 0, artWidth, 270);
    p.globalCompositeOperation = 'destination-out';
    const melt = p.createLinearGradient(0, 270, 0, 319);
    melt.addColorStop(0, '#000');
    melt.addColorStop(1, 'transparent');
    p.fillStyle = melt;
    p.fillRect(0, 270, artWidth, 51);
    p.fillStyle = '#000';
    const polygons = fingers.slice(0, 4).map((_, i) => {
      const left = gapRows.map((row) => [i === 0 ? 0 : row[i], row[0]]);
      const right = gapRows.map((row) => [i === 3 ? 535 : row[i + 1], row[0]]);
      return left.concat(right.reverse());
    });
    polygons.push(
      thumb ?? [
        [0, 320],
        [150, 320],
        [184, 376],
        [213, 437],
        [227, 464],
        [246, 514],
        [0, 514],
      ],
    );
    function path(ctx, pts) {
      ctx.beginPath();
      pts.forEach(([x, y], i) => {
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
    p.globalCompositeOperation = 'destination-out';
    path(
      p,
      polygons[4].map(([x, y]) => [Math.max(0, x - 2), Math.min(509, y)]),
    );
    p.fill();
    const parts = polygons.map((poly, i) => {
      const left = Math.floor(Math.min(...poly.map((v) => v[0]))),
        top = Math.floor(Math.min(...poly.map((v) => v[1])));
      const right = Math.ceil(Math.max(...poly.map((v) => v[0]))),
        bottom = Math.ceil(Math.max(...poly.map((v) => v[1])));
      const img = canvas(right - left, bottom - top),
        ctx = img.getContext('2d');
      ctx.translate(-left, -top);
      path(ctx, poly);
      ctx.clip();
      ctx.drawImage(photo, 0, 0);
      const pixels = ctx.getImageData(0, 0, img.width, img.height).data;
      const grid = [],
        triangles = [];
      const cols = Math.ceil(img.width / 31),
        rows = Math.ceil(img.height / 29);
      for (let y = 0; y <= rows; y++)
        for (let x = 0; x <= cols; x++)
          grid.push([left + (img.width * x) / cols, top + (img.height * y) / rows]);
      for (let y = 0; y < rows; y++)
        for (let x = 0; x < cols; x++) {
          let opaque = false;
          const x1 = Math.min(img.width - 1, Math.ceil(((x + 1) * img.width) / cols));
          const y1 = Math.min(img.height - 1, Math.ceil(((y + 1) * img.height) / rows));
          for (let iy = Math.floor((y * img.height) / rows); iy <= y1 && !opaque; iy += 2)
            for (let ix = Math.floor((x * img.width) / cols); ix <= x1; ix += 2)
              if (pixels[(iy * img.width + ix) * 4 + 3] > 1) {
                opaque = true;
                break;
              }
          if (opaque) {
            const j = y * (cols + 1) + x;
            triangles.push([j, j + 1, j + cols + 1], [j + cols + 1, j + 1, j + cols + 2]);
          }
        }
      const f = fingers[i],
        tones = [img];
      for (let n = 1; n <= 6; n++) {
        const tint = canvas(img.width, img.height),
          tc = tint.getContext('2d');
        tc.drawImage(img, 0, 0);
        tc.globalCompositeOperation = 'source-atop';
        const wash = tc.createLinearGradient(
          f.tip[0] - left,
          f.tip[1] - top,
          f.m[0] - left,
          f.m[1] - top,
        );
        wash.addColorStop(0, 'rgba(77,44,34,' + (0.18 * n) / 6 + ')');
        wash.addColorStop(0.45, 'rgba(91,51,39,' + (0.08 * n) / 6 + ')');
        wash.addColorStop(0.67, 'rgba(255,240,214,' + (0.055 * n) / 6 + ')');
        wash.addColorStop(1, 'rgba(255,240,214,0)');
        tc.fillStyle = wash;
        tc.fillRect(0, 0, img.width, img.height);
        tones.push(tint);
      }
      return {
        tones,
        left,
        top,
        grid,
        triangles,
        out: new Float64Array(2 * grid.length),
        digit: i,
      };
    });
    return { palm, parts };
  }
  function digitShadow(photo) {
    const ratio = 0.36,
      margin = 40,
      w = Math.ceil((photo.width + 2 * margin) * ratio),
      h = Math.ceil((photo.height + 2 * margin) * ratio);
    const mask = canvas(w, h),
      c = mask.getContext('2d');
    c.drawImage(photo, margin * ratio, margin * ratio, photo.width * ratio, photo.height * ratio);
    c.globalCompositeOperation = 'source-in';
    c.fillStyle = '#39291c';
    c.fillRect(0, 0, w, h);
    const blurred = (radius) => {
      const img = canvas(w, h),
        ctx = img.getContext('2d');
      ctx.filter = 'blur(' + radius + 'px)';
      ctx.drawImage(mask, 0, 0);
      return img;
    };
    return { soft: blurred(2.9), tight: blurred(0.72), margin, w: w / ratio, h: h / ratio };
  }
  class OverheadHand {
    constructor() {
      this.profile = smallHand;
      this.fingers = poseDigits(this.profile.tips);
    }
    load(img) {
      this.photo = img;
      Object.assign(
        this,
        separateFingers(img, this.fingers, this.profile.gaps, this.profile.thumb),
      );
      this.shadows = shadowMasks(img);
      this.baseShadows = shadowMasks(this.palm);
      for (const part of this.parts) part.shadow = digitShadow(part.tones[0]);
      const small = canvas(320, 480),
        ctx = small.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, small.width, small.height);
      const data = ctx.getImageData(0, 0, small.width, small.height).data;
      const scale = small.width / artWidth;
      this.cells = [];
      for (let r = 0; r < ny - 1; r++) {
        for (let c = 0; c < nx - 1; c++) {
          const x0 = Math.max(0, Math.floor(xs[c] * scale) - 1);
          const x1 = Math.min(small.width - 1, Math.ceil(xs[c + 1] * scale) + 1);
          const y0 = Math.max(0, Math.floor(ys[r] * scale) - 1);
          const y1 = Math.min(small.height - 1, Math.ceil(ys[r + 1] * scale) + 1);
          let occupied = false;
          for (let y = y0; y <= y1 && !occupied; y++) {
            for (let x = x0; x <= x1; x++)
              if (data[4 * (y * small.width + x) + 3] > 2) {
                occupied = true;
                break;
              }
          }
          if (occupied) this.cells.push([r, c]);
        }
      }
      this.points = new Float64Array(2 * nx * ny);
      this.q = new Float64Array(2);
      return this;
    }
    configure(view, p) {
      this.transition = null;
      this.sleeveDrop = 0;
      this.scale =
        ((view.handWidth * sizeRatio * this.profile.size) / artWidth) *
        (1 + 0.034 * clamp(p.altitude ?? 0));
      this.px = p.x;
      this.py = p.y;
      this.load = clamp(p.load ?? p.pressure ?? 0);
      this.altitude = clamp(p.altitude ?? 0);
      this.lift = clamp(p.lift ?? 0);
      this.dx = clamp(p.motionX || 0, -1, 1);
      this.dy = clamp(p.motionY || 0, -1, 1);
      const yaw = 0.013 + clamp(p.angle || 0, -0.48, 0.48) + 0.033 * this.dx;
      this.cs = Math.cos(yaw);
      this.sn = Math.sin(yaw);
      const at = (p.x - (view.x ?? 0)) / (view.w ?? view.width);
      const counter = clamp((at - 0.346) * 0.87 + 0.16 * this.dx, -0.32, 0.46);
      const fore = 0.013 + 0.37 * (yaw - 0.013) + counter + 0.017 * this.lift;
      this.ac = Math.cos(fore);
      this.as = Math.sin(fore);
      const ux = wrist[0] - pad[0],
        uy = wrist[1] - pad[1];
      this.wx = this.cs * ux - this.sn * uy;
      this.wy = this.sn * ux + this.cs * uy;
      this.tuck = clamp(p.tuck ?? 0, -1, 1);
      const pressure = clamp(p.pressure ?? 0),
        firm = smooth(0.5, 0.98, pressure);
      this.articulated = !p.rest || pressure > 0.18;
      if (this.articulated) {
        const bearing = smooth(0.04, 0.54, pressure) * (1 - 0.89 * this.altitude);
        const open = bearing * (0.78 + 0.16 * firm - 0.5 * this.tuck) - 0.2 * this.altitude;
        const flex = clamp(
          0.15 +
            0.53 * Math.max(0, this.tuck) -
            0.15 * Math.max(0, -this.tuck) +
            0.25 * firm +
            0.48 * this.altitude,
          0,
          1,
        );
        this.joints = this.fingers.map((f, i) => {
          const side = (i - 1.5) * 0.025 * this.dx * bearing;
          const angle = f.splay * open + side + 0.046 * (this.dx - 0.49 * this.dy) * bearing;
          return {
            co: Math.cos(angle),
            si: Math.sin(angle),
            flex,
            first: -0.16 * flex * f.curl + 0.023 * open,
            second: -0.6 * flex * f.curl + 0.052 * open,
            wide: 0.029 * bearing,
            slipX: -(19 + 3 * i) * this.dx * bearing,
            slipY: -(15 + 2 * i) * this.dy * bearing,
          };
        });
      }
      if (this.articulated) {
        this.point(this.profile.anchor[0], this.profile.anchor[1], this.q);
        const settling = Math.min(view.h * 0.013, (p.depth ?? 0) * 0.36) * (1 - this.altitude);
        this.px += p.x - this.q[0];
        this.py += p.y - this.q[1] + settling;
        if (p.coat) this.seatOnEdge(p, view);
        else this.seat = null;
      } else this.seat = null;
      this.sleeveDrop = sleeveReach(this, view, 459, 922);
    }
    seatOnEdge(p, view) {
      const W = view.w;
      const reachWidth = view.kitten ? (view.baseW ?? W) : W;
      const pad = p.pad ?? { u: (p.x - view.x) / W, v: (p.y - view.y) / view.h };
      let { u, v } = pad;
      let offsetX = 0,
        offsetY = 0;
      if (view.kitten) {
        const f = this.fingers[1];
        this.digitPoint(f.tip[0], f.tip[1], 1, this.q);
        this.point(this.q[0], this.q[1], this.q);
        const x = p.x + (this.q[0] - p.x) * 0.72,
          y = p.y + (this.q[1] - p.y) * 0.72;
        u = (x - view.x) / W;
        v = (y - view.y) / view.h;
        offsetX = p.x - x;
        offsetY = p.y - y;
      }
      const edge = p.coat.handEdge(u, v, pad.u, pad.v);
      if (!edge) {
        this.seat = null;
        return;
      }
      const { nx, ny } = edge;
      const clearance = Math.max(
        0,
        (edge.inside ? edge.distance : -edge.distance) * W + offsetX * nx + offsetY * ny,
      );
      let dx = 0,
        dy = 0;
      if (clearance < 0.14 * reachWidth) {
        const anchor = this.profile.anchor;
        this.point(anchor[0], anchor[1], this.q);
        const x = this.q[0],
          y = this.q[1];
        let lead = 0,
          side = 0,
          weight = 0;
        for (let i = 0; i < 4; i++) {
          const f = this.fingers[i];
          this.digitPoint(f.tip[0], f.tip[1], i, this.q);
          this.point(this.q[0], this.q[1], this.q);
          const ax = this.q[0] - x,
            ay = this.q[1] - y,
            out = -nx * ax - ny * ay;
          const k = Math.exp(out / (W * 0.016));
          lead = Math.max(lead, out);
          side += k * (-ny * ax + nx * ay);
          weight += k;
        }
        if (lead > W * 0.009) {
          const shift = Math.max(0, lead - clearance + this.scale * 4);
          const drift = (side / weight) * smooth(0, 1, shift / lead) * 0.78;
          const neck = p.coat.neckWeight(p.pad?.u ?? (p.x - view.x) / W);
          const bearing = 1 - neck * (1 - smooth(0.009, 0.072, lead / W));
          dx = (bearing * (nx * shift + ny * drift)) / W;
          dy = (bearing * (ny * shift - nx * drift)) / W;
        }
      }
      const last = this.seat?.kitten === view.kitten ? this.seat : null;
      const travel = last ? Math.hypot(p.x - last.px, p.y - last.py) : Infinity;
      const reposition = travel / reachWidth > 0.12;
      let f = reposition ? 1 : -Math.expm1(-p.dt / 0.063);
      if (!reposition && view.kitten) {
        const correction = W * Math.hypot(dx - last.x, dy - last.y);
        const allowance = 0.105 * reachWidth * p.dt + 0.25 * travel;
        if (correction * f > allowance) f = allowance / correction;
      }
      const seatX = (last?.x ?? dx) + (dx - (last?.x ?? dx)) * f;
      const seatY = (last?.y ?? dy) + (dy - (last?.y ?? dy)) * f;
      this.seat = { x: seatX, y: seatY, px: p.x, py: p.y, kitten: view.kitten };
      this.px += seatX * W;
      this.py += seatY * W;
    }
    contacts() {
      const pads = this.fingers.map((f, i) => {
        const x = f.tip[0] + (f.p[0] - f.tip[0]) * 0.24,
          y = f.tip[1] + (f.p[1] - f.tip[1]) * 0.24;
        if (this.articulated) {
          this.digitPoint(x, y, i, this.q);
          this.point(this.q[0], this.q[1], this.q);
        } else this.point(x, y, this.q);
        return { x: this.q[0], y: this.q[1], weight: [0.14, 0.19, 0.18, 0.1, 0.065][i] };
      });
      this.point(this.profile.anchor[0], this.profile.anchor[1], this.q);
      pads.push({ x: this.q[0], y: this.q[1], weight: 0.325 });
      return pads;
    }
    digitPoint(x, y, id, out) {
      const f = this.fingers[id],
        j = this.joints[id];
      const dx = x - f.m[0],
        dy = y - f.m[1],
        along = f.ax * dx + f.ay * dy;
      const gain = smooth(-8, 67, along);
      const boundary = id === 4 ? 1 - smooth(462, 512, y) : 1 - smooth(274, 319, y);
      const amt = gain * boundary;
      const flex = along * j.first + Math.max(0, along - f.prox) * (j.second - j.first);
      const cross = -f.ay * dx + f.ax * dy;
      const bx = dx + f.ax * flex - f.ay * cross * j.wide,
        by = dy + f.ay * flex + f.ax * cross * j.wide;
      const friction = amt * clamp(along / (f.prox * 1.8));
      const bend = j.flex * Math.sin(Math.PI * clamp(along / (f.prox * 1.88))) * 7 * f.curl;
      out[0] = x + amt * (j.co * bx - j.si * by - dx + f.ay * bend) + friction * j.slipX;
      out[1] = y + amt * (j.si * bx + j.co * by - dy - f.ax * bend) + friction * j.slipY;
    }
    point(x, y, out, offset = 0) {
      let u = x - pad[0],
        v = y - pad[1];
      const distal = 1 - smooth(135, 495, y),
        flex = this.load - 0.16;
      u += flex * distal * 0.042 * (x - pad[0]);
      v += flex * distal * 0.048 * (y - pad[1]);
      const knuckle = smooth(140, 350, y) * (1 - smooth(400, 580, y));
      u += knuckle * (this.dx * 11 - flex * 4.3);
      v += knuckle * (this.dy * 9 - flex * 8.3 + this.lift * 8);
      const hx = this.cs * u - this.sn * v,
        hy = this.sn * u + this.cs * v;
      const wx = x - wrist[0],
        wy = y - wrist[1];
      const sx = this.wx + this.ac * wx - this.as * wy,
        sy = this.wy + this.as * wx + this.ac * wy;
      const blend = smooth(465, 785, y + 0.29 * (x - wrist[0]));
      out[offset] = this.px + this.scale * (hx + (sx - hx) * blend);
      out[offset + 1] = this.py + this.scale * (hy + (sy - hy) * blend);
      if (this.sleeveDrop && y > 680) out[offset + 1] += this.sleeveDrop * smooth(680, 1535, y);
      if (this.transition) this.transition.project(out, offset);
    }
    digitShadows(ctx) {
      const k = this.scale,
        a = this.altitude;
      for (const part of this.parts) {
        const f = this.fingers[part.digit],
          root = f.m,
          tip = f.tip;
        const u = tip[0] - root[0],
          v = tip[1] - root[1],
          s = -f.ay * 40,
          t = f.ax * 40,
          det = u * t - v * s;
        this.digitPoint(root[0], root[1], part.digit, this.q);
        this.point(this.q[0], this.q[1], this.q);
        const x = this.q[0],
          y = this.q[1];
        this.digitPoint(tip[0], tip[1], part.digit, this.q);
        this.point(this.q[0], this.q[1], this.q);
        const X = this.q[0] - x,
          Y = this.q[1] - y;
        this.digitPoint(root[0] + s, root[1] + t, part.digit, this.q);
        this.point(this.q[0], this.q[1], this.q);
        const Z = this.q[0] - x,
          W = this.q[1] - y;
        const m = (X * t - Z * v) / det,
          n = (Y * t - W * v) / det,
          o = (Z * u - X * s) / det,
          d = (W * u - Y * s) / det;
        const { soft, tight, margin, w, h } = part.shadow;
        const left = part.left - margin,
          top = part.top - margin,
          tx = x - m * root[0] - o * root[1],
          ty = y - n * root[0] - d * root[1];
        ctx.save();
        ctx.globalAlpha = 0.27 - 0.08 * a;
        ctx.transform(m, n, o, d, tx + k * (8 + 22 * a), ty + k * (13 + 32 * a));
        ctx.drawImage(soft, left, top, w, h);
        ctx.restore();
        ctx.save();
        ctx.globalAlpha = (0.31 + 0.18 * this.load) * (1 - a) * (1 - a);
        ctx.transform(m, n, o, d, tx + k * 2.6, ty + k * 4);
        ctx.drawImage(tight, left, top, w, h);
        ctx.restore();
      }
    }
    shade(ctx, visibility) {
      const a = this.altitude,
        k = this.scale,
        level = this.load;
      ctx.save();
      if (this.articulated) this.digitShadows(ctx);
      for (const { soft, tight, upper, margin } of this.articulated
        ? this.baseShadows
        : this.shadows) {
        const co = upper ? this.cs : this.ac,
          si = upper ? this.sn : this.as;
        const ax = upper ? pad[0] : wrist[0],
          ay = upper ? pad[1] : wrist[1];
        const tx = upper ? this.px : this.px + k * this.wx,
          ty = upper ? this.py : this.py + k * this.wy;
        ctx.save();
        ctx.translate(tx, ty);
        ctx.transform(k * co, k * si, -k * si, k * co, 0, 0);
        const w = artWidth + 2 * margin,
          h = artHeight + 2 * margin;
        const left = -ax - margin,
          top = -ay - margin;
        const far = upper ? 1 : 1.42;
        ctx.globalAlpha *= visibility * (upper ? 0.28 : 0.19) * (1 - 0.3 * a);
        ctx.drawImage(soft, left + (9 + 18 * a) * far, top + (13 + 29 * a) * far, w, h);
        ctx.restore();
        ctx.save();
        ctx.translate(tx, ty);
        ctx.transform(k * co, k * si, -k * si, k * co, 0, 0);
        ctx.globalAlpha *= visibility * (upper ? 0.32 + 0.15 * level : 0.09) * (1 - a) * (1 - a);
        ctx.drawImage(tight, left + 2.8, top + 4.1, w, h);
        ctx.restore();
      }
      ctx.restore();
    }
    triangle(ctx, ia, ib, ic, src, texture) {
      const q = this.points;
      const i = ia * 2,
        j = ib * 2,
        k = ic * 2;
      const x = xs[ia % nx],
        y = ys[Math.floor(ia / nx)],
        u = xs[ib % nx] - x,
        v = ys[Math.floor(ib / nx)] - y;
      const s = xs[ic % nx] - x,
        t = ys[Math.floor(ic / nx)] - y;
      const det = u * t - v * s,
        X = q[j] - q[i],
        Y = q[j + 1] - q[i + 1],
        Z = q[k] - q[i],
        W = q[k + 1] - q[i + 1];
      const m = (X * t - Z * v) / det,
        n = (Y * t - W * v) / det,
        b = (Z * u - X * s) / det,
        d = (W * u - Y * s) / det;
      const cx = (q[i] + q[j] + q[k]) / 3,
        cy = (q[i + 1] + q[j + 1] + q[k + 1]) / 3;
      ctx.save();
      ctx.beginPath();
      for (const h of [i, j, k]) {
        const ex = q[h] - cx,
          ey = q[h + 1] - cy,
          over = 0.68 / Math.max(1, Math.hypot(ex, ey));
        const px = q[h] + ex * over,
          py = q[h + 1] + ey * over;
        if (h === i) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.clip();
      ctx.transform(m, n, b, d, q[i] - m * x - b * y, q[i + 1] - n * x - d * y);
      ctx.drawImage(texture, ...src, ...src);
      ctx.restore();
    }
    drawDigits(ctx) {
      for (const part of this.parts) {
        const { left, top, grid, triangles, tones, out, digit } = part;
        const img = tones[Math.round(6 * this.joints[digit].flex)];
        for (let i = 0; i < grid.length; i++) {
          this.digitPoint(grid[i][0], grid[i][1], digit, this.q);
          this.point(this.q[0], this.q[1], out, 2 * i);
        }
        for (const [ia, ib, ic] of triangles) {
          const a = ia * 2,
            b = ib * 2,
            c = ic * 2;
          const p = grid[ia],
            u = grid[ib][0] - p[0],
            v = grid[ib][1] - p[1];
          const h = grid[ic][0] - p[0],
            s = grid[ic][1] - p[1];
          const det = u * s - v * h,
            X = out[b] - out[a],
            Y = out[b + 1] - out[a + 1],
            Z = out[c] - out[a],
            W = out[c + 1] - out[a + 1];
          const m = (X * s - Z * v) / det,
            n = (Y * s - W * v) / det,
            o = (Z * u - X * h) / det,
            d = (W * u - Y * h) / det;
          const cx = (out[a] + out[b] + out[c]) / 3,
            cy = (out[a + 1] + out[b + 1] + out[c + 1]) / 3;
          ctx.save();
          ctx.beginPath();
          for (const i of [a, b, c]) {
            const dx = out[i] - cx,
              dy = out[i + 1] - cy,
              add = 0.54 / Math.max(1, Math.hypot(dx, dy));
            if (i === a) ctx.moveTo(out[i] + dx * add, out[i + 1] + dy * add);
            else ctx.lineTo(out[i] + dx * add, out[i + 1] + dy * add);
          }
          ctx.closePath();
          ctx.clip();
          ctx.transform(m, n, o, d, out[a] - m * p[0] - o * p[1], out[a + 1] - n * p[0] - d * p[1]);
          const x0 = Math.min(p[0], grid[ib][0], grid[ic][0]),
            y0 = Math.min(p[1], grid[ib][1], grid[ic][1]);
          const lx = Math.max(left, Math.floor(x0) - 2),
            ly = Math.max(top, Math.floor(y0) - 2);
          const w = Math.min(
            left + img.width - lx,
            Math.ceil(Math.max(Math.abs(u), Math.abs(h))) + 5,
          );
          const hh = Math.min(
            top + img.height - ly,
            Math.ceil(Math.max(Math.abs(v), Math.abs(s))) + 5,
          );
          ctx.drawImage(img, lx - left, ly - top, w, hh, lx, ly, w, hh);
          ctx.restore();
        }
      }
    }
    drawSkin(ctx) {
      for (let r = 0; r < ny; r++)
        for (let c = 0; c < nx; c++) this.point(xs[c], ys[r], this.points, 2 * (r * nx + c));
      ctx.save();
      if (this.articulated) this.drawDigits(ctx);
      this.drawPalm(ctx, this.articulated ? this.palm : this.photo);
      ctx.restore();
    }
    drawPalm(ctx, texture) {
      for (const [r, c] of this.cells) {
        if (this.articulated && ys[r + 1] < 318) continue;
        const left = Math.max(0, xs[c] - 4),
          top = Math.max(0, ys[r] - 4);
        const right = Math.min(artWidth, xs[c + 1] + 4),
          bottom = Math.min(artHeight, ys[r + 1] + 4);
        const box = [left, top, right - left, bottom - top],
          i = r * nx + c;
        this.triangle(ctx, i, i + 1, i + nx, box, texture);
        this.triangle(ctx, i + nx, i + 1, i + nx + 1, box, texture);
      }
    }
    draw(ctx) {
      if (!this.photo) return;
      if (!this.transition) this.shade(ctx, 1);
      this.drawSkin(ctx);
    }
  }
  return { OverheadHand };
})();
