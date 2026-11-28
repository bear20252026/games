/**
 * HandChange —— 手从"背"切到"尾"（或反向）时的补间
 *
 * place() 记录起点姿态与目标姿态，按 amount 在两者之间插值（位置、角度、缩放、透明），
 * 避免手瞬移。held 变化时会重置过渡，move 里保存补间参数。
 */

'use strict';
const { HandChange } = (() => {
  const openArm = [
    [305, 323],
    [429, 572],
    [506, 700],
    [659, 1050],
    [724, 1460],
    [207, 473],
    [410, 766],
    [609, 666],
  ];
  const anchorCount = 10 + openArm.length;
  const clamp = (x) => Math.max(0, Math.min(1, x));
  function field() {
    return {
      xy: new Float64Array(anchorCount * 2),
      delta: new Float64Array(anchorCount * 2),
      soft: 1,
      project(out, k) {
        const x = out[k],
          y = out[k + 1];
        let total = 0,
          dx = 0,
          dy = 0;
        for (let i = 0; i < this.xy.length; i += 2) {
          const a = x - this.xy[i],
            b = y - this.xy[i + 1],
            d = a * a + b * b + this.soft;
          const weight = 1 / (d * d);
          total += weight;
          dx += this.delta[i] * weight;
          dy += this.delta[i + 1] * weight;
        }
        out[k] += dx / total;
        out[k + 1] += dy / total;
      },
    };
  }
  class HandChange {
    constructor() {
      this.open = field();
      this.cupped = field();
      this.q = new Float64Array(2);
      this.reset();
    }
    reset() {
      this.held = false;
      this.amount = 0;
      this.rate = 0;
      this.move = null;
      this.view = null;
      this.x = 0;
      this.y = 0;
      this.vx = 0;
      this.vy = 0;
    }
    place(hand, grip, held, dt, view) {
      const q = this.q;
      hand.point(...openArm[1], q);
      const openX = q[0],
        openY = q[1];
      let gripX = openX,
        gripY = openY;
      if (grip) {
        grip.point(...grip.layout.wrist, q);
        gripX = q[0];
        gripY = q[1];
      }
      let x = held ? gripX : openX,
        y = held ? gripY : openY;
      const targetAmount = held ? 1 : 0;
      if (this.view !== view) {
        this.view = view;
        this.x = x;
        this.y = y;
        this.vx = this.vy = 0;
        this.move = null;
        this.amount = targetAmount;
        this.rate = 0;
        this.held = held;
      }
      if (held !== this.held) {
        this.move = {
          x: this.x,
          y: this.y,
          vx: this.vx,
          vy: this.vy,
          amount: this.amount,
          rate: this.rate,
          time: 0,
          duration: held ? 0.29 : 0.26,
        };
        this.held = held;
      }
      const m = this.move;
      if (m) {
        const t = clamp((m.time += dt) / m.duration),
          f = t * t * (3 - 2 * t);
        const carry = m.duration * t * (1 - t) * (1 - t);
        x = m.x + (x - m.x) * f + m.vx * carry;
        y = m.y + (y - m.y) * f + m.vy * carry;
        this.amount = clamp(m.amount + (targetAmount - m.amount) * f + m.rate * carry);
        this.rate =
          ((targetAmount - m.amount) * 6 * t * (1 - t)) / m.duration +
          m.rate * (1 - t) * (1 - 3 * t);
        if (t === 1) {
          this.move = null;
          this.amount = targetAmount;
          this.rate = 0;
        }
      }
      const limit = view.handWidth * 1.7;
      this.vx = Math.max(-limit, Math.min(limit, (x - this.x) / dt));
      this.vy = Math.max(-limit, Math.min(limit, (y - this.y) / dt));
      this.x = x;
      this.y = y;
      hand.px += x - openX;
      hand.py += y - openY;
      if (grip) {
        grip.x += x - gripX;
        grip.y += y - gripY;
        if (this.amount > 0 && this.amount < 1) this.fit(hand, grip, this.amount, view.baseW);
        if (this.move) {
          hand.sleeveDrop += sleeveReach(hand, view, 459, 922);
          grip.sleeveDrop += sleeveReach(grip, view, ...grip.layout.bottom);
        }
      }
      const mix = clamp((this.amount - 0.28) / 0.48);
      return mix * mix * (3 - 2 * mix);
    }
    fit(hand, grip, amount, width) {
      const a = this.open,
        b = this.cupped,
        q = this.q;
      const { tips, knuckles, arm } = grip.layout;
      a.soft = b.soft = (width * 0.003) ** 2;
      for (let i = 0; i < tips.length; i++) {
        const f = hand.fingers[i];
        if (hand.articulated) hand.digitPoint(f.tip[0], f.tip[1], i, q);
        else q.set(f.tip);
        hand.point(q[0], q[1], a.xy, 2 * i);
        grip.point(...tips[i], b.xy, 2 * i);
        const k = 2 * (i + tips.length),
          joint = i === 4 ? f.p : f.m;
        if (hand.articulated) hand.digitPoint(...joint, i, q);
        else q.set(joint);
        hand.point(q[0], q[1], a.xy, k);
        grip.point(...knuckles[i], b.xy, k);
      }
      for (let i = 0; i < openArm.length; i++) {
        const k = 2 * (i + tips.length + knuckles.length);
        hand.point(openArm[i][0], openArm[i][1], a.xy, k);
        grip.point(...arm[i], b.xy, k);
      }
      for (let i = 0; i < a.xy.length; i++) {
        const distance = b.xy[i] - a.xy[i];
        a.delta[i] = distance * amount;
        b.delta[i] = distance * (amount - 1);
      }
      hand.transition = a;
      grip.transition = b;
    }
  }
  return { HandChange };
})();
