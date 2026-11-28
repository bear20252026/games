/**
 * What the drummer hears in a loop (ADR-0057): where its low end, body and
 * top land in a bar of sixteen steps, how busy each is, and how late its
 * off-beats sit. Plain signal work on the loop's own samples; no model, no DOM.
 */

import { fft } from "./OnsetDetector.js";

// The loop is listened to at about 22 kHz, in 46 ms windows 5 ms apart
const LISTEN_RATE = 22050;
const WINDOW = 1024;
const HOP_SECONDS = 0.005;
const STEPS = 16;
/** The three parts of a loop a drummer plays against, by frequency (Hz) */
export const BANDS = { low: [30, 180], mid: [180, 2000], high: [2000, 9000] };
// A step counts as hit in a band from this share of the band's strongest step
const HIT_SHARE = 0.35;

/** Halve the sample rate until it is near the rate the loop is listened to at */
function thin(samples, sampleRate) {
  let out = samples;
  let rate = sampleRate;
  while (rate >= LISTEN_RATE * 1.9) {
    const half = new Float32Array(out.length >> 1);
    for (let i = 0; i < half.length; i++) half[i] = (out[2 * i] + out[2 * i + 1]) / 2;
    out = half;
    rate /= 2;
  }
  return { samples: out, rate };
}

/**
 * Listen to a loop.
 * @param {Float32Array} mono - The loop's samples
 * @param {number} sampleRate
 * @param {number} bars - How many bars of four beats the loop is
 * @returns {{low: number[], mid: number[], high: number[], busy: {low: number, mid: number, high: number}, lean: number, bass: number} | null}
 *   Each band: how hard it lands on each of the sixteen steps of a bar, 0 to 1.
 *   busy: the share of steps a band lands on. lean: how late the off-beats sit,
 *   as a share of a step (0.1 is a tenth of a sixteenth late; negative is early).
 *   null where there is too little to hear.
 */
export function listenToLoop(mono, sampleRate, bars) {
  const { samples: loop, rate } = thin(mono, sampleRate);
  const hop = Math.max(1, Math.round(rate * HOP_SECONDS));
  const steps = Math.round(bars * STEPS);
  if (loop.length < WINDOW * 2 || steps < STEPS) return null;
  // A loop goes round: its end is what comes before its first hit, and its start what follows its last
  const samples = new Float32Array(loop.length + 2 * WINDOW);
  samples.set(loop.subarray(loop.length - WINDOW));
  samples.set(loop, WINDOW);
  samples.set(loop.subarray(0, WINDOW), WINDOW + loop.length);
  const frames = Math.floor((samples.length - WINDOW) / hop) + 1;

  const window = Float32Array.from(
    { length: WINDOW },
    (_, n) => 0.5 - 0.5 * Math.cos((2 * Math.PI * n) / WINDOW),
  );
  const names = Object.keys(BANDS);
  const hz = rate / WINDOW;
  // How much each band rises from one window to the next: the start of a sound
  const rise = Object.fromEntries(names.map((name) => [name, new Float32Array(frames)]));
  const re = new Float64Array(WINDOW);
  const im = new Float64Array(WINDOW);
  let before = new Float32Array(WINDOW / 2 + 1);
  // The sound in each band over the whole loop
  const power = Object.fromEntries(names.map((name) => [name, 0]));
  for (let f = 0; f < frames; f++) {
    for (let n = 0; n < WINDOW; n++) {
      re[n] = samples[f * hop + n] * window[n];
      im[n] = 0;
    }
    fft(re, im);
    const now = new Float32Array(WINDOW / 2 + 1);
    for (let b = 0; b <= WINDOW / 2; b++) {
      now[b] = Math.log1p((100 * Math.hypot(re[b], im[b])) / Math.sqrt(WINDOW));
    }
    for (const name of names) {
      const [from, to] = BANDS[name];
      let sum = 0;
      for (let b = Math.ceil(from / hz); b <= to / hz; b++) {
        sum += Math.max(0, now[b] - before[b]);
        power[name] += re[b] * re[b] + im[b] * im[b];
      }
      rise[name][f] = sum;
    }
    before = now;
  }

  const stepSeconds = loop.length / rate / steps;
  const perSecond = rate / hop;
  // A window that starts at the loop's start is a whole window in, and a sound
  // rises fastest in it when it is three quarters of the way across
  const lag = -WINDOW / 4 / rate;
  const heard = { busy: {} };
  const offBeats = [];
  for (const name of names) {
    const hit = new Float32Array(STEPS);
    for (let s = 0; s < steps; s++) {
      const centre = s * stepSeconds - lag;
      const from = Math.max(0, Math.round((centre - stepSeconds / 2) * perSecond));
      const to = Math.min(frames, Math.round((centre + stepSeconds / 2) * perSecond));
      let best = 0;
      let at = from;
      for (let f = from; f < to; f++) {
        if (rise[name][f] > best) {
          best = rise[name][f];
          at = f;
        }
      }
      hit[s % STEPS] += best;
      // The body and top say where the loop's off-beats sit; the low end is too slow to tell
      if (name !== "low" && s % 2 === 1) {
        offBeats.push([best, (at / perSecond - centre) / stepSeconds]);
      }
    }
    const top = Math.max(...hit);
    heard[name] = [...hit].map((v) => (top > 0 ? v / top : 0));
    heard.busy[name] = heard[name].filter((v) => v >= HIT_SHARE).length / STEPS;
  }
  if (names.every((name) => heard[name].every((v) => v === 0))) return null;

  // How much of the loop's sound is low end: a voice or a thin melody has next to none
  const all = names.reduce((sum, name) => sum + power[name], 0);
  heard.bass = all > 0 ? power.low / all : 0;

  // Weighted by how hard each lands, and only those that land at all
  const strongest = Math.max(...offBeats.map(([weight]) => weight), 1e-9);
  const landed = offBeats.filter(([weight]) => weight > strongest * HIT_SHARE);
  const weight = landed.reduce((sum, [w]) => sum + w, 0);
  heard.lean = weight > 0 ? landed.reduce((sum, [w, late]) => sum + w * late, 0) / weight : 0;
  return heard;
}

