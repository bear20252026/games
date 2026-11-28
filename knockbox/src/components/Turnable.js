/**
 * Turnable
 * Makes an element a dial that a mouse, a pen or a finger can turn (ADR-0050):
 * press and drag up or down from anywhere on it, tap it twice to put it back,
 * or turn it from the keyboard. It is announced as a slider. The pointer is
 * held for the length of the drag, so it can leave the dial and still turn it.
 */

import { isDrag, isSecondTap, keyTurned, turned } from "../core/Turn.js";

/**
 * @param {HTMLElement|SVGElement} el - What is pressed
 * @param {Object} dial
 * @param {string} dial.label - What it is called, for a screen reader
 * @param {() => number} dial.get - Its value now
 * @param {(value: number) => void} dial.onTurn - Each new value while it is turned
 * @param {(value: number) => void} dial.onSet - The value it is left at
 * @param {number} [dial.resetTo] - Where two taps put it
 * @param {number} [dial.perPx] - Value per px of drag
 * @param {(value: number) => string} [dial.say] - The value in words
 * @returns {{sync: Function}} Call sync() when the value changes from elsewhere
 */
export function turnable(el, { label, get, onTurn, onSet, resetTo = 0, perPx = 0.8, say }) {
  const text = say ?? ((value) => `${value}%`);
  const sync = () => {
    el.setAttribute("aria-valuenow", String(get()));
    el.setAttribute("aria-valuetext", text(get()));
  };
  el.setAttribute("role", "slider");
  el.setAttribute("tabindex", "0");
  el.setAttribute("aria-label", label);
  el.setAttribute("aria-valuemin", "0");
  el.setAttribute("aria-valuemax", "100");
  el.setAttribute("aria-orientation", "vertical");
  sync();

  let held = null;
  let lastTap = null;

  el.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // Not a text selection, and not a press on whatever lies under the dial
    e.preventDefault();
    e.stopPropagation();
    el.focus?.({ preventScroll: true });
    el.setPointerCapture?.(e.pointerId);
    held = { id: e.pointerId, x: e.clientX, y: e.clientY, from: get(), dragged: false };
    el.classList.add("is-held");
  });

  el.addEventListener("pointermove", (e) => {
    if (!held || e.pointerId !== held.id) return;
    held.dragged ||= isDrag(e.clientX - held.x, e.clientY - held.y, e.pointerType);
    if (!held.dragged) return;
    const value = turned(held.from, held.y - e.clientY, perPx);
    if (value !== get()) {
      onTurn(value);
      sync();
    }
  });

  const letGo = (e) => {
    if (!held || e.pointerId !== held.id) return;
    const { dragged } = held;
    held = null;
    el.classList.remove("is-held");
    if (dragged) {
      lastTap = null;
      onSet(get());
    } else if (e.type === "pointerup") {
      const tap = { at: e.timeStamp, x: e.clientX, y: e.clientY };
      if (isSecondTap(lastTap, tap)) {
        lastTap = null;
        onTurn(resetTo);
        onSet(resetTo);
      } else lastTap = tap;
    }
    sync();
  };
  el.addEventListener("pointerup", letGo);
  el.addEventListener("pointercancel", letGo);

  el.addEventListener("keydown", (e) => {
    const value = keyTurned(e.key, e.shiftKey, get());
    if (value === null) return;
    e.preventDefault();
    // Not one of the desk's own keys while a dial has them
    e.stopPropagation();
    onTurn(value);
    onSet(value);
    sync();
  });

  return { sync };
}
