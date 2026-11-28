/**
 * VoxEngine
 * Drops a voice take into the same pocket the drums sit in.
 *
 * The take is cut at its onsets (syllables, consonants, taps). Each slice is
 * then moved toward the nearest grid position *plus the pocket offset of the
 * drum it follows*: follow the kick and the phrase lies back with it, follow
 * the snare and it pushes. TIGHT blends between the timing as performed (0)
 * and fully pocketed (100).
 *
 * Nothing is destructive: the raw take and the slice markers are kept, and
 * placements are recomputed from the store, so turning the humanize dial or
 * changing the hi-hat mode re-pockets the voice on the next pass.
 *
 * A marker pins a moment of the take (`onset`) to a moment of the loop (`at`).
 * They start out the same. Drag a hit somewhere else and they part company:
 * the audio goes with the marker, and the chops either side are stretched or
 * squeezed, at their own pitch, to fill the space that leaves.
 */

import { NUM_STEPS } from "../constants/drums.js";
import { createDreamFx } from "./DreamFx.js";
import { isHeard } from "./Heard.js";
import { getPocketOffset } from "./HumanizeEngine.js";
import { levelToGain } from "./MixLevels.js";
import { detectOnsets, peakLevel } from "./OnsetDetector.js";
import { stretchChannels } from "./Stretcher.js";
import { analyseKey, detectPitch, tuneCents } from "./Tuner.js";

/** Which drum's pocket the voice leans on: its pitch and its row */
export const FOLLOW_VOICES = {
  kick: { pitch: 36, track: 0 },
  snare: { pitch: 38, track: 1 },
  hat: { pitch: 42, track: 2 },
};

/**
 * Ways to cut a take: at its transients, on every beat, on every bar, or
 * not at all. Any of them can then be reshaped by hand on the chop screen.
 */
export const CHOP_MODES = ["auto", "beats", "bars", "whole"];
// Markers can't be dragged closer together than this
const MIN_SLICE_SECONDS = 0.03;
// How far a chop may be squeezed or stretched when the hit after it is moved
const MIN_STRETCH = 0.25;
const MAX_STRETCH = 4;
// Closer to 1 than this and the chop is played as it is
const STRETCH_EPSILON = 1e-3;

/** Grid sizes in 16th steps: 16ths, 8ths, 8th-note triplets */
export const VOX_RESOLUTIONS = { 16: 1, 8: 2, trip: 4 / 3 };

const ALLOWED_BARS = [1, 2, 4];
// A loaded loop is taken to be a whole number of bars if that puts its tempo
// within this many octaves of the session's (half an octave: x0.71 to x1.41)
const MAX_TEMPO_DISTANCE = 0.5;
// Start each slice a hair before its onset so the attack isn't clipped
const PRE_ROLL_SECONDS = 0.006;
// Let a slice ring this far into the next one; with the fades it reads as a crossfade
const OVERLAP_SECONDS = 0.008;
// A raw microphone records far quieter than the drum samples: bring a take
// up to this peak (never down), within reason
const TAKE_TARGET_PEAK = 0.7;
const TAKE_MAX_GAIN = 24;
// The shortest piece of a file that can be trimmed out as the loop
export const MIN_TRIM_SECONDS = 0.25;
// Quieter than this (about -40 dBFS) and there is nothing worth keeping
export const MIN_TAKE_PEAK = 0.01;

/**
 * Cut a take into slices at its onsets.
 * @param {number[]} onsets - Onset times in seconds
 * @param {number} takeSeconds - Length of the usable take
 * @param {number[]} [ats] - Where in the loop each onset is heard, if a hit
 *   has been moved; otherwise each is heard where it was performed
 * @returns {Array<{id: number, start: number, end: number, onset: number, at: number, stretch: number, source: number, muted: boolean}>}
 *   A slice is both a zone of the loop (it starts playing at `at`) and a
 *   chop of audio (`start` to `end`, made `stretch` times as long). `source`
 *   is the chop heard in this zone: its own until chops are swapped, copied
 *   or shuffled.
 */
export function buildSlices(onsets, takeSeconds, ats = onsets) {
  const kept = onsets.map((_, i) => i).filter((i) => onsets[i] < takeSeconds);
  const inTake = kept.map((i) => onsets[i]);
  const heard = kept.map((i) => ats[i]);
  return inTake.map((onset, i) => ({
    id: i,
    onset,
    at: heard[i],
    start: Math.max(0, onset - PRE_ROLL_SECONDS),
    end: i + 1 < inTake.length ? inTake[i + 1] - PRE_ROLL_SECONDS : takeSeconds,
    stretch: stretchRatio(inTake, heard, i, takeSeconds),
    source: i,
    muted: false,
  }));
}

/**
 * How much longer (or shorter) a chop has to be to reach the next marker,
 * now that markers can be heard somewhere other than where they were cut.
 * @param {number[]} onsets - Where each marker cuts the take
 * @param {number[]} ats - Where each marker is heard in the loop
 * @param {number} index - Which chop
 * @param {number} takeSeconds - Where the last chop ends, in both
 * @returns {number} 1 for a chop that plays as it was performed
 */
export function stretchRatio(onsets, ats, index, takeSeconds) {
  const last = index + 1 >= onsets.length;
  const cut = (last ? takeSeconds : onsets[index + 1]) - onsets[index];
  const heard = (last ? takeSeconds : ats[index + 1]) - ats[index];
  if (cut <= 0 || heard <= 0) return 1;
  const ratio = heard / cut;
  return Math.abs(ratio - 1) < STRETCH_EPSILON ? 1 : ratio;
}

