/**
 * ClipScene
 * The picture in CLIP's video (ADR-0030): a tape deck on the desk's wood.
 * The beat's cassette is dropped in, the door shuts, PLAY goes down and the
 * beat starts; the needles and four small lamps follow the drums as they
 * were played. The light comes up and goes down slowly and holds steady
 * between: nothing flashes with the beat.
 *
 * Every frame is drawn from its time alone, so the same clip is made every
 * time. Draws on any 2D canvas, on the page or in a worker.
 */

import { CLIP_FPS, CLIP_LEAD, clipLength, ringing } from "./Clip.js";

// The scene is laid out tall; a square clip is the middle of it
const W = 1080;
const H = 1920;
const SQUARE = { top: 212, height: 1380 };
// The deck
const DX = 110;
const DY = 262;
const DW = 860;
const DH = 1090;
// A lamp for each drum
const LAMPS = ["255,122,43", "244,236,214", "255,209,102", "142,202,230"];
const TURN = Math.PI * 2;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = (x) => {
  const c = clamp(x);
  return c * c * (3 - 2 * c);
};
/** The same run of chance every time, from a seed */
const rng = (from) => {
  let seed = from;
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const hash = (n) => rng(Math.floor(n) * 9973 + 7)();

function tile(w, h, paint) {
  const canvas = new OffscreenCanvas(w, h);
  paint(canvas.getContext("2d"));
  return canvas;
}

/**
 * @param {Object} scene
 * @param {OffscreenCanvas|HTMLCanvasElement} scene.canvas - 1080 wide; 1920 tall, or 1080 for the square
 * @param {{title: string, by: string, link: string, out: boolean, bpm: number}} scene.beat
 * @param {number[][]} scene.hits - From clipHits
 * @param {number} scene.barSeconds
 * @param {number} scene.bars
 * @param {CanvasImageSource} [scene.logo] - The logo sticker; the wordmark is never without it
 * @param {CanvasImageSource} [scene.face] - The maker's face
 * @returns {(t: number) => void} Draws the frame at t seconds
 */
export function createScene({ canvas, beat, hits, barSeconds, bars, logo, face }) {
  const g = canvas.getContext("2d");
  const step = barSeconds / 16;
  const length = clipLength(barSeconds, bars);
  const square = canvas.height <= canvas.width;

  const WOOD = tile(700, 1100, (c) => {
    const r = rng(11);
    const base = c.createLinearGradient(0, 0, 0, 1100);
    base.addColorStop(0, "#5a3a22");
    base.addColorStop(0.6, "#47291a");
    base.addColorStop(1, "#33200f");
    c.fillStyle = base;
    c.fillRect(0, 0, 700, 1100);
    for (let i = 0; i < 900; i++) {
      c.fillStyle = `rgba(${r() < 0.5 ? "20,10,2" : "255,200,140"},${0.03 + r() * 0.07})`;
      c.fillRect(r() * 700, r() * 1100 - 200, 0.4 + r() * 1.8, 200 + r() * 900);
    }
    for (const x of [130, 395, 610]) {
      c.fillStyle = "rgba(0,0,0,.4)";
      c.fillRect(x, 0, 2.5, 1100);
      c.fillStyle = "rgba(255,220,180,.07)";
      c.fillRect(x + 2.5, 0, 1, 1100);
    }
  });
  const BRUSHED = tile(420, 300, (c) => {
    const r = rng(4);
    for (let i = 0; i < 700; i++) {
      c.fillStyle = `rgba(${r() < 0.5 ? "255,255,255" : "0,0,0"},${0.02 + r() * 0.05})`;
      c.fillRect(r() * 420 - 100, r() * 300, 80 + r() * 300, 1);
    }
  });
  const GRAIN = [1, 2, 3].map((seed) =>
    tile(256, 256, (c) => {
      const r = rng(seed * 31);
      const d = c.createImageData(256, 256);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = r() * 255;
        d.data[i] = v;
        d.data[i + 1] = v;
        d.data[i + 2] = v;
        d.data[i + 3] = 24;
      }
      c.putImageData(d, 0, 0);
    }),
  );
  const DUST = Array.from({ length: 70 }, (_, i) => {
    const r = rng(i + 100);
    return { x: r() * W, y: r() * H, z: 0.4 + r() * 1.6, sp: 4 + r() * 14, ph: r() * 6.28 };
  });
  const brushed = g.createPattern(BRUSHED, "repeat");
  const grain = GRAIN.map((sheet) => g.createPattern(sheet, "repeat"));

  const rr = (x, y, w, h, r) => {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
  };
  const disc = (x, y, r) => {
    g.beginPath();
    g.arc(x, y, r, 0, TURN);
  };
  const glow = (x, y, radius, color, alpha) => {
    if (alpha <= 0.003) return;
    const p = g.createRadialGradient(x, y, 0, x, y, radius);
    p.addColorStop(0, color);
    p.addColorStop(1, "rgba(0,0,0,0)");
    g.save();
    g.globalCompositeOperation = "lighter";
    g.globalAlpha = Math.min(1, alpha);
    g.fillStyle = p;
    g.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    g.restore();
  };

  /** The sticker to the left, then Knockbox in its own lettering */
  function wordmark(x, y, size) {
    if (logo) g.drawImage(logo, x, y - size * 0.72, size * 1.35, size * 1.35);
    g.textAlign = "left";
    g.textBaseline = "middle";
    g.font = `400 ${size}px "Permanent Marker"`;
    const left = x + size * 1.5;
    g.fillStyle = "#f8e6c8";
    g.fillText("Knock", left, y);
    g.fillStyle = "#ff7a2b";
    g.fillText("box", left + g.measureText("Knock").width, y);
  }

  /** The cassette, 700 by 330, with its top left at the origin */
  function cassette(spin, wound) {
    const w = 700;
    const h = 330;
    const body = g.createLinearGradient(0, 0, 0, h);
    body.addColorStop(0, "#2c2a27");
    body.addColorStop(1, "#151413");
    g.fillStyle = body;
    rr(0, 0, w, h, 22);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,.09)";
    g.lineWidth = 2;
    rr(1, 1, w - 2, h - 2, 21);
    g.stroke();
    const label = g.createLinearGradient(0, 26, 0, 240);
    label.addColorStop(0, "#f1e6c6");
    label.addColorStop(1, "#dccfa6");
    g.fillStyle = label;
    rr(30, 26, w - 60, 218, 10);
    g.fill();
    g.fillStyle = "#b53a1e";
    g.fillRect(30, 96, w - 60, 7);
    g.fillStyle = "#2a1810";
    g.font = '400 56px "Permanent Marker"';
    g.textBaseline = "alphabetic";
    g.textAlign = "left";
    g.fillText(beat.title, 56, 82, w - 250);
    g.font = '700 19px "JetBrains Mono"';
    g.fillStyle = "#6b5a3e";
    g.textAlign = "right";
    g.fillText(`${beat.bpm} BPM`, w - 54, 76);
    g.fillStyle = "#0d0c0b";
    rr(150, 122, w - 300, 104, 12);
    g.fill();
    const tape = 30 + 22 * (1 - wound);
    for (const [cx, pack] of [
      [230, tape],
      [w - 230, 74 - tape],
    ]) {
      g.fillStyle = "#3b2416";
      disc(cx, 174, pack + 8);
      g.fill();
      g.fillStyle = "#e8e2d2";
      disc(cx, 174, 30);
      g.fill();
      g.save();
      g.translate(cx, 174);
      g.rotate(spin);
      g.fillStyle = "#111";
      for (let i = 0; i < 6; i++) {
        g.rotate(Math.PI / 3);
        g.fillRect(-4, 12, 8, 14);
      }
      disc(0, 0, 9);
      g.fill();
      g.restore();
    }
    for (const [sx, sy] of [
      [18, 18],
      [w - 18, 18],
      [18, h - 18],
      [w - 18, h - 18],
    ]) {
      g.fillStyle = "#555";
      disc(sx, sy, 6);
      g.fill();
    }
  }

  function meter(x, y, level, name) {
    const w = 350;
    const h = 176;
    g.fillStyle = "#0c0b0a";
    rr(x - 8, y - 8, w + 16, h + 16, 10);
    g.fill();
    const dial = g.createLinearGradient(0, y, 0, y + h);
    dial.addColorStop(0, "#f6e9c2");
    dial.addColorStop(1, "#e3cf98");
    g.fillStyle = dial;
    rr(x, y, w, h, 6);
    g.fill();
    const cx = x + w / 2;
    const cy = y + h + 40;
    const R = 170;
    const at = (v) => -Math.PI / 2 + (v - 0.5) * 1.5;
    g.lineWidth = 5;
    g.strokeStyle = "#2a1810";
    g.beginPath();
    g.arc(cx, cy, R, at(0), at(0.7));
    g.stroke();
    g.strokeStyle = "#b53a1e";
    g.beginPath();
    g.arc(cx, cy, R, at(0.7), at(1));
    g.stroke();
    for (let i = 0; i <= 10; i++) {
      const a = at(i / 10);
      g.strokeStyle = i >= 7 ? "#b53a1e" : "#2a1810";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
      g.lineTo(cx + Math.cos(a) * (R + 16), cy + Math.sin(a) * (R + 16));
      g.stroke();
    }
    g.fillStyle = "#2a1810";
    g.font = '700 20px "JetBrains Mono"';
    g.textAlign = "left";
    g.textBaseline = "alphabetic";
    g.fillText("VU", x + 16, y + h - 14);
    g.textAlign = "right";
    g.fillText(name, x + w - 16, y + h - 14);
    g.save();
    rr(x, y, w, h, 6);
    g.clip();
    const a = at(clamp(level));
    g.strokeStyle = "rgba(0,0,0,.25)";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(cx + 5, cy + 5);
    g.lineTo(cx + 5 + Math.cos(a) * (R + 8), cy + 5 + Math.sin(a) * (R + 8));
    g.stroke();
    g.strokeStyle = "#1a0f08";
    g.lineWidth = 3.5;
    g.beginPath();
    g.moveTo(cx, cy);
    g.lineTo(cx + Math.cos(a) * (R + 8), cy + Math.sin(a) * (R + 8));
    g.stroke();
    g.fillStyle = "rgba(255,255,255,.16)";
    g.fillRect(x, y, w, 44);
    g.restore();
    glow(x + w / 2, y + h / 2, 300, "rgba(255,196,110,.8)", 0.1);
  }

  function deck(t, tb, lit) {
    g.save();
    g.shadowColor = "rgba(0,0,0,.85)";
    g.shadowBlur = 70;
    g.shadowOffsetY = 36;
    const body = g.createLinearGradient(0, DY, 0, DY + DH);
    body.addColorStop(0, "#3b3834");
    body.addColorStop(0.5, "#2a2826");
    body.addColorStop(1, "#1a1918");
    g.fillStyle = body;
    rr(DX, DY, DW, DH, 34);
    g.fill();
    g.restore();
    g.save();
    rr(DX, DY, DW, DH, 34);
    g.clip();
    g.fillStyle = brushed;
    g.fillRect(DX, DY, DW, DH);
    g.restore();
    g.strokeStyle = "rgba(255,255,255,.13)";
    g.lineWidth = 2.5;
    rr(DX + 1.5, DY + 1.5, DW - 3, DH - 3, 33);
    g.stroke();
    wordmark(DX + 40, DY + 50, 34);

    // Meters: the left rides the kick, the right the snare and hats
    const low = 0.12 + 0.62 * ringing(hits[0], tb, 4.5) + 0.04 * Math.sin(t * 9);
    const high =
      0.1 +
      0.5 * ringing(hits[1], tb, 6) +
      0.2 * ringing(hits[2], tb, 12) +
      0.03 * Math.sin(t * 13 + 1);
    meter(DX + 52, DY + 100, tb < 0 ? 0.02 : low, "L");
    meter(DX + DW - 52 - 350, DY + 100, tb < 0 ? 0.02 : high, "R");

    // The door, and the tape behind its glass
    const dx = DX + 50;
    const dy = DY + 318;
    const dw = DW - 100;
    const dh = 420;
    g.fillStyle = "#070706";
    rr(dx, dy, dw, dh, 16);
    g.fill();
    // The tape is dropped in from above, seats with a clack, and the door closes over it
    const drop = ease((t - 0.3) / 0.62);
    const seat = Math.exp(-Math.max(0, t - 0.92) * 22) * (t > 0.92 ? 7 : 0);
    const shut = ease((t - 1.08) / 0.16);
    g.save();
    g.translate(dx + dw / 2, dy + 46 + 165 - (1 - drop) * 760 + seat);
    g.scale(1 + (1 - drop) * 0.14, 1 + (1 - drop) * 0.14);
    g.rotate((1 - drop) * -0.07);
    g.translate(-350, -165);
    if (drop < 1) {
      g.shadowColor = "rgba(0,0,0,.6)";
      g.shadowBlur = 40;
      g.shadowOffsetY = 30 + (1 - drop) * 60;
      g.fillStyle = "#151413";
      rr(0, 0, 700, 330, 22);
      g.fill();
      g.shadowColor = "transparent";
    }
    const turning = Math.max(0, tb);
    cassette(turning * 2.6 - 0.9 * (1 - Math.exp(-turning * 3.2)), clamp(tb / (barSeconds * bars)));
    g.restore();
    g.globalAlpha = shut;
    const glass = g.createLinearGradient(dx, dy, dx + dw, dy + dh);
    glass.addColorStop(0, "rgba(255,255,255,.1)");
    glass.addColorStop(0.35, "rgba(255,255,255,0)");
    glass.addColorStop(1, "rgba(255,255,255,.04)");
    g.fillStyle = glass;
    rr(dx, dy, dw, dh, 16);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,.14)";
    g.lineWidth = 2;
    rr(dx + 1, dy + 1, dw - 2, dh - 2, 15);
    g.stroke();
    g.globalAlpha = 1;

    // The counter turns over on each beat; a lamp for each drum
    const cy = DY + 770;
    const beatAt = tb / (step * 4);
    const beats = tb < 0 ? 0 : Math.floor(beatAt);
    const roll = tb < 0 ? 0 : ease((beatAt % 1) * 8 - 7);
    g.fillStyle = "#0a0a09";
    rr(DX + 52, cy, 168, 58, 6);
    g.fill();
    g.save();
    rr(DX + 58, cy + 5, 156, 48, 3);
    g.clip();
    g.font = '700 36px "JetBrains Mono"';
    g.textAlign = "center";
    g.textBaseline = "middle";
    String(beats)
      .padStart(3, "0")
      .split("")
      .forEach((digit, i) => {
        const mid = cy + 31;
        const turn = i === 2 ? roll * 48 : 0;
        g.fillStyle = "#efe6cc";
        g.fillRect(DX + 60 + i * 52, cy + 5, 48, 48);
        g.fillStyle = "#151515";
        g.fillText(digit, DX + 84 + i * 52, mid - turn);
        if (turn) g.fillText(String((beats + 1) % 10), DX + 84 + i * 52, mid + 48 - turn);
      });
    g.restore();
    LAMPS.forEach((color, i) => {
      const lx = DX + DW - 330 + i * 78;
      const e = ringing(hits[i], tb, 9);
      g.fillStyle = "#0a0a09";
      disc(lx, cy + 22, 13);
      g.fill();
      g.fillStyle = `rgba(${color},${0.22 + 0.78 * e})`;
      disc(lx, cy + 22, 9);
      g.fill();
      glow(lx, cy + 22, 46, `rgba(${color},.9)`, 0.4 * e * lit);
    });

    // The keys: PLAY goes down on the cue
    const ky = DY + 868;
    const down = ease((t - (CLIP_LEAD - 0.14)) / 0.07);
    g.fillStyle = "#0a0a09";
    rr(DX + 40, ky - 10, DW - 80, 190, 10);
    g.fill();
    ["rew", "play", "ff", "stop", "rec"].forEach((key, i) => {
      const kx = DX + 56 + i * 152;
      const kw = 140;
      const push = key === "play" ? down * 12 : 0;
      const top = ky + push;
      const cap = g.createLinearGradient(0, top, 0, top + 160);
      cap.addColorStop(0, key === "rec" ? "#a8352a" : "#d9d3c4");
      cap.addColorStop(1, key === "rec" ? "#6e1f18" : "#9a9486");
      g.fillStyle = "#050505";
      rr(kx, ky + 12, kw, 160, 8);
      g.fill();
      g.fillStyle = cap;
      rr(kx, top, kw, 160 - push, 8);
      g.fill();
      g.fillStyle = "rgba(255,255,255,.3)";
      rr(kx + 6, top + 5, kw - 12, 10, 5);
      g.fill();
      if (push) {
        g.fillStyle = `rgba(0,0,0,${0.22 * down})`;
        rr(kx, top, kw, 160 - push, 8);
        g.fill();
      }
      g.fillStyle = key === "rec" ? "#f4d6d0" : "#2a2622";
      const mx = kx + kw / 2;
      const my = top + 76;
      const tri = (ox, dir) => {
        g.beginPath();
        g.moveTo(mx + ox - 14 * dir, my - 18);
        g.lineTo(mx + ox + 14 * dir, my);
        g.lineTo(mx + ox - 14 * dir, my + 18);
        g.fill();
      };
      if (key === "play") tri(2, 1);
      if (key === "rew") {
        tri(-13, -1);
        tri(13, -1);
      }
      if (key === "ff") {
        tri(-13, 1);
        tri(13, 1);
      }
      if (key === "stop") g.fillRect(mx - 16, my - 16, 32, 32);
      if (key === "rec") {
        disc(mx, my, 16);
        g.fill();
      }
    });
    for (const [sx, sy] of [
      [DX + 26, DY + 26],
      [DX + DW - 26, DY + 26],
      [DX + 26, DY + DH - 26],
      [DX + DW - 26, DY + DH - 26],
    ]) {
      g.fillStyle = "#6a665e";
      disc(sx, sy, 8);
      g.fill();
      g.strokeStyle = "#222";
      g.lineWidth = 2;
      g.beginPath();
      g.moveTo(sx - 5, sy - 2);
      g.lineTo(sx + 5, sy + 2);
      g.stroke();
    }
  }

  /** Whose beat it is, in one quiet line under the deck: the deck already carries the wordmark */
  function credit() {
    // Nobody yet: the clip is signed by the desk alone
    if (!beat.by) return;
    const y = 1420;
    g.save();
    g.shadowColor = "rgba(0,0,0,.8)";
    g.shadowBlur = 8;
    g.textAlign = "left";
    g.textBaseline = "middle";
    g.font = '500 30px "JetBrains Mono"';
    const words = "produced by ";
    const lead = g.measureText(words).width;
    g.font = '400 46px "Permanent Marker"';
    const name = Math.min(g.measureText(beat.by).width, 560);
    const disk = face ? 84 : 0;
    let x = (W - (disk + lead + name)) / 2;
    if (face) {
      g.save();
      disc(x + 32, y, 32);
      g.fillStyle = "#16324a";
      g.fill();
      g.clip();
      g.drawImage(face, x, y - 32, 64, 64);
      g.restore();
      g.lineWidth = 4;
      g.strokeStyle = "#fbf7ea";
      disc(x + 32, y, 32);
      g.stroke();
      x += disk;
    }
    g.font = '500 30px "JetBrains Mono"';
    g.fillStyle = "#b9a888";
    g.fillText(words, x, y + 2);
    g.font = '400 46px "Permanent Marker"';
    g.fillStyle = "#f8e6c8";
    g.fillText(beat.by, x + lead, y, 560);
    g.restore();
  }

  /** In the last bar, what to do about it and where */
  function stamp(t) {
    const dt = t - (CLIP_LEAD + barSeconds * (bars - 1) + step * 8);
    if (dt < 0) return;
    const settle = ease(dt / 0.3);
    const scale = 1.12 - 0.12 * settle;
    g.save();
    g.translate(W / 2, 900);
    g.rotate(-0.1);
    g.scale(scale, scale);
    g.globalAlpha = settle * 0.95;
    g.fillStyle = "rgba(20,8,4,.72)";
    rr(-400, -150, 800, 300, 18);
    g.fill();
    g.strokeStyle = "#ff5a2a";
    g.lineWidth = 10;
    rr(-384, -134, 768, 268, 14);
    g.stroke();
    g.lineWidth = 3;
    rr(-366, -116, 732, 232, 9);
    g.stroke();
    g.fillStyle = "#ff5a2a";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = '400 104px "Permanent Marker"';
    // A beat that is out can be flipped from its link; one that isn't sends people to the desk
    g.fillText(beat.out ? "FLIP THIS BEAT" : "MAKE YOUR OWN", 0, -28, 700);
    g.font = '700 34px "JetBrains Mono"';
    g.fillStyle = "#ffd9c2";
    g.fillText(beat.link, 0, 66, 700);
    g.restore();
  }

  return function frame(t) {
    const tb = t - CLIP_LEAD;
    const f = Math.floor(t * CLIP_FPS);
    const kick = ringing(hits[0], tb, 6);
    const snare = ringing(hits[1], tb, 5);
    const lit = ease(t / 0.7) * (1 - ease((t - (length - 0.45)) / 0.4));
    if (square) {
      const k = canvas.height / SQUARE.height;
      g.setTransform(k, 0, 0, k, (canvas.width - W * k) / 2, -SQUARE.top * k);
    } else {
      g.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    }
    g.fillStyle = "#000";
    g.fillRect(-400, 0, W + 800, H);

    // Camera: a slow push all the way, a lean on the kick, a hand that isn't quite still
    const push = 0.985 + 0.075 * ease(t / length) + 0.005 * kick;
    g.save();
    g.translate(W / 2 + Math.sin(t * 1.1) * 5, H / 2 - 90 + Math.cos(t * 0.8) * 6);
    g.scale(push, push);
    g.rotate(Math.sin(t * 0.45) * 0.004 - 0.012);
    g.translate(-W / 2, -H / 2 + 90);
    g.drawImage(WOOD, -160, -420, 1400, 2700);
    g.fillStyle = `rgba(0,0,0,${0.9 - 0.56 * lit})`;
    g.fillRect(-200, -500, 1500, 2900);
    glow(W / 2, 220, 1150, "rgba(255,196,128,.9)", 0.4 * lit);
    deck(t, tb, lit);
    credit();
    g.fillStyle = `rgba(0,0,0,${0.82 * (1 - lit)})`;
    g.fillRect(-200, -500, 1500, 2900);
    // Dust in the lamp's light; a snare stirs it
    for (const d of DUST) {
      const x = (d.x + Math.sin(t * 0.4 + d.ph) * 40 * d.z) % W;
      const y = (((d.y - t * d.sp - snare * 10 * d.z) % H) + H) % H;
      const cone = clamp(1 - Math.hypot(x - W / 2, y - 500) / 950);
      g.fillStyle = `rgba(255,226,180,${0.45 * cone * lit})`;
      disc(x, y, 1.6 * d.z);
      g.fill();
    }
    stamp(t);
    g.restore();

    g.save();
    g.globalCompositeOperation = "lighter";
    const leak = g.createLinearGradient(0, 0, 420, 0);
    leak.addColorStop(0, `rgba(255,96,30,${(0.09 + 0.03 * Math.sin(t * 0.6)) * lit})`);
    leak.addColorStop(1, "rgba(255,96,30,0)");
    g.fillStyle = leak;
    g.fillRect(0, 0, 420, H);
    g.restore();
    const vig = g.createRadialGradient(W / 2, H * 0.44, 420, W / 2, H * 0.5, 1180);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(0,0,0,.84)");
    g.fillStyle = vig;
    g.fillRect(-400, 0, W + 800, H);
    g.save();
    g.globalCompositeOperation = "overlay";
    g.fillStyle = grain[f % 3];
    g.translate(hash(f + 9) * 256, hash(f + 19) * 256);
    g.fillRect(-656, -256, W + 1312, H + 512);
    g.restore();
  };
}
