/**
 * BeatTag
 * The strips of tape that say where the beat on the desk came from. A flip: its chain, who started it and who flipped it since, each
 * name a way to that version. A beat that has been flipped: its flips. When
 * a link leads nowhere the tape says so instead (FR-OPEN-06). Someone else's
 * beat is not on the desk at all: it is in the listening room (Room.js).
 */

import { LcdMessage } from "./LcdMessage.js";
import { Toast } from "./Toast.js";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // Names and titles are typed by people: always text, never markup
  if (text !== undefined) node.textContent = text;
  return node;
}

const root = () => document.querySelector("#beat-tag");

/**
 * The sticky note a report is written on; resolves with what was written, or null.
 * @param {Element} [onto] - What it is stuck to
 */
export function askReport(onto = document.querySelector(".stage")) {
  return new Promise((resolve) => {
    const note = el("form", "sticky send-note report-note");
    note.setAttribute("aria-label", "Report this beat");
    const reason = el("textarea", "report-note-line");
    reason.required = true;
    reason.maxLength = 1000;
    reason.rows = 3;
    reason.placeholder = "what's wrong with it?";
    reason.setAttribute("aria-label", "What's wrong with it?");
    const contact = el("input", "report-note-line");
    contact.type = "text";
    contact.maxLength = 200;
    contact.placeholder = "how to reach you (if you like)";
    contact.setAttribute("aria-label", "How to reach you, if you like");
    // Not a login: password managers can leave it be
    contact.setAttribute("data-1p-ignore", "");
    contact.setAttribute("data-lpignore", "true");
    contact.autocomplete = "off";

    const row = el("div", "keep-note-keys");
    const send = el("button", "keep-note-key is-hot", "Report it");
    send.type = "submit";
    const never = el("button", "keep-note-key", "Never mind");
    never.type = "button";
    row.append(send, never);
    note.append(el("span", "", "Report this beat"), reason, contact, row);

    const answer = (value) => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer, true);
      note.remove();
      resolve(value);
    };
    const onKey = (e) => {
      // The desk's own keys stay quiet while something is being written
      e.stopPropagation();
      if (e.key === "Escape") answer(null);
    };
    const onPointer = (e) => {
      if (!note.contains(e.target)) answer(null);
    };
    never.addEventListener("click", () => answer(null));
    note.addEventListener("submit", (e) => {
      e.preventDefault();
      if (reason.value.trim()) answer({ reason: reason.value, contact: contact.value });
    });

    onto.append(note);
    document.addEventListener("keydown", onKey, true);
    setTimeout(() => document.addEventListener("pointerdown", onPointer, true));
    reason.focus({ preventScroll: true });
  });
}

/** A strip of tape with words on it */
function tape(className = "") {
  return el("span", `beat-tag-tape ${className}`.trim());
}

/** Someone's name: a way to that version of the beat when there is one to open */
function nameOf({ name, id }) {
  if (!id) return el("b", "", name);
  const link = el("a", "beat-tag-name", name);
  link.href = `/b/${encodeURIComponent(id)}`;
  return link;
}

export const BeatTag = {
  /**
   * @param {Object} tag
   * @param {{name: string, did: string, id: string|null}[]} tag.chain - Where the beat
   *   came from, as Flips.chainWords() words it; empty when it is nobody's flip
   * @param {number} tag.flips - How many sent flips have been made from it
   * @param {() => Promise<{flips: Object[]}>} tag.listFlips
   */
  show({ chain, flips, listFlips }) {
    const tag = root();
    const rows = [];

    if (chain.length) {
      const came = tape("beat-tag-chain");
      came.append(el("span", "beat-tag-small", "where this beat came from: "));
      chain.forEach((link, i) => {
        if (i) came.append(el("span", "beat-tag-then", " › "));
        came.append(nameOf(link), ` ${link.did}`);
      });
      const second = el("div", "beat-tag-row");
      second.append(came);
      rows.push(second);
    }

    if (flips > 0) {
      const open = el(
        "button",
        "beat-tag-tape beat-tag-flips",
        flips === 1 ? "1 flip" : `${flips} flips`,
      );
      open.type = "button";
      open.setAttribute("aria-expanded", "false");
      const list = el("div", "beat-tag-list");
      list.hidden = true;
      open.addEventListener("click", async () => {
        if (!list.hidden) {
          list.hidden = true;
          open.setAttribute("aria-expanded", "false");
          return;
        }
        try {
          const reply = await listFlips();
          list.replaceChildren(
            ...reply.flips.map((made) => {
              const strip = el("a", "beat-tag-tape beat-tag-made");
              strip.href = `/b/${encodeURIComponent(made.id)}`;
              strip.append(el("b", "", made.title), ` · ${made.bpm} bpm · by ${made.by.name}`);
              return strip;
            }),
          );
          list.hidden = false;
          open.setAttribute("aria-expanded", "true");
        } catch {
          Toast.show("Couldn't fetch the flips. Try again.", "warning");
        }
      });
      const third = el("div", "beat-tag-row beat-tag-stack");
      third.append(open, list);
      rows.push(third);
    }

    tag.replaceChildren(...rows);
    tag.hidden = rows.length === 0;
  },

  /** The link led nowhere: say so, and offer the empty desk */
  gone() {
    const tag = root();
    const tape = el("span", "beat-tag-tape");
    tape.append(el("span", "beat-tag-words", "this beat isn't available. "));
    const own = el("a", "beat-tag-own", "make your own");
    own.href = "/";
    tape.append(own);
    tag.replaceChildren(tape);
    tag.hidden = false;
  },

  hide() {
    root().hidden = true;
  },
};
