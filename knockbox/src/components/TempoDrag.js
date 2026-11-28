/**
 * TempoDrag
 * The tempo readout is nudged by pressing it and dragging up or down, under a
 * mouse or a finger (ADR-0050). A press that doesn't travel is still a press
 * on a number field: it takes the cursor and can be typed into.
 */

import { isDrag, turned } from "../core/Turn.js";
import { TEMPO_MAX, TEMPO_MIN } from "./Shortcuts.js";

/** BPM per px of drag */
const TEMPO_PER_PX = 0.5;

/**
 * @param {HTMLInputElement} input - The tempo field
 * @param {(bpm: number) => void} setTempo - Puts a tempo on the desk
 */
export function tempoDrag(input, setTempo) {
  let held = null;

  input.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    held = { id: e.pointerId, x: e.clientX, y: e.clientY, from: Number(input.value), drag: false };
  });

  input.addEventListener("pointermove", (e) => {
    if (!held || e.pointerId !== held.id) return;
    if (!held.drag && isDrag(e.clientX - held.x, e.clientY - held.y, e.pointerType)) {
      held.drag = true;
      // From here it is a dial, not a field: no cursor, no selection, no keyboard sliding up
      input.setPointerCapture?.(e.pointerId);
      input.blur();
    }
    if (!held.drag) return;
    e.preventDefault();
    const bpm = turned(held.from, held.y - e.clientY, TEMPO_PER_PX, TEMPO_MIN, TEMPO_MAX);
    if (bpm !== Number(input.value)) setTempo(bpm);
  });

  const letGo = (e) => {
    if (!held || e.pointerId !== held.id) return;
    // The press that ended a drag is not also a press on the field
    if (held.drag) e.preventDefault();
    held = null;
  };
  input.addEventListener("pointerup", letGo);
  input.addEventListener("pointercancel", letGo);
}