/**
 * Where each slice plays in the loop.
 * @param {Array} slices - From buildSlices
 * @param {Object} settings
 * @param {number} settings.bpm - Current tempo
 * @param {number} settings.takeBpm - Tempo the take was made at
 * @param {number} settings.bars - Loop length in bars
 * @param {number} settings.tightness - 0 (as performed) to 100 (pocketed)
 * @param {number} settings.gridSteps - Grid size in 16th steps
 * @param {number} [settings.offset] - Seconds the whole take is slid later (negative = earlier)
 * @param {Function} settings.pocketAt - `(step) => seconds`, pocket offset of the followed drum
 * @returns {Array<{id, source, muted, step, time, startTime, offset, duration, stretch}>} Sorted by startTime.
 *   `time` is where the onset lands, `startTime` where playback begins (both loop-relative seconds)
 */
export function placeSlices(slices, settings) {
  const { bpm, takeBpm, bars, tightness, gridSteps, pocketAt, offset = 0 } = settings;
  const stepDuration = 60 / bpm / 4;
  const takeStepDuration = 60 / takeBpm / 4;
  const loopSteps = bars * NUM_STEPS;
  const loopSeconds = loopSteps * stepDuration;
  const tight = tightness / 100;

  const placed = slices.map((slice) => {
    // The take can be slid against the beat; what runs off one end of the
    // loop comes back in at the other
    const slid = (slice.at ?? slice.onset) + offset;
    const performedSteps = (((slid / takeStepDuration) % loopSteps) + loopSteps) % loopSteps;
    const gridPos = Math.round(performedSteps / gridSteps) * gridSteps;

    // Triplet positions fall between 16ths: blend the pockets either side
    const lower = Math.floor(gridPos + 1e-9);
    const frac = gridPos - lower;
    const pocket = pocketAt(lower) * (1 - frac) + (frac > 1e-9 ? pocketAt(lower + 1) * frac : 0);

    const performedTime = performedSteps * stepDuration;
    const pocketTime = gridPos * stepDuration + pocket;
    const time = performedTime + (pocketTime - performedTime) * tight;
    // The zone says when; its source chop says what is heard. Zones never
    // move, so the rhythm that was sung is kept however chops are rearranged.
    const chop = slices[slice.source] ?? slice;
    // A stretched chop is played from its own, longer copy of the audio
    const stretch = chop.stretch ?? 1;
    const preRoll = (chop.onset - chop.start) * stretch;

    return {
      id: slice.id,
      source: chop.id,
      muted: slice.muted,
      step: ((Math.floor(time / stepDuration + 1e-6) % loopSteps) + loopSteps) % loopSteps,
      time,
      startTime: time - preRoll,
      offset: chop.start,
      duration: (chop.end - chop.start) * stretch,
      stretch,
    };
  });

  placed.sort((a, b) => a.startTime - b.startTime);

  // Trim each slice where the next one starts (the last one wraps to the first)
  placed.forEach((slice, i) => {
    const nextStart =
      i + 1 < placed.length ? placed[i + 1].startTime : placed[0].startTime + loopSeconds;
    slice.duration = Math.min(slice.duration, nextStart - slice.startTime + OVERLAP_SECONDS);
  });
  return placed;
}

/**
 * Work out how many bars a loaded loop is, and so its tempo: the bar count
 * that puts its tempo nearest the session's.
 * @param {number} seconds - Length of the audio
 * @param {number} bpm - Session tempo
 * @returns {{bars: number, bpm: number} | null} null if it is not loop-sized
 *   (a whole song, a one-shot): no bar count gives a tempo near the session's
 */
export function fitLoop(seconds, bpm) {
  let best = null;
  for (const bars of ALLOWED_BARS) {
    const loopBpm = (bars * 240) / seconds;
    const distance = Math.abs(Math.log2(loopBpm / bpm));
    if (!best || distance < best.distance) best = { bars, bpm: loopBpm, distance };
  }
  return best.distance <= MAX_TEMPO_DISTANCE ? { bars: best.bars, bpm: best.bpm } : null;
}

export class VoxEngine {
  /**
   * @param {Store} store
   * @param {AudioEngine} audioEngine
   * @param {string} [laneKey] - Which take lane this is, and its slice of the
   *   store: "vox" (the mic take) or "smp" (the loaded loop)
   * @param {AudioJobs} [jobs] - Does the listening and stretching off the
   *   page's thread. Without it everything is worked out here, as it is asked for.
   */
  constructor(store, audioEngine, laneKey = "vox", jobs = null) {
    this.store = store;
    this.audioEngine = audioEngine;
    this.laneKey = laneKey;
    this.jobs = jobs;
    // SAUCE chain per audio context (the live one, and each offline bounce)
    this.fxChains = new WeakMap();
    this.buffer = null;
    // Mono copy of the take and where its transients are, for the chop screen
    this.mono = null;
    this.peak = 1;
    this.takeSeconds = 0;
    this.autoOnsets = [];
    // Every onset in the audio (autoOnsets are the ones inside the loop)
    this.allOnsets = [];
    // A loaded loop whose length set its tempo, rather than the session's
    this.fitted = false;
    this.peaksCache = null;
    // The whole of a loaded file, the part of it trimmed out as the loop
    // (null: none yet), and every transient in it, for trimming again
    this.source = null;
    this.trim = null;
    this.sourceOnsets = [];
    this.sourceMono = null;
    this.sourcePeaksCache = null;
    // The file the take was loaded from, { name, type, bytes }, so a saved
    // beat can hold the original (null: a mic take, which has no file)
    this.file = null;
    // Muted while a new take is being recorded over the loop
    this.suspended = false;
    // The last erased take, kept until a new one is made, so erasing can be undone
    this.erased = null;
    // TUNE: the lane whose key this one is tuned to (the loaded loop), and
    // the sung pitch of each chop, worked out once per chop
    this.tuneTo = null;
    this.pitchCache = new Map();
    // Stretched copies of the chops whose neighbours have been moved
    this.stretchCache = new Map();
    // Chops being stretched or listened to by the worker right now
    this.stretching = new Set();
    this.pitching = new Set();
    this.placementCache = { key: [], placements: [] };
  }

