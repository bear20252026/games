/**
 * Tuner
 * Brings a sung take into tune with a loaded loop, without touching the loop.
 *
 *   analyseKey   listens to the loop: which notes it is made of, what key
 *                that makes, and how far the whole recording sits from
 *                concert pitch (a sampled record is rarely dead on A440)
 *   detectPitch  the note a stretch of the voice is sung at
 *   tuneCents    how far that is from the nearest note of the loop's key
 *
 * The correction itself is done by the player, which runs each chop of the
 * voice a touch faster or slower. Pure maths on a Float32Array — no Web
 * Audio — so it runs the same under node.
 */

import { fft } from "./OnsetDetector.js";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
};
// How strongly each step of a key tends to be heard (Krumhansl & Kessler)
const KEY_PROFILES = {
  major: [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
  minor: [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
};
// Below this match with any key profile the audio has no key worth naming (drums, noise)
const MIN_KEY_MATCH = 0.4;

const KEY_FFT_SIZE = 16384;
// Where the notes of a loop are read from: above the mud, below the fizz
const KEY_MIN_HZ = 110;
const KEY_MAX_HZ = 2000;
// A spectral peak counts if it is at least this fraction of its frame's loudest
const PEAK_FLOOR = 0.1;
// The octave in 10-cent bins
const BINS = 120;

// Voice range searched for a sung pitch
const VOICE_MIN_HZ = 70;
const VOICE_MAX_HZ = 800;
const PITCH_WINDOW = 1024;
const PITCH_FRAMES = 8;
// Skip the consonant at the front of a chop; the note is in what follows
const ATTACK_SECONDS = 0.03;
// YIN: how periodic a frame must be to count as a sung note
const VOICED_THRESHOLD = 0.15;

/**
 * @param {Float32Array} samples - Mono audio of the loop
 * @param {number} sampleRate
 * @returns {{name: string, scale: number[], cents: number} | null} `scale` is
 *   the key's pitch classes (0 = C); `cents` how sharp the recording is of
 *   concert pitch. null if it has no clear key.
 */
export function analyseKey(samples, sampleRate) {
  const histogram = pitchHistogram(samples, sampleRate);

  // Tuning: slide a 12-tooth comb round the octave and keep where it catches most
  let offset = 0;
  let bestScore = -1;
  for (let shift = -5; shift < 5; shift++) {
    let score = 0;
    for (let note = 0; note < 12; note++) score += histogram[wrapBin(note * 10 + shift)];
    if (score > bestScore) {
      bestScore = score;
      offset = shift;
    }
  }
  if (bestScore <= 0) return null;

  // How much of each of the twelve notes there is, within 30 cents of it
  const chroma = new Array(12).fill(0);
  for (let note = 0; note < 12; note++) {
    for (let d = -3; d <= 3; d++) chroma[note] += histogram[wrapBin(note * 10 + offset + d)];
  }

  let best = null;
  for (const [mode, profile] of Object.entries(KEY_PROFILES)) {
    for (let tonic = 0; tonic < 12; tonic++) {
      const rotated = profile.map((_, note) => profile[(note - tonic + 12) % 12]);
      const match = correlation(chroma, rotated);
      if (!best || match > best.match) best = { mode, tonic, match };
    }
  }
  if (best.match < MIN_KEY_MATCH) return null;

  return {
    name: `${NOTE_NAMES[best.tonic]} ${best.mode === "major" ? "MAJ" : "MIN"}`,
    scale: SCALES[best.mode].map((step) => (step + best.tonic) % 12),
    cents: offset * 10,
  };
}

/**
 * The note a stretch of a take is sung at.
 * @param {Float32Array} samples - Mono take
 * @param {number} sampleRate
 * @param {number} from - Start of the stretch (seconds)
 * @param {number} to - End of the stretch (seconds)
 * @returns {number|null} Hz, or null if there is no steady note in it (a breath, a consonant)
 */
export function detectPitch(samples, sampleRate, from, to) {
  const tauMin = Math.floor(sampleRate / VOICE_MAX_HZ);
  const tauMax = Math.ceil(sampleRate / VOICE_MIN_HZ);
  const span = PITCH_WINDOW + tauMax;
  const end = Math.min(samples.length, Math.round(to * sampleRate)) - span;
  let start = Math.round((from + ATTACK_SECONDS) * sampleRate);
  if (start > end) start = Math.round(from * sampleRate);
  if (start > end) return null;

  // A handful of frames spread across the stretch; the middle one of those
  // that hold a note is the answer, so a wobble at either end doesn't count
  const pitches = [];
  const difference = new Float32Array(tauMax + 1);
  for (let frame = 0; frame < PITCH_FRAMES; frame++) {
    const at = start + Math.round(((end - start) * frame) / Math.max(1, PITCH_FRAMES - 1));
    const tau = periodAt(samples, at, difference, tauMin, tauMax);
    if (tau) pitches.push(sampleRate / tau);
    if (end === start) break;
  }
  if (pitches.length === 0) return null;
  return pitches.sort((a, b) => a - b)[Math.floor(pitches.length / 2)];
}

/**
 * How far a sung note is from the nearest note it should be.
 * @param {number} hz - The sung pitch
 * @param {{scale: number[], cents: number} | null} key - From analyseKey; with
 *   no key, the nearest semitone at concert pitch
 * @returns {number} Cents to shift the voice by (positive = up)
 */
export function tuneCents(hz, key) {
  const scale = key?.scale ?? SCALES.major.concat([1, 3, 6, 8, 10]);
  // In semitones above C-1, measured against the loop's own tuning
  const sung = 69 + 12 * Math.log2(hz / 440) - (key?.cents ?? 0) / 100;

  let nearest = Math.round(sung);
  for (let reach = 0; reach <= 6; reach++) {
    const candidates = [Math.round(sung) - reach, Math.round(sung) + reach]
      .filter((note) => scale.includes(((note % 12) + 12) % 12))
      .sort((a, b) => Math.abs(a - sung) - Math.abs(b - sung));
    if (candidates.length > 0) {
      nearest = candidates[0];
      break;
    }
  }
  return (nearest - sung) * 100;
}

/** Energy at every 10 cents of the octave, from the spectral peaks of the whole loop */
function pitchHistogram(samples, sampleRate) {
  const histogram = new Float32Array(BINS);
  const re = new Float32Array(KEY_FFT_SIZE);
  const im = new Float32Array(KEY_FFT_SIZE);
  const binHz = sampleRate / KEY_FFT_SIZE;
  const low = Math.ceil(KEY_MIN_HZ / binHz);
  const high = Math.floor(KEY_MAX_HZ / binHz);
  const mags = new Float32Array(high + 2);

  // Short loops get one zero-padded frame; longer ones overlap by half
  const lastStart = Math.max(0, samples.length - KEY_FFT_SIZE);
  for (let start = 0; start <= lastStart; start += KEY_FFT_SIZE / 2) {
    for (let i = 0; i < KEY_FFT_SIZE; i++) {
      const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (KEY_FFT_SIZE - 1));
      re[i] = (samples[start + i] ?? 0) * window;
      im[i] = 0;
    }
    fft(re, im);

    let loudest = 0;
    for (let b = low - 1; b <= high + 1; b++) {
      mags[b] = Math.hypot(re[b], im[b]);
      if (mags[b] > loudest) loudest = mags[b];
    }
    if (loudest === 0) continue;

    for (let b = low; b <= high; b++) {
      const mag = mags[b];
      if (mag < loudest * PEAK_FLOOR || mag <= mags[b - 1] || mag < mags[b + 1]) continue;
      // The true peak lies between bins: fit a parabola through the three around it
      const a = Math.log(mags[b - 1] + 1e-12);
      const c = Math.log(mags[b + 1] + 1e-12);
      const shift = (0.5 * (a - c)) / (a - 2 * Math.log(mag) + c);
      const note = 69 + 12 * Math.log2(((b + shift) * binHz) / 440);
      histogram[wrapBin(Math.round(note * 10))] += Math.sqrt(mag / loudest);
    }
  }
  return histogram;
}

/** Period (in samples) of the note in one frame, by YIN; 0 if the frame holds no steady note */
function periodAt(samples, at, difference, tauMin, tauMax) {
  let running = 0;
  let found = 0;
  for (let tau = 1; tau <= tauMax; tau++) {
    let sum = 0;
    for (let j = 0; j < PITCH_WINDOW; j++) {
      const delta = samples[at + j] - samples[at + j + tau];
      sum += delta * delta;
    }
    running += sum;
    // Normalised by the average so far, so a silent frame doesn't look periodic
    difference[tau] = running > 0 ? (sum * tau) / running : 1;

    if (found && difference[tau] > difference[found]) break;
    if (tau >= tauMin && difference[tau] < VOICED_THRESHOLD) found = tau;
  }
  if (!found || found >= tauMax) return 0;

  const a = difference[found - 1];
  const b = difference[found];
  const c = difference[found + 1];
  const curve = a - 2 * b + c;
  return curve > 0 ? found + (0.5 * (a - c)) / curve : found;
}

function wrapBin(bin) {
  return ((bin % BINS) + BINS) % BINS;
}

function correlation(a, b) {
  const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;
  const meanA = mean(a);
  const meanB = mean(b);
  let cross = 0;
  let powerA = 0;
  let powerB = 0;
  for (let i = 0; i < a.length; i++) {
    cross += (a[i] - meanA) * (b[i] - meanB);
    powerA += (a[i] - meanA) ** 2;
    powerB += (b[i] - meanB) ** 2;
  }
  return powerA > 0 && powerB > 0 ? cross / Math.sqrt(powerA * powerB) : 0;
}
