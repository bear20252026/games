/**
 * Player
 * What the phone's player, a tape deck, says about the beat it is playing
 * (ADR-0012, ADR-0032).
 * No DOM.
 */

import { NUM_TRACKS } from "../constants/drums.js";

// Steps in a bar of the pattern
const STEPS = 16;

/**
 * The pattern as rows of pads: one row per drum, true where a step is on.
 * @param {Object<string, {active: boolean}>} steps - The store's steps, keyed track-<row>_<step>
 * @returns {boolean[][]}
 */
export function playerRows(steps) {
  return Array.from({ length: NUM_TRACKS }, (_, track) =>
    Array.from({ length: STEPS }, (_, step) => Boolean(steps[`track-${track}_${step}`]?.active)),
  );
}

/**
 * Which drums are hit on each step: what the deck's lamps and needles follow.
 * @param {boolean[][]} rows - From playerRows
 * @returns {number[][]} For each of the sixteen steps, the drums that sound on it
 */
export function playerHits(rows) {
  return Array.from({ length: STEPS }, (_, step) =>
    rows.flatMap((row, track) => (row[step] ? [track] : [])),
  );
}

/** What is printed on the tape's label beside its title */
export function playerLabel({ bpm, feel }) {
  return `${bpm} BPM · ${String(feel || "friction").toUpperCase()}`;
}

/** The deck's counter: beats since PLAY went down, on three wheels */
export function playerCount(beats) {
  return String(Math.max(0, beats) % 1000).padStart(3, "0");
}

/** How many sent flips a beat has, as the card words it; nothing when there are none */
export function flipsLine(flips) {
  if (!flips) return "";
  return flips === 1 ? "1 flip" : `${flips} flips`;
}

/**
 * Where a looping bounce has got to, for the lamps and the counter.
 * @param {number} heard - Seconds of it heard so far
 * @param {number} barSeconds
 * @returns {{step: number, beats: number}} The step sounding (0-15), and the beats begun since it started
 */
export function tapePosition(heard, barSeconds) {
  if (!(heard >= 0) || !(barSeconds > 0)) return { step: -1, beats: 0 };
  return {
    step: Math.floor((heard % barSeconds) / (barSeconds / 16)) % 16,
    beats: Math.floor(heard / (barSeconds / 4)) + 1,
  };
}
