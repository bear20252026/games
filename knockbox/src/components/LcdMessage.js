/**
 * LcdMessage
 * A line or two shown on the sampler's display for a moment, over its usual
 * BPM / STEP / MODE readout, the way the machine itself would say something
 * ("SAVED: DISK 1 OF 3").
 */

const SHOW_MS = 2600;

let timer = null;

export const LcdMessage = {
  /**
   * @param {string[]} lines - One or two short lines; set as text, never as HTML
   * @param {number} [ms] - How long it stays up
   */
  show(lines, ms = SHOW_MS) {
    const lcd = document.querySelector(".lcd");
    const message = lcd?.querySelector(".lcd-msg");
    if (!message) return;

    message.replaceChildren(
      ...lines.map((line) => {
        const row = document.createElement("span");
        row.textContent = line;
        return row;
      }),
    );
    lcd.classList.add("is-messaging");
    clearTimeout(timer);
    timer = setTimeout(() => lcd.classList.remove("is-messaging"), ms);
  },
};