  /** A different take: what was worked out for the last one is no use */
  forgetChops() {
    this.pitchCache.clear();
    this.stretchCache.clear();
    // Fresh sets: an answer still on its way for the old take finds nothing to tick off
    this.stretching = new Set();
    this.pitching = new Set();
  }

  /** This lane's slice of the store */
  lane() {
    return this.store.getState()[this.laneKey];
  }

  hasTake() {
    return this.buffer !== null && this.lane().slices.length > 0;
  }

  /**
   * Load a take: find its onsets, slice it, and put it on the VOX lane.
   * @param {AudioBuffer} buffer - Starts on beat one of the loop
   * @param {number} [bars] - Loop length of a mic take, recorded at the session
   *   tempo. Omitted for a loaded file: its bars and tempo come from its length.
   * @param {{start: number, end: number}} [trim] - The buffer is this part of
   *   the file already loaded, not a new file
   * @param {{onsets: number[], key: Object|null}} [heard] - What hear() made
   *   of it already; without it the take is listened to here and now
   * @returns {number} How many slices were found
   */
  setTake(buffer, bars, trim = null, heard = null) {
    const bpm = this.store.getState().transport.bpm;
    const barSeconds = (60 / bpm / 4) * NUM_STEPS;
    // A loaded loop brings its own tempo: its chops land on the session's
    // grid and play at their own speed. Anything not loop-sized is read at
    // the session tempo, as many bars of it as fit.
    const fit = bars ? null : fitLoop(buffer.duration, bpm);
    const loopBars = bars ?? fit?.bars ?? ALLOWED_BARS[ALLOWED_BARS.length - 1];
    const takeBpm = fit?.bpm ?? bpm;
    const takeSeconds = fit ? buffer.duration : Math.min(buffer.duration, loopBars * barSeconds);

    const mono = mixToMono(buffer);
    const peak = peakLevel(mono);
    let onsets = heard?.onsets ?? detectOnsets(mono, buffer.sampleRate);
    // Audible, but nothing to cut on (one held note, a wash of sound): keep
    // the take whole, as a single slice from where the sound starts
    if (onsets.length === 0 && peak >= MIN_TAKE_PEAK) {
      const firstSound = mono.findIndex((sample) => Math.abs(sample) >= peak * 0.2);
      onsets = [firstSound / buffer.sampleRate];
    }

    const slices = buildSlices(onsets, takeSeconds);
    if (slices.length === 0) return 0;

    this.erased = null;
    this.forgetChops();
    if (!trim) {
      // A new file can be trimmed; a mic take is already the length it should be
      this.source = bars ? null : buffer;
      this.sourceOnsets = bars ? [] : onsets;
      this.sourceMono = null;
      this.sourcePeaksCache = null;
      this.file = null;
    }
    this.trim = trim;
    this.buffer = buffer;
    this.mono = mono;
    this.peak = peak;
    this.takeSeconds = takeSeconds;
    this.autoOnsets = slices.map((slice) => slice.onset);
    this.allOnsets = onsets;
    this.fitted = fit !== null;
    this.peaksCache = null;
    this.store.dispatch({
      lane: this.laneKey,
      type: "SET_VOX_TAKE",
      payload: {
        origin: bars ? "mic" : "file",
        // What a sung take can be tuned to: the key of a loaded loop
        key: bars ? null : heard ? heard.key : analyseKey(mono, buffer.sampleRate),
        bars: loopBars,
        takeBpm,
        chop: "auto",
        // A slide dialled in for the mic carries over to the next mic take
        // (the same lag will be there); a dropped file starts from zero
        offset: bars ? this.lane().offset : 0,
        slices,
        gain: Math.min(TAKE_MAX_GAIN, Math.max(1, TAKE_TARGET_PEAK / peak)),
      },
    });
    if (this.lane().tune) this.warmPitches();
    return slices.length;
  }

  /**
   * Listen to a recording off the page's thread: where its hits are and,
   * for a loaded file, its key. This is the slow part of setTake().
   * @param {AudioBuffer} buffer
   * @param {number} [bars] - As setTake(): given for a mic take, which has no key to find
   * @returns {Promise<{onsets: number[], key: Object|null}|null>} null with
   *   no worker to ask: setTake() then listens for itself
   */
  async hear(buffer, bars) {
    if (!this.jobs) return null;
    try {
      const mono = mixToMono(buffer);
      return await this.jobs.run("listen", { mono, sampleRate: buffer.sampleRate, key: !bars });
    } catch {
      return null;
    }
  }

  /** setTake(), with the listening done off the page's thread first */
  async loadTake(buffer, bars) {
    return this.setTake(buffer, bars, null, await this.hear(buffer, bars));
  }

  /** Take the voice off the loop. The take is kept aside until restore() or a new take. */
  clear() {
    if (!this.hasTake()) return;
    const { buffer, mono, peak, takeSeconds, autoOnsets, allOnsets, fitted } = this;
    const { source, trim, sourceOnsets } = this;
    const vox = this.lane();
    this.erased = { buffer, mono, peak, takeSeconds, autoOnsets, allOnsets, fitted, vox };
    Object.assign(this.erased, { source, trim, sourceOnsets });
    this.buffer = null;
    this.mono = null;
    this.peaksCache = null;
    this.store.dispatch({ lane: this.laneKey, type: "CLEAR_VOX" });
  }

  /** Bring back the take that clear() removed, chops and settings as they were */
  restore() {
    if (!this.erased) return false;
    const { vox, ...take } = this.erased;
    Object.assign(this, take, { erased: null, peaksCache: null });
    this.sourceMono = null;
    this.sourcePeaksCache = null;
    this.forgetChops();
    this.store.dispatch({ lane: this.laneKey, type: "SET_VOX_TAKE", payload: vox });
    return true;
  }

