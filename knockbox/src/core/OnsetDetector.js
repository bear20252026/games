/**
 * OnsetDetector
 * Finds where syllables, consonants and taps start in a recording, using
 * spectral flux: how much new energy appears across the spectrum from one
 * short frame to the next. Pure maths on a Float32Array — no Web Audio —
 * so it runs the same in the browser and under node.
 */

const FFT_SIZE = 1024;
const HOP = 256;
// A frame counts as an onset if its flux beats the recent average by this much...
const SENSITIVITY = 2.2;
// ...and clears this fraction of the loudest flux in the take (rejects room noise)
const FLOOR_RATIO = 0.07;
// Log compression of each bin, so soft consonants still register next to loud vowels
const COMPRESSION = 20;
const MIN_GAP_SECONDS = 0.09;
// How far around a flux peak to look for the moment the sound actually starts
const REFINE_BACK_SECONDS = 0.03;
const REFINE_AHEAD_SECONDS = 0.03;
const REFINE_LEVEL = 0.2;
// Below this peak (about -66 dBFS) there is no signal, only converter noise
export const SILENCE_PEAK = 0.0005;
// The strongest onset must stand this far above the take's typical frame
const MIN_FLUX_CONTRAST = 6;
// The very first frame counts as an onset only if it is at least this loud (of peak)
const FIRST_FRAME_LEVEL = 0.15;
// Share of the take's quietest frames used to measure the room noise...
const NOISE_FRAMES_RATIO = 0.1;
// ...and how far above that average a bin must rise before it counts
const NOISE_HEADROOM = 2;

/** Loudest sample in a signal (0-1) */
export function peakLevel(samples) {
  let peak = 0;
  for (let i = 0; i < samples.length; i++) {
    const v = Math.abs(samples[i]);
    if (v > peak) peak = v;
  }
  return peak;
}

/**
 * @param {Float32Array} samples - Mono audio
 * @param {number} sampleRate
 * @returns {number[]} Onset times in seconds, ascending; empty if there is nothing but silence or steady noise
 */
export function detectOnsets(samples, sampleRate) {
  // Work at a fixed level: a raw microphone (no auto-gain) can be 30-40 dB
  // quieter than a mastered file, and the detector should not care
  const peak = peakLevel(samples);
  if (peak < SILENCE_PEAK) return [];
  const flux = spectralFlux(samples, 1 / peak);
  const maxFlux = flux.reduce((max, v) => Math.max(max, v), 0);
  if (maxFlux === 0) return [];

  // An open mic in a quiet room flickers evenly: no frame stands far above
  // the typical one. Real onsets tower over it.
  const typicalFlux = Float32Array.from(flux).sort()[Math.floor(flux.length / 2)];
  if (maxFlux < typicalFlux * MIN_FLUX_CONTRAST) return [];

  const floor = maxFlux * FLOOR_RATIO;
  const minGapFrames = Math.ceil((MIN_GAP_SECONDS * sampleRate) / HOP);
  const onsets = [];
  let lastFrame = -Infinity;

  for (let n = 0; n < flux.length; n++) {
    const value = flux[n];
    if (value < floor) continue;

    // Local peak
    let isPeak = true;
    for (let k = Math.max(0, n - 3); k <= Math.min(flux.length - 1, n + 3); k++) {
      if (flux[k] > value) isPeak = false;
    }
    if (!isPeak) continue;

    // Standing clear of what came just before it
    let sum = 0;
    let count = 0;
    for (let k = Math.max(0, n - 12); k < n; k++) {
      sum += flux[k];
      count++;
    }
    if (count > 0 && value < (sum / count) * SENSITIVITY) continue;
    if (n - lastFrame < minGapFrames) continue;

    lastFrame = n;
    onsets.push(refineOnset(samples, sampleRate, n * HOP + FFT_SIZE / 2));
  }

  // Refinement can pull two neighbours together; keep them in order and apart
  return onsets.filter((t, i) => i === 0 || t - onsets[i - 1] >= MIN_GAP_SECONDS / 2);
}

