/**
 * What the drummer thinks, and when (ADR-0058). No DOM.
 */

import { drumTakes, TAKES_A_TIME } from "./Drummer.js";
import { isOneOf } from "./Ideas.js";
import { partOf } from "./Watch.js";

// A loop has gone round this many bars before he offers to play along
export const OFFER_BARS = 1;
// The beat has gone round this many bars before he thinks of a loop
export const LOOP_THOUGHT_BARS = 4;
// How many bars go round before he says he can be tapped, to a maker who has not tapped him yet
export const HINT_BARS = 2;
// Bars the beat has gone round with a part of the desk left alone before he speaks of it: for something off, and for something to try
export const FIX_BARS = 4;
export const SPARK_BARS = 8;
// Bars between one idea raised unasked coming down and the next going up
export const GAP_BARS = 8;
// Bars an idea raised unasked stays up unanswered
export const UP_BARS = 8;
// And for the thing to try that goes with one just kept
export const FOLLOW_BARS = 4;
// With the beat stopped: this many bars' worth of stillness, at the tempo set, before he speaks of anything
export const STILL_BARS = 4;
// Ideas waved off in a row before he waits to be tapped
export const NAHS_TO_QUIET = 2;
// After this many of his ideas are answered he sits back, for this many bars (ADR-0086)
export const IDEAS_TO_REST = 2;
export const REST_BARS = 16;

/**
 * @param {Object} now
 * @param {boolean} now.hasLoop - A loop is on the desk
 * @param {number} now.heardBars - Bars played since the beat started, or the loop landed
 * @param {boolean} now.pencil - Something on the pads is in pencil
 * @param {boolean} now.takesUp - He has brought takes for this loop
 * @param {boolean} now.listening - He is listening to the loop
 * @param {boolean} now.done - A take was kept for this loop
 * @param {boolean} now.kept - It was kept a moment ago
 * @param {boolean} now.loopAsleep - The loop's screen is on the sampler, with no loop
 * @param {boolean} now.loopThoughtSeen - He has thought of a loop on this browser before
 * @param {"idea" | "trying" | "cool" | "bet" | "none" | null} [now.idea] - An idea of his is up, on trial, or just answered
 * @param {boolean} [now.hint] - The maker has not tapped him yet, and he has not said so this visit
 * @param {boolean} [now.stopped] - The beat is stopped, on a desk the maker has touched this visit
 * @param {number} [now.stillBars] - Stopped: bars' worth of time since the desk was last touched
 * @returns {"loop" | "offer" | "listening" | "takes" | "kept" | "idea" | "trying" | "cool" | "bet" | "none" | "hint" | null}
 */
export function whatHeThinks(now) {
  // With nothing else to say, he says he can be tapped, to a maker who has not found that out
  const waited = Math.max(now.heardBars, now.stillBars ?? 0);
  return otherwise(now) ?? (now.hint && waited >= HINT_BARS ? "hint" : null);
}

function otherwise(now) {
  // An idea needs no loop, and gives way only to his listening and his takes
  if (now.idea && !now.listening && !(now.hasLoop && now.takesUp && now.pencil)) return now.idea;
  if (!now.hasLoop) {
    const due = now.loopAsleep && !now.loopThoughtSeen && now.heardBars >= LOOP_THOUGHT_BARS;
    return due ? "loop" : null;
  }
  if (now.listening) return "listening";
  if (now.takesUp && now.pencil) return "takes";
  if (now.kept) return "kept";
  if (now.done) return null;
  // Stopped, there is no bar to wait for: he offers as the loop lands
  return now.heardBars >= OFFER_BARS || now.stopped ? "offer" : null;
}

/** His take at a place in the run: four at a time, then the next four of the same loop */
export function takeAt(heard, bpm, index) {
  const round = Math.floor(index / TAKES_A_TIME);
  return drumTakes(heard, bpm, round)[index % TAKES_A_TIME];
}

/**
 * The idea he would raise now, if any. Tapped, he gives his best. Unprompted he
 * watches where the maker's hands are (ADR-0071): he speaks of a part of the
 * desk they have left alone, a few bars on for something off and a few more
 * for something to try, and of a part they keep going back and forth over, at
 * once. Not at all after ideas were waved off in a row, and not on the heels
 * of the last thing he raised. The one idea that opens a blank desk waits for
 * nothing. With the beat stopped nothing is playing for him to cut across, and
 * everything waits the short wait from the last thing touched.
 * @param {Array} ideas - From ideasFor, less those already waved off
 * @param {Object} when
 * @param {number} when.quietBars - Stopped, bars' worth of stillness; playing, bars since the desk was last touched
 * @param {function(Object): number} [when.alone] - Bars the part an idea would change has been left alone
 * @param {number} [when.gapBars] - Bars since the last idea he raised unasked came down
 * @param {string|null} [when.unsettled] - The part the maker cannot settle (Watch.unsettled)
 * @param {string[]} [when.passed] - Ideas left unanswered until they went: not raised again until their part is touched
 * @param {boolean} [when.stopped] - The beat is stopped
 * @param {number} when.nahs - Ideas waved off in a row
 * @param {boolean} [when.tapped] - The maker asked
 * @param {string[]} [when.follows] - The ideas that go with one just kept (followsOn): due sooner
 * @param {boolean} [when.opened] - The desk was opened or cleared to how it stands, not brought there a pad at a time
 */
export function ideaDue(
  ideas,
  {
    quietBars,
    alone = () => quietBars,
    gapBars = Number.POSITIVE_INFINITY,
    unsettled = null,
    passed = [],
    nahs,
    tapped = false,
    opened = true,
    follows = [],
    stopped = false,
    resting = false,
  },
) {
  if (tapped) return ideas[0] ?? null;
  // A desk with nothing on it is spoken of at once, playing or not: there is nothing to interrupt
  const opening = opened && ideas.find((idea) => idea.opens);
  if (opening) return opening;
  if (nahs >= NAHS_TO_QUIET) return null;
  // Sitting back so the beat can be heard (ADR-0086): only what is measurably off is said
  if (resting) {
    const off = (idea) => idea.kind === "fix" && !idea.asked && !passed.includes(idea.id);
    return stopped ? null : (ideas.find((idea) => off(idea) && alone(idea) >= FIX_BARS) ?? null);
  }
  if (stopped) {
    // An idea that waits to be asked is never raised unprompted
    return ideas.find((idea) => !idea.asked && quietBars >= STILL_BARS) ?? null;
  }
  // What they cannot settle: whatever he has for that part, what waits to be asked included
  const forIt = unsettled && ideas.find((idea) => partOf(idea) === unsettled);
  if (forIt) return forIt;
  const due = (idea) => {
    // The thing that goes with one just kept follows on it, whatever was said last
    if (isOneOf(idea, follows)) return alone(idea) >= FOLLOW_BARS;
    // An idea may ask for longer than a thing to try gets: its part is heard first
    const bars = idea.bars ?? (idea.kind === "fix" ? FIX_BARS : SPARK_BARS);
    return alone(idea) >= bars && gapBars >= GAP_BARS;
  };
  return ideas.find((idea) => !idea.asked && !passed.includes(idea.id) && due(idea)) ?? null;
}