  // ---- Saving: a take as it goes into a saved beat, and comes back out ----

  /**
   * What a saved beat needs to rebuild this take, beyond the lane's own
   * settings in the store.
   * @returns {{audio: AudioBuffer, file: Object|null, trim: Object|null,
   *   takeSeconds: number, fitted: boolean}|null} null with no take on the lane
   */
  exportTake() {
    if (!this.hasTake()) return null;
    const { file, trim, takeSeconds, fitted } = this;
    // A loaded file is kept whole, so it can still be trimmed differently
    return { audio: this.source ?? this.buffer, file, trim, takeSeconds, fitted };
  }

  /**
   * Put a saved take back: its audio is read the way it first was, then the
   * lane is set to exactly what was saved (chops, moved hits, mutes, the lot).
   * @param {AudioBuffer} audio - What exportTake() gave as `audio`
   * @param {Object} take - The rest of what exportTake() gave
   * @param {Object} lane - The lane's saved slice of the store
   * @returns {Promise<boolean>} false if nothing could be read from the audio
   */
  async importTake(audio, take, lane) {
    let count = await this.loadTake(audio, lane.origin === "mic" ? lane.bars : undefined);
    if (count && take.trim) count = await this.trimHeard(take.trim.start, take.trim.end);
    if (!count) return false;

    // How it was read depended on the tempo at the time; keep what was saved
    this.file = take.file ?? null;
    this.takeSeconds = take.takeSeconds;
    this.fitted = take.fitted;
    this.autoOnsets = this.allOnsets.filter((onset) => onset < this.takeSeconds);
    this.peaksCache = null;
    this.store.dispatch({ lane: this.laneKey, type: "SET_VOX_TAKE", payload: lane });
    if (lane.tune) this.warmPitches();
    this.warmStretches();
    return true;
  }

  /** Forget the take entirely, with nothing kept to bring back (the lane's settings are left alone) */
  drop() {
    this.buffer = null;
    this.mono = null;
    this.source = null;
    this.sourceMono = null;
    this.sourceOnsets = [];
    this.trim = null;
    this.file = null;
    this.erased = null;
    this.peaksCache = null;
    this.sourcePeaksCache = null;
    this.forgetChops();
  }

  /**
   * SAUCE fader: how much of the take is sent to the chorus, echo and hall
   * @param {number} value - 0 (dry) to 100
   */
  setFx(value) {
    this.store.dispatch({
      lane: this.laneKey,
      type: "SET_VOX_SETTING",
      payload: { key: "fx", value },
    });
    // Heard at once, not only from the next chop
    this.fxChains.get(this.audioEngine.liveTarget.ctx)?.setAmount(value / 100);
  }

  /**
   * TUNE key: nudge every chop onto the nearest note of the loop's key (or,
   * with no loop, the nearest semitone). The loop is never altered.
   */
  toggleTune() {
    const tune = !this.lane().tune;
    if (tune) this.warmPitches();
    this.store.dispatch({
      lane: this.laneKey,
      type: "SET_VOX_SETTING",
      payload: { key: "tune", value: tune },
    });
  }

  /** The key this lane is tuned to: the other lane's, while it has a take */
  getTuneKey() {
    return this.tuneTo?.hasTake() ? this.tuneTo.lane().key : null;
  }

  /** The note a chop is sung at (Hz), or null if it holds no steady note */
  getChopPitch(chop) {
    const id = `${chop.onset}:${chop.end}`;
    if (!this.pitchCache.has(id)) {
      const pitch = detectPitch(this.mono, this.buffer.sampleRate, chop.onset, chop.end);
      this.pitchCache.set(id, pitch);
    }
    return this.pitchCache.get(id);
  }

  /** Listen to every chop now, so the first tuned pass doesn't stall on it */
  warmPitches() {
    if (!this.buffer) return;
    const chops = this.lane().slices;
    if (!this.jobs) {
      for (const chop of chops) this.getChopPitch(chop);
      return;
    }
    const { mono, pitchCache, pitching } = this;
    const { sampleRate } = this.buffer;
    const id = (chop) => `${chop.onset}:${chop.end}`;
    const wanted = chops.filter((chop) => !pitchCache.has(id(chop)) && !pitching.has(id(chop)));
    if (wanted.length === 0) return;
    for (const chop of wanted) pitching.add(id(chop));
    // Each chop goes over as a copy of its own stretch of the take, from its
    // first sound to its end (a view would take the whole take with it)
    const cut = (chop) =>
      mono.slice(Math.round(chop.onset * sampleRate), Math.round(chop.end * sampleRate));
    this.jobs
      .run("pitches", { chops: wanted.map(cut), sampleRate })
      .then((pitches) => {
        // Still the same take? (a new one has caches of its own)
        if (this.pitching !== pitching || this.mono !== mono) return;
        wanted.forEach((chop, i) => {
          if (!pitchCache.has(id(chop))) pitchCache.set(id(chop), pitches[i]);
        });
      })
      .catch(() => {})
      .finally(() => {
        for (const chop of wanted) pitching.delete(id(chop));
      });
  }

  /** Silence the lane without losing the take: it is not played and is left out of the stereo bounce */
  toggleMute() {
    const muted = !this.lane().muted;
    this.store.dispatch({
      lane: this.laneKey,
      type: "SET_VOX_SETTING",
      payload: { key: "muted", value: muted },
    });
  }

  // ---- Trimming: which part of a loaded file is the loop ----

  /** Is there a loaded file here that a loop can be trimmed out of? */
  canTrim() {
    return this.source !== null && this.buffer !== null;
  }

