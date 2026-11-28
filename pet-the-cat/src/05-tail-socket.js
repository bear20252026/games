/**
 * TailSocket —— 尾巴根部与身体网格的"缝合"
 *
 * 尾巴是独立骨架，身体是独立网格，两者接口处会撕裂。这里把靠近尾巴的身体顶点
 * 按 influence(arc, 横向距离) 的权重拉到尾巴坐标系里，越靠根权重越大。
 * seat() 负责把尾巴横截面贴到身体表面（先取身体网格坐标，再按距离衰减回尾巴坐标），
 * 所以尾巴根看起来是从毛里长出来的，而不是插在身体上。
 */

'use strict';
const { TailSocket } = (() => {
  const aspect = 935 / 1517;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  const smooth = (lo, hi, x) => {
    const k = clamp((x - lo) / (hi - lo));
    return k * k * (3 - 2 * k);
  };
  function frame(nodes, i, rest, out = {}) {
    const a = nodes[Math.max(0, i - 1)],
      b = nodes[Math.min(nodes.length - 1, i + 1)];
    const x = rest ? b.x - a.x : b.u - a.u,
      y = rest ? b.y - a.y : b.v - a.v;
    const inv = 1 / (Math.hypot(x, y) || 1);
    out.x = -y * inv;
    out.y = x * inv;
    return out;
  }
  function influence(arc, d) {
    const along = smooth(0.013, 0.092, arc),
      edge = smooth(0.042, 0.103, Math.abs(d));
    return along * (1 - (1 - along) * edge);
  }
  class TailSocket {
    constructor(tail, vertices) {
      this.tail = tail;
      const nodes = tail.nodes;
      this.rest = nodes.map((_, i) => frame(nodes, i, true));
      this.normals = nodes.map(() => ({ x: 0, y: 0 }));
      this.raw = new Float32Array(vertices.length * 2);
      this.centers = nodes.map((n) => ({ u: n.u, v: n.v }));
      this.wedge = [];
      for (let j = 0; j < vertices.length; j++) {
        const { x, y } = vertices[j],
          Y = y * aspect;
        if (x < 0.746 || x > 0.836 || y < 0.275 || y > 0.68) continue;
        let i = 0,
          f = 0,
          d = 0,
          best = Infinity;
        for (let k = 0; k < 8; k++) {
          const a = nodes[k],
            b = nodes[k + 1],
            tx = (b.x - a.x) / a.length,
            ty = (b.y - a.y) / a.length;
          const t = clamp(((x - a.x) * tx + (Y - a.y) * ty) / a.length);
          const rx = x - a.x - (b.x - a.x) * t,
            ry = Y - a.y - (b.y - a.y) * t,
            l = rx * rx + ry * ry;
          if (l < best) {
            best = l;
            i = k;
            f = t;
            d = -rx * ty + ry * tx;
          }
        }
        const a = nodes[i],
          b = nodes[i + 1],
          arc = a.arc + f * a.length;
        if (a.arc === 0 && f === 0) continue;
        const w = influence(arc, d);
        if (w < 0.00001) continue;
        this.wedge.push({ j: 2 * j, i, f, d, w, x, y: Y });
      }
    }
    update(surface, xy, light) {
      this.surface = surface;
      this.raw.set(xy);
      this.bound = xy;
      const nodes = this.tail.nodes,
        R = this.rest,
        N = this.normals;
      this.tail.centers = this.centers;
      for (let i = 0; i < 9; i++) frame(nodes, i, false, N[i]);
      for (const p of this.wedge) {
        const { j, i, f, d, w } = p,
          g = 1 - f,
          a = nodes[i],
          b = nodes[i + 1];
        const dx =
          (a.u - a.x) * g +
          (b.u - b.x) * f +
          d * ((N[i].x - R[i].x) * g + (N[i + 1].x - R[i + 1].x) * f);
        const dy =
          (a.v - a.y) * g +
          (b.v - b.y) * f +
          d * ((N[i].y - R[i].y) * g + (N[i + 1].y - R[i + 1].y) * f);
        xy[j] += w * (p.x + dx - xy[j]);
        xy[j + 1] += w * ((p.y + dy) / aspect - xy[j + 1]);
        light[j] *= 1 - w;
        light[j + 1] *= 1 - w;
      }
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i],
          p = this.centers[i];
        if (n.arc < 0.095) {
          [p.u, p.v] = this.seat(i, 0, 0, n.u, n.v);
        } else {
          p.u = n.u;
          p.v = n.v;
        }
      }
    }
    seat(i, d, ext, x, y) {
      const a = this.tail.nodes[i],
        normal = this.rest[i];
      const arc = a.arc + ext,
        w = influence(arc, d);
      if (w >= 1) return [x, y];
      const u = a.x + ext * normal.y + d * normal.x,
        v = (a.y - ext * normal.x + d * normal.y) / aspect;
      const bx = this.surface.sample(this.raw, u, v, 0),
        by = this.surface.sample(this.raw, u, v, 1) * aspect;
      const tx = bx + (x - bx) * w,
        ty = by + (y - by) * w;
      const away = smooth(0.06, 0.088, arc);
      if (away >= 1) return [tx, ty];
      const mx = this.surface.sample(this.bound, u, v, 0),
        my = this.surface.sample(this.bound, u, v, 1) * aspect;
      return [mx + (tx - mx) * away, my + (ty - my) * away];
    }
  }
  return { TailSocket };
})();
