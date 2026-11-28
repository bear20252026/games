/**
 * Audio Engine
 * Handles Web Audio API operations: loading samples, scheduling notes, playback
 * Uses extracted modules for humanization and ghost note generation
 */

import { DRUM_PITCHES } from "../constants/drums.js";
import { extractGhostNotes } from "./GhostNoteGenerator.js";
import { getHumanizedNote } from "./HumanizeEngine.js";
import { soundFile, soundId, TRACK_KEYS } from "./Sounds.js";

// Voice envelope timings. A built-in drum is cut short, as it was chosen by ear; a sound
// of the maker's own rings out, up to a ceiling (ADR-0054)
const DRUM_VOICE_SECONDS = 0.25;
export const OWN_VOICE_SECONDS = 4;
const FADE_SECONDS = 0.005;
const SLICE_FADE_OUT_SECONDS = 0.008;

// Engine states
const STATE = {
  UNINITIALIZED: "uninitialized",
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
};

// Metronome click: a short blip, higher on the one
const CLICK_HZ = 1000;
const CLICK_ACCENT_HZ = 1500;
const CLICK_SECONDS = 0.04;

/**
 * Browser audio host for the sequencer.
 *
 * Owns decoded drum buffers, custom sample replacement, and low-level note
 * scheduling. Higher-level groove decisions stay in the groove and humanize
 * modules so this class can remain focused on Web Audio work.
 */
/** Which cut of the stock drums this is: part of their address, so a new kit gets past a year's cache */
export const STOCK_KIT = 3;

/**
 * How long a drum voice sounds.
 * @param {number} bufferSeconds - The sound's own length
 * @param {boolean} own - Whether it is the maker's own sound
 */
export function voiceSeconds(bufferSeconds, own) {
  return Math.min(own ? OWN_VOICE_SECONDS : DRUM_VOICE_SECONDS, bufferSeconds);
}

/**
 * When the voice ringing on a row is cut off by the row's next hit.
 * @param {{startAt: number, endAt: number}|undefined} last - The voice before
 * @param {number} nextAt - When the next hit starts
 * @returns {number|null} The time, or null where it has no need: nothing rings, it is over
 *   (or as good as) by then, or the hits were handed over out of order
 */
export function chokeAt(last, nextAt) {
  if (!last || last.startAt >= nextAt || last.endAt <= nextAt + FADE_SECONDS) return null;
  return nextAt;
}

export class AudioEngine {
  /**
   * @param {AudioContext} audioCtx - Browser audio context used for decoding and playback.
   */
  constructor(audioCtx) {
    this.audioContext = audioCtx;
    this.samples = {};
    this.defaultSamples = {};
    // Mixer: gain multiplier per drum pitch (missing = unity)
    this.trackLevels = {};
    this.customSamples = new Set();
    // Every sound loaded or beatboxed onto a row, kept so the row can be
    // switched between it and the kit sound (customSamples: the ones in use)
    this.customBuffers = {};
    // The voice still ringing on each row of a maker's own sound, by audio context
    this.ringing = new WeakMap();
    // The file each of those was loaded from, { name, type, bytes }, so a
    // saved beat can hold the original (missing: a beatboxed sound)
    this.customFiles = {};
    // The built-in sound picked for each row, by id (missing: the row's first), and
    // every built-in fetched so far, by file, as a promise of its buffer (ADR-0049)
    this.kit = {};
    this.kitBuffers = new Map();
    /** Picks still on their way: a bounce waits for them */
    this.picking = Promise.resolve();
    this.samplesLoaded = false;
    /** The fetch of the drum sounds, while it is under way */
    this.samplesLoading = null;
    this.state = STATE.UNINITIALIZED;
    this.error = null;

    // Master bus — every voice lands here, so there is one node to meter,
    // record or re-point. Offline bounces pass their own { ctx, dest } target.
    this.output = audioCtx.createGain();
    this.output.connect(audioCtx.destination);
    this.liveTarget = { ctx: audioCtx, dest: this.output };
    // Live voices that have been scheduled and haven't finished yet
    this.liveSources = new Map();

    // Map MIDI pitches to sample names
    this.pitchToSample = {
      [DRUM_PITCHES.KICK]: "kick",
      [DRUM_PITCHES.SNARE]: "snare",
      [DRUM_PITCHES.HIHAT_CLOSED]: "hihat-closed",
      [DRUM_PITCHES.HIHAT_OPEN]: "hihat-open",
    };
  }

  /**
   * Check if engine is ready for playback
   * @returns {boolean}
   */
  isReady() {
    return this.state === STATE.READY;
  }

  /**
   * Get current engine state
   * @returns {string}
   */
  getState() {
    return this.state;
  }

