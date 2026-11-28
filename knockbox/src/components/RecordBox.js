/**
 * RecordBox
 * The records built-in loops are kept on (ADR-0088), opened over the desk: a
 * sleeve for each, a guest's under their own cover where they gave one. A
 * sleeve picked is turned over to its loops, the first of them picked. A
 * loop's round key hears it over the beat; its name picks it, heard or not,
 * and USE IT puts the picked one on the desk. Put away by its x, by Esc and
 * by a press beside it, which leave the desk sounding as it did.
 */

import { coverFile, records, storeOf } from "../core/Records.js";

/** Where the site keeps the loops and covers */
export const LOOPS_AT = "./public/loops/";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // A record's words are data from a file: always text, never markup
  if (text !== undefined) node.textContent = text;
  return node;
}

function key(className, text, action) {
  const button = el("button", className, text);
  button.type = "button";
  button.addEventListener("click", action);
  return button;
}

export class RecordBox {
  /**
   * @param {Object} options
   * @param {(picked: {record: Object, loop: Object}) => void} options.onUse - Put that loop on the desk
   * @param {(picked: {record: Object, loop: Object}|null) => Promise<boolean>} options.onTry - Hear
   *   that loop over the beat, or with null none; resolves false where it could not be heard
   * @param {() => void} [options.onOpen] - The box was opened
   */
  constructor({ onUse, onTry, onOpen }) {
    this.onUse = onUse;
    this.onTry = onTry;
    this.onOpen = onOpen;
    /** The box, over the desk; null while it is shut */
    this.root = null;
    /** The record turned over, and its loop being heard, if any */
    this.turned = null;
    this.chosen = null;
    /** The loop USE IT takes: the first of a record turned over, until another is pressed */
    this.picked = null;
    /** What had the focus before the box opened */
    this.opener = null;
    this.onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      this.shut();
    };
  }

  open() {
    const all = records();
    if (this.root || all.length === 0) return;
    this.opener = document.activeElement;
    this.onOpen?.();
    // One record alone is shown turned over: there is nothing to pick between
    this.turn(all.length === 1 ? all[0] : null);
    this.chosen = null;
    this.root = el("div", "record-box");
    this.root.setAttribute("role", "dialog");
    this.root.setAttribute("aria-modal", "true");
    this.root.setAttribute("aria-label", "Records");
    this.root.addEventListener("pointerdown", (e) => {
      if (e.target === this.root) this.shut();
    });
    document.addEventListener("keydown", this.onKey, true);
    document.body.append(this.root);
    this.draw();
  }

  shut() {
    if (!this.root) return;
    this.choose(null);
    document.removeEventListener("keydown", this.onKey, true);
    this.root.remove();
    this.root = null;
    this.opener?.focus?.({ preventScroll: true });
  }

  draw() {
    const inside = el("div", "record-box-in");
    const shut = key("record-box-shut", "×", () => this.shut());
    shut.setAttribute("aria-label", "Put the records away");
    inside.append(shut);
    if (this.turned) inside.append(this.sleeve(this.turned), this.back(this.turned));
    else {
      for (const record of records()) {
        inside.append(
          this.sleeve(record, () => {
            this.turn(record);
            this.draw();
          }),
        );
      }
    }
    this.root.replaceChildren(inside);
    inside
      .querySelector('.record-pick[aria-pressed="true"], button.record-sleeve')
      ?.focus({ preventScroll: true });
  }

  /** Turn a record over, its first loop picked; with null, back to the sleeves */
  turn(record) {
    this.turned = record;
    this.picked = record?.loops[0] ?? null;
  }

  /** A record's front: the guest's cover, or a sleeve printed in the desk's style */
  sleeve(record, pick) {
    const front = pick
      ? key("record-sleeve", undefined, pick)
      : el("div", "record-sleeve is-turned");
    if (pick) front.setAttribute("aria-label", `${record.title}, by ${record.by}`);
    front.append(el("b", "", record.title), el("small", "", record.by));
    const cover = coverFile(record);
    if (cover) {
      const art = el("img");
      art.alt = "";
      art.src = LOOPS_AT + cover;
      // A cover that won't load leaves the printed sleeve showing
      art.addEventListener("error", () => art.remove());
      front.append(art);
    }
    return front;
  }

  /** A record turned over: whose loops, and the loops */
  back(record) {
    const back = el("div", "record-back");
    const by = el("div", "record-by");
    by.append(el("span", "", `Loops by ${record.by}`));
    const store = storeOf(record);
    if (store) {
      const link = el("a", "", "their store ↗");
      link.href = store;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      by.append(link);
    }
    back.append(el("h3", "", record.title), by);
    for (const loop of record.loops) {
      const line = el("div", "record-loop");
      // Hearing a loop picks it; picking one does not make it sound
      const hear = key("record-hear", undefined, () => {
        this.picked = loop;
        this.choose(this.chosen === loop ? null : loop, record);
        this.draw();
        this.root
          ?.querySelector('.record-hear[aria-pressed="true"]')
          ?.focus({ preventScroll: true });
      });
      hear.setAttribute("aria-label", `Hear ${loop.name} over the beat`);
      hear.setAttribute("aria-pressed", String(this.chosen === loop));
      const pick = key("record-pick", undefined, () => {
        this.picked = loop;
        this.draw();
      });
      pick.setAttribute("aria-pressed", String(this.picked === loop));
      pick.append(el("b", "", loop.name), el("span", "", loop.key ?? ""));
      line.append(hear, pick);
      back.append(line);
    }
    const foot = el("div", "record-foot");
    const use = key("is-use", "Use it", () => {
      const picked = { record, loop: this.picked };
      this.shut();
      this.onUse(picked);
    });
    foot.append(use);
    if (records().length > 1) {
      foot.append(
        key("", "Other records", () => {
          this.turn(null);
          this.choose(null);
          this.draw();
        }),
      );
    }
    back.append(foot);
    return back;
  }

  /** Hear a loop over the beat, or with null stop hearing one */
  choose(loop, record) {
    if (loop === this.chosen) return;
    this.chosen = loop;
    Promise.resolve(this.onTry?.(loop ? { record, loop } : null))
      .then((heard) => heard === false && this.letGo(loop))
      .catch(() => this.letGo(loop));
  }

  /** The loop being heard has stopped, by the beat stopping or by not being had: no loop is chosen */
  letGo(loop = this.chosen) {
    if (!loop || this.chosen !== loop) return;
    this.chosen = null;
    this.onTry?.(null);
    if (this.root) this.draw();
  }
}
