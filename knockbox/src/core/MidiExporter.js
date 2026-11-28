/**
 * MidiExporter
 *
 * Renders the current 16-step loop into a Standard MIDI File (SMF Type 1)
 * with all humanization baked in: per-hit microtiming offsets, per-hit
 * velocity, and AI-generated ghost notes.
 *
 * Layout: one MTrk per drum (kick / snare / closed HH / open HH), each
 * with its own TrackName meta-event. This is the MPC/Dilla-style
 * one-sound-per-track workflow — drag the .mid into a DAW and the
 * producer gets four named MIDI tracks ready for individual samplers.
 *
 * For drum-rack/Battery producers, dropping the file onto an existing
 * drum-rack track merges the four sub-tracks through GM pitches (36/38/42/46),
 * which match the General MIDI drum map.
 *
 * Vanilla SMF encoder — no external dependencies.
 */

import { Toast } from "../components/Toast.js";
import { NUM_STEPS, NUM_TRACKS } from "../constants/drums.js";
import { downloadBytes } from "./FileUtils.js";
import { barsRound } from "./Hand.js";

const PPQN = 480; // Ticks per quarter note — standard, fine resolution for microtiming
const DRUM_CHANNEL = 9; // GM drum channel (channel 10 in MIDI spec, 0-indexed in protocol)
const NOTE_DURATION_SEC = 0.05; // Drums are transients; 50ms is plenty

const TRACK_NAMES = ["KICK", "SNARE", "HI-HAT (CLOSED)", "HI-HAT (OPEN)"];

export class MidiExporter {
  constructor(store, audioEngine, grooveController) {
    this.store = store;
    this.audioEngine = audioEngine;
    this.grooveController = grooveController;
  }

  /**
   * The loop as a MIDI file, without saving it anywhere.
   * @returns {{filename: string, bytes: Uint8Array, mime: string}|null} Null for an empty pattern
   */
  build() {
    const eventsByTrack = this.buildEvents();
    const totalNotes = eventsByTrack.reduce((sum, t) => sum + t.length, 0);
    if (totalNotes === 0) return null;
    const bpm = this.store.getState().transport.bpm;
    return {
      filename: this.makeFilename(),
      bytes: this.serialize(eventsByTrack, bpm),
      mime: "audio/midi",
    };
  }

  /** @returns {{filename: string, bytes: Uint8Array, mime: string}|null} What was downloaded */
  export() {
    const file = this.build();
    if (!file) {
      Toast.show("Add some hits to the pattern first", "warning");
      return null;
    }
    this.download(file.bytes, file.filename);
    Toast.show("MIDI downloaded — 4 tracks (kick/snare/hats)", "success");
    return file;
  }

  /**
   * Returns an array of 4 event arrays, one per drum track.
   * Each event: { pitch, tickStart, tickEnd, velocity }.
   * Asks GrooveController.getStepEvents for each step — the same call live
   * playback makes — so the file carries every flam, roll and ghost note.
   */
  buildEvents() {
    const bpm = this.store.getState().transport.bpm;
    const stepDuration = 60 / bpm / 4;
    const eventsByTrack = Array.from({ length: NUM_TRACKS }, () => []);

    // One bar, or with the switch-up on as many as the drums take to come round (ADR-0078)
    const bars = barsRound(this.store.getState());
    for (let step = 0; step < bars * NUM_STEPS; step++) {
      const at = [step % NUM_STEPS, step * stepDuration, Math.floor(step / NUM_STEPS)];
      for (const event of this.grooveController.getStepEvents(...at)) {
        if (event.track < 0 || event.track >= NUM_TRACKS) continue;

        const safeTime = Math.max(0, event.time);
        eventsByTrack[event.track].push({
          pitch: event.pitch,
          tickStart: this.secondsToTicks(safeTime, bpm),
          tickEnd: this.secondsToTicks(safeTime + NOTE_DURATION_SEC, bpm),
          velocity: clampVelocity(event.velocity),
        });
      }
    }

    for (const trackEvents of eventsByTrack) {
      trackEvents.sort((a, b) => a.tickStart - b.tickStart);
    }
    return eventsByTrack;
  }

  secondsToTicks(seconds, bpm) {
    return Math.round(((seconds * bpm) / 60) * PPQN);
  }

