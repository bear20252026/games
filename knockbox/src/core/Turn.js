/**
 * Turning a dial
 * The sums behind a pot that is dragged up and down, under a mouse or a
 * finger (ADR-0050): how far a drag moves it, when two taps are a reset, and
 * what the keys do. No DOM; components/Turnable.js wires it to an element.
 */

/** A press that travels less than this is a tap; a finger wobbles more than a mouse */
export const TAP_SLOP = { mouse: 3, pen: 4, touch: 8 };

/** Two taps this close together, in time and place, put a dial back */
export const TWO_TAP_MS = 350;
export const TWO_TAP_PX = 28;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Where a drag has taken a dial.
 * @param {number} from - Its value when it was taken hold of
 * @param {number} up - How far the pointer has gone up the screen since, in px (down is negative)
 * @param {number} perPx - Value per px
 * @returns {number} A whole number within the dial's range
 */
export function turned(from, up, perPx, min = 0, max = 100) {
  return clamp(Math.round(from + up * perPx), min, max);
}

/** Has the press gone far enough to be a drag? */
export function isDrag(dx, dy, pointerType = "mouse") {
  return Math.hypot(dx, dy) > (TAP_SLOP[pointerType] ?? TAP_SLOP.mouse);
}

/**
 * Is this tap the second of two?
 * @param {{at: number, x: number, y: number}|null} last - The tap before, if any
 * @param {{at: number, x: number, y: number}} tap
 */
export function isSecondTap(last, tap) {
  if (!last) return false;
  return tap.at - last.at <= TWO_TAP_MS && Math.hypot(tap.x - last.x, tap.y - last.y) <= TWO_TAP_PX;
}

/**
 * Where a key takes a dial: the arrows by one (ten with Shift), Home and End to its ends.
 * @returns {number|null} Null when the key is not one that turns
 */
export function keyTurned(key, shift, value, min = 0, max = 100) {
  const step = { ArrowUp: 1, ArrowRight: 1, ArrowDown: -1, ArrowLeft: -1 }[key];
  if (step) return clamp(value + step * (shift ? 10 : 1), min, max);
  if (key === "Home") return min;
  if (key === "End") return max;
  return null;
}

/** A press held this long on something with a hint shows the hint (touch has no hover) */
export const HINT_HOLD_MS = 500;
/** How long a hint stays once the finger is off it */
export const HINT_LINGER_MS = 1800;
/** Mouse and focus events a browser makes up after a touch arrive within this long of it */
const TOUCH_ECHO_MS = 800;

/** Is this mouse or focus event the browser's echo of a touch just made? */
export function isTouchEcho(lastTouchAt, now) {
  return now - lastTouchAt <= TOUCH_ECHO_MS;
}