  /** The part of the file in use (seconds): what was trimmed, else what was read from its start */
  getTrim() {
    return this.trim ?? { start: 0, end: Math.min(this.source.duration, this.takeSeconds) };
  }

  /**
   * Make part of the loaded file the loop. It is read the way a freshly
   * loaded file is: as the whole number of bars that puts its tempo nearest
   * the session's, cut at its transients and landed on the session's grid.
   * The rest of the file is kept, so it can be trimmed differently later.
   * @returns {number} How many slices were found (0: nothing there, and nothing changed)
   */
  trimTo(start, end) {
    const piece = this.cutSource(start, end);
    return piece ? this.setTake(piece.cut, undefined, piece.trim) : 0;
  }

  /** trimTo(), with the listening done off the page's thread first */
  async trimHeard(start, end) {
    const piece = this.cutSource(start, end);
    if (!piece) return 0;
    return this.setTake(piece.cut, undefined, piece.trim, await this.hear(piece.cut));
  }

  /** Part of the loaded file as audio of its own; null if it is too short to be a loop */
  cutSource(start, end) {
    const { sampleRate, numberOfChannels } = this.source;
    const from = Math.max(0, Math.round(start * sampleRate));
    const to = Math.min(this.source.length, Math.round(end * sampleRate));
    if (to - from < MIN_TRIM_SECONDS * sampleRate) return null;

    const cut = new AudioBuffer({ length: to - from, numberOfChannels, sampleRate });
    for (let c = 0; c < numberOfChannels; c++) {
      cut.copyToChannel(this.source.getChannelData(c).subarray(from, to), c);
    }
    return { cut, trim: { start: from / sampleRate, end: to / sampleRate } };
  }

  /**
   * Waveform of part of the loaded file, for the trim screen.
   * @param {number} from - Seconds into the file at the left edge
   * @param {number} to - Seconds into the file at the right edge
   * @param {number} columns - How many pixels wide it will be drawn
   * @returns {{min: Float32Array, max: Float32Array}} Lowest and highest sample per column, -1..1
   */
  getSourcePeaks(from, to, columns) {
    const cache = this.sourcePeaksCache;
    if (cache?.from === from && cache.to === to && cache.columns === columns) return cache;

    this.sourceMono ??= mixToMono(this.source);
    const mono = this.sourceMono;
    const min = new Float32Array(columns);
    const max = new Float32Array(columns);
    const samplesPerColumn = ((to - from) * this.source.sampleRate) / columns;
    const first = from * this.source.sampleRate;
    // A long file has thousands of samples to a pixel: every one need not be looked at
    const stride = Math.max(1, Math.floor(samplesPerColumn / 256));
    let peak = 1e-6;
    for (let x = 0; x < columns; x++) {
      const begin = Math.floor(first + x * samplesPerColumn);
      const stop = Math.min(mono.length, Math.floor(first + (x + 1) * samplesPerColumn));
      for (let i = begin; i < stop; i += stride) {
        if (mono[i] < min[x]) min[x] = mono[i];
        if (mono[i] > max[x]) max[x] = mono[i];
      }
      peak = Math.max(peak, max[x], -min[x]);
    }
    for (let x = 0; x < columns; x++) {
      min[x] /= peak;
      max[x] /= peak;
    }
    this.sourcePeaksCache = { from, to, columns, min, max };
    return this.sourcePeaksCache;
  }

  // ---- Chopping: where the slice markers are ----

  /** Length of the loop at the tempo the take was made at (seconds) */
  getTakeLoopSeconds() {
    const { bars, takeBpm } = this.lane();
    return bars * NUM_STEPS * (60 / takeBpm / 4);
  }

  /**
   * Say how many bars a loaded loop is, when the guess was wrong. A fitted
   * loop keeps its chops and changes tempo (twice the bars, twice the BPM);
   * anything else is re-read at that length and chopped afresh.
   */
  cycleLoopBars() {
    const { bars, takeBpm, origin } = this.lane();
    if (!this.buffer || origin !== "file") return;
    const next = ALLOWED_BARS[(ALLOWED_BARS.indexOf(bars) + 1) % ALLOWED_BARS.length];

    if (this.fitted) {
      const payload = { bars: next, takeBpm: (next * 240) / this.buffer.duration };
      this.store.dispatch({ lane: this.laneKey, type: "SET_VOX_TAKE", payload });
      return;
    }
    const barSeconds = (60 / takeBpm / 4) * NUM_STEPS;
    this.takeSeconds = Math.min(this.buffer.duration, next * barSeconds);
    this.autoOnsets = this.allOnsets.filter((onset) => onset < this.takeSeconds);
    this.peaksCache = null;
    this.store.dispatch({ lane: this.laneKey, type: "SET_VOX_TAKE", payload: { bars: next } });
    this.setChop("auto");
  }

  /**
   * Re-cut the whole take.
   * @param {string} mode - One of CHOP_MODES
   */
  setChop(mode) {
    if (!this.buffer) return;
    const { takeBpm } = this.lane();
    const beatSeconds = 60 / takeBpm;

    let onsets;
    if (mode === "beats" || mode === "bars") {
      const every = mode === "beats" ? beatSeconds : beatSeconds * 4;
      onsets = [];
      // Stop short of a sliver at the very end of the take
      for (let t = 0; t < this.takeSeconds - MIN_SLICE_SECONDS; t += every) onsets.push(t);
    } else if (mode === "whole") {
      onsets = [0];
    } else {
      onsets = this.autoOnsets;
    }
    this.setMarkers(
      onsets.map((onset) => ({ onset, muted: false })),
      mode,
    );
  }

