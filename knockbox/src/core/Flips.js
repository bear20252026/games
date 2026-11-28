/**
 * Flips
 * The desk's side of flipping someone's beat (ADR-0008): what a flip keeps
 * and what it leaves behind, what it is called, and how the chain of where
 * a beat came from is worded. No DOM.
 */

import { builtInTakes } from "./Records.js";

const TITLE_LENGTH = 40;
const MARK = " (my flip)";

/**
 * What a flip of a beat is called until it is renamed.
 * @param {string} title - The beat being flipped
 */
export function flipTitle(title) {
  // Flipped again, it is still only "my flip"
  const plain = title.endsWith(MARK) ? title.slice(0, -MARK.length) : title;
  return `${plain.slice(0, TITLE_LENGTH - MARK.length).trimEnd()}${MARK}`;
}

/**
 * A snapshot as a flip keeps it: the pattern, the feel and the settings.
 * The loop, the vocal and any drum sounds of the maker's own stay behind,
 * so their lanes arrive empty. A built-in loop is not the maker's own: it is
 * kept, by its name, with its chops (FR-OPEN-15).
 * @param {Object} snapshot - As Project.snapshot() made it
 */
export function flipOf(snapshot) {
  const state = { ...snapshot.state };
  const takes = builtInTakes(snapshot.takes);
  for (const lane of ["smp", "vox"]) {
    if (state[lane] && !takes[lane]) state[lane] = { ...state[lane], slices: [] };
  }
  return { ...snapshot, state, takes, drums: {}, audio: [] };
}

/**
 * The chain of where a beat came from, in words.
 * @param {{id: string|null, by: {name: string}}[]} chain - Oldest first, the beat itself last
 * @param {string} [me] - The name of whoever is at the desk
 * @returns {{name: string, did: string, id: string|null}[]} Empty when the beat is nobody's flip
 */
export function chainWords(chain, me) {
  if (!chain || chain.length < 2) return [];
  return chain.map(({ id, by }, i) => ({
    name: by.name === me ? "you" : by.name,
    did: i === 0 ? "started it" : "flipped it",
    id,
  }));
}
