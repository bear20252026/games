/**
 * PulseToast
 * Once a visit, when the desk has settled, a toast says what the day's beats
 * have been like across every desk and offers the crate (ADR-0031). It never
 * comes up over a playing beat, and in a quiet week it does not come.
 */

import { pulseLine } from "../core/Pulse.js";

const SEEN_KEY = "knockbox-pulse-seen";
// After the desk is up, before the toast; and how long it stays
const WAIT_MS = 7000;
const STAY_MS = 10000;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export class PulseToast {
  /**
   * @param {Object} options
   * @param {() => Promise<{pulse: Object|null}>} options.fetch
   * @param {() => boolean} options.isBusy - Something else has the person's attention
   * @param {() => boolean} options.canDig - There is a crate to open
   * @param {() => void} options.onDig
   */
  constructor({ fetch, isBusy, canDig, onDig }) {
    this.fetch = fetch;
    this.isBusy = isBusy;
    this.canDig = canDig;
    this.onDig = onDig;
    this.root = null;
  }

  init() {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return;
    } catch {
      // No storage: it may come once a page instead of once a visit
    }
    setTimeout(() => this.come(), WAIT_MS);
  }

  async come(tries = 3) {
    // Not over a playing beat, a tour or an open crate: look again later, a few times
    if (this.isBusy()) {
      if (tries > 0) setTimeout(() => this.come(tries - 1), WAIT_MS * 2);
      return;
    }
    if (!this.canDig()) return;
    let pulse;
    try {
      ({ pulse } = await this.fetch());
    } catch {
      return;
    }
    if (!pulse || this.isBusy()) return;
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch {}
    this.show(pulse);
  }

  show(pulse) {
    const root = el("div", "pulse-toast");
    root.setAttribute("role", "status");
    const shut = el("button", "pulse-shut", "✕");
    shut.type = "button";
    shut.setAttribute("aria-label", "Close");
    shut.addEventListener("click", () => this.leave());

    // "23 beats today. Mostly laid-back and drunk." with the count picked out
    const [count, ...rest] = pulseLine(pulse).split(" ");
    const line = el("p", "pulse-line");
    line.append(el("em", "", count), ` ${rest.join(" ")}`);
    const sound = el("div", "pulse-sound");
    for (const tag of pulse.sound) sound.append(el("span", "", tag));

    const dig = el("button", "pulse-dig", "DIG THE CRATE →");
    dig.type = "button";
    dig.addEventListener("click", () => {
      this.leave();
      this.onDig();
    });
    root.append(shut, line, sound, dig);
    document.body.append(root);
    this.root = root;

    // It goes by itself, but not from under a hand or a focused key
    let timer = setTimeout(() => this.leave(), STAY_MS);
    const hold = () => clearTimeout(timer);
    const release = () => {
      clearTimeout(timer);
      timer = setTimeout(() => this.leave(), STAY_MS / 2);
    };
    root.addEventListener("pointerenter", hold);
    root.addEventListener("focusin", hold);
    root.addEventListener("pointerleave", release);
    root.addEventListener("focusout", release);
    this.clear = hold;
  }

  leave() {
    this.clear?.();
    this.root?.remove();
    this.root = null;
  }
}
