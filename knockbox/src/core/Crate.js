/**
 * Crate
 * What is in the disk file of beats from other desks, and how the open
 * crate is narrowed (ADR-0021, ADR-0031). No DOM.
 */

import { STICKER_KINDS } from "./Stickers.js";

/** What the label on the shut disk file says is inside */
export function crateCount(beats) {
  return beats.length === 1 ? "1 beat" : `${beats.length} beats`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** The tempo bands beats are sorted into, slowest first */
export const TEMPO_BANDS = [
  ["UNDER 80", (bpm) => bpm < 80],
  ["80–95", (bpm) => bpm >= 80 && bpm <= 95],
  ["OVER 95", (bpm) => bpm > 95],
];

/** Which band a tempo falls in */
export function tempoBand(bpm) {
  return TEMPO_BANDS.find(([, holds]) => holds(bpm))[0];
}

/**
 * What the open crate can be narrowed by, a group to a row of keys; the
 * first of each lets everything through. All of it is read from what a beat
 * already carries: when it was sent, its tempo and its tags (ADR-0031), and
 * the stickers its listeners put on it (ADR-0046).
 */
export const CRATE_FILTERS = {
  when: [
    ["ALL", () => true],
    ["TODAY", (beat, now) => beat.sentAt >= now - DAY_MS],
    ["THIS WEEK", (beat, now) => beat.sentAt >= now - 7 * DAY_MS],
  ],
  feel: [
    ["ALL", () => true],
    ...["FRICTION", "LIMP", "LIVE"].map((feel) => [feel, (beat) => beat.tags.includes(feel)]),
  ],
  tempo: [
    ["ALL", () => true],
    ...TEMPO_BANDS.map(([name, holds]) => [name, (beat) => holds(beat.bpm)]),
  ],
  has: [
    ["ANY", () => true],
    ["DRUNK", (beat) => beat.tags.some((tag) => tag.startsWith("DRUNK"))],
    ["A LOOP", (beat) => beat.tags.includes("LOOP")],
    ["A VOCAL", (beat) => beat.tags.includes("VOCAL")],
  ],
  stickers: [
    ["ANY", () => true],
    ...STICKER_KINDS.map((kind) => [kind.toUpperCase(), (beat) => beat.stickers?.counts[kind] > 0]),
  ],
};

/** Nothing narrowed: the first key of every group */
export function crateUnfiltered() {
  return Object.fromEntries(Object.keys(CRATE_FILTERS).map((group) => [group, 0]));
}

/**
 * The beats the pressed keys let through, in the order the server gave.
 * @param {Object[]} beats
 * @param {Object<string, number>} picked - Which key of each group is down
 * @param {number} now
 */
export function crateShown(beats, picked, now) {
  return beats.filter((beat) =>
    Object.entries(CRATE_FILTERS).every(([group, keys]) => keys[picked[group] ?? 0][1](beat, now)),
  );
}

/**
 * A beat's pattern as its sleeve prints it: a row for each drum, "1" where a step is on.
 * @param {Object<string, {active: boolean}>} [steps] - The store's steps, keyed track-<row>_<step>
 * @returns {string[]}
 */
export function cratePattern(steps = {}) {
  return Array.from({ length: 4 }, (_, track) =>
    Array.from({ length: 16 }, (_, step) =>
      steps[`track-${track}_${step}`]?.active ? "1" : "0",
    ).join(""),
  );
}

/** How often an open crate looks for what has changed on other desks */
export const CRATE_LOOK_MS = 60_000;

/** How long a sleeve is out before its beat is made ready to play: not every one flicked past */
export const CRATE_WARM_MS = 500;

/**
 * The sleeve that is out once the crate has been read again. A beat its maker took
 * back is just not there any more: the one that was beside it comes out in its place.
 * @param {Object[]} before - The crate as it was
 * @param {Object[]} after - The crate as it is
 * @param {string|null} picked - The beat whose sleeve was out
 * @returns {string|null} Null when the crate was shut, or is empty
 */
export function pickedAfter(before, after, picked) {
  if (!picked || after.some((beat) => beat.id === picked)) return picked;
  const at = before.findIndex((beat) => beat.id === picked);
  return (after[at] ?? after[at - 1] ?? after[0])?.id ?? null;
}

/**
 * Whether two readings of the crate are the same beats in the same state.
 * @param {Object[]} a
 * @param {Object[]} b
 */
export function sameCrate(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * A list of sleeves with one beat's stickers as they now are.
 * @param {Object[]} beats
 * @param {string} id
 * @param {{offered: string[], counts: Object, mine: string[]}} stickers
 */
export function stickered(beats, id, stickers) {
  return beats.map((beat) => (beat.id === id ? { ...beat, stickers } : beat));
}

/**
 * A person's pile once a sticker of theirs has gone on a beat or come off it
 * (FR-STICK-04). A first sticker puts the beat on top; the last one taken back
 * takes the beat out, unless the pile is what they are looking through: there
 * it stays until the crate is read again, so a slip can be put right.
 * @param {Object[]} pile
 * @param {Object} beat - The sleeve, with its stickers as they now are
 * @param {boolean} looking - The pile is what the open crate is showing
 * @returns {Object[]}
 */
export function pileAfter(pile, beat, looking) {
  const there = pile.some((kept) => kept.id === beat.id);
  if (beat.stickers.mine.length === 0 && !looking)
    return pile.filter((kept) => kept.id !== beat.id);
  if (there) return stickered(pile, beat.id, beat.stickers);
  return beat.stickers.mine.length ? [beat, ...pile] : pile;
}

/** What the tab for a person's pile says is in it */
export function pileCount(pile) {
  return `${pile.length} kept`;
}
