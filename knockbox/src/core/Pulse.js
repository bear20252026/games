/**
 * Pulse
 * What the day's beats have been like, across every desk: how many, and the
 * feel, swing and tempo most of them share (ADR-0031). It names nobody and
 * lists no beat. No DOM: the Worker uses this too.
 */

import { tempoBand } from "./Crate.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Fewer beats than this and the day says nothing; the week speaks for it, or nobody does
export const PULSE_FLOOR = 5;

/** The value most of them have; the first seen wins a tie */
function most(values) {
  const counts = new Map();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0][0];
}

/**
 * @param {Array<{at: number, bpm: number, feel: string, drunk: boolean}>} beats - The week's beats
 * @param {number} now
 * @returns {{count: number, span: "today"|"week", sound: string[]}|null} null in a quiet week
 */
export function pulseOf(beats, now) {
  const week = beats.filter((beat) => beat.at >= now - 7 * DAY_MS);
  const today = week.filter((beat) => beat.at >= now - DAY_MS);
  const [span, counted] = today.length >= PULSE_FLOOR ? ["today", today] : ["week", week];
  if (counted.length < PULSE_FLOOR) return null;
  const swing = most(counted.map((beat) => (beat.drunk ? "DRUNK" : "STRAIGHT")));
  const band = most(counted.map((beat) => tempoBand(beat.bpm)));
  return {
    count: counted.length,
    span,
    sound: [most(counted.map((beat) => beat.feel)), swing, `${band} BPM`],
  };
}

const PACE = { "UNDER 80 BPM": "slow", "80–95 BPM": "laid-back", "OVER 95 BPM": "quick" };

/** The pulse in a beatmaker's words: "23 beats today. Mostly laid-back and drunk." */
export function pulseLine({ count, span, sound }) {
  const [, swing, band] = sound;
  const when = span === "today" ? "today" : "this week";
  return `${count} beats ${when}. Mostly ${PACE[band]} and ${swing.toLowerCase()}.`;
}
