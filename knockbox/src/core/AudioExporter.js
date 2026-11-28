/**
 * AudioExporter
 *
 * Bounces the loop to audio. The same events live playback schedules
 * (GrooveController.getStepEvents, plus the VOX lane when there is a take)
 * are rendered through the engine's own voices into an OfflineAudioContext,
 * so the file is what you hear: swing, ghosts, flams, rolls and voice.
 *
 * The bounce is a seamless loop: one extra bar is rendered ahead of the
 * part that is kept, so tails ringing over the bar line and grace notes
 * that land just before beat one are already in the audio when it wraps.
 *
 * Every bar is a fresh performance (timing jitter is re-rolled per hit, as
 * it is on every live pass), so a bounce is a new take, not a recording of
 * the last loop you heard.
 */

import { Toast } from "../components/Toast.js";
import { NUM_STEPS, NUM_TRACKS } from "../constants/drums.js";
import { downloadBytes, encodeWav, encodeZip } from "./FileUtils.js";
import { isHeard } from "./Heard.js";

const SAMPLE_RATE = 44100;
/** How many bars a bounce holds */
export const BARS = 4;
// Leave a little headroom rather than sitting exactly on full scale
const PEAK_CEILING = 0.98;

const STEM_NAMES = ["kick", "snare", "hihat-closed", "hihat-open"];

export class AudioExporter {
  constructor(store, audioEngine, grooveController) {
    this.store = store;
    this.audioEngine = audioEngine;
    this.grooveController = grooveController;
    this.takeEngines = [];
    this.isRendering = false;
  }

  /** The take lanes (voice, loaded loop) join the bounce, each as its own stem */
  setTakeEngines(engines) {
    this.takeEngines = engines;
  }

  /**
   * Bounce the full mix to one WAV.
   * @returns {Promise<{filename: string, files: Array}|null>} What was written, or null
   */
  async exportMix() {
    return this.run(async (events) => {
      const bytes = await this.renderWav(events);
      const filename = this.makeFilename("mix", "wav", true);
      downloadBytes(bytes, filename, "audio/wav");
      Toast.show(`WAV bounced — ${BARS} bars, loops seamlessly`, "success");
      return { filename, files: [{ name: filename, label: "mix", mime: "audio/wav", bytes }] };
    });
  }

  /**
   * Bounce each lane on its own and hand them back as one ZIP.
   * Stems share one event list, so they line up sample-for-sample. Each is
   * cut to exactly four bars and named with the tempo and length, so it
   * drops onto a DAW's grid as a loop.
   * @returns {Promise<{filename: string, files: Array}|null>} What was written, or null
   */
  async exportStems() {
    return this.run(
      async (events) => {
        const lanes = [...STEM_NAMES.map((name, track) => ({ name, track }))];
        for (const { laneKey } of this.takeEngines) lanes.push({ name: laneKey, track: laneKey });

        const files = [];
        for (const lane of lanes) {
          const laneEvents = events.filter((e) => e.track === lane.track);
          if (laneEvents.length === 0) continue;
          files.push({
            name: this.makeFilename(lane.name, "wav"),
            label: lane.name.replace("hihat-", ""),
            mime: "audio/wav",
            bytes: await this.renderWav(laneEvents),
          });
        }

        const filename = this.makeFilename("stems", "zip", true);
        downloadBytes(encodeZip(files), filename, "application/zip");
        Toast.show(`Stems bounced — ${files.length} WAVs in one zip`, "success");
        return { filename, files };
      },
      { everyRow: true },
    );
  }

  /**
   * The loop as sound and as hits, for CLIP to make its video from.
   * @returns {Promise<{channels: Float32Array[], sampleRate: number, events: Array, barSeconds: number, bars: number, bpm: number}|null>}
   */
  async bounceLoop({ quiet = false } = {}) {
    return this.run(
      async (events) => ({
        channels: await this.renderChannels(events),
        sampleRate: SAMPLE_RATE,
        events,
        barSeconds: this.getStepDuration() * NUM_STEPS,
        bars: BARS,
        bpm: this.store.getState().transport.bpm,
      }),
      { quiet },
    );
  }

