/**
 * FurContact —— 手指与毛的接触细节
 *
 *  - coatFringe()/furAlpha()：沿猫身边缘取一圈"毛边"alpha，手指压上去时毛会被遮住
 *  - fringeAlpha()/makeMargin()：生成指缘的一圈绒毛遮罩，让手指边缘"融"进毛里
 *  - fitMargin()：按透视与厚度调整遮罩位置
 * draw() 把指根阴影、毛边合成到手层上，这是"手真的陷进毛里"的观感来源。
 */

'use strict';
const { FurContact } = (() => {
  const smooth = (lo, hi, x) => {
    const t = Math.max(0, Math.min(1, (x - lo) / (hi - lo)));
    return t * t * (3 - 2 * t);
  };
  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  function coatFringe(surface) {
    const { src, sw, sh } = surface,
      start = Math.floor(sw * 0.19),
      end = Math.ceil(sw * 0.74);
    const outline = new Float32Array(sw),
      edge = new Float32Array(sw),
      r = Math.max(4, Math.round(sw * 0.014));
    for (let x = start - r; x <= end + r; x++) {
      let y = Math.floor(sh * 0.84);
      while (y > sh * 0.47 && src[4 * (y * sw + x) + 3] < 155) y--;
      outline[x] = y;
    }
    let sum = 0;
    for (let x = start - r; x <= start + r; x++) sum += outline[x];
    for (let x = start; x < end; x++) {
      edge[x] = sum / (2 * r + 1);
      sum += outline[x + r + 1] - outline[x - r];
    }
    return { src, sw, edge };
  }
  function furAlpha(photo, x, y) {
    const { src, sw } = photo,
      ix = Math.floor(x),
      iy = Math.floor(y),
      fx = x - ix,
      fy = y - iy;
    const i = 4 * (iy * sw + ix) + 3,
      j = i + sw * 4;
    return (
      (src[i] + fx * (src[i + 4] - src[i])) * (1 - fy) + (src[j] + fx * (src[j + 4] - src[j])) * fy
    );
  }
  function fringeAlpha(photo, u, edge, gap, scale, softness) {
    const base = 1 - smooth(-8, -2, gap / softness),
      limit = 1 - smooth(3, 12, gap / softness);
    if (base >= 1 || limit <= 0) return 255 * base;
    const hair = furAlpha(photo, u, edge + (gap * scale * 0.9) / softness) / 255;
    const bed = 1 - smooth(-7, 8, gap / softness);
    return 255 * (base + (limit - base) * (0.72 * hair + 0.28 * bed));
  }
  function makeMargin(photo, image, left, top, tipX, tipY, axisX, axisY, digit) {
    const w = 183,
      h = 176,
      x0 = Math.floor(tipX - 58),
      y0 = Math.floor(tipY - 37);
    const sampler = canvas(w, h),
      sg = sampler.getContext('2d', { willReadFrequently: true });
    sg.drawImage(image, left - x0, top - y0);
    const skin = sg.getImageData(0, 0, w, h).data,
      scale = photo.sw / 1517;
    const shapes = [sg.createImageData(w, h), sg.createImageData(w, h)];
    const digitScale = [1, 0.92, 0.99, 0.82, 0.79][digit],
      submerge = [5, -8, 8, -12, -4][digit];
    let minX = w,
      minY = h,
      maxX = 0,
      maxY = 0;
    for (let y = 1; y < h - 1; y++) {
      let lo = 1,
        hi = w - 2;
      while (lo < w - 1 && skin[4 * (w * y + lo) + 3] < 120) lo++;
      while (hi > lo && skin[4 * (w * y + hi) + 3] < 120) hi--;
      for (let x = 1; x < w - 1; x++) {
        const dx = x + x0 - tipX,
          dy = y + y0 - tipY;
        const along = dx * axisX + dy * axisY,
          across = -dx * axisY + dy * axisX;
        if (along > 51 || along < -37 || Math.abs(across) > 35) continue;
        const depth = submerge + 0.28 * across + 0.01 * across * across;
        const u = photo.sw * (0.23 + 0.072 * digit) + across * scale;
        const ix = Math.floor(u),
          f = u - ix,
          baseline = photo.edge[ix] + f * (photo.edge[ix + 1] - photo.edge[ix]);
        const index = 4 * (w * y + x) + 3;
        for (let level = 0; level < 2; level++) {
          const end = level ? depth : depth * 0.6 - 13;
          const opacity =
            fringeAlpha(photo, u, baseline, along - end, scale, 1.2) *
            (1 - smooth(27, 35, Math.abs(across))) *
            smooth(-37, -29, along);
          if (opacity < 1) continue;
          shapes[level].data[index] = opacity;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
      if (lo >= hi) continue;
      for (const side of [1, -1]) {
        const root = side > 0 ? lo : hi;
        if (root === 1 || root === w - 2) continue;
        const a = skin[4 * (w * y + root) + 3],
          prior = skin[4 * (w * y + root - side) + 3];
        const rim = root - (side * (a - 120)) / Math.max(1, a - prior);
        const along = (rim + x0 - tipX) * axisX + (y + y0 - tipY) * axisY;
        const proximal = y + y0 - tipY;
        const upstream = side > 0;
        const sidePad =
          smooth(-27, upstream ? 2 : 14, along) *
          (1 - smooth(48, 112, along)) *
          smooth(upstream ? -25 : -9, upstream ? 9 : 21, proximal);
        if (sidePad < 0.012) continue;
        const strength = digitScale * (upstream ? 1 : 0.3) * sidePad;
        const softness = 0.38 + 0.62 * sidePad;
        const donor = photo.sw * (0.226 + 0.071 * digit + (upstream ? 0 : 0.026));
        const end = Math.min(58, hi - lo + 4);
        for (let step = -5; step <= end; step++) {
          const x = root + side * step,
            depth = (x - rim) * side;
          if (x <= 0 || x >= w - 1) continue;
          const u = donor + (y - 0.36 * depth) * scale,
            ix = Math.floor(u),
            f = u - ix;
          const baseline = photo.edge[ix] + f * (photo.edge[ix + 1] - photo.edge[ix]);
          const rimOpacity = smooth(-5, -1, depth) * smooth(0, 0.25, sidePad);
          const index = 4 * (w * y + x) + 3;
          for (let level = 0; level < 2; level++) {
            const reach = (level ? 20 : 9) * strength;
            const opacity =
              fringeAlpha(photo, u, baseline, depth - reach, scale, softness) * rimOpacity;
            if (opacity <= shapes[level].data[index] || opacity < 1) continue;
            shapes[level].data[index] = Math.min(opacity, 254);
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
          }
        }
      }
    }
    const bw = Math.max(1, maxX - minX + 1),
      bh = Math.max(1, maxY - minY + 1);
    const beds = shapes.map((shape) => {
      const bed = canvas(bw, bh);
      bed.getContext('2d').putImageData(shape, -minX, -minY, minX, minY, bw, bh);
      return bed;
    });
    return {
      beds,
      x0: x0 + minX,
      y0: y0 + minY,
      w: bw,
      h: bh,
      digit,
      tipX,
      tipY,
      m: new Float64Array(6),
    };
  }
  function restToScreen(hand, digit, x, y, q) {
    if (hand.articulated) {
      hand.digitPoint(x, y, digit, q);
      x = q[0];
      y = q[1];
    }
    hand.point(x, y, q);
  }
  function fitMargin(part, hand, q) {
    const { tipX: x, tipY: y, m, digit } = part,
      span = 32;
    restToScreen(hand, digit, x, y, q);
    const ox = q[0],
      oy = q[1];
    restToScreen(hand, digit, x + span, y, q);
    m[0] = (q[0] - ox) / span;
    m[1] = (q[1] - oy) / span;
    restToScreen(hand, digit, x, y + span, q);
    m[2] = (q[0] - ox) / span;
    m[3] = (q[1] - oy) / span;
    m[4] = ox + (part.x0 - x) * m[0] + (part.y0 - y) * m[2];
    m[5] = oy + (part.x0 - x) * m[1] + (part.y0 - y) * m[3];
  }
  class FurContact {
    constructor() {
      this.q = new Float64Array(2);
      this.coats = new WeakMap();
    }
    draw(ctx, view, layer, cat, hand, input, altitude) {
      if (!cat.longCoat || !input || input.zone === 'tail' || altitude >= 0.94) return;
      const bearing = 1 - altitude;
      const load = smooth(0.02, 0.79, 0.62 * input.pressure + 0.38 * cat.tip.load);
      if (bearing * load < 0.01) return;
      if (!this.buffer) {
        this.buffer = canvas(1, 1);
        this.ink = this.buffer.getContext('2d');
      }
      let parts = this.coats.get(cat.surface.img);
      if (!parts) {
        const fringe = coatFringe(cat.surface);
        parts = hand.fingers.map((f, i) => {
          const part = hand.parts[i];
          return makeMargin(fringe, part.tones[0], part.left, part.top, ...f.tip, -f.ax, -f.ay, i);
        });
        this.coats.set(cat.surface.img, parts);
      }
      const dpr = view.dpr;
      let x0 = view.width,
        y0 = view.height,
        x1 = 0,
        y1 = 0;
      for (const part of parts) {
        fitMargin(part, hand, this.q);
        const [a, b, c, d, x, y] = part.m,
          xx = a * part.w,
          xy = b * part.w,
          yx = c * part.h,
          yy = d * part.h;
        x0 = Math.min(x0, x + Math.min(0, xx) + Math.min(0, yx));
        x1 = Math.max(x1, x + Math.max(0, xx) + Math.max(0, yx));
        y0 = Math.min(y0, y + Math.min(0, xy) + Math.min(0, yy));
        y1 = Math.max(y1, y + Math.max(0, xy) + Math.max(0, yy));
      }
      const px = Math.max(0, Math.floor(x0 * dpr) - 1),
        py = Math.max(0, Math.floor(y0 * dpr) - 1);
      const w = Math.min(ctx.canvas.width, Math.ceil(x1 * dpr) + 1) - px;
      const h = Math.min(ctx.canvas.height, Math.ceil(y1 * dpr) + 1) - py;
      if (w < 1 || h < 1) return;
      const buffer = this.buffer,
        g = this.ink;
      if (buffer.width < w) buffer.width = Math.ceil(w / 32) * 32;
      if (buffer.height < h) buffer.height = Math.ceil(h / 32) * 32;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalCompositeOperation = 'source-over';
      g.clearRect(0, 0, w, h);
      const crown = input.skull ?? 0;
      const deep = smooth(0.16, 0.94, load) * (1 - 0.68 * crown);
      for (const part of parts) {
        const [a, b, c, d, x, y] = part.m;
        g.setTransform(a * dpr, b * dpr, c * dpr, d * dpr, x * dpr - px, y * dpr - py);
        g.globalAlpha = bearing * load * (1 - 0.19 * crown);
        g.drawImage(part.beds[0], 0, 0);
        const loft =
          0.96 +
          0.04 *
            Math.sin(
              ((x - view.x) * 86) / view.w + ((y - view.y) * 55) / view.h + part.tipX * 0.14,
            );
        g.globalAlpha = bearing * deep * loft;
        g.drawImage(part.beds[1], 0, 0);
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-in';
      const sx = layer.width / (view.width * dpr),
        sy = layer.height / (view.height * dpr);
      g.drawImage(layer, px * sx, py * sy, w * sx, h * sy, 0, 0, w, h);
      ctx.drawImage(buffer, 0, 0, w, h, px / dpr, py / dpr, w / dpr, h / dpr);
    }
  }
  return { FurContact };
})();
