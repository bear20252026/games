/**
 * HeardKeys
 * The mute and solo keys every row carries (ADR-0053), where the row lock was.
 */

import { isHeard, isMuted, isSoloed } from "../core/Heard.js";

/** The pair, as markup for a row */
export const HEARD_KEYS = `<div class="ms-keys">
  <button class="ms-key is-mute" type="button" data-ms="mute" aria-pressed="false" aria-label="Mute" data-tooltip="Mute: this row is not played, and is left out of the WAV bounce. Stems and MIDI still carry it.">M</button>
  <button class="ms-key is-solo" type="button" data-ms="solo" aria-pressed="false" aria-label="Solo" data-tooltip="Solo: hear only the soloed rows. It is for listening and is not saved with the beat.">S</button>
</div>`;

/**
 * Light a row's keys as the desk stands, and grey the row if it is not heard.
 * @param {HTMLElement} rowEl
 * @param {Object} state
 * @param {number|string} row - 0 to 3, "smp" or "vox"
 */
export function showHeard(rowEl, state, row) {
  rowEl
    .querySelector('[data-ms="mute"]')
    ?.setAttribute("aria-pressed", String(isMuted(state, row)));
  rowEl
    .querySelector('[data-ms="solo"]')
    ?.setAttribute("aria-pressed", String(isSoloed(state, row)));
  rowEl.classList.toggle("is-quiet", !isHeard(state, row));
}
