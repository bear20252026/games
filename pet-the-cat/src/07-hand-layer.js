/**
 * HandLayer —— 手腕/袖口的遮挡
 *
 * sleeveReach() 先算出袖子伸进画面多远；HandLayer 维护一张与画布同尺寸的遮罩，
 * 把被猫身挡住的袖口部分裁掉，于是手看起来是"从猫身后伸过来"的。
 */

'use strict';
const { sleeveReach, HandLayer } = (() => {
  function sleeveReach(hand, view, left, right) {
    const a = new Float64Array(2),
      b = new Float64Array(2);
    hand.point(left, 1535, a);
    hand.point(right, 1535, b);
    if (Math.max(a[0], b[0]) < 0 || Math.min(a[0], b[0]) > view.width) return 0;
    let minY = Infinity;
    if (a[0] >= 0 && a[0] <= view.width) minY = a[1];
    if (b[0] >= 0 && b[0] <= view.width) minY = Math.min(minY, b[1]);
    for (const side of [0, view.width]) {
      const t = (side - a[0]) / (b[0] - a[0]);
      if (t >= 0 && t <= 1) minY = Math.min(minY, a[1] + (b[1] - a[1]) * t);
    }
    return Math.max(0, view.height + 3 - minY);
  }
  class HandLayer {
    constructor() {
      this.skin = document.createElement('canvas');
      this.tint = document.createElement('canvas');
      this.ink = this.skin.getContext('2d');
      this.small = this.tint.getContext('2d');
    }
    draw(ctx, view, paint, altitude) {
      const w = view.width,
        h = view.height,
        d = view.dpr;
      const W = Math.round(w * d),
        H = Math.round(h * d);
      if (this.skin.width !== W || this.skin.height !== H) {
        this.skin.width = W;
        this.skin.height = H;
        this.tint.width = Math.max(1, Math.round(w * 0.34));
        this.tint.height = Math.max(1, Math.round(h * 0.34));
      }
      const g = this.ink,
        q = this.small;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, W, H);
      g.setTransform(d, 0, 0, d, 0, 0);
      g.save();
      paint(g);
      g.restore();
      const sw = this.tint.width,
        sh = this.tint.height;
      q.clearRect(0, 0, sw, sh);
      q.filter = 'blur(' + Math.max(0.72, w * 0.0013) + 'px)';
      q.drawImage(this.skin, 0, 0, sw, sh);
      q.filter = 'none';
      q.globalCompositeOperation = 'source-in';
      q.fillStyle = '#37271d';
      q.fillRect(0, 0, sw, sh);
      q.globalCompositeOperation = 'source-over';
      ctx.save();
      ctx.globalAlpha = 0.21;
      ctx.drawImage(
        this.tint,
        w * (0.003 + 0.004 * altitude),
        w * (0.004 + 0.008 * altitude),
        w,
        h,
      );
      ctx.globalAlpha = 0.28 * (1 - altitude);
      ctx.drawImage(this.tint, w * 0.0008, w * 0.00155, w, h);
      ctx.restore();
      ctx.drawImage(this.skin, 0, 0, w, h);
    }
  }
  return { sleeveReach, HandLayer };
})();