  /**
   * Slide the whole take against the beat — for a take that came in a
   * little early or late. The slice markers move with it.
   * @param {number} seconds - Later if positive; wraps round the loop
   */
  setOffset(seconds) {
    // Keep it as the shortest way round: half a loop either side of zero
    const loopSeconds = this.getTakeLoopSeconds();
    const half = loopSeconds / 2;
    const offset = ((((seconds + half) % loopSeconds) + loopSeconds) % loopSeconds) - half;
    this.store.dispatch({
      lane: this.laneKey,
      type: "SET_VOX_SETTING",
      payload: { key: "offset", value: offset },
    });
  }

  /**
   * Where a hit may be moved to: between its neighbours, inside the take,
   * and no further than the chops either side can stretch
   */
  clampMarker(index, time) {
    const slices = this.lane().slices;
    const cut = (i) =>
      (i + 1 < slices.length ? slices[i + 1].onset : this.takeSeconds) - slices[i].onset;
    const nextAt = index + 1 < slices.length ? slices[index + 1].at : this.takeSeconds;
    let lower = nextAt - cut(index) * MAX_STRETCH;
    let upper = nextAt - Math.max(MIN_SLICE_SECONDS, cut(index) * MIN_STRETCH);
    if (index > 0) {
      const before = slices[index - 1];
      lower = Math.max(
        lower,
        before.at + Math.max(MIN_SLICE_SECONDS, cut(index - 1) * MIN_STRETCH),
      );
      upper = Math.min(upper, before.at + cut(index - 1) * MAX_STRETCH);
    }
    return Math.max(0, lower, Math.min(upper, time));
  }

  /**
   * The moment of the take heard at a moment of the loop, hits moved or not
   * @param {number} time - Seconds into the loop, before the take is slid
   */
  sourceAt(time) {
    const slices = this.lane().slices;
    let zone = -1;
    while (zone + 1 < slices.length && time >= slices[zone + 1].at) zone++;
    // Ahead of the first marker nothing is stretched
    if (zone === -1) return Math.max(0, slices[0].onset - (slices[0].at - time));
    return slices[zone].onset + (time - slices[zone].at) / slices[zone].stretch;
  }

  /**
   * Where a marker ends up if its hit is dragged to a moment of the loop:
   * the audio goes with it
   */
  warpTarget(index, time) {
    return { onset: this.lane().slices[index].onset, at: this.clampMarker(index, time) };
  }

  /**
   * Where a marker ends up if only the cut is dragged: the audio stays
   * where it is and the marker moves over it
   */
  recutTarget(index, time) {
    const slices = this.lane().slices;
    const room = (key) => {
      const lower = index > 0 ? slices[index - 1][key] + MIN_SLICE_SECONDS : 0;
      const upper =
        (index + 1 < slices.length ? slices[index + 1][key] : this.takeSeconds) - MIN_SLICE_SECONDS;
      return (value) => Math.max(lower, Math.min(upper, value));
    };
    const at = room("at")(time);
    return { onset: room("onset")(this.sourceAt(at)), at };
  }

  /** Put a marker where warpTarget or recutTarget said it would go */
  moveMarker(index, target) {
    const markers = this.getMarkers();
    Object.assign(markers[index], target);
    this.setMarkers(markers, "edit", true);
  }

  /** Put a moved hit back where it was performed (as near as its neighbours allow) */
  resetMarker(index) {
    this.moveMarker(index, this.warpTarget(index, this.lane().slices[index].onset));
  }

  /** Split the slice at a point in the loop; the new slice inherits its mute */
  addMarker(time) {
    if (time >= this.takeSeconds - MIN_SLICE_SECONDS) return;
    const markers = this.getMarkers();
    const onset = this.sourceAt(time);
    const tooClose = (marker) =>
      Math.abs(marker.at - time) < MIN_SLICE_SECONDS ||
      Math.abs(marker.onset - onset) < MIN_SLICE_SECONDS;
    if (markers.some(tooClose)) return;

    const before = markers.filter((marker) => marker.at <= time).pop();
    markers.push({ onset, at: time, muted: before?.muted ?? false });
    this.setMarkers(markers, "edit");
  }

  /** Remove a marker: its slice becomes part of the one before it */
  removeMarker(index) {
    const markers = this.getMarkers();
    if (markers.length <= 1) return; // a take needs somewhere to start
    markers.splice(index, 1);
    this.setMarkers(markers, "edit");
  }

  getMarkers() {
    return this.lane().slices.map(({ onset, at, muted }) => ({ onset, at, muted }));
  }

  /**
   * Rebuild the slices from a list of markers.
   * @param {Array<{onset: number, at?: number, muted: boolean}>} markers -
   *   `at` is left out for a hit heard where it was performed
   * @param {boolean} [keepOrder] - Keep the chops' reordering. Only possible
   *   when no marker was added or removed, since that renumbers the chops.
   */
  setMarkers(markers, chop, keepOrder = false) {
    const previous = this.lane().slices;
    markers.sort((a, b) => a.onset - b.onset);
    const slices = buildSlices(
      markers.map((marker) => marker.onset),
      this.takeSeconds,
      markers.map((marker) => marker.at ?? marker.onset),
    ).map((slice, i) => ({
      ...slice,
      muted: markers[i].muted,
      source: keepOrder ? previous[i].source : i,
    }));
    this.store.dispatch({ lane: this.laneKey, type: "SET_VOX_TAKE", payload: { slices, chop } });
    this.warmStretches();
  }

  /**
   * A chop's audio, made as long as its markers now say it is.
   * @returns {AudioBuffer}
   */
  getStretched(chop) {
    const id = stretchId(chop);
    if (!this.stretchCache.has(id)) {
      // Due to play before the worker has got to it: stretched here, this once
      const { sampleRate } = this.buffer;
      const stretched = stretchChannels(this.chopChannels(chop), chop.stretch, sampleRate);
      this.stretchCache.set(id, this.asBuffer(stretched));
    }
    return this.stretchCache.get(id);
  }

