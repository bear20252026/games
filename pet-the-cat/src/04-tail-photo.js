/**
 * TailPhoto —— 把尾巴照片贴着骨骼"蒙"上去
 *
 * 照片是横向条带：尾部横向切图，stripOrigin 处是尾巴根，之后每 1/1000 长度对应一列像素。
 * drawSections() 沿骨骼每 50px 取一条截面，截面上的像素按 widthScale 展开，形成四边形带；
 * 四边形再拆成两个三角形贴图。
 *
 * 两套光栅化：
 *  - rasterTriangle()：写进 ImageData 的软件光栅，带 1.5px 膨胀做边缘抗锯齿（小图/无 GPU 时）
 *  - drawTriangle()：用 canvas 的 clip + 仿射变换直接贴图（快，但有接缝）
 * 只有在尾巴形变超过亚像素阈值时才重绘（changed 判断），省掉大量开销。
 */

'use strict';
const { TailPhoto } = (() => {
  const photoWidth = 1517,
    stripOrigin = 20,
    halfWidth = 100,
    bandHeight = 50;
  function hasInk(pixels, left, top, right, bottom) {
    const x0 = Math.max(0, Math.floor(left) - 3),
      x1 = Math.min(pixels.width, Math.ceil(right) + 3);
    const y0 = Math.max(0, top - 3),
      y1 = Math.min(pixels.height, bottom + 3);
    for (let y = y0; y < y1; y++) {
      let alpha = (y * pixels.width + x0) * 4 + 3;
      for (let x = x0; x < x1; x++, alpha += 4) if (pixels.data[alpha]) return true;
    }
    return false;
  }
  function texture(pixels) {
    const { width, height, data } = pixels,
      stride = width + 2;
    const texels = new Uint8ClampedArray(4 * stride * (height + 2));
    for (let y = 0; y < height + 2; y++) {
      const row = width * Math.max(0, Math.min(height - 1, y - 1));
      for (let x = 0; x < stride; x++) {
        const s = 4 * (row + Math.max(0, Math.min(width - 1, x - 1))),
          d = 4 * (y * stride + x),
          a = data[s + 3];
        texels[d] = (data[s] * a) / 255;
        texels[d + 1] = (data[s + 1] * a) / 255;
        texels[d + 2] = (data[s + 2] * a) / 255;
        texels[d + 3] = a;
      }
    }
    return { texels, stride, height };
  }
  function rasterTriangle(dst, tex, a, b, c, dpr) {
    const dx = b.x - a.x,
      dy = b.y - a.y,
      ex = c.x - a.x,
      ey = c.y - a.y,
      det = dx * ey - ex * dy;
    if (Math.abs(det) < 0.00001) return;
    const u = b.s - a.s,
      v = b.t - a.t,
      p = c.s - a.s,
      q = c.t - a.t;
    const ux = (u * ey - p * dy) / det,
      uy = (p * dx - u * ex) / det,
      vx = (v * ey - q * dy) / det,
      vy = (q * dx - v * ex) / det;
    const ab = Math.hypot(dx, dy),
      ac = Math.hypot(ex, ey),
      bc = Math.hypot(c.x - b.x, c.y - b.y),
      per = ab + ac + bc;
    const radius = Math.abs(det) / per,
      cx = (a.x * bc + b.x * ac + c.x * ab) / per,
      cy = (a.y * bc + b.y * ac + c.y * ab) / per;
    const pad = Math.min(1.5 * radius, 0.72 * dpr),
      expand = 1 + (pad + 0.65) / radius;
    const edgeFor = (x, y) => ({ x: cx + (x - cx) * expand, y: cy + (y - cy) * expand });
    let lo = edgeFor(a.x, a.y),
      mid = edgeFor(b.x, b.y),
      hi = edgeFor(c.x, c.y);
    const top = Math.max(0, Math.ceil(Math.min(lo.y, mid.y, hi.y) - 0.5)),
      bottom = Math.min(dst.height, Math.ceil(Math.max(lo.y, mid.y, hi.y) - 0.5));
    const flip = Math.sign(det),
      ax = (-dy / ab) * flip,
      ay = (dx / ab) * flip,
      bx = (-(c.y - b.y) / bc) * flip,
      by = ((c.x - b.x) / bc) * flip,
      kx = (ey / ac) * flip,
      ky = (-ex / ac) * flip;
    const leftS = Math.max(0, Math.floor(Math.min(a.s, b.s, c.s)) - 2) + 0.5,
      rightS = Math.min(tex.stride - 2, Math.ceil(Math.max(a.s, b.s, c.s)) + 2) + 0.5;
    const topT = Math.max(0, Math.floor(Math.min(a.t, b.t, c.t)) - 2) + 0.5,
      bottomT = Math.min(tex.height, Math.ceil(Math.max(a.t, b.t, c.t)) + 2) + 0.5;
    if (lo.y > mid.y) {
      [lo, mid] = [mid, lo];
    }
    if (mid.y > hi.y) {
      [mid, hi] = [hi, mid];
    }
    if (lo.y > mid.y) {
      [lo, mid] = [mid, lo];
    }
    const long = (hi.x - lo.x) / (hi.y - lo.y),
      first = mid.y === lo.y ? 0 : (mid.x - lo.x) / (mid.y - lo.y),
      last = hi.y === mid.y ? 0 : (hi.x - mid.x) / (hi.y - mid.y);
    const { stride, texels } = tex,
      srcStride = 4 * stride,
      out = dst.data;
    for (let y = top; y < bottom; y++) {
      const cy = y + 0.5;
      const x1 = lo.x + (cy - lo.y) * long,
        x2 = cy < mid.y ? lo.x + (cy - lo.y) * first : mid.x + (cy - mid.y) * last;
      const left = Math.max(0, Math.ceil(Math.min(x1, x2) - 0.5)),
        right = Math.min(dst.width, Math.ceil(Math.max(x1, x2) - 0.5));
      let sx = a.s + 0.5 + (left + 0.5 - a.x) * ux + (cy - a.y) * uy,
        sy = a.t + 0.5 + (left + 0.5 - a.x) * vx + (cy - a.y) * vy;
      let f0 = (left + 0.5 - a.x) * ax + (cy - a.y) * ay + pad + 0.5,
        f1 = (left + 0.5 - b.x) * bx + (cy - b.y) * by + pad + 0.5,
        f2 = (left + 0.5 - c.x) * kx + (cy - c.y) * ky + pad + 0.5;
      for (
        let x = left, d = 4 * (y * dst.width + left);
        x < right;
        x++, d += 4, sx += ux, sy += vx, f0 += ax, f1 += bx, f2 += kx
      ) {
        if (sx < leftS || sx >= rightS || sy < topT || sy >= bottomT) continue;
        const cover = Math.min(1, f0, f1, f2);
        if (cover <= 0) continue;
        const ix = sx | 0,
          iy = sy | 0,
          s = 4 * (iy * stride + ix),
          h = s + srcStride;
        const fx = sx - ix,
          fy = sy - iy,
          tl = (1 - fx) * (1 - fy),
          tr = fx * (1 - fy),
          bl = (1 - fx) * fy,
          br = fx * fy;
        const alpha =
          cover *
          (texels[s + 3] * tl + texels[s + 7] * tr + texels[h + 3] * bl + texels[h + 7] * br);
        if (alpha < 0.5) continue;
        const r = texels[s] * tl + texels[s + 4] * tr + texels[h] * bl + texels[h + 4] * br;
        const g = texels[s + 1] * tl + texels[s + 5] * tr + texels[h + 1] * bl + texels[h + 5] * br;
        const b = texels[s + 2] * tl + texels[s + 6] * tr + texels[h + 2] * bl + texels[h + 6] * br;
        if (alpha >= 254.5) {
          out[d] = r;
          out[d + 1] = g;
          out[d + 2] = b;
          out[d + 3] = 255;
          continue;
        }
        const under = out[d + 3] * (1 - alpha / 255),
          combined = alpha + under;
        out[d] = (255 * r * cover + under * out[d]) / combined;
        out[d + 1] = (255 * g * cover + under * out[d + 1]) / combined;
        out[d + 2] = (255 * b * cover + under * out[d + 2]) / combined;
        out[d + 3] = combined;
      }
    }
  }
  function drawTriangle(g, photo, a, b, c) {
    const u = b.s - a.s,
      v = b.t - a.t,
      p = c.s - a.s,
      q = c.t - a.t,
      D = u * q - v * p;
    const X = b.x - a.x,
      Y = b.y - a.y,
      Z = c.x - a.x,
      W = c.y - a.y;
    const m = (X * q - Z * v) / D,
      n = (Y * q - W * v) / D,
      h = (Z * u - X * p) / D,
      k = (W * u - Y * p) / D;
    const ab = Math.hypot(X, Y),
      ac = Math.hypot(Z, W),
      bc = Math.hypot(X - Z, Y - W),
      perimeter = ab + ac + bc;
    if (perimeter < 0.0001) return;
    const cx = (a.x * bc + b.x * ac + c.x * ab) / perimeter,
      cy = (a.y * bc + b.y * ac + c.y * ab) / perimeter;
    const expand = Math.min(1.5, (0.72 * perimeter) / Math.max(0.01, Math.abs(X * W - Y * Z)));
    g.save();
    g.beginPath();
    for (const pt of [a, b, c]) {
      const dx = (pt.x - cx) * expand,
        dy = (pt.y - cy) * expand;
      if (pt === a) g.moveTo(pt.x + dx, pt.y + dy);
      else g.lineTo(pt.x + dx, pt.y + dy);
    }
    g.closePath();
    g.clip();
    g.transform(m, n, h, k, a.x - m * a.s - h * a.t, a.y - n * a.s - k * a.t);
    const l = Math.max(0, Math.floor(Math.min(a.s, b.s, c.s)) - 2),
      t = Math.max(0, Math.min(a.t, b.t, c.t) - 2);
    const w = Math.min(photo.width, Math.ceil(Math.max(a.s, b.s, c.s)) + 2) - l;
    const height = Math.min(photo.height, Math.max(a.t, b.t, c.t) + 2) - t;
    g.drawImage(photo, l, t, w, height, l, t, w, height);
    g.restore();
  }
  function drawSections(view, tail, socket, visible, draw) {
    const nodes = tail.nodes,
      photo = tail.image;
    if (!photo) return;
    let previous = null;
    for (let j = -1; j <= nodes.length; j++) {
      const i = Math.max(0, Math.min(nodes.length - 1, j)),
        n = nodes[i];
      const a = nodes[Math.max(0, i - 1)],
        b = nodes[Math.min(nodes.length - 1, i + 1)];
      const dx = b.u - a.u,
        dy = b.v - a.v,
        length = Math.hypot(dx, dy) || 1,
        tx = dx / length,
        ty = dy / length;
      const S = stripOrigin + n.arc * photoWidth,
        s = j < 0 ? 0 : j === nodes.length ? photo.width : S;
      const ext = (s - S) / photoWidth,
        x = n.u + ext * tx,
        y = n.v + ext * ty;
      const row = [];
      for (let t = 0; t <= photo.height; t += bandHeight) {
        const across = (t - halfWidth) / photoWidth,
          d = across * n.widthScale;
        const nap = n.furTravel * Math.min(1, Math.abs(across) / n.r);
        const px = x - d * ty + nap * tx,
          py = y + d * tx + nap * ty;
        const [u, v] = n.arc < 0.095 ? socket.seat(i, across, ext, px, py) : [px, py];
        row.push({ s, t, x: view.x + u * view.w, y: view.y + v * view.w });
      }
      if (previous)
        for (let k = 0; k < row.length - 1; k++) {
          if (!visible[j][k]) continue;
          draw(previous[k], row[k], previous[k + 1]);
          draw(previous[k + 1], row[k], row[k + 1]);
        }
      previous = row;
    }
  }
  class TailPhoto {
    constructor() {
      this.photo = document.createElement('canvas');
      this.ink = this.photo.getContext('2d');
      this.shape = [];
    }
    setSections(pixels, nodes) {
      this.tex = texture(pixels);
      const edges = [0, ...nodes.map((n) => stripOrigin + n.arc * photoWidth), pixels.width];
      this.visible = [];
      for (let i = 1; i < edges.length; i++) {
        const bands = [];
        for (let top = 0; top < pixels.height; top += bandHeight)
          bands.push(hasInk(pixels, edges[i - 1], top, edges[i], top + bandHeight));
        this.visible.push(bands);
      }
    }
    draw(g, view, tail, socket) {
      const nodes = tail.nodes,
        W = view.w,
        d = view.dpr;
      const joint = [];
      for (const i of [2, 4]) {
        const n = nodes[i],
          normal = socket.normals[i];
        for (const off of [-0.031, 0.031])
          joint.push(...socket.seat(i, off, 0, n.u + off * normal.x, n.v + off * normal.y));
      }
      const moved =
        !this.lastJoint || joint.some((v, i) => Math.abs(v - this.lastJoint[i]) * W * d > 0.26);
      const changed =
        moved ||
        this.image !== tail.image ||
        this.w !== W ||
        this.d !== d ||
        nodes.some(
          (n, i) =>
            !this.shape[i] ||
            Math.max(
              Math.abs(n.u - this.shape[i].u),
              Math.abs(n.v - this.shape[i].v),
              n.r * Math.abs(n.widthScale - this.shape[i].widthScale),
              Math.abs(n.furTravel - this.shape[i].furTravel),
            ) >
              0.36 / (W * d),
        );
      if (changed) {
        this.lastJoint = joint;
        this.image = tail.image;
        this.w = W;
        this.d = d;
        this.shape = nodes.map((n) => ({
          u: n.u,
          v: n.v,
          widthScale: n.widthScale,
          furTravel: n.furTravel,
        }));
        const margin = W * 0.084;
        this.left = Math.floor((Math.min(...nodes.map((n) => n.u)) * W - margin) * d) / d;
        this.top = Math.floor((Math.min(...nodes.map((n) => n.v)) * W - margin) * d) / d;
        const right = Math.max(...nodes.map((n) => n.u)) * W + margin,
          bottom = Math.max(...nodes.map((n) => n.v)) * W + margin;
        const neededW = Math.ceil((right - this.left) * d),
          neededH = Math.ceil((bottom - this.top) * d);
        if (neededW > this.photo.width || neededH > this.photo.height) {
          this.photo.width = Math.ceil(Math.max(neededW, this.photo.width) / 64) * 64;
          this.photo.height = Math.ceil(Math.max(neededH, this.photo.height) / 64) * 64;
        }
        this.usedW = neededW;
        this.usedH = neededH;
        const c = this.ink;
        const region = { x: -this.left * d, y: -this.top * d, w: W * d };
        if (region.w <= photoWidth) {
          let buffer = this.buffer;
          if (!buffer || neededW > buffer.width || neededH > buffer.height) {
            const w = Math.ceil(Math.max(neededW, buffer?.width ?? 0) / 64) * 64;
            const h = Math.ceil(Math.max(neededH, buffer?.height ?? 0) / 64) * 64;
            buffer = this.buffer = c.createImageData(w, h);
          }
          buffer.data.fill(0, 0, 4 * buffer.width * neededH);
          drawSections(region, tail, socket, this.visible, (a, b, e) =>
            rasterTriangle(buffer, this.tex, a, b, e, d),
          );
          c.putImageData(buffer, 0, 0, 0, 0, neededW, neededH);
        } else {
          c.setTransform(1, 0, 0, 1, 0, 0);
          c.clearRect(0, 0, this.photo.width, this.photo.height);
          c.setTransform(d, 0, 0, d, 0, 0);
          drawSections(
            { x: -this.left, y: -this.top, w: W },
            tail,
            socket,
            this.visible,
            (a, b, e) => drawTriangle(c, tail.image, a, b, e),
          );
        }
      }
      g.drawImage(
        this.photo,
        0,
        0,
        this.usedW,
        this.usedH,
        view.x + this.left,
        view.y + this.top,
        this.usedW / d,
        this.usedH / d,
      );
    }
  }
  return { TailPhoto };
})();
