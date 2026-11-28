/**
 * BounceMenu
 * The cassette's one way out to a DAW: "Export as" on its label slides the
 * inlay card out from under it, with a line for each thing the tape can be
 * bounced to and what that is. Picking a line bounces it and slides the card
 * back; so does Esc, or reaching for anything else on the desk.
 */

export class BounceMenu {
  /**
   * @param {Object} parts
   * @param {HTMLButtonElement} parts.button - "Export as", on the label
   * @param {HTMLElement} parts.menu - The inlay card, holding one button per format
   */
  constructor({ button, menu }) {
    this.button = button;
    this.menu = menu;
  }

  get items() {
    return [...this.menu.querySelectorAll('[role="menuitem"]')];
  }

  init() {
    this.button.addEventListener("click", () => this.set(this.menu.hidden));
    // The line's own handler has bounced it by the time the card goes back
    this.menu.addEventListener("click", (e) => {
      if (e.target.closest('[role="menuitem"]')) this.set(false);
    });
    // A line dragged out to a DAW is a choice made too
    this.menu.addEventListener("dragend", () => this.set(false));
    document.addEventListener("pointerdown", (e) => {
      if (!this.menu.hidden && !this.menu.contains(e.target) && !this.button.contains(e.target)) {
        this.set(false);
      }
    });
    // Esc puts the card back from wherever the hands are
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !this.menu.hidden && !this.menu.contains(e.target)) this.set(false);
    });
    const onKey = (e) => {
      if (this.menu.hidden) return;
      const step = nextItem(e.key, this.items.indexOf(document.activeElement), this.items.length);
      if (e.key === "Escape") {
        this.set(false);
        this.button.focus({ preventScroll: true });
      } else if (step !== null) this.items[step].focus({ preventScroll: true });
      else return;
      e.preventDefault();
      // Not one of the desk's own keys while the card is out
      e.stopPropagation();
    };
    this.button.addEventListener("keydown", onKey);
    this.menu.addEventListener("keydown", onKey);
  }

  set(open) {
    this.menu.hidden = !open;
    this.button.setAttribute("aria-expanded", String(open));
  }
}

/**
 * Which line the arrow keys move to.
 * @param {string} key
 * @param {number} at - The line with focus; -1 when none has it
 * @param {number} count
 * @returns {number|null} Null when the key is not one that moves
 */
export function nextItem(key, at, count) {
  if (key === "ArrowDown") return (at + 1) % count;
  if (key === "ArrowUp") return (at <= 0 ? count : at) - 1;
  if (key === "Home") return 0;
  if (key === "End") return count - 1;
  return null;
}