/**
 * Half-wave rectified, log-compressed spectral flux per frame.
 *
 * A live microphone is never silent between syllables: the room, the preamp
 * and the fan are always there, and frame to frame that noise flickers in
 * every bin at once, which can bury a softly sung onset. So the spectrum is
 * gated first: the quietest frames of the take are taken to be "just the
 * room", and only what rises above that per-bin floor is counted.
 */
function spectralFlux(samples, gain) {
  const numFrames = Math.max(0, Math.floor((samples.length - FFT_SIZE) / HOP) + 1);
  const flux = new Float32Array(numFrames);
  const window = new Float32Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1));
  }

  // Pass 1: log-magnitude spectrum and loudness of every frame
  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);
  const bins = FFT_SIZE / 2;
  const spectra = new Float32Array(numFrames * bins);
  const loudness = new Float32Array(numFrames);
  let firstFramePeak = 0;

  for (let n = 0; n < numFrames; n++) {
    const start = n * HOP;
    for (let i = 0; i < FFT_SIZE; i++) {
      const sample = samples[start + i] * gain;
      if (n === 0) firstFramePeak = Math.max(firstFramePeak, Math.abs(sample));
      re[i] = sample * window[i];
      im[i] = 0;
    }
    fft(re, im);

    for (let b = 0; b < bins; b++) {
      // Scaled so a full-scale sine reads 1 before compression
      const mag = Math.log1p((COMPRESSION * Math.hypot(re[b], im[b])) / (FFT_SIZE / 4));
      spectra[n * bins + b] = mag;
      loudness[n] += mag;
    }
  }

  // The room: per-bin average over the quietest frames, with some headroom
  const quietCount = Math.max(1, Math.floor(numFrames * NOISE_FRAMES_RATIO));
  const quietest = Array.from(loudness.keys())
    .sort((a, b) => loudness[a] - loudness[b])
    .slice(0, quietCount);
  const noiseFloor = new Float32Array(bins);
  for (const n of quietest) {
    for (let b = 0; b < bins; b++) noiseFloor[b] += spectra[n * bins + b] / quietCount;
  }

  // Pass 2: flux of what stands above the room
  for (let n = 0; n < numFrames; n++) {
    let sum = 0;
    for (let b = 0; b < bins; b++) {
      const floor = noiseFloor[b] * NOISE_HEADROOM;
      const cur = Math.max(0, spectra[n * bins + b] - floor);
      const prev = n === 0 ? 0 : Math.max(0, spectra[(n - 1) * bins + b] - floor);
      if (cur > prev) sum += cur - prev;
    }
    flux[n] = sum;
  }

  // Frame 0 is measured against silence, so a hit right on beat one counts —
  // but only if something is really sounding there
  if (numFrames > 0 && firstFramePeak < FIRST_FRAME_LEVEL) flux[0] = 0;
  return flux;
}

/**
 * Walk back from a flux peak to the sample where the sound first gets
 * properly loud, so slices start on the attack rather than inside it.
 */
function refineOnset(samples, sampleRate, centerSample) {
  const from = Math.max(0, Math.round(centerSample - REFINE_BACK_SECONDS * sampleRate));
  const to = Math.min(samples.length, Math.round(centerSample + REFINE_AHEAD_SECONDS * sampleRate));

  let peak = 0;
  for (let i = from; i < to; i++) peak = Math.max(peak, Math.abs(samples[i]));
  for (let i = from; i < to; i++) {
    if (Math.abs(samples[i]) >= peak * REFINE_LEVEL) return i / sampleRate;
  }
  return centerSample / sampleRate;
}

/** In-place radix-2 FFT */
export function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let size = 2; size <= n; size <<= 1) {
    const angle = (-2 * Math.PI) / size;
    const half = size >> 1;
    for (let start = 0; start < n; start += size) {
      for (let k = 0; k < half; k++) {
        const cos = Math.cos(angle * k);
        const sin = Math.sin(angle * k);
        const a = start + k;
        const b = a + half;
        const tr = re[b] * cos - im[b] * sin;
        const ti = re[b] * sin + im[b] * cos;
        re[b] = re[a] - tr;
        im[b] = im[a] - ti;
        re[a] += tr;
        im[a] += ti;
      }
    }
  }
}
