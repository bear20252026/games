/**
 * Groove Controller
 * What the drums play on each step: the pocket, the hand (ADR-0075) and the
 * ghost notes, worked out on the desk by rule. There is no model (ADR-0076).
 */

import { NUM_TRACKS, PITCH_TO_TRACK, TRACK_TO_PITCH } from "../constants/drums.js";
import { expandArticulation, mainVelocity } from "./Articulations.js";
import { extractTurnNotes } from "./GhostNoteGenerator.js";
import { barOf, Hand } from "./Hand.js";
import { isHeard } from "./Heard.js";
import { getPocketOffset } from "./HumanizeEngine.js";

// Ghost notes keep at least this much of their offset, even at 0% humanize
const MIN_GHOST_OFFSET_RATIO = 0.3;

/**
 * Coordinates groove generation, playback timing, and visual sync.
 *
 * The controller is the bridge between the UI store and the audio engine. It
 * keeps the ghost notes for the pattern on the desk ready for the clock tick.
 */
export class GrooveController {
  /**
   * @param {import("./Store.js").Store} store - Sequencer state store.
   * @param {import("./AudioEngine.js").AudioEngine} audioEngine - Audio playback host.
   */
  constructor(store, audioEngine) {
    this.store = store;
    this.audioEngine = audioEngine;
    this.currentGhostNotes = [];
    // The notes he adds in the bar that turns back to the top (ADR-0078)
    this.currentTurnNotes = [];
    // What a played bar has that a drawn one does not, by rule (ADR-0075)
    this.hand = new Hand();
    this.unsubscribers = [];
    // Pads silenced while a beatbox take is recorded (bounces are unaffected)
    this.suspended = false;
  }

  /** Follow the desk: the ghost notes are worked out again whenever what they depend on changes */
  init() {
    this.setupSubscriptions();
    this.refreshGhostNotes();
  }

  /**
   * Set up store subscriptions for groove-related state changes
   */
  setupSubscriptions() {
    // Track previous values for change detection
    let lastSteps = this.store.getState().steps;
    let lastHumanize = this.store.getState().humanizeValue;
    let lastBpm = this.store.getState().transport.bpm;
    let lastTrackSettings = this.store.getState().trackSettings;
    let lastGrooveSettings = this.store.getState().grooveSettings;

    const unsubscribe = this.store.subscribe((newState) => {
      const stepsChanged = newState.steps !== lastSteps;
      const humanizeChanged = newState.humanizeValue !== lastHumanize;
      const bpmChanged = newState.transport.bpm !== lastBpm;
      // Swing locks and the hi-hat mode both move the ghost notes
      const trackSettingsChanged =
        newState.trackSettings !== lastTrackSettings ||
        newState.grooveSettings !== lastGrooveSettings;

      // The ghost notes go by the pattern, the swing dial, the tempo, the ghost dials,
      // the locks and the hi-hat mode
      if (stepsChanged || humanizeChanged || bpmChanged || trackSettingsChanged) {
        this.refreshGhostNotes();
      }

      // Update trackers
      lastSteps = newState.steps;
      lastHumanize = newState.humanizeValue;
      lastBpm = newState.transport.bpm;
      lastTrackSettings = newState.trackSettings;
      lastGrooveSettings = newState.grooveSettings;
    });

    this.unsubscribers.push(unsubscribe);
  }

  /** Work the ghost notes out again for the desk as it stands */
  refreshGhostNotes() {
    const state = this.store.getState();
    // The hand plays a hit by what is around it on the pads
    this.hand.see(state.steps);
    const humanizeAmount = state.humanizeValue / 100;
    const hihatMode = state.grooveSettings?.hihatMode || "friction";

    // How far each ghost sits from its step is fixed here, at the tempo it
    // was worked out for, so a tempo change can't throw it across the bar
    const stepDuration = 60 / state.transport.bpm / 4;
    this.currentGhostNotes = this.audioEngine
      .extractGhostNotes(
        state.steps,
        state.transport.bpm,
        humanizeAmount,
        state.trackSettings,
        hihatMode,
      )
      .map((ghost) => ({ ...ghost, offset: ghost.startTime - ghost.step * stepDuration }));
    // His notes at the turn go by the pads and the dials alone, so they are the same until
    // the maker changes one of those (ADR-0079)
    this.currentTurnNotes = state.grooveSettings?.switchUp
      ? extractTurnNotes(state.steps, state.transport.bpm, humanizeAmount, state.trackSettings).map(
          (note) => ({ ...note, offset: note.startTime - note.step * stepDuration }),
        )
      : [];
  }

