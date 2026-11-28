/**
 * HeldSign
 * The warning sign beside the SAVE key while a guest has disks (ADR-0035).
 * A guest's "saved" is held by this browser and not kept, and the desk shows
 * it without a word: no tick on the key, the sign, the disks loose in the box
 * (DiskBox.js). The words come when the sign is pressed: a sticky with the
 * three ways the beat is lost, and the way out.
 */

import { HELD_SEEN, HELD_WAYS, isHeld } from "../core/Held.js";

const SVG = "http://www.w3.org/2000/svg";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function picture(path) {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  const shape = document.createElementNS(SVG, "path");
  shape.setAttribute("d", path);
  svg.append(shape);
  return svg;
}

export class HeldSign {
  /**
   * @param {Object} options
   * @param {DiskDrive} options.disks
   * @param {Function} options.onSignIn - Open the sheet that makes the account theirs
   */
  constructor({ disks, onSignIn }) {
    this.disks = disks;
    this.onSignIn = onSignIn;
    this.key = document.querySelector("#save-btn");
    this.sign = document.querySelector("#save-warn");
    this.note = null;
  }

  init() {
    this.sign.addEventListener("click", () => (this.note ? this.shut() : this.show()));
    // Anywhere else on the desk puts the sticky away
    document.addEventListener("pointerdown", (e) => {
      if (this.note && !this.note.contains(e.target) && !this.sign.contains(e.target)) this.shut();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.note) this.shut();
    });
    this.disks.onChange(() => this.render());
    this.render();
  }

  render() {
    const { disks } = this;
    const held = disks.ready && isHeld(disks.user, disks.count);
    this.sign.hidden = !held;
    // A tick is a promise: the key keeps its disk until the account is theirs
    this.key.toggleAttribute("data-held", held);
    if (!held) return this.shut();
    if (!this.rung()) this.ring();
  }

  rung() {
    try {
      return localStorage.getItem(HELD_SEEN) !== null;
    } catch {
      return true;
    }
  }

  /** The first time on this browser, the sign is seen to arrive, and the way out with it */
  ring() {
    try {
      localStorage.setItem(HELD_SEEN, "1");
    } catch {
      // Then it rings again next time, which is no harm
    }
    this.sign.classList.add("is-ringing");
    // The corner draws itself again as the guest is made: wait for the face to be there
    setTimeout(() => {
      document.querySelector("#account .acct-btn")?.classList.add("is-nudged");
    }, 600);
  }

  show() {
    const note = el("div", "save-why");
    note.setAttribute("role", "dialog");
    note.setAttribute("aria-label", "Why this beat could be lost");
    const ways = el("ul", "save-why-ways");
    for (const { words, icon } of HELD_WAYS) {
      const way = el("li", "", words);
      way.prepend(picture(icon));
      way.append(el("b", "", "gone"));
      ways.append(way);
    }
    const out = el("button", "desk-key is-hot", "Sign in");
    out.type = "button";
    out.addEventListener("click", () => {
      this.shut();
      this.onSignIn();
    });
    note.append(el("h3", "", "Held here, not kept."), ways, out);
    note.style.left = `${this.sign.offsetLeft + this.sign.offsetWidth / 2}px`;
    this.sign.after(note);
    this.sign.setAttribute("aria-expanded", "true");
    this.sign.classList.remove("is-ringing");
    this.note = note;
    out.focus();
  }

  shut() {
    if (!this.note) return;
    this.note.remove();
    this.note = null;
    this.sign.setAttribute("aria-expanded", "false");
  }
}