  /** A chop's own stretch of the take, channel by channel */
  chopChannels(chop) {
    const { sampleRate, numberOfChannels } = this.buffer;
    const from = Math.round(chop.start * sampleRate);
    const to = Math.min(this.buffer.length, Math.round(chop.end * sampleRate));
    const channels = [];
    for (let c = 0; c < numberOfChannels; c++) {
      channels.push(this.buffer.getChannelData(c).subarray(from, to));
    }
    return channels;
  }

  asBuffer(channels) {
    const { sampleRate } = this.buffer;
    const numberOfChannels = channels.length;
    const buffer = new AudioBuffer({ length: channels[0].length, numberOfChannels, sampleRate });
    channels.forEach((data, c) => {
      buffer.copyToChannel(data, c);
    });
    return buffer;
  }

  /** Stretch what needs it now, rather than when it is first due to play; drop what no longer does */
  warmStretches() {
    if (!this.buffer) return;
    const wanted = this.lane().slices.filter((chop) => chop.stretch !== 1);
    const ids = new Set(wanted.map(stretchId));
    for (const id of this.stretchCache.keys()) {
      if (!ids.has(id)) this.stretchCache.delete(id);
    }
    const { buffer, stretchCache, stretching } = this;
    for (const chop of wanted) {
      const id = stretchId(chop);
      if (stretchCache.has(id) || stretching.has(id)) continue;
      if (!this.jobs) {
        this.getStretched(chop);
        continue;
      }
      // Off the page's thread: dragging a marker never waits on the stretch
      stretching.add(id);
      this.jobs
        .run("stretch", {
          // Copies: a view would take the whole take across with it
          channels: this.chopChannels(chop).map((channel) => channel.slice()),
          ratio: chop.stretch,
          sampleRate: buffer.sampleRate,
        })
        .then((stretched) => {
          // Still the same take, and not stretched here in the meantime?
          if (this.buffer !== buffer || this.stretching !== stretching) return;
          if (!stretchCache.has(id)) stretchCache.set(id, this.asBuffer(stretched));
        })
        .catch(() => {})
        .finally(() => stretching.delete(id));
    }
  }

  // ---- Rearranging: which chop is heard in which zone ----

  /** Have the chops been moved out of the order they were sung in? */
  isReordered() {
    return this.lane().slices.some((slice, i) => slice.source !== i);
  }

  getSources() {
    return this.lane().slices.map((slice) => slice.source);
  }

  setSources(sources) {
    const slices = this.lane().slices.map((slice, i) => ({
      ...slice,
      source: sources[i],
    }));
    this.store.dispatch({ lane: this.laneKey, type: "SET_VOX_TAKE", payload: { slices } });
  }

  /** Two zones trade the chops they play */
  swapChops(a, b) {
    const sources = this.getSources();
    if (a === b || sources[a] === undefined || sources[b] === undefined) return;
    [sources[a], sources[b]] = [sources[b], sources[a]];
    this.setSources(sources);
  }

  /** The chop heard in one zone is repeated in others (replacing what was there) */
  copyChop(from, targets) {
    const sources = this.getSources();
    if (sources[from] === undefined) return;
    for (const zone of targets) {
      if (sources[zone] !== undefined) sources[zone] = sources[from];
    }
    this.setSources(sources);
  }

  /**
   * Deal the chops out across the zones again, one each. Chops only trade
   * with others of about their own length (short hits with short hits,
   * phrases with phrases), so nothing is cut off badly or left hanging.
   * @param {Function} [rand] - Random source, 0..1
   */
  shuffleChops(rand = Math.random) {
    const slices = this.lane().slices;
    if (slices.length < 2) return;
    const current = this.getSources();

    let sources = current;
    for (let attempt = 0; attempt < 8 && sources.every((s, i) => s === current[i]); attempt++) {
      sources = shuffleByLength(slices, rand);
    }
    this.setSources(sources);
  }

  /** Back to the order it was sung in */
  resetOrder() {
    this.setSources(this.lane().slices.map((_, i) => i));
  }

  /**
   * Waveform of the take across the loop, for drawing.
   * @param {number} columns - How many pixels wide it will be drawn
   * @returns {{min: Float32Array, max: Float32Array}} Lowest and highest sample per column, -1..1
   */
  getPeaks(columns) {
    if (this.peaksCache?.columns === columns) return this.peaksCache;

    const min = new Float32Array(columns);
    const max = new Float32Array(columns);
    if (this.mono) {
      const samplesPerColumn = (this.getTakeLoopSeconds() * this.buffer.sampleRate) / columns;
      const end = Math.min(this.mono.length, Math.round(this.takeSeconds * this.buffer.sampleRate));
      for (let x = 0; x < columns; x++) {
        const from = Math.floor(x * samplesPerColumn);
        const to = Math.min(end, Math.floor((x + 1) * samplesPerColumn));
        for (let i = from; i < to; i++) {
          const sample = this.mono[i] / this.peak;
          if (sample < min[x]) min[x] = sample;
          if (sample > max[x]) max[x] = sample;
        }
      }
    }
    this.peaksCache = { columns, min, max };
    return this.peaksCache;
  }

  /** Current slice placements; recomputed only when something they depend on changes */
  getPlacements() {
    const state = this.store.getState();
    const vox = state[this.laneKey];
    const { humanizeValue, trackSettings } = state;
    const bpm = state.transport.bpm;
    const hihatMode = state.grooveSettings?.hihatMode || "friction";

    const key = [vox, humanizeValue, trackSettings, bpm, hihatMode];
    const cache = this.placementCache;
    if (key.every((value, i) => value === cache.key[i])) return cache.placements;

    const voice = FOLLOW_VOICES[vox.follow] || FOLLOW_VOICES.kick;
    const swingLocked = trackSettings?.[voice.track]?.swingLocked ?? false;
    const placements = placeSlices(vox.slices, {
      bpm,
      takeBpm: vox.takeBpm,
      bars: vox.bars,
      tightness: vox.tightness,
      offset: vox.offset,
      gridSteps: VOX_RESOLUTIONS[vox.resolution] || 1,
      pocketAt: (step) =>
        getPocketOffset(
          voice.pitch,
          step % NUM_STEPS,
          humanizeValue / 100,
          bpm,
          hihatMode,
          swingLocked,
        ),
    });

    this.placementCache = { key, placements };
    return placements;
  }

