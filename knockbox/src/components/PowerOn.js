/**
 * The desk coming on (ADR-0072): the room's lamp, the sampler's boot words
 * and its pad self-test, then READY. Until READY nothing on the desk answers.
 */

// The room stands dark this long, then its lamp comes on; this long after, with the lamp's pool
// on the desk, the sampler wakes and the room starts to fill in around it
export const DARK_MS = 200;
export const LAMP_MS = 650;
// The sampler's words while it boots, and how long each is up
export const BOOT_WORDS = [
  { text: "KB-3000", delay: 450 },
  { text: "BOOTING...", delay: 500 },
  { text: "GROOVAE v1.0", delay: 500 },
  { text: "LOADING...", delay: 450 },
  { text: "READY", delay: 450 },
];
// Each row of pads lights this long after the one above it, and all go out this long after the last
export const ROW_MS = 110;
export const SWEEP_REST_MS = 160;

/** From a dark room to READY, in milliseconds */
export const bootMs = (rows = 4) =>
  DARK_MS +
  LAMP_MS +
  BOOT_WORDS.reduce((sum, word) => sum + word.delay, 0) +
  rows * ROW_MS +
  SWEEP_REST_MS;

const HELD = [
  "pointerdown",
  "mousedown",
  "mouseup",
  "click",
  "dblclick",
  "touchstart",
  "keydown",
  "keyup",
  "dragover",
  "drop",
];

/**
 * Whether the desk leaves this press or key unanswered: every one of them until
 * it is ready, but for the keys that are the browser's own (reload, the tools).
 * @param {Event} event
 * @param {boolean} ready - The sampler has said READY
 */
export function isHeld(event, ready) {
  if (ready) return false;
  if (!event.type.startsWith("key")) return true;
  return !(event.metaKey || event.ctrlKey || event.altKey || /^F\d+$/.test(event.key ?? ""));
}

/**
 * Hold the desk until it is ready: presses, keys and dropped files are stopped
 * before anything on the desk hears them.
 * @param {EventTarget} target - The window
 * @param {function(): boolean} isReady
 */
export function holdTheDesk(target, isReady) {
  const hold = (event) => {
    if (!isHeld(event, isReady())) return;
    event.stopImmediatePropagation();
    event.preventDefault();
  };
  for (const type of HELD) target.addEventListener(type, hold, { capture: true, passive: false });
}