  /**
   * Load all drum samples
   * Call this after user interaction (e.g., after clicking play)
   */
  loadSamples() {
    if (this.samplesLoaded) return this.picking;
    // Asked again while they are on their way: the same wait, not a second fetch
    this.samplesLoading ??= this.fetchSamples().finally(() => {
      this.samplesLoading = null;
    });
    return this.samplesLoading.then(() => this.picking);
  }

  /**
   * Put a built-in sound on a row (ADR-0049). Before the drums have been asked for it is
   * only noted, and fetched with the rest; after, it is fetched now.
   * @param {string} key - The row: "kick", "snare", "hihat-closed", "hihat-open"
   * @param {string} [id] - One of the row's sounds; anything else is its first
   * @returns {Promise<void>} Done when the row plays it
   */
  useSound(key, id) {
    this.kit[key] = soundId(key, id);
    if (!this.samplesLoaded && !this.samplesLoading) return Promise.resolve();
    const picked = (this.samplesLoading ?? Promise.resolve())
      .catch(() => {})
      .then(() => this.fetchSound(key));
    this.picking = Promise.all([this.picking, picked]).then(() => {});
    return picked;
  }

  /** Fetch a row's picked sound, once per file, and make it the row's kit sound */
  async fetchSound(key) {
    const file = soundFile(key, this.kit[key]);
    // Kept as it is asked for, so two picks of one file are one fetch
    if (!this.kitBuffers.has(file)) this.kitBuffers.set(file, this.fetchFile(file));
    const audioBuffer = await this.kitBuffers.get(file);
    if (!audioBuffer) {
      this.kitBuffers.delete(file);
      return;
    }
    // Another was picked while this one was on its way: that one wins
    if (soundFile(key, this.kit[key]) !== file) return;
    this.defaultSamples[key] = audioBuffer;
    // A sound of the maker's own stays on the row until it is switched off
    if (!this.customSamples.has(key)) this.samples[key] = audioBuffer;
  }

