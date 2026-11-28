/**
 * Where the maker's hands are (ADR-0071). The drummer watches the desk a part
 * at a time: he speaks of a part that has been left alone while the work goes
 * on elsewhere, and of one the maker keeps going back and forth over. No DOM.
 */

import { rowsOf } from "./Ideas.js";

export const PARTS = ["kick", "snare", "hats", "feel", "sounds", "loop", "voice"];
const ROW_PARTS = ["kick", "snare", "hats", "hats"];

// Changes that go back over the same thing, inside this many bars, before a part is taken as not settled
export const BACK_AND_FORTH = 3;
export const UNSETTLED_BARS = 4;
// Bars a part is left alone after he has spoken of it as not settled, before he may again
export const SETTLED_BARS = 8;

/** The part a drum row belongs to: the two rows of hats are one */
export const partOfRow = (row) => ROW_PARTS[row];

/**
 * The part of the desk an idea would change: the feel where it sets the swing,
 * the hi-hat mode or the switch-up, else the drum its pads are on, else the feel for a ghost
 * dial alone, else the loop or the voice whose row it changes.
 * @param {Object} idea - From ideasFor
 * @returns {string} One of PARTS
 */
export function partOf(idea) {
  const goes = [idea, ...(idea.rounds ?? [])];
  if (goes.some((go) => go.feel || go.switchUp !== undefined)) return "feel";
  const rows = rowsOf(idea);
  // Pads thinned with a ghost dial turned to make up for them is still that drum's
  const pads = goes.flatMap((go) => [...(go.on ?? []), ...(go.off ?? [])]);
  // Other sounds under the pads as they are: the sounds are a part of their own
  if (pads.length === 0 && goes.some((go) => go.sounds)) return "sounds";
  if (pads.length > 0) return partOfRow(Math.min(...rows.filter((row) => typeof row === "number")));
  if (rows.includes("smp")) return "loop";
  if (rows.includes("vox")) return "voice";
  return "feel";
}

/** Whether a change goes back over an earlier one: the same thing again, or a pad moved a step across */
function goesBackOver(change, earlier) {
  if (change.key === earlier.key) return true;
  const moved = change.pad && earlier.pad && change.pad.row === earlier.pad.row;
  return (
    Boolean(moved) &&
    Math.abs(change.pad.step - earlier.pad.step) === 1 &&
    change.way !== earlier.way
  );
}

export class Watch {
  constructor() {
    // When each part was last changed by the maker, and what they changed of late
    this.touched = {};
    this.changes = [];
    // The parts he has spoken of as not settled, until they are left alone
    this.hinted = new Set();
  }

  /**
   * The maker changed something.
   * @param {string} part - One of PARTS
   * @param {string} key - What was changed: a pad, a dial, a switch
   * @param {boolean|number|null} way - A pad lit (true) or put out (false); a dial turned up (1),
   *   down (-1) or dragged (0); null for a key or a switch, where every press is a change
   * @param {number} at - Milliseconds
   * @param {{row: number, step: number}} [pad] - The pad, where it was one
   */
  note(part, key, way, at, pad = null) {
    this.touched[part] = at;
    const last = this.changes.findLast((change) => change.part === part);
    // A dial held and turned one way is one change, however many steps it passes
    if (typeof way === "number" && last?.key === key && (way === 0 || last.way === way)) {
      last.at = at;
      return;
    }
    this.changes.push({ part, key, way, at, pad });
  }

  /** A part changed in a way that is never back and forth: its clock starts over and no more */
  touch(part, at) {
    this.touched[part] = at;
  }

  /** Everything changed at once (the tempo, the pads cleared): every part starts over, and nothing is back and forth */
  noteAll(at) {
    for (const part of PARTS) this.touched[part] = at;
    this.changes = [];
  }

  /** Milliseconds a part has been left alone, from when it was last changed or `since`, whichever was later */
  alone(part, at, since = 0) {
    return at - Math.max(this.touched[part] ?? 0, since);
  }

  /**
   * The part the maker cannot settle, if any: three changes inside four bars
   * that go back over the same thing. Lighting new pads one after another is not it.
   * @param {number} at - Milliseconds
   * @param {number} barMs - A bar, in milliseconds
   * @returns {string|null}
   */
  unsettled(at, barMs) {
    for (const part of this.hinted) {
      if (this.alone(part, at) >= SETTLED_BARS * barMs) this.hinted.delete(part);
    }
    this.changes = this.changes.filter((change) => at - change.at < UNSETTLED_BARS * barMs);
    for (const part of PARTS) {
      if (this.hinted.has(part)) continue;
      const mine = this.changes.filter((change) => change.part === part);
      const back = mine.filter((change, i) =>
        mine.slice(0, i).some((earlier) => goesBackOver(change, earlier)),
      );
      // The first change of a thing goes back over nothing: two more that do make three
      if (back.length >= BACK_AND_FORTH - 1) return part;
    }
    return null;
  }

  /** He has spoken of a part as not settled: not again until it has been left alone */
  spokeOf(part) {
    this.hinted.add(part);
    this.changes = this.changes.filter((change) => change.part !== part);
  }
}
