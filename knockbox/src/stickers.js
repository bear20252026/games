/**
 * Stickers
 * The drawn stickers listeners put on a beat (ADR-0046), as things on the
 * page: one sticker, with how many people put it on. Where they lie, and
 * what pressing one does, is the room's, the crate's or the page's to say.
 * Beside the components, not among them: a person's page draws them too.
 */

import { STICKERS, stickerArt, stickerCount } from "./core/Stickers.js";

/**
 * One sticker: its drawing and its words.
 * @param {string} kind
 * @param {Object} [options]
 * @param {string} [options.tag] - "button" for one that can be pressed
 * @param {number} [options.count] - How many people put it on; nothing is shown for none
 * @param {boolean} [options.mine] - The person looking is one of them
 * @returns {HTMLElement}
 */
export function sticker(kind, { tag = "span", count = 0, mine = false } = {}) {
  const { words } = STICKERS.find((known) => known.kind === kind);
  const node = document.createElement(tag);
  node.className = `stk stk-${kind}${mine ? " is-mine" : ""}`;
  if (tag === "button") node.type = "button";
  const art = document.createElement("img");
  art.src = stickerArt(kind);
  art.alt = "";
  const shout = document.createElement("b");
  shout.append(words[0], document.createElement("br"), words[1]);
  node.append(art, shout);
  if (count > 0) {
    const tally = document.createElement("i");
    tally.textContent = stickerCount(count);
    node.append(tally);
  }
  return node;
}