  /**
   * Encode as SMF Type 1: MThd + N × MTrk. Tempo meta lives on the first
   * track (track 0 = KICK) so DAWs that read it from any track still see it.
   */
  serialize(eventsByTrack, bpm, trackNames = TRACK_NAMES) {
    const trackChunks = eventsByTrack.map((trackEvents, idx) =>
      this.buildTrackChunk(trackEvents, trackNames[idx], idx === 0 ? bpm : null),
    );

    const totalSize =
      14 + // MThd
      trackChunks.reduce((sum, c) => sum + 8 + c.length, 0);
    const out = new Uint8Array(totalSize);
    let p = 0;

    // MThd
    out.set([0x4d, 0x54, 0x68, 0x64], p);
    p += 4;
    out.set([0x00, 0x00, 0x00, 0x06], p);
    p += 4;
    out.set([0x00, 0x01], p);
    p += 2; // format 1
    out.set([(trackChunks.length >> 8) & 0xff, trackChunks.length & 0xff], p);
    p += 2;
    out.set([(PPQN >> 8) & 0xff, PPQN & 0xff], p);
    p += 2;

    // MTrk chunks
    for (const chunk of trackChunks) {
      out.set([0x4d, 0x54, 0x72, 0x6b], p);
      p += 4;
      const len = chunk.length;
      out.set([(len >> 24) & 0xff, (len >> 16) & 0xff, (len >> 8) & 0xff, len & 0xff], p);
      p += 4;
      out.set(chunk, p);
      p += len;
    }

    return out;
  }

  /**
   * Build the byte payload for a single MTrk chunk.
   * Includes a TrackName meta at tick 0, optional tempo meta at tick 0,
   * then all the note events with VLQ delta-time, then End-of-Track.
   */
  buildTrackChunk(trackEvents, trackName, bpmForTempoMeta) {
    const bytes = [];

    // TrackName meta @ tick 0
    pushVLQ(bytes, 0);
    bytes.push(0xff, 0x03);
    pushVLQ(bytes, trackName.length);
    for (let i = 0; i < trackName.length; i++) bytes.push(trackName.charCodeAt(i) & 0x7f);

    // Tempo meta @ tick 0 (only on the first track)
    if (bpmForTempoMeta != null) {
      pushVLQ(bytes, 0);
      const usecPerQuarter = Math.round(60_000_000 / bpmForTempoMeta);
      bytes.push(0xff, 0x51, 0x03);
      bytes.push((usecPerQuarter >> 16) & 0xff);
      bytes.push((usecPerQuarter >> 8) & 0xff);
      bytes.push(usecPerQuarter & 0xff);
    }

    // Note On/Off pairs as a single sorted message stream
    const messages = [];
    for (const e of trackEvents) {
      messages.push({ tick: e.tickStart, kind: "on", pitch: e.pitch, velocity: e.velocity });
      messages.push({ tick: e.tickEnd, kind: "off", pitch: e.pitch });
    }
    // Off-events at the same tick come first — prevents same-pitch retrigger collisions
    messages.sort((a, b) => a.tick - b.tick || (a.kind === "off" ? -1 : 1));

    let lastTick = 0;
    for (const m of messages) {
      pushVLQ(bytes, m.tick - lastTick);
      lastTick = m.tick;
      if (m.kind === "on") {
        bytes.push(0x90 | DRUM_CHANNEL, m.pitch & 0x7f, m.velocity & 0x7f);
      } else {
        bytes.push(0x80 | DRUM_CHANNEL, m.pitch & 0x7f, 0);
      }
    }

    // End-of-Track meta
    pushVLQ(bytes, 0);
    bytes.push(0xff, 0x2f, 0x00);

    return Uint8Array.from(bytes);
  }

  download(bytes, filename) {
    downloadBytes(bytes, filename, "audio/midi");
  }

  makeFilename() {
    const state = this.store.getState();
    const bpm = state.transport.bpm;
    const mode = state.grooveSettings?.hihatMode || "friction";
    return `knockbox-${bpm}bpm-${mode}-${Date.now()}.mid`;
  }
}

function clampVelocity(v) {
  if (!Number.isFinite(v)) return 100;
  return Math.max(1, Math.min(127, Math.round(v)));
}

function pushVLQ(arr, value) {
  let v = value < 0 ? 0 : value;
  const out = [v & 0x7f];
  v >>= 7;
  while (v > 0) {
    out.unshift((v & 0x7f) | 0x80);
    v >>= 7;
  }
  for (const b of out) arr.push(b);
}