  /**
   * The pads his turn notes fall on in a bar, to be shown while it plays: none in a bar
   * that does not turn (ADR-0079).
   * @param {number} bar - Bars since the beat was started
   * @returns {string[]} Pad ids
   */
  turnPads(bar) {
    if (!barOf(this.store.getState(), bar).turns) return [];
    return this.currentTurnNotes.map((note) => `track-${note.track}_${note.step}`);
  }

  /**
   * Get current ghost notes
   * @returns {Array}
   */
  getGhostNotes() {
    return this.currentGhostNotes;
  }

  /**
   * Map MIDI pitch back to track index
   * @param {number} pitch - MIDI pitch value
   * @returns {number} Track index (0-3) or -1 if not found
   */
  getTrackFromPitch(pitch) {
    return PITCH_TO_TRACK[pitch] ?? -1;
  }

  /**
   * Schedule visual sync event for snare hits
   * @param {number} snareTime - AudioContext time when snare plays
   */
  scheduleSnareVisual(snareTime) {
    const now = this.audioEngine.audioContext.currentTime;
    const VISUAL_LATENCY_COMPENSATION = 50; // Fire visual 50ms early to account for render lag
    const delayMs = (snareTime - now) * 1000 - VISUAL_LATENCY_COMPENSATION;

    if (delayMs > 0) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("snare-hit"));
      }, delayMs);
    } else {
      // Fire immediately if delay is too short
      window.dispatchEvent(new CustomEvent("snare-hit"));
    }
  }

  /**
   * Schedule visual sync event for ghost snare hits
   * Uses same latency compensation as main snare, but dispatches a different event
   * for subtle head bob animation
   * @param {number} snareTime - AudioContext time when ghost snare plays
   */
  scheduleGhostSnareVisual(snareTime) {
    const now = this.audioEngine.audioContext.currentTime;
    const VISUAL_LATENCY_COMPENSATION = 50;
    const delayMs = (snareTime - now) * 1000 - VISUAL_LATENCY_COMPENSATION;

    if (delayMs > 0) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("ghost-snare-hit"));
      }, delayMs);
    } else {
      window.dispatchEvent(new CustomEvent("ghost-snare-hit"));
    }
  }

  /**
   * Everything the drums play on one step: main hits, their articulations
   * (flams, drags, rolls) and ghost notes. Live playback, MIDI export and
   * audio bounce all ask this one method, so they can't drift apart.
   * @param {number} step - Sequencer step (0-15)
   * @param {number} baseTime - Straight-grid time of that step (AudioContext
   *   time when playing, loop-relative seconds when exporting)
   * @param {number} [bar] - Bars since the beat was started: with the switch-up on, every
   *   second bar is played differently and the last of a round has the turn (ADR-0078)
   * @returns {Array<{track: number, pitch: number, time: number, velocity: number, kind: string}>}
   */
  getStepEvents(step, baseTime, bar = 0) {
    const state = this.store.getState();
    const { switched, turns } = barOf(state, bar);
    this.hand.switched = switched;
    const humanizeAmount = state.humanizeValue / 100;
    const bpm = state.transport.bpm;
    const trackSettings = state.trackSettings;
    const hihatMode = state.grooveSettings?.hihatMode || "friction";
    const stepDuration = 60 / bpm / 4;
    const events = [];
    // Hats on the eighths with nothing between them, drawn or ghosted, keep two clear levels
    const eighths =
      !(trackSettings?.[2]?.ghostQuantity > 0) &&
      ![1, 3, 5, 7, 9, 11, 13, 15].some((odd) => state.steps[`track-2_${odd}`]?.active);

    // 1. Main pattern notes (kick, snare, hihats) and their articulations
    for (let track = 0; track < NUM_TRACKS; track++) {
      const cell = state.steps[`track-${track}_${step}`];
      if (!cell?.active) continue;

      const pitch = TRACK_TO_PITCH[track];
      const { time, velocity } = this.audioEngine.getHumanizedNote(
        track,
        step,
        baseTime,
        humanizeAmount,
        TRACK_TO_PITCH,
        bpm,
        trackSettings,
        hihatMode,
        eighths,
        this.hand,
      );
      events.push({ track, pitch, time, velocity: mainVelocity(cell.art, velocity), kind: "main" });

      if (cell.art) {
        const swingLocked = trackSettings?.[track]?.swingLocked ?? false;
        const pocketAt = (stepsAhead) =>
          getPocketOffset(pitch, step + stepsAhead, humanizeAmount, bpm, hihatMode, swingLocked);
        const hit = { time, velocity, baseTime, stepDuration, humanizeAmount };
        for (const extra of expandArticulation(cell.art, hit, pocketAt)) {
          events.push({ track, pitch, ...extra, kind: "art" });
        }
      }
    }

    // 2. Ghost notes for this step
    // Ghost notes always have minimum 30% offset to preserve syncopation character
    // If track is swing-locked, use minimum offset only (not scaled by humanize dial)
    // In the bar that turns, his turn note takes the place of a ghost on the same drum and step
    const turned = new Set(this.currentTurnNotes.map((note) => `${note.pitch}_${note.step}`));
    const ghosts = turns
      ? [
          ...this.currentGhostNotes.filter((ghost) => !turned.has(`${ghost.pitch}_${ghost.step}`)),
          ...this.currentTurnNotes,
        ]
      : this.currentGhostNotes;
    for (const ghost of ghosts) {
      if (ghost.step !== step) continue;

      const track = this.getTrackFromPitch(ghost.pitch);
      const isSwingLocked = trackSettings?.[track]?.swingLocked ?? false;
      const effectiveOffsetRatio = isSwingLocked
        ? MIN_GHOST_OFFSET_RATIO
        : Math.max(MIN_GHOST_OFFSET_RATIO, humanizeAmount);

      events.push({
        track,
        pitch: ghost.pitch,
        time: baseTime + ghost.offset * effectiveOffsetRatio,
        velocity: ghost.velocity,
        kind: "ghost",
      });
    }

    return events;
  }

  /**
   * Handle a clock tick - plays notes for the current step
   * @param {number} currentStep - Current sequencer step (0-15)
   * @param {number} nextNoteTime - AudioContext time for the next note
   * @param {number} [totalSteps] - Steps since PLAY, as the takes count them
   */
  handleTick(currentStep, nextNoteTime, totalSteps = currentStep) {
    if (this.suspended) return;
    const SNARE_PITCH = TRACK_TO_PITCH[1];

    const state = this.store.getState();
    const bar = Math.floor(totalSteps / 16);
    for (const event of this.getStepEvents(currentStep, nextNoteTime, bar)) {
      // A muted row, or one left out by a solo, keeps its notes and is not sounded (ADR-0053)
      if (!isHeard(state, event.track)) continue;
      this.audioEngine.scheduleNote(event.time, event.pitch, event.velocity);

      // Visual sync: full head-nod on main snares, subtle bob on ghost snares
      if (event.pitch !== SNARE_PITCH) continue;
      if (event.kind === "main") this.scheduleSnareVisual(event.time);
      else if (event.kind === "ghost") this.scheduleGhostSnareVisual(event.time);
    }
  }

  /**
   * Cleanup - unsubscribe from store and terminate worker
   */
  destroy() {
    this.unsubscribers.forEach((unsub) => {
      unsub();
    });
    if (this.worker) {
      this.worker.terminate();
    }
  }
}
