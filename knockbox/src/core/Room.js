/**
 * Room
 * What the listening room says about someone else's beat (ADR-0044): the
 * record's label, the tags on its sleeve, its play key and its flips. No DOM.
 */

/** What the room's play key says: at rest, while the beat is fetched, and while it goes round */
export const ROOM_KEY = { "": "▶ Play", readying: "Getting it ready", on: "■ Stop" };

/**
 * Whether a beat is shown in the room and not on the pads.
 * @param {Object|null} visiting - Someone else's beat on the desk, or null
 * @param {boolean} tooSmall - The desk doesn't fit: the tape deck is shown instead
 */
export function inRoom(visiting, tooSmall) {
  return Boolean(visiting) && !tooSmall;
}

/** What is printed round the record's label under its title */
export function roomLabel({ by, bpm }) {
  return `${by.name} · ${Math.round(bpm)}`.toUpperCase();
}

/**
 * The tags on the sleeve. Where the beat has been is said elsewhere in the
 * room (who it was flipped from, the flips made from it), so not here too.
 * @param {string[]} [tags]
 */
export function roomTags(tags = []) {
  return tags.filter((tag) => !/\bFLIPS?$/.test(tag));
}

/** A flip in the room's list, under its title */
export function flipCredit({ bpm, by }) {
  return `${Math.round(bpm)} bpm · ${by.name}`;
}
