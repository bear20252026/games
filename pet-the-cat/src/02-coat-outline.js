/**
 * CoatOutline —— 从身体图里"抠"出轮廓，供手部贴边、遮挡使用
 *
 * - lines/point：把身体图的 alpha 边缘按 marching 方式求交，得到一圈折线段（带法线）
 * - near()：给任意屏幕点找到最近的轮廓点，加权平滑后返回"贴边位置 + 法线 + 在头/背哪个区"
 * - fitNeck()：算出脖子上下两条极限线，手压下去时不能穿过脖子
 * - padCoverage()：查某个 uv 点是否还在猫身上（带 3px 柔化）
 *
 * 手要"压进毛里"而不是浮在照片上，靠的就是这一层几何信息。
 */

'use strict';
const { CoatOutline } = (() => {
  const aspect = 935 / 1517;
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  class CoatOutline {
    constructor(surface) {
      const w = 280,
        h = Math.round((w * surface.sh) / surface.sw),
        cn = document.createElement('canvas');
      cn.width = w;
      cn.height = h;
      const g = cn.getContext('2d', { willReadFrequently: true });
      const alpha = (radius) => {
        g.clearRect(0, 0, w, h);
        g.filter = 'blur(' + radius + 'px)';
        g.drawImage(surface.img, 0, 0, w, h);
        return g.getImageData(0, 0, w, h).data;
      };
      const edge = alpha(1),
        wide = alpha(3.1),
        A = (data, x, y) => data[(y * w + x) * 4 + 3];
      this.maskWidth = w;
      this.maskHeight = h;
      this.padMask = new Uint8Array(w * h);
      for (let i = 0; i < this.padMask.length; i++) this.padMask[i] = wide[i * 4 + 3];
      this.neckColumns = [];
      for (let x = Math.ceil(0.13 * w); x < 0.42 * w; x++) {
        let top = 0,
          bottom = h - 1;
        while (top < bottom && A(edge, x, top) < 128) top++;
        while (bottom > top && A(edge, x, bottom) < 128) bottom--;
        if (bottom > top)
          this.neckColumns.push({
            u: (x + 0.5) / w,
            top: (top + 0.5) / h,
            bottom: (bottom + 0.5) / h,
          });
      }
      this.lines = [];
      const point = (x, y) => {
        const i = clamp(Math.round(x), 2, w - 3),
          j = clamp(Math.round(y), 2, h - 3);
        const nx = A(wide, i + 2, j) - A(wide, i - 2, j),
          ny = A(wide, i, j + 2) - A(wide, i, j - 2),
          L = Math.hypot(nx, ny) || 1;
        return { x: (x + 0.5) / w, y: ((y + 0.5) / h) * aspect, nx: nx / L, ny: ny / L };
      };
      for (let y = 1; y < h - 2; y++)
        for (let x = 1; x < w - 2; x++) {
          const a = A(edge, x, y),
            b = A(edge, x + 1, y),
            c = A(edge, x + 1, y + 1),
            d = A(edge, x, y + 1);
          if (Math.min(a, b, c, d) >= 128 || Math.max(a, b, c, d) < 128) continue;
          const hits = [];
          if (a >= 128 !== b >= 128) hits.push(point(x + (128 - a) / (b - a), y));
          if (b >= 128 !== c >= 128) hits.push(point(x + 1, y + (128 - b) / (c - b)));
          if (d >= 128 !== c >= 128) hits.push(point(x + (128 - d) / (c - d), y + 1));
          if (a >= 128 !== d >= 128) hits.push(point(x, y + (128 - a) / (d - a)));
          for (let i = 0; i + 1 < hits.length; i += 2) {
            const p = hits[i],
              q = hits[i + 1],
              dx = q.x - p.x,
              dy = q.y - p.y,
              length = Math.hypot(dx, dy);
            if (length > 1e-8) this.lines.push({ p, q, dx, dy, length, den: length * length });
          }
        }
    }
    padCoverage(u, v) {
      const w = this.maskWidth,
        h = this.maskHeight,
        x = u * w - 0.5,
        y = v * h - 0.5;
      if (x < 0 || y < 0 || x >= w - 1 || y >= h - 1) return 0;
      const col = Math.floor(x),
        row = Math.floor(y),
        i = row * w + col,
        fx = x - col,
        fy = y - row,
        a = this.padMask;
      const top = a[i] + (a[i + 1] - a[i]) * fx,
        bottom = a[i + w] + (a[i + w + 1] - a[i + w]) * fx;
      return (top + (bottom - top) * fy) / 255;
    }
    fitNeck(cat) {
      if (!this.neckColumns.length) return;
      let top = Infinity,
        innerTop = -Infinity,
        bottom = -Infinity,
        innerBottom = Infinity;
      for (const p of this.neckColumns) {
        const a = cat.restY(p.u, p.top),
          b = cat.restY(p.u, p.bottom);
        top = Math.min(top, a);
        innerTop = Math.max(innerTop, a);
        bottom = Math.max(bottom, b);
        innerBottom = Math.min(innerBottom, b);
      }
      this.topNeck = { side: 1, limit: top, seat: top + 0.6 * (innerTop - top) };
      this.bottomNeck = { side: -1, limit: bottom, seat: bottom + 0.45 * (innerBottom - bottom) };
    }
    near(cat, u, v) {
      const mat = cat.unmap(u, v),
        U = mat.u,
        V = mat.v * aspect;
      let best = Infinity,
        closest = null;
      for (const line of this.lines) {
        const { p, dx, dy, den } = line;
        const t = clamp(((U - p.x) * dx + (V - p.y) * dy) / den);
        const ex = p.x + t * dx - U,
          ey = p.y + t * dy - V,
          d = ex * ex + ey * ey;
        if (d < best) {
          best = d;
          closest = line;
        }
      }
      if (!closest) return null;
      let sum = 0,
        x = 0,
        y = 0,
        nx = 0,
        ny = 0;
      const sigma = 0.014,
        limit = sigma * sigma * 8;
      for (const l of this.lines) {
        const p = l.p;
        if (Math.abs(p.x - closest.p.x) > 0.065 || Math.abs(p.y - closest.p.y) > 0.065) continue;
        const k = clamp(((U - p.x) * l.dx + (V - p.y) * l.dy) / l.den),
          ex = p.x + k * l.dx,
          ey = p.y + k * l.dy;
        const delta = (ex - U) ** 2 + (ey - V) ** 2 - best;
        if (delta > limit) continue;
        const weight = Math.exp(-delta / (2 * sigma * sigma)) * l.length;
        sum += weight;
        x += ex * weight;
        y += ey * weight;
        nx += (p.nx + (l.q.nx - p.nx) * k) * weight;
        ny += (p.ny + (l.q.ny - p.ny) * k) * weight;
      }
      x /= sum;
      y /= sum * aspect;
      const restY = cat.thickness === 1 ? y : cat.restY(x, y);
      if (cat.thickness !== 1) {
        const slope = ((cat.restY(x + 0.001, y) - cat.restY(x - 0.001, y)) * aspect) / 0.002;
        ny /= cat.widthScale(x);
        nx -= slope * ny;
      }
      const norm = Math.hypot(nx, ny) || 1;
      const X = cat.hasMesh ? cat.surface.sample(cat.xy, x, y, 0) : x;
      const Y = cat.hasMesh ? cat.surface.sample(cat.xy, x, y, 1) : restY;
      return {
        u: X,
        v: Y,
        nx: nx / norm,
        ny: ny / norm,
        distance: Math.hypot(u - X, (v - Y) * aspect),
        restDistance: Math.hypot(u - x, (v - restY) * aspect),
        inside: !!mat.zone,
        zone: x < 0.282 ? 'head' : 'back',
      };
    }
  }
  return { CoatOutline };
})();
