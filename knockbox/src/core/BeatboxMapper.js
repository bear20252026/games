/**
 * BeatboxMapper
 * Works out which drum each beatboxed hit was meant to be, from how it
 * sounds: a "b" or "boom" is mostly low, a "k" or "psh" sits in the middle,
 * a "ts" is all top. No calibration: the hits of one take are compared with
 * each other, so it is the difference between your sounds that matters, not
 * how they come across on a particular microphone. Pure maths on a
 * Float32Array — no Web Audio — so it runs the same under node.
 */

import { fft } from "./OnsetDetector.js";

const FFT_SIZE = 2048;
// Rumble below this says nothing about which drum was meant
const MIN_HZ = 60;
// Hits whose brightness differs by less than this (in octaves) are the same sound
const MIN_SPLIT_OCTAVES = 0.7;
// Where a lone group of sounds falls when there is nothing to compare it with
const KICK_BELOW_HZ = 700;
const LOW_GROUP_KICK_BELOW_HZ = 1200;
const HAT_ABOVE_HZ = 3500;
// A hat that rings on this long was an open one ("tsss")
const OPEN_HAT_SECONDS = 0.2;
const SUSTAIN_LEVEL = 0.2;
// The longest sound cut out of a take to play on a pad
const MAX_HIT_SECONDS = 0.5;
const PRE_ROLL_SECONDS = 0.004;

/** Row each voice plays on */
export const VOICE_TRACK = { kick: 0, snare: 1, hat: 2, openhat: 3 };

/**
 * @param {Float32Array} samples - Mono take
 * @param {number} sampleRate
 * @param {number[]} onsets - Where the hits start, in seconds (from detectOnsets)
 * @returns {Array<{time: number, voice: string, start: number, end: number, peak: number}>}
 *   One per onset: which drum it is, and the stretch of the take (seconds) that is its sound
 */
export function mapBeatbox(samples, sampleRate, onsets) {
  const hits = onsets.map((time, i) => {
    const start = Math.max(0, time - PRE_ROLL_SECONDS);
    const next = i + 1 < onsets.length ? onsets[i + 1] - PRE_ROLL_SECONDS : Infinity;
    const end = Math.min(samples.length / sampleRate, next, time + MAX_HIT_SECONDS);
    const from = Math.round(time * sampleRate);
    const to = Math.round(end * sampleRate);

    let peak = 0;
    for (let s = from; s < to; s++) peak = Math.max(peak, Math.abs(samples[s]));
    // How long it rings: the last moment it is still a fair fraction of its peak
    let last = from;
    for (let s = from; s < to; s++) {
      if (Math.abs(samples[s]) >= peak * SUSTAIN_LEVEL) last = s;
    }

    return {
      time,
      start,
      end,
      peak,
      sustain: (last - from) / sampleRate,
      brightness: Math.log2(spectralCentroid(samples, sampleRate, from)),
    };
  });

  // Line the hits up from dullest to brightest and cut the line at its (up
  // to two) widest gaps: each stretch between cuts is one kind of sound
  const order = hits.map((_, i) => i).sort((a, b) => hits[a].brightness - hits[b].brightness);
  const cuts = order
    .slice(1)
    .map((hit, i) => ({ at: i + 1, gap: hits[hit].brightness - hits[order[i]].brightness }))
    .filter((cut) => cut.gap >= MIN_SPLIT_OCTAVES)
    .sort((a, b) => b.gap - a.gap)
    .slice(0, 2)
    .map((cut) => cut.at)
    .sort((a, b) => a - b);
  const groups = [];
  let from = 0;
  for (const at of [...cuts, order.length]) {
    groups.push(order.slice(from, at));
    from = at;
  }

  const voices = nameGroups(
    groups.map(
      (group) => 2 ** (group.reduce((sum, i) => sum + hits[i].brightness, 0) / group.length),
    ),
  );
  groups.forEach((group, g) => {
    for (const i of group) {
      const open = voices[g] === "hat" && hits[i].sustain >= OPEN_HAT_SECONDS;
      hits[i].voice = open ? "openhat" : voices[g];
    }
  });

  return hits.map(({ time, voice, start, end, peak }) => ({ time, voice, start, end, peak }));
}

/**
 * Which drum each group of sounds is, given the groups' typical brightness
 * (Hz, ascending). Three kinds of sound are kick, snare, hat. With fewer,
 * where they sit decides: "boom ts" is kick and hat, "boom ka" kick and snare.
 */
function nameGroups(centroids) {
  if (centroids.length === 3) return ["kick", "snare", "hat"];
  if (centroids.length === 2) {
    const low = centroids[0] < LOW_GROUP_KICK_BELOW_HZ ? "kick" : "snare";
    const high = centroids[1] > HAT_ABOVE_HZ ? "hat" : "snare";
    return low === high ? ["kick", "snare"] : [low, high];
  }
  const [only] = centroids;
  return [only < KICK_BELOW_HZ ? "kick" : only > HAT_ABOVE_HZ ? "hat" : "snare"];
}

/** Centre of gravity of the spectrum (Hz) of the first few tens of ms from a sample position */
function spectralCentroid(samples, sampleRate, from) {
  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) {
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1));
    re[i] = (samples[from + i] ?? 0) * window;
  }
  fft(re, im);

  const binHz = sampleRate / FFT_SIZE;
  let weighted = 0;
  let total = 0;
  for (let b = Math.ceil(MIN_HZ / binHz); b < FFT_SIZE / 2; b++) {
    const power = re[b] * re[b] + im[b] * im[b];
    weighted += power * b * binHz;
    total += power;
  }
  return total > 0 ? weighted / total : MIN_HZ;
}
