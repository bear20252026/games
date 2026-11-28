/**
 * TailHand —— 抓尾巴那只手
 *
 * 和 OverheadHand 用同一套分层素材，但姿态不同：手掌包住尾巴（角度随抓握点旋转），
 * configure() 接收抓握位置、按压力度、滑动量、帧间隔，驱动手指弯曲与皮肤拉伸。
 */

'use strict';
const { TailHand } = (() => {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (x) => {
    x = clamp(x, 0, 1);
    return x * x * (3 - 2 * x);
  };
  const layout = {
    cx: 452,
    cy: 204,
    size: 0.87,
    wrist: [544, 623],
    bottom: [423, 828],
    tips: [
      [336, 120],
      [421, 98],
      [519, 110],
      [606, 134],
      [253, 188],
    ],
    knuckles: [
      [357, 257],
      [458, 239],
      [551, 241],
      [640, 267],
      [238, 278],
    ],
    arm: [
      [472, 373],
      [544, 623],
      [560, 703],
      [608, 1050],
      [629, 1460],
      [296, 392],
      [428, 718],
      [676, 679],
    ],
  };
  function surface(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  const xs = [0, 176, 226, 266, 311, 354, 394, 439, 486, 531, 576, 622, 666, 718, 824, 930, 1024];
  const ys = [
    0, 67, 97, 126, 156, 191, 230, 274, 329, 401, 489, 556, 624, 702, 834, 1040, 1270, 1536,
  ];
  const closedScale = 0.83;
  class TailHand {
    constructor() {
      this.layout = layout;
      this.angle = 0;
    }
    load(photo) {
      this.photo = photo;
      const tiny = surface(128, 192),
        c = tiny.getContext('2d', { willReadFrequently: true });
      c.drawImage(photo, 0, 0, 128, 192);
      const pix = c.getImageData(0, 0, 128, 192).data;
      this.grid = [];
      this.spans = [];
      for (const y of ys) for (const x of xs) this.grid.push([x, y]);
      for (let j = 0; j < ys.length - 1; j++)
        for (let i = 0; i < xs.length - 1; i++) {
          let occupied = false;
          for (
            let y = Math.max(0, (ys[j] >> 3) - 1);
            y < Math.min(192, Math.ceil(ys[j + 1] / 8) + 1) && !occupied;
            y++
          )
            for (
              let x = Math.max(0, (xs[i] >> 3) - 1);
              x < Math.min(128, Math.ceil(xs[i + 1] / 8) + 1);
              x++
            ) {
              if (pix[(128 * y + x) * 4 + 3] > 2) {
                occupied = true;
                break;
              }
            }
          if (occupied) {
            const last = this.spans.at(-1);
            if (last && last.row === j && last.end === i) last.end = i + 1;
            else this.spans.push({ row: j, start: i, end: i + 1 });
          }
        }
      this.xy = new Float64Array(this.grid.length * 2);
      this.q = new Float64Array(2);
      return this;
    }
    configure(view, p, x, y, amount, pressure, slide, dt) {
      const l = this.layout;
      this.x = x;
      this.y = y;
      this.k = (view.handWidth * 0.5166 * l.size * closedScale) / 1024;
      this.transition = null;
      this.sleeveDrop = 0;
      this.dpr = view.dpr || 1;
      const target = 0.24 * p.ty + 0.026 * Math.tanh(slide * 4),
        f = 1 - Math.exp(-dt / 0.09);
      if (amount < 0.07) this.angle = target;
      else this.angle += (target - this.angle) * f;
      this.c = Math.cos(this.angle);
      this.s = Math.sin(this.angle);
      const fore = 0.53 * this.angle + ease((p.u - 0.79) / 0.2) * 0.12;
      this.ca = Math.cos(fore);
      this.sa = Math.sin(fore);
      const wx = l.wrist[0] - l.cx,
        wy = l.wrist[1] - l.cy;
      this.wx = this.c * wx - this.s * wy;
      this.wy = this.s * wx + this.c * wy;
      const diameter = (2 * p.feltRadius * view.w) / this.k;
      this.fold =
        (1 - amount) * -22 + amount * (clamp((125 - diameter) * 0.23, -13, 20) + pressure * 6);
      const along = p.tx * this.c + p.ty * this.s,
        cross = p.ty * this.c - p.tx * this.s;
      const edge = p.upperFur * view.w;
      const reach = (edge + Math.abs(cross) * 130 * this.k) / Math.max(0.65, along);
      const cover = (78 - this.fold) * this.k;
      const lift =
        clamp(reach - cover, 0, edge * 0.87) * ease((along - 0.25) / 0.55) * ease(amount);
      this.x += this.s * lift;
      this.y -= this.c * lift;
      this.closing = 4 * amount * (1 - amount);
      this.slide = clamp(slide * 16, -7, 7) * amount;
      this.sleeveDrop = sleeveReach(this, view, ...l.bottom);
    }
    point(x, y, out, i = 0) {
      const l = this.layout,
        dx = x - l.cx;
      const knuckles = 1 - ease((y - l.cy + 36) / 173);
      const thumb = 1 - ease((x - l.cx + 180) / 87);
      const fold = this.fold - this.closing * 9 * ease((x - 366) / 225);
      const px = dx + knuckles * (thumb * 0.65 * fold - (0.045 * dx * fold) / 20 - this.slide);
      const py = y - l.cy + knuckles * fold * (1 - 0.55 * thumb);
      const hx = this.c * px - this.s * py,
        hy = this.s * px + this.c * py;
      const sx = x - l.wrist[0],
        sy = y - l.wrist[1],
        arm = ease((y + 0.2 * sx - 553) / 240);
      out[i] =
        this.x + this.k * (hx + (this.wx + (this.ca * sx - this.sa * sy) / closedScale - hx) * arm);
      out[i + 1] =
        this.y + this.k * (hy + (this.wy + (this.sa * sx + this.ca * sy) / closedScale - hy) * arm);
      if (this.sleeveDrop && y > 680) out[i + 1] += this.sleeveDrop * ease((y - 680) / 855);
      if (this.transition) this.transition.project(out, i);
    }
    triangle(ctx, ia, ib, ic) {
      const [ax, ay] = this.grid[ia],
        [bx, by] = this.grid[ib],
        [cx, cy] = this.grid[ic];
      const uvx = bx - ax,
        uvy = by - ay,
        px = cx - ax,
        py = cy - ay,
        det = uvx * py - uvy * px;
      const o = this.xy,
        A = ia * 2,
        B = ib * 2,
        C = ic * 2,
        X = o[B] - o[A],
        Y = o[B + 1] - o[A + 1],
        Z = o[C] - o[A],
        V = o[C + 1] - o[A + 1];
      const m = (X * py - Z * uvy) / det,
        n = (Y * py - V * uvy) / det,
        b = (Z * uvx - X * px) / det,
        d = (V * uvx - Y * px) / det;
      const mx = (o[A] + o[B] + o[C]) / 3,
        my = (o[A + 1] + o[B + 1] + o[C + 1]) / 3;
      ctx.save();
      ctx.beginPath();
      for (const h of [A, B, C]) {
        const vx = o[h] - mx,
          vy = o[h + 1] - my,
          g = 0.64 / Math.max(1, Math.hypot(vx, vy));
        if (h === A) ctx.moveTo(o[h] + vx * g, o[h + 1] + vy * g);
        else ctx.lineTo(o[h] + vx * g, o[h + 1] + vy * g);
      }
      ctx.closePath();
      ctx.clip();
      ctx.transform(m, n, b, d, o[A] - m * ax - b * ay, o[A + 1] - n * ax - d * ay);
      const left = Math.max(0, Math.min(ax, bx, cx) - 2),
        top = Math.max(0, Math.min(ay, by, cy) - 2);
      const w = Math.min(1024, Math.max(ax, bx, cx) + 2) - left,
        h = Math.min(1536, Math.max(ay, by, cy) + 2) - top;
      ctx.drawImage(this.photo, left, top, w, h, left, top, w, h);
      ctx.restore();
    }
    drawSpan(ctx, row, start, end) {
      const xy = this.xy,
        stride = xs.length * 2,
        A = row * stride + 2 * start,
        B = row * stride + 2 * end;
      const C = A + stride,
        D = B + stride,
        x = xs[start],
        y = ys[row],
        w = xs[end] - x,
        h = ys[row + 1] - y;
      const m = (xy[B] - xy[A] + xy[D] - xy[C]) / (2 * w),
        n = (xy[B + 1] - xy[A + 1] + xy[D + 1] - xy[C + 1]) / (2 * w);
      const b = (xy[C] - xy[A] + xy[D] - xy[B]) / (2 * h),
        d = (xy[C + 1] - xy[A + 1] + xy[D + 1] - xy[B + 1]) / (2 * h);
      const ax = (xy[A] + xy[B] + xy[C] + xy[D]) * 0.25 - (m * w + b * h) * 0.5;
      const ay = (xy[A + 1] + xy[B + 1] + xy[C + 1] + xy[D + 1]) * 0.25 - (n * w + d * h) * 0.5;
      const tolerance = 0.18 / this.dpr;
      for (let col = start; col <= end; col++) {
        const i = A + (col - start) * 2,
          dx = xs[col] - x,
          px = ax + dx * m,
          py = ay + dx * n;
        if (
          Math.abs(px - xy[i]) > tolerance ||
          Math.abs(py - xy[i + 1]) > tolerance ||
          Math.abs(px + b * h - xy[i + stride]) > tolerance ||
          Math.abs(py + d * h - xy[i + stride + 1]) > tolerance
        ) {
          if (end > start + 1) {
            const mid = (start + end) >> 1;
            this.drawSpan(ctx, row, start, mid);
            this.drawSpan(ctx, row, mid, end);
          } else {
            const v = A / 2;
            this.triangle(ctx, v, v + 1, v + xs.length);
            this.triangle(ctx, v + xs.length, v + 1, v + xs.length + 1);
          }
          return;
        }
      }
      const pad = 0.65 / (this.k * this.dpr);
      const left = Math.max(0, x - pad),
        top = Math.max(0, y - pad);
      const width = Math.min(1024, x + w + pad) - left,
        height = Math.min(1536, y + h + pad) - top;
      ctx.save();
      ctx.transform(m, n, b, d, ax - m * x - b * y, ay - n * x - d * y);
      ctx.drawImage(this.photo, left, top, width, height, left, top, width, height);
      ctx.restore();
    }
    drawSkin(ctx) {
      for (let i = 0; i < this.grid.length; i++)
        this.point(this.grid[i][0], this.grid[i][1], this.xy, 2 * i);
      for (const { row, start, end } of this.spans) this.drawSpan(ctx, row, start, end);
    }
  }
  return { TailHand };
})();
