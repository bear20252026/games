/**
 * Shortcuts
 * The handful of keys every beat machine and DAW agrees on, so the desk can
 * be played without reaching for the mouse:
 *
 *   Space      play / stop
 *   1 2 3 4    hit the kick, snare, hat, open hat
 *   Shift 1-4  mute that drum row (ADR-0053)
 *   ↑ ↓        tempo up / down (Shift: by 5)
 *   T          tap tempo
 *   R          record a take; again to finish it
 *   M          mixer
 *   S          save the beat
 *   ? or /     the list of keys, in How it works
 *
 * (The chop screens add their own: Delete, and Enter / Esc while trimming.)
 *
 * Nothing here uses Ctrl, Cmd or Alt, so the browser's own shortcuts are
 * left alone, and typing in a field is never intercepted.
 */

// Taps further apart than this start a new count (ms)
const TAP_TIMEOUT_MS = 2000;
// How many of the latest taps the tempo is worked out from
const TAP_MEMORY = 5;
export const TEMPO_MIN = 30;
export const TEMPO_MAX = 240;
const TEMPO_BIG_STEP = 5;

/**
 * The tempo a run of taps is beating out.
 * @param {number[]} taps - Times of the taps, in ms, oldest first
 * @returns {number | null} BPM, or null until there are two taps to go on
 */
export function tapTempo(taps) {
  if (taps.length < 2) return null;
  const beat = (taps[taps.length - 1] - taps[0]) / (taps.length - 1);
  return Math.max(TEMPO_MIN, Math.min(TEMPO_MAX, Math.round(60000 / beat)));
}

export class Shortcuts {
  /**
   * @param {Object} options
   * @param {Function} options.onHit - `(track) => void`: sound a drum row now
   * @param {Function} options.onHelp - Show the list of keys
   * @param {Function} options.isBlocked - True while the keys should do nothing (the tour is up)
   * @param {Array<{handleKey: Function}>} options.lanes - The chop screens, which get first refusal
   */
  constructor({ onHit, onMute, onHelp, isBlocked, lanes }) {
    this.onHit = onHit;
    this.onMute = onMute;
    this.onHelp = onHelp;
    this.isBlocked = isBlocked;
    this.lanes = lanes;
    this.taps = [];
  }

  init() {
    document.addEventListener("keydown", (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target) || this.isBlocked()) return;
      if (this.lanes.some((lane) => lane.handleKey(e)) || this.handle(e)) e.preventDefault();
    });
  }

  /** @returns {boolean} Whether the key was one of ours */
  handle(e) {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (key === "ArrowUp" || key === "ArrowDown") {
      const step = (key === "ArrowUp" ? 1 : -1) * (e.shiftKey ? TEMPO_BIG_STEP : 1);
      this.setTempo(Number(document.querySelector("#tempo-input").value) + step);
      return true;
    }
    // Everything else fires once per press, however long the key is held
    if (e.repeat) return key === " ";

    // Shift with 1 to 4 mutes that row. By where the key is: Shift changes what it types
    const muted = e.shiftKey && /^Digit[1-4]$/.test(e.code ?? "") ? Number(e.code[5]) - 1 : -1;

    if (muted >= 0) this.onMute(muted);
    else if (key === " ") {
      // A key that still has focus would be pressed by the same Space
      if (document.activeElement instanceof HTMLButtonElement) document.activeElement.blur();
      press("#play-btn");
    } else if (key >= "1" && key <= "4") this.onHit(Number(key) - 1);
    else if (key === "t") this.tap(e.timeStamp);
    else if (key === "r") press("#vox-mic .mic-btn");
    else if (key === "m") press("#mixer-btn");
    else if (key === "s") press("#save-btn:not([hidden])");
    // The key the ? is printed on, with Shift or without
    else if (key === "?" || key === "/") this.onHelp();
    else return false;
    return true;
  }

  tap(now) {
    if (now - this.taps[this.taps.length - 1] > TAP_TIMEOUT_MS) this.taps = [];
    this.taps = [...this.taps, now].slice(-TAP_MEMORY);
    const bpm = tapTempo(this.taps);
    if (bpm) this.setTempo(bpm);
  }

  /** Goes through the tempo field, so everything that listens to it hears about it */
  setTempo(bpm) {
    const input = document.querySelector("#tempo-input");
    input.value = Math.max(TEMPO_MIN, Math.min(TEMPO_MAX, Math.round(bpm)));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function press(selector) {
  document.querySelector(selector)?.click();
}

/** Is this somewhere keys mean something already: a field, a fader, a menu? */
function isTyping(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, [contenteditable="true"], [role="slider"], [role="menu"]',
    ),
  );
}