  /**
   * Shared guard rails around a bounce: one at a time, samples loaded, something to play.
   * @param {Function} bounce - Given the events to render
   * @param {Object} [options]
   * @param {boolean} [options.quiet] - Say nothing where there is nothing to bounce
   * @param {boolean} [options.everyRow] - Muted and unsoloed rows too: stems are packed for
   *   later work. Otherwise what is bounced is what is heard (ADR-0053)
   */
  async run(bounce, { quiet = false, everyRow = false } = {}) {
    if (this.isRendering) return null;
    this.isRendering = true;
    try {
      await this.audioEngine.loadSamples();
      const state = this.store.getState();
      const events = this.collectEvents().filter((e) => everyRow || isHeard(state, e.track));
      if (events.length === 0) {
        // Nobody asked for a bounce made out of sight: it has nothing to say
        if (!quiet) Toast.show("Add some hits to the pattern first", "warning");
        return null;
      }
      return await bounce(events);
    } catch (error) {
      console.error("Audio bounce failed:", error);
      Toast.show("Couldn't bounce the audio", "error");
      return null;
    } finally {
      this.isRendering = false;
    }
  }

  /**
   * Every event for the lead-in bar, the bars that are kept, and one bar
   * after (its early hits can land inside the kept part). Times are seconds
   * from the start of the lead-in bar.
   * Every row's, heard or not: run() leaves out what a bounce should not have.
   */
  collectEvents() {
    const stepDuration = this.getStepDuration();
    const events = [];

    for (let absStep = 0; absStep < (BARS + 2) * NUM_STEPS; absStep++) {
      const baseTime = absStep * stepDuration;
      // The lead-in bar is the last of a round, as it is the take's, so a switch-up's turn leads in
      const bar = Math.floor(absStep / NUM_STEPS) + BARS - 1;
      for (const event of this.grooveController.getStepEvents(absStep % NUM_STEPS, baseTime, bar)) {
        if (event.track >= 0 && event.track < NUM_TRACKS) events.push(event);
      }
      for (const engine of this.takeEngines) {
        events.push(...engine.getStepEvents(absStep + (BARS - 1) * NUM_STEPS, baseTime, true));
      }
    }
    return events;
  }

  /**
   * Render events offline and return the kept bars as WAV bytes.
   * @param {Array} events - From collectEvents (optionally filtered to one lane)
   * @returns {Promise<Uint8Array>}
   */
  async renderWav(events) {
    const bpm = this.store.getState().transport.bpm;
    return encodeWav(await this.renderChannels(events), SAMPLE_RATE, { bpm, beats: BARS * 4 });
  }

  /**
   * Render events offline and return the kept bars, a channel each.
   * @param {Array} events
   * @returns {Promise<Float32Array[]>}
   */
  async renderChannels(events) {
    const barSeconds = this.getStepDuration() * NUM_STEPS;
    const leadFrames = Math.round(barSeconds * SAMPLE_RATE);
    const keptFrames = Math.round(barSeconds * BARS * SAMPLE_RATE);
    const ctx = new OfflineAudioContext(2, leadFrames + keptFrames, SAMPLE_RATE);
    const target = { ctx, dest: ctx.destination };
    const endTime = (leadFrames + keptFrames) / SAMPLE_RATE;

    for (const event of events) {
      if (event.time >= endTime) continue;
      const takeEngine = this.takeEngines.find((engine) => engine.laneKey === event.track);
      if (takeEngine) takeEngine.playEvent(event, target);
      else this.audioEngine.scheduleNote(event.time, event.pitch, event.velocity, 0, target);
    }

    const rendered = await ctx.startRendering();
    const channels = [0, 1].map((c) => rendered.getChannelData(c).subarray(leadFrames));

    // Only ever turn a hot bounce down; quiet ones are left as played
    let peak = 0;
    for (const channel of channels) {
      for (let i = 0; i < channel.length; i++) peak = Math.max(peak, Math.abs(channel[i]));
    }
    if (peak > PEAK_CEILING) {
      const gain = PEAK_CEILING / peak;
      for (const channel of channels) {
        for (let i = 0; i < channel.length; i++) channel[i] *= gain;
      }
    }
    return channels;
  }

  getStepDuration() {
    return 60 / this.store.getState().transport.bpm / 4;
  }

  /**
   * @param {string} part - What is in the file: "mix", "kick", "stems"...
   * @param {string} extension
   * @param {boolean} [stamped] - Add the time, for files that land in Downloads
   */
  makeFilename(part, extension, stamped = false) {
    const state = this.store.getState();
    const bpm = state.transport.bpm;
    const mode = state.grooveSettings?.hihatMode || "friction";
    const stamp = stamped ? `-${mode}-${Date.now()}` : "";
    return `knockbox-${part}-${bpm}bpm-${BARS}bars${stamp}.${extension}`;
  }
}