  /**
   * Slices that start during one step — the VOX lane's answer to
   * GrooveController.getStepEvents.
   * @param {number} absStep - Steps since the loop started (not wrapped to a bar)
   * @param {number} baseTime - Straight-grid time of that step
   * @param {boolean} [all] - Heard or not: for what is packed for later work (stems)
   */
  getStepEvents(absStep, baseTime, all = false) {
    if (!this.hasTake() || this.suspended) return [];

    const state = this.store.getState();
    const lane = state[this.laneKey];
    // Muted, or left out by another row's solo (ADR-0053)
    if (!all && !isHeard(state, this.laneKey)) return [];
    const stepDuration = 60 / state.transport.bpm / 4;
    const loopSteps = lane.bars * NUM_STEPS;
    const loopStep = absStep % loopSteps;
    const tuneKey = lane.tune ? this.getTuneKey() : null;
    const events = [];

    for (const slice of this.getPlacements()) {
      if (slice.muted) continue;
      // A slice pulled ahead of beat one starts on the last step of the pass before
      const startStep = Math.floor(slice.startTime / stepDuration);
      if (((startStep % loopSteps) + loopSteps) % loopSteps !== loopStep) continue;

      // Tuned: run the chop a touch fast or slow, so its note lands on the key
      const sung = lane.tune ? this.getChopPitch(lane.slices[slice.source]) : null;
      const rate = sung ? 2 ** (tuneCents(sung, tuneKey) / 1200) : 1;

      // A stretched chop plays from the top of its own copy of the audio
      const stretched = slice.stretch !== 1 ? this.getStretched(lane.slices[slice.source]) : null;

      events.push({
        track: this.laneKey,
        rate,
        buffer: stretched ?? this.buffer,
        time: baseTime + (slice.startTime - startStep * stepDuration),
        offset: stretched ? 0 : slice.offset,
        duration: slice.duration,
        gain: lane.gain * levelToGain(state.mix[this.laneKey]),
        fx: lane.fx / 100,
        bpm: state.transport.bpm,
      });
    }
    return events;
  }

  /** Play one event of this lane, live or into an offline render target */
  playEvent(event, target = this.audioEngine.liveTarget) {
    const { ctx } = target;
    let dest = target.dest;
    // Once a chain exists the take stays on it, so the send can be closed
    // and reopened without the dry path jumping
    if (event.fx > 0 || this.fxChains.has(ctx)) {
      if (!this.fxChains.has(ctx)) this.fxChains.set(ctx, createDreamFx(ctx, target.dest));
      const chain = this.fxChains.get(ctx);
      chain.setTempo(event.bpm);
      chain.setAmount(event.fx);
      dest = chain.input;
    }
    this.audioEngine.playSlice(
      event.buffer,
      event.time,
      event.offset,
      event.duration,
      event.gain,
      { ctx, dest },
      event.rate,
    );
  }

  /**
   * Handle a clock tick - schedules the slices that start on this step
   * @param {number} absStep - Steps since the clock started
   * @param {number} nextNoteTime - AudioContext time of the step
   */
  handleTick(absStep, nextNoteTime) {
    for (const event of this.getStepEvents(absStep, nextNoteTime)) {
      this.playEvent(event);
    }
  }
}

// Chops count as about the same length up to this ratio
const SIMILAR_LENGTH = 1.6;

/**
 * A chop for every zone, shuffled within groups of similar length.
 * @param {Array} slices - In sung order
 * @param {Function} rand - Random source, 0..1
 * @returns {number[]} source chop per zone
 */
export function shuffleByLength(slices, rand) {
  // Rank the positions by length and start a new group wherever the length
  // jumps. A group of one has nobody to trade with, so it joins the group
  // below it (or above, for the shortest).
  const byLength = slices
    .map((_, i) => i)
    .sort((a, b) => sliceLength(slices[a]) - sliceLength(slices[b]));
  const groups = [];
  for (const position of byLength) {
    const group = groups[groups.length - 1];
    if (group && sliceLength(slices[position]) <= sliceLength(slices[group[0]]) * SIMILAR_LENGTH) {
      group.push(position);
    } else groups.push([position]);
  }
  for (let g = groups.length - 1; g >= 0 && groups.length > 1; g--) {
    if (groups[g].length > 1) continue;
    const [single] = groups.splice(g, 1);
    if (g > 0) groups[g - 1].push(...single);
    else groups[0].unshift(...single);
  }

  // A fresh deal each time: every chop goes to a zone from its own group,
  // wherever earlier swaps and copies had put it
  const sources = [];
  for (const positions of groups) {
    const chops = [...positions];
    for (let i = chops.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [chops[i], chops[j]] = [chops[j], chops[i]];
    }
    positions.forEach((position, i) => {
      sources[position] = chops[i];
    });
  }
  return sources;
}

/** Names a chop's stretched audio: what was cut, and how far it was stretched */
function stretchId(chop) {
  return `${chop.start}:${chop.end}:${chop.stretch.toFixed(4)}`;
}

function sliceLength(slice) {
  return slice.end - slice.start;
}

export function mixToMono(buffer) {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);
  const mono = new Float32Array(buffer.length);
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c);
    for (let i = 0; i < mono.length; i++) mono[i] += data[i] / buffer.numberOfChannels;
  }
  return mono;
}
