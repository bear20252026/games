/**
 * The loop's screen before there is a loop (ADR-0056): whether it is shown
 * asleep on the sampler, and a maker's choice to put it away. No DOM.
 */

const PUT_AWAY_KEY = "knockbox.loopScreenAway";
// The row a loaded loop lands on
const LOOP_LANE = "smp";

function browserStorage() {
  return typeof localStorage === "undefined" ? null : localStorage;
}

/** Whether a row with nothing on it shows its screen asleep: the loop's row, until it is put away */
export function loopScreenSleeps(laneKey, storage = browserStorage()) {
  if (laneKey !== LOOP_LANE) return false;
  try {
    return storage?.getItem(PUT_AWAY_KEY) !== "1";
  } catch {
    return true; // storage is blocked: the screen is there each visit
  }
}

/** A maker who only wants drums puts the screen away, for good on this browser */
export function putLoopScreenAway(storage = browserStorage()) {
  try {
    storage?.setItem(PUT_AWAY_KEY, "1");
  } catch {
    // Nothing can be kept: it is away for this visit only
  }
}

/** How long that many bars of four beats take at a tempo, in seconds */
export function barsSeconds(bars, bpm) {
  return (bars * 4 * 60) / bpm;
}
