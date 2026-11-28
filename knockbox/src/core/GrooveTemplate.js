/**
 * GrooveTemplate
 * The feel on its own, with no pattern attached: for each drum voice, where
 * every 16th of the bar sits in the pocket and how hard it is hit. A DAW
 * can lift a groove from a clip like this and lay it over other drums.
 *
 * Only the repeatable part of the feel is here (the push, the drag and the
 * swing); the per-hit jitter is left out, since a template is applied to
 * every bar alike.
 */

import { NUM_STEPS, NUM_TRACKS, TRACK_TO_PITCH } from "../constants/drums.js";
import { getPocketOffset, getPocketVelocity } from "./HumanizeEngine.js";

/**
 * @param {Object} settings
 * @param {number} settings.bpm
 * @param {number} settings.humanize - 0.0 to 1.0
 * @param {string} settings.hihatMode
 * @param {Object} [settings.trackSettings] - For the swing locks
 * @returns {{lead: number, voices: Array<{track: number, pitch: number, swing: number,
 *   notes: Array<{step: number, time: number, offset: number, velocity: number}>}>}}
 *   Times in seconds from the start of the bar. `lead` is how far the whole
 *   kit was moved back so that no pushed hit falls before the bar starts;
 *   it is the same for every voice, so the feel between them is untouched.
 */
export function buildGrooveTemplate(settings) {
  const { bpm, humanize, hihatMode, trackSettings } = settings;
  const stepDuration = 60 / bpm / 4;

  const voices = [];
  for (let track = 0; track < NUM_TRACKS; track++) {
    const pitch = TRACK_TO_PITCH[track];
    const locked = trackSettings?.[track]?.swingLocked ?? false;
    const notes = [];
    for (let step = 0; step < NUM_STEPS; step++) {
      notes.push({
        step,
        offset: getPocketOffset(pitch, step, humanize, bpm, hihatMode, locked),
        velocity: getPocketVelocity(pitch, step, humanize),
      });
    }
    voices.push({ track, pitch, notes, swing: swingPercent(notes, stepDuration) });
  }

  const earliest = Math.min(...voices.flatMap((voice) => voice.notes.map((note) => note.offset)));
  const lead = Math.max(0, -earliest);
  for (const voice of voices) {
    for (const note of voice.notes) note.time = note.step * stepDuration + note.offset + lead;
  }
  return { lead, voices };
}

/**
 * The nearest thing a plain swing knob can say about a voice: where the
 * off-beat 16th sits between two on-beats (50 is straight, 66 is a triplet).
 * A drag or a push that moves every hit alike doesn't show up in it.
 */
function swingPercent(notes, stepDuration) {
  const lean = notes[1].offset - notes[0].offset;
  return Math.round((50 + (lean / (2 * stepDuration)) * 100) * 10) / 10;
}