  /** @returns {Promise<AudioBuffer|null>} Null when the file can't be had: the row keeps what it plays */
  async fetchFile(file) {
    // Browsers keep these for a year (_headers): the number after each is what makes
    // a changed kit a new address. Raise it whenever a file in samples/ changes (ADR-0043)
    const url = `./samples/${file}?v=${STOCK_KIT}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        console.warn(`Sample not found: ${url} - using fallback oscillator`);
        return null;
      }
      return await this.audioContext.decodeAudioData(await response.arrayBuffer());
    } catch (error) {
      console.warn(`Failed to load sample ${file}:`, error);
      return null;
    }
  }

  async fetchSamples() {
    this.state = STATE.LOADING;
    this.error = null;

    try {
      await Promise.all(TRACK_KEYS.map((key) => this.fetchSound(key)));
      this.samplesLoaded = true;
      this.state = STATE.READY;
    } catch (error) {
      this.state = STATE.ERROR;
      this.error = error;
      console.error("Failed to load samples:", error);
      throw error;
    }
  }

  /**
   * Schedule a note to play at a specific time
   * @param {number} time - AudioContext time to play the note
   * @param {number} pitch - MIDI pitch number
   * @param {number} velocity - MIDI velocity (0-127), defaults to 100
   * @param {number} sampleStartOffset - Offset into sample buffer in seconds (for micro-chops)
   * @param {{ctx: BaseAudioContext, dest: AudioNode}} target - Where to render (defaults to live output)
   */
  scheduleNote(time, pitch, velocity = 100, sampleStartOffset = 0, target = this.liveTarget) {
    const sampleName = this.pitchToSample[pitch];
    const sample = sampleName ? this.samples[sampleName] : null;

    // Convert MIDI velocity (0-127) to gain (0.0-1.0)
    const normalizedVelocity = velocity / 127;
    // Exponential curve for natural dynamics, then the row's mixer fader
    const gain = normalizedVelocity ** 1.5 * (this.trackLevels[pitch] ?? 1);

    if (sample) {
      const own = sample === this.customBuffers[sampleName];
      this.playSample(
        sample,
        time,
        gain,
        velocity,
        sampleStartOffset,
        target,
        own ? sampleName : null,
      );
    } else {
      // Fallback to oscillator if sample not loaded
      this.playOscillator(time, pitch, gain, target);
    }
  }

  /**
   * Play an audio sample with gain and velocity-to-filter mapping
   * Low velocity = darker/muffled sound (ghost notes)
   * High velocity = bright/full sound (main hits)
   * @param {AudioBuffer} buffer - The sample to play
   * @param {number} time - AudioContext time to start
   * @param {number} gain - Gain level (0.0-1.0)
   * @param {number} velocity - MIDI velocity (1-127) for filter mapping
   * @param {number} sampleStartOffset - Offset into buffer in seconds (for micro-chops)
   * @param {{ctx: BaseAudioContext, dest: AudioNode}} target - Where to render
   * @param {string|null} ownRow - The row, where the sound is the maker's own: it rings out,
   *   and the row's next hit cuts it off
   */
  playSample(
    buffer,
    time,
    gain,
    velocity = 100,
    sampleStartOffset = 0,
    target = this.liveTarget,
    ownRow = null,
  ) {
    const { ctx, dest } = target;
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();

    // A short fade keeps the cut from clicking
    const maxDuration = voiceSeconds(buffer.duration, Boolean(ownRow));
    const startAt = Math.max(0, time);
    if (ownRow)
      this.ringOn(ctx, ownRow, { source, gainNode, gain, startAt, endAt: startAt + maxDuration });

    source.buffer = buffer;
    gainNode.gain.setValueAtTime(gain, startAt);
    if (buffer.duration > maxDuration) {
      gainNode.gain.setValueAtTime(gain, startAt + maxDuration - FADE_SECONDS);
      gainNode.gain.linearRampToValueAtTime(0, startAt + maxDuration);
    }

    // Velocity-to-Filter mapping (Dilla technique)
    filterNode.type = "lowpass";
    const minCutoff = 800;
    const maxCutoff = 20000;
    const normalizedVel = velocity / 127;
    const cutoff = minCutoff + (maxCutoff - minCutoff) * normalizedVel ** 2;

    filterNode.frequency.setValueAtTime(cutoff, startAt);
    filterNode.Q.setValueAtTime(0.7, startAt);

    // Signal chain: source → filter → gain → master bus
    source.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(dest);

    // Cleanup after playback ends
    source.onended = () => {
      this.liveSources.delete(source);
      source.disconnect();
      filterNode.disconnect();
      gainNode.disconnect();
    };

    // Start playback with optional offset into sample (for micro-chops)
    // Second parameter is offset into buffer in seconds
    source.start(startAt, sampleStartOffset, maxDuration);
    this.trackLive(source, startAt, ctx);
  }

  /**
   * A row's own sound is one voice: its next hit cuts off the one still ringing, as a
   * sampler's pad does, so a long bass note never piles up on itself. Kept per context,
   * so a bounce does as the desk does.
   */
  ringOn(ctx, row, voice) {
    const rows = this.ringing.get(ctx) ?? new Map();
    this.ringing.set(ctx, rows);
    const last = rows.get(row);
    const cutAt = chokeAt(last, voice.startAt);
    if (cutAt !== null) {
      const fadeFrom = Math.max(last.startAt, cutAt - FADE_SECONDS);
      last.gainNode.gain.cancelScheduledValues(fadeFrom);
      last.gainNode.gain.setValueAtTime(last.gain, fadeFrom);
      last.gainNode.gain.linearRampToValueAtTime(0, cutAt);
      last.source.stop(cutAt);
    }
    rows.set(row, voice);
  }

  /** Remember a scheduled live voice so stopping the transport can call it off */
  trackLive(source, startAt, ctx) {
    if (ctx === this.audioContext) this.liveSources.set(source, startAt);
  }

  /**
   * Call off every hit that is scheduled but hasn't sounded yet. The clock
   * schedules a little ahead, so without this a few hits would still land
   * after STOP. What is already sounding rings out.
   */
  cancelScheduled() {
    const now = this.audioContext.currentTime;
    for (const [source, startAt] of this.liveSources) {
      if (startAt <= now) continue;
      source.stop();
      this.liveSources.delete(source);
    }
  }

  /**
   * Play a region of a longer recording (a vocal chop) with short fades at
   * both ends so slice boundaries don't click.
   * @param {AudioBuffer} buffer - The full take
   * @param {number} time - When to start
   * @param {number} offset - Where in the take the slice begins (seconds)
   * @param {number} duration - Slice length (seconds)
   * @param {number} gain - Gain level (0.0-1.0)
   * @param {{ctx: BaseAudioContext, dest: AudioNode}} target - Where to render
   * @param {number} rate - Playback speed, for tuning: above 1 is sharper (and a little shorter)
   */
  playSlice(buffer, time, offset, duration, gain = 1, target = this.liveTarget, rate = 1) {
    const { ctx, dest } = target;
    const source = ctx.createBufferSource();
    const gainNode = ctx.createGain();
    const startAt = Math.max(0, time);
    // `duration` is how long it may sound; a retuned slice gets through more
    // or less of the take in that time
    const content = Math.min(duration * rate, buffer.duration - offset);
    const length = Math.max(FADE_SECONDS * 3, content / rate);
    const fadeOut = Math.min(SLICE_FADE_OUT_SECONDS, length / 3);

    source.buffer = buffer;
    source.playbackRate.value = rate;
    gainNode.gain.setValueAtTime(0, startAt);
    gainNode.gain.linearRampToValueAtTime(gain, startAt + FADE_SECONDS);
    gainNode.gain.setValueAtTime(gain, startAt + length - fadeOut);
    gainNode.gain.linearRampToValueAtTime(0, startAt + length);

    source.connect(gainNode);
    gainNode.connect(dest);
    source.onended = () => {
      this.liveSources.delete(source);
      source.disconnect();
      gainNode.disconnect();
    };
    source.start(startAt, offset, length * rate);
    this.trackLive(source, startAt, ctx);
  }

  /**
   * Metronome click, for counting in and keeping time while recording.
   * @param {number} time - AudioContext time
   * @param {boolean} accent - The one of the bar: higher and a little louder
   */
  playClick(time, accent) {
    const { ctx, dest } = this.liveTarget;
    const oscNode = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscNode.type = "sine";
    oscNode.frequency.setValueAtTime(accent ? CLICK_ACCENT_HZ : CLICK_HZ, time);
    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(accent ? 0.5 : 0.35, time + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + CLICK_SECONDS);

    oscNode.connect(gainNode);
    gainNode.connect(dest);
    oscNode.onended = () => {
      this.liveSources.delete(oscNode);
      oscNode.disconnect();
      gainNode.disconnect();
    };
    oscNode.start(time);
    oscNode.stop(time + CLICK_SECONDS);
    this.trackLive(oscNode, time, ctx);
  }

  /**
   * Fallback oscillator-based sound (used if samples aren't loaded)
   */
  playOscillator(time, pitch, gain, target = this.liveTarget) {
    const { ctx, dest } = target;
    const frequency = this.calculateFrequency(pitch);

    const oscNode = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscNode.type = "triangle";
    oscNode.frequency.setValueAtTime(frequency, time);

    gainNode.gain.setValueAtTime(0, time);
    gainNode.gain.linearRampToValueAtTime(gain, time + 0.001);
    gainNode.gain.linearRampToValueAtTime(0, time + 0.1);

    oscNode.connect(gainNode);
    gainNode.connect(dest);

    // Cleanup after oscillator stops
    oscNode.onended = () => {
      oscNode.disconnect();
      gainNode.disconnect();
    };

    oscNode.start(time);
    oscNode.stop(time + 0.1);
  }

  calculateFrequency(pitch) {
    const adjustedPitch = pitch + 24;
    return 440 * 2 ** ((adjustedPitch - 69) / 12);
  }

  // Re-export methods from extracted modules for backwards compatibility
  getHumanizedNote(
    trackIdx,
    stepIdx,
    baseTime,
    humanizeAmount,
    pitchMap,
    bpm,
    trackSettings = null,
    hihatMode = "friction",
    eighths = false,
    hand = null,
  ) {
    return getHumanizedNote(
      trackIdx,
      stepIdx,
      baseTime,
      humanizeAmount,
      pitchMap,
      bpm,
      trackSettings,
      hihatMode,
      eighths,
      hand,
    );
  }

  extractGhostNotes(
    originalSteps,
    bpm,
    humanizeAmount,
    trackSettings = null,
    hihatMode = "friction",
  ) {
    return extractGhostNotes(originalSteps, bpm, humanizeAmount, trackSettings, hihatMode);
  }

  /** Mixer fader for one drum, as a gain multiplier. Applies live and to bounces. */
  setTrackLevel(pitch, gain) {
    this.trackLevels[pitch] = gain;
  }

  replaceSample(audioBuffer, key, file = null) {
    if (Object.values(this.pitchToSample).includes(key)) {
      this.customSamples.add(key);
      this.customBuffers[key] = audioBuffer;
      if (file) this.customFiles[key] = file;
      else delete this.customFiles[key];
      this.samples[key] = audioBuffer;
    } else {
      return {
        error: `Invalid sample key: ${key}`,
        key,
      };
    }
  }

  /** Every row back to its kit sound. Your own sounds are kept to switch back to. */
  resetSamples() {
    this.samples = { ...this.defaultSamples };
    this.customSamples.clear();
  }

  /** Every row back to its kit sound, and your own sounds forgotten (a saved beat is about to load) */
  clearCustomSamples() {
    this.resetSamples();
    this.customBuffers = {};
    this.customFiles = {};
  }

  /** Is there a sound of your own for this row (in use or not)? */
  hasCustomBuffer(key) {
    return key in this.customBuffers;
  }

  /** Switch one row between your own sound and the kit's */
  useCustomSample(key, on) {
    if (on && this.hasCustomBuffer(key)) {
      this.samples[key] = this.customBuffers[key];
      this.customSamples.add(key);
    } else {
      this.samples[key] = this.defaultSamples[key];
      this.customSamples.delete(key);
    }
  }

  hasCustomSample(key) {
    return this.customSamples.has(key);
  }
}
