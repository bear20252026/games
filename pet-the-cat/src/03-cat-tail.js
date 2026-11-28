/**
 * CatTail —— 尾巴的 26 节样条骨骼与抓握状态机
 *
 * 静止姿态由 path 常量（一串归一化控制点）采样成骨架；每节存 rest/upperRest 两个角度：
 * 平放、翘起。
 *
 * 状态：grab() 抓住 → drag() 拖动（超过程度会拉长、超过指尖会打滑）→ release()
 * 松手后 readyToCurl/beginCurl 让尾巴按随机延迟卷回去，回弹用二阶阻尼 turn()。
 *
 * 弯曲刚度沿长度衰减（bendWeight），所以根部硬、尾梢软；widthScale 表示被抓握处被捏细。
 */

'use strict';
const { CatTail } = (() => {
  const aspect = 935 / 1517,
    photoWidth = 1517;
  const path = [
    [0.749, 0.453],
    [0.805, 0.47],
    [0.873, 0.481],
    [0.921, 0.514],
    [0.952, 0.576],
    [0.955, 0.646],
    [0.944, 0.708],
    [0.918, 0.755],
    [0.879, 0.786],
    [0.857, 0.794],
  ];
  const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const smooth = (x) => {
    x = clamp(x);
    return x * x * (3 - 2 * x);
  };
  const approach = (a, b, dt, s) => a + (b - a) * -Math.expm1(-dt / s);
  const count = 26,
    angleLimit = Math.PI / 12;
  const bell = (x) => Math.exp(-x * x);
  function turn(n, goal, rate, dt) {
    const offset = n.angle - goal,
      speed = n.turnRate + rate * offset,
      decay = Math.exp(-rate * dt);
    n.angle = goal + (offset + speed * dt) * decay;
    n.turnRate = (n.turnRate - speed * rate * dt) * decay;
  }
  function skeleton() {
    const arc = [0];
    for (let i = 1; i < path.length; i++)
      arc.push(
        arc[i - 1] +
          Math.hypot(path[i][0] - path[i - 1][0], (path[i][1] - path[i - 1][1]) * aspect),
      );
    const nodes = [];
    let j = 1;
    for (let i = 0; i < count; i++) {
      const at = (arc.at(-1) * i) / (count - 1);
      while (j < path.length - 1 && at > arc[j]) j++;
      const a = path[j - 1],
        b = path[j],
        f = (at - arc[j - 1]) / (arc[j] - arc[j - 1]);
      const x = a[0] + (b[0] - a[0]) * f,
        y = (a[1] + (b[1] - a[1]) * f) * aspect,
        prev = nodes[i - 1];
      nodes.push({
        x,
        y,
        u: x,
        v: y,
        length: 0,
        arc: prev ? prev.arc + Math.hypot(x - prev.x, y - prev.y) : 0,
        angle: 0,
        rest: 0,
        r: 0.025,
        upperFur: 0.025,
        turnRate: 0,
        widthScale: 1,
        furTravel: 0,
      });
      if (prev) {
        prev.length = Math.hypot(x - prev.x, y - prev.y);
        prev.angle = prev.rest = Math.atan2(y - prev.y, x - prev.x);
      }
    }
    nodes.at(-1).rest = nodes.at(-1).angle = nodes.at(-2).rest;
    return nodes;
  }
  class CatTail {
    constructor() {
      this.nodes = skeleton();
      this.length = this.nodes.at(-1).arc;
      this.root = this.nodes[0];
      for (const n of this.nodes) {
        const bend = smooth((n.arc / this.length - 0.065) / 0.32);
        n.upperRest = n.rest * (1 - 1.96 * bend);
      }
      this.bendWeight = this.nodes.map((n) => smooth(n.arc / 0.084));
      this.reset();
    }
    reset() {
      this.restsAbove = false;
      this.centers = null;
      this.stroke = null;
      this.amount = 0;
      this.closure = 0;
      this.at = 0.2;
      this.slide = 0;
      this.releaseAge = 4;
      this.releaseAngles = null;
      this.releasePoint = null;
      this.curlDuration = 0;
      this.curlTime = 0;
      for (const n of this.nodes) {
        n.u = n.x;
        n.v = n.y;
        n.angle = n.rest;
        n.turnRate = 0;
        n.widthScale = 1;
        n.furTravel = 0;
      }
    }
    setPhoto(image, maxRadius = 0.041) {
      this.image = image;
      const c = document.createElement('canvas');
      c.width = image.width;
      c.height = image.height;
      const g = c.getContext('2d', { willReadFrequently: true });
      g.drawImage(image, 0, 0);
      const pixels = g.getImageData(0, 0, c.width, c.height),
        data = pixels.data;
      for (const n of this.nodes) {
        const x = Math.round(20 + photoWidth * n.arc);
        let top = 100,
          bottom = 100;
        while (top > 0 && data[(top * c.width + x) * 4 + 3] > 85) top--;
        while (bottom < c.height - 1 && data[(bottom * c.width + x) * 4 + 3] > 85) bottom++;
        n.r = clamp((bottom - top) / (2 * photoWidth), 0.008, maxRadius);
        while (top > 0 && data[(top * c.width + x) * 4 + 3] > 48) top--;
        n.upperFur = (100 - top) / photoWidth;
      }
      return pixels;
    }
    segment(s) {
      const distance = clamp(s) * this.length;
      let i = 0;
      while (i < count - 2 && this.nodes[i + 1].arc < distance) i++;
      return { i, f: clamp((distance - this.nodes[i].arc) / this.nodes[i].length) };
    }
    point(s, seated = false) {
      const { i, f } = this.segment(s),
        a = this.nodes[i],
        b = this.nodes[i + 1];
      const line = seated && this.centers ? this.centers : this.nodes;
      const p = line[i],
        q = line[i + 1],
        prev = line[Math.max(0, i - 1)],
        next = line[Math.min(count - 1, i + 2)];
      const ax = q.u - prev.u,
        ay = q.v - prev.v,
        bx = next.u - p.u,
        by = next.v - p.v;
      const wa = (1 - f) / (Math.hypot(ax, ay) || 1),
        wb = f / (Math.hypot(bx, by) || 1);
      const dx = ax * wa + bx * wb,
        dy = ay * wa + by * wb,
        len = Math.hypot(dx, dy) || 1;
      return {
        u: p.u + (q.u - p.u) * f,
        v: (p.v + (q.v - p.v) * f) / aspect,
        tx: dx / len,
        ty: dy / len,
        at: clamp(s),
        ru: a.x + (b.x - a.x) * f,
        rv: (a.y + (b.y - a.y) * f) / aspect,
        radius: a.r + (b.r - a.r) * f,
        upperFur: (1 - f) * a.upperFur * a.widthScale + f * b.upperFur * b.widthScale,
        feltRadius: (1 - f) * a.r * a.widthScale + f * b.r * b.widthScale,
      };
    }
    gripPoint() {
      if (!this.stroke && this.releasePoint) return this.releasePoint;
      const p = this.point(this.at, true);
      if (this.at >= 0.999 && this.stroke) {
        const t = this.stroke,
          extra = clamp((t.u - p.u) * p.tx + (t.v - p.v * aspect) * p.ty, 0, 0.024);
        p.u += p.tx * extra;
        p.v += (p.ty * extra) / aspect;
      }
      return p;
    }
    closest(u, v, from = 0, to = 1) {
      const center = this.centers ?? this.nodes;
      const start = from * this.length,
        end = to * this.length;
      let at = 0,
        distance = Infinity;
      for (let i = 0; i < count - 1; i++) {
        const { arc, length } = this.nodes[i];
        if (arc > end) break;
        if (arc + length < start) continue;
        const a = center[i],
          b = center[i + 1],
          dx = b.u - a.u,
          dy = b.v - a.v,
          px = u - a.u,
          py = v * aspect - a.v;
        const f = clamp(
          (px * dx + py * dy) / Math.max(1e-12, dx * dx + dy * dy),
          Math.max(0, (start - arc) / length),
          Math.min(1, (end - arc) / length),
        );
        const d = Math.hypot(px - f * dx, py - f * dy);
        if (d < distance) {
          distance = d;
          at = (arc + length * f) / this.length;
        }
      }
      const p = this.point(at, true);
      p.distance = distance;
      p.normal = (u - p.u) * -p.ty + (v - p.v) * aspect * p.tx;
      return p;
    }
    grab(p, hit, fromBody = false) {
      this.releasePoint = null;
      this.releaseAngles = null;
      this.curlDuration = 0;
      const at = hit.at,
        grip = this.point(at, true),
        y = grip.v * aspect;
      const dy = (p.v - grip.v) * aspect;
      this.stroke = {
        x: p.u,
        y: p.v * aspect,
        dx: p.u - grip.u,
        dy,
        keepY: fromBody ? dy - clamp(dy, -grip.radius, grip.radius) : 0,
        startX: grip.u,
        startY: y,
        startAt: at,
        farthest: grip.u,
        farthestAt: at,
        angles: this.nodes.map((n) => n.angle),
        u: grip.u,
        v: y,
        handU: grip.u,
        handY: y,
        yaw: 0,
        unwind: 0,
        wantedAt: at,
        pressure: 0.6,
        pastTip: false,
      };
      this.at = at;
      this.slide = 0;
    }
    drag(p, pressure = 0.6) {
      const s = this.stroke;
      if (!s) return;
      const travel = Math.hypot(p.u - s.x, p.v * aspect - s.y),
        offset = 1 - smooth(travel / 0.042);
      const u = p.u - offset * s.dx,
        v = p.v * aspect - s.keepY - offset * (s.dy - s.keepY);
      const dx = u - this.root.x,
        dy = v - this.root.y;
      const yaw = (s.yaw = clamp(Math.atan2(dy, Math.max(0.001, dx)), -angleLimit, angleLimit));
      s.u = u;
      s.v = v;
      s.pressure = pressure;
      if (u < s.farthest && s.farthest > s.startX + 0.0001) {
        const along = (u - s.farthest) / Math.cos(yaw);
        s.wantedAt = clamp(s.farthestAt + along / this.length);
        s.pastTip = false;
        return;
      }
      const pull = u - s.startX,
        at = s.startAt,
        active = smooth(pull / (0.048 + 0.074 * (1 - at)));
      const start = this.segment(at),
        nodes = this.nodes;
      const openedX = (mix) => {
        let x = this.root.x;
        for (let i = 0; i <= start.i; i++) {
          const yawAt = s.angles[i] + (yaw - s.angles[i]) * this.bendWeight[i] * mix;
          x += Math.cos(yawAt) * nodes[i].length * (i === start.i ? start.f : 1);
        }
        return x;
      };
      const extended = openedX(1);
      const tipX = extended + (1 - at) * this.length * Math.cos(yaw);
      s.pastTip = u > tipX + 0.028;
      if (pull < 0) {
        s.wantedAt = clamp(at + pull / this.length);
        s.unwind = 0;
      } else {
        s.unwind = active;
        if (u < extended - 0.0001 && u < openedX(active) - 0.0001) {
          let low = 0,
            high = active;
          for (let i = 0; i < 11; i++) {
            const mid = (low + high) * 0.5;
            if (openedX(mid) < u) low = mid;
            else high = mid;
          }
          s.unwind = (low + high) * 0.5;
        }
        const feed = Math.max(0, u - openedX(s.unwind)) / (this.length * Math.cos(yaw));
        s.wantedAt = clamp(Math.max(s.farthestAt, at + feed));
      }
      if (s.pastTip) {
        s.wantedAt = 1;
        s.unwind = 1;
      }
      if (u >= s.farthest) {
        s.farthest = Math.min(u, tipX);
        s.farthestAt = s.wantedAt;
      }
    }
    release() {
      if (!this.stroke) return;
      this.releasePoint = this.gripPoint();
      this.releaseAngles = this.nodes.map((n) => n.angle);
      this.releaseAge = 0;
      this.stroke = null;
      this.curlDelay = Math.random() < 0.1 ? 0 : 1.05 + Math.random() * 0.55;
    }
    readyToCurl(dt) {
      return this.releaseAngles && !this.curlDuration && this.releaseAge + dt >= this.curlDelay;
    }
    beginCurl(duration, restsAbove) {
      this.restsAbove = restsAbove;
      this.curlDuration = duration;
      this.curlTime = 0;
    }
    moveGrip(dt) {
      const s = this.stroke,
        prevAt = this.at;
      this.at = approach(prevAt, s.wantedAt, dt, 0.029 + 0.017 * (1 - this.amount));
      const along = ((this.at - prevAt) * this.length) / dt;
      this.slide = approach(this.slide, clamp(along, -0.85, 0.95), dt, 0.057);
      const x = approach(s.handU, s.u, dt, 0.061),
        y = approach(s.handY, s.v, dt, 0.061);
      const vx = clamp((x - s.handU) / dt, -1.5, 1.5),
        vy = clamp((y - s.handY) / dt, -1.5, 1.5);
      s.handU = x;
      s.handY = y;
      const side = 0.24 * Math.tanh((y - s.startY) / 0.042) - 0.048 * this.amount;
      const slip = Math.tanh(this.slide * 4.4);
      const grip = this.segment(this.at);
      let gripY = this.root.y,
        mobility = 0;
      for (let i = 0; i < count; i++) {
        const n = this.nodes[i],
          k = n.arc / this.length,
          offset = (k - this.at) * this.length;
        const before = bell((offset + 0.037) / 0.061),
          after = bell((offset - 0.05) / 0.071);
        const free = smooth(offset / 0.155),
          cross = vy * Math.cos(n.angle) - vx * Math.sin(n.angle);
        const give =
          this.bendWeight[i] *
          this.amount *
          (side * (before - 0.78 * after) - 0.31 * free * Math.tanh(2.7 * cross));
        const ahead = smooth((k - s.farthestAt) / 0.44);
        const weight = s.unwind * (1 - 0.94 * ahead) * this.bendWeight[i];
        const curled = s.angles[i] + give,
          drawn = clamp(s.yaw + give, -angleLimit, angleLimit);
        n.goal = curled + (drawn - curled) * weight;
        const tx = Math.max(0, Math.cos(n.goal));
        n.compliance = (1 - weight) * this.bendWeight[i] * tx * tx * (1 - smooth(offset / 0.105));
        if (i <= grip.i) {
          const span = n.length * (i === grip.i ? grip.f : 1);
          gripY += span * Math.sin(n.goal);
          mobility += span * tx * n.compliance;
        }
        const pad = bell((offset + 0.007 * slip) / 0.044);
        const edge = bell((Math.abs(offset) - 0.065) / 0.025);
        const width = 1 + this.amount * (0.065 * edge - (0.14 + 0.1 * s.pressure) * pad);
        n.widthScale = approach(n.widthScale, width, dt, width < n.widthScale ? 0.043 : 0.13);
        n.furTravel = approach(
          n.furTravel,
          0.0048 * slip * this.amount * (pad + 0.45 * edge),
          dt,
          0.065,
        );
      }
      const tilt = 0.36 * Math.tanh((y - gripY) / (0.36 * (0.035 + mobility)));
      for (const n of this.nodes) {
        const offset = n.arc - this.at * this.length;
        const rate =
          67 - 47 * smooth((offset + 0.008) / 0.2) - 17 * smooth((-offset - 0.067) / 0.16);
        turn(n, n.goal + tilt * n.compliance, rate, dt);
      }
    }
    slipped() {
      return (
        this.stroke?.pastTip &&
        this.at > 0.994 &&
        this.nodes.at(-1).u - this.root.x > 0.91 * this.length
      );
    }
    update(dt, wave) {
      const s = this.stroke,
        root = this.root;
      this.closure = approach(this.closure, s ? 1 : 0, dt, s ? 0.047 : 0.055);
      this.amount = approach(this.amount, this.closure, dt, s ? 0.061 : 0.073);
      this.releaseAge += dt;
      if (this.curlDuration) this.curlTime += dt;
      if (s) this.moveGrip(dt);
      else {
        this.slide = approach(this.slide, 0, dt, 0.14);
        for (let i = 0; i < count; i++) {
          const n = this.nodes[i],
            k = n.arc / this.length;
          const target = this.restsAbove ? n.upperRest : n.rest;
          let base = target;
          if (this.releaseAngles) {
            const start = this.releaseAngles[i];
            const progress = this.curlDuration
              ? smooth((this.curlTime / this.curlDuration - 0.22 * (1 - k)) / 0.78)
              : 0;
            base = start + (target - start) * progress;
          }
          n.angle = this.releaseAngles && !this.curlDuration ? base : wave(k, base, n.rest);
          n.turnRate = 0;
          n.widthScale = approach(n.widthScale, 1, dt, 0.106);
          n.furTravel = approach(n.furTravel, 0, dt, 0.11);
        }
      }
      if (this.curlDuration && this.curlTime >= this.curlDuration) {
        this.releaseAngles = null;
        this.curlDuration = 0;
      }
      let x = root.x,
        y = root.y;
      for (let i = 0; i < count; i++) {
        const n = this.nodes[i];
        n.u = x;
        n.v = y;
        if (i === count - 1) {
          n.angle = this.nodes[i - 1].angle;
          break;
        }
        x += Math.cos(n.angle) * n.length;
        y += Math.sin(n.angle) * n.length;
      }
    }
  }
  return { CatTail };
})();