// A step sounds where it is this loud against the take's loudest step
const SOUNDING_SHARE = 0.15;

/**
 * Where a take sounds in the bar: for each of the sixteen steps, the share of
 * the take's bars in which there is sound on it. A voice leaves gaps; this is
 * where they are.
 * @param {Float32Array} mono - The take
 * @param {number} sampleRate
 * @param {number} bars - How many bars it is
 * @returns {number[] | null} Sixteen shares, 0 to 1; null for silence
 */
export function soundingSteps(mono, sampleRate, bars) {
  const steps = bars * STEPS;
  const length = mono.length / steps;
  if (!(length >= 1) || !(sampleRate > 0)) return null;
  const loud = new Float64Array(steps);
  for (let s = 0; s < steps; s++) {
    const from = Math.floor(s * length);
    const to = Math.floor((s + 1) * length);
    let sum = 0;
    for (let n = from; n < to; n++) sum += mono[n] * mono[n];
    loud[s] = Math.sqrt(sum / (to - from));
  }
  const top = Math.max(...loud);
  if (!(top > 0)) return null;
  const sounding = new Array(STEPS).fill(0);
  for (let s = 0; s < steps; s++) {
    if (loud[s] >= top * SOUNDING_SHARE) sounding[s % STEPS] += 1 / bars;
  }
  return sounding;
}

/**
 * What was heard in a loop, as the loop is played now. He hears the take as
 * it was loaded; the maker may since have slid it against the beat, dealt its
 * chops in another order or silenced some. Slid, its sounds are on other
 * steps, and what is left of a step is how late it leans. With its chops out
 * of their order, or some silenced, where its sounds fall is no longer known:
 * how busy it is still holds, and nothing is said of any one step.
 * @param {Object|null} heard - From listenToLoop
 * @param {Object} take - The loop's row: { offset, takeBpm, slices }
 * @returns {Object|null}
 */
export function heardAsPlayed(heard, { offset = 0, takeBpm, slices = [] }) {
  if (!heard) return null;
  const asCut = slices.every((slice, i) => slice.source === i && !slice.muted);
  if (!asCut) {
    const none = () => new Array(STEPS).fill(0);
    return { ...heard, low: none(), mid: none(), high: none(), lean: 0, bass: 0 };
  }
  const slid = offset / (60 / takeBpm / 4);
  const whole = Math.round(slid);
  if (whole === 0 && slid === 0) return heard;
  // Later by a step, what was on a step is on the next
  const turn = (row) => row.map((_, step) => row[(((step - whole) % STEPS) + STEPS) % STEPS]);
  return {
    ...heard,
    low: turn(heard.low),
    mid: turn(heard.mid),
    high: turn(heard.high),
    lean: heard.lean + (slid - whole),
  };
}
