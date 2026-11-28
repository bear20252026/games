/**
 * The drummer's hand (ADR-0075): what a played bar has that a drawn one does not,
 * written as rules. How hard each drum is hit where it falls in the bar, how far
 * each leans off its place, and a drift that wanders from hit to hit, not a new
 * roll of the dice each time. The levels and the leans are what the groove model
 * (GrooVAE) gave on average over some fourteen hundred patterns, from 70 to 170 BPM; they are mixed into
 * the desk's own pocket at the weights the model's answer was. No DOM.
 */

import { DRUM_PITCHES } from "../constants/drums.js";
import { gaussianRandom } from "./MathUtils.js";

const { KICK, SNARE, HIHAT_CLOSED, HIHAT_OPEN } = DRUM_PITCHES;

// Where an open hat falls says how hard it is hit: the early "and"s ring, the late ones are a touch
const OPEN_LEVELS = { 2: 93, 10: 77, 6: 38, 14: 31 };
const OPEN_LEVEL = 60;

// A kick that lands a step or two after another is the firm one of the pair; the first was the pickup
const KICK_LANDS = 62;

/**
 * How hard a drummer hits a drum on a step, as a MIDI velocity: the one and the
 * backbeat full, a kick between the beats soft, a snare off the backbeat a ghost.
 * Of two kicks close together the second lands firm, wherever it falls.
 * The closed hat has its own pulse (hatPulse) and is not shaped here.
 * @param {number} pitch - MIDI pitch of the drum
 * @param {number} stepIdx - Step in the bar (wraps every 16)
 * @param {Set<number>} [kicks] - The steps the kick row is lit on, where known
 * @returns {number|null} null for a drum this does not shape
 */
export function handLevel(pitch, stepIdx, kicks = null) {
  const step = ((stepIdx % 16) + 16) % 16;
  if (pitch === KICK) {
    const level = step === 0 ? 75 : step % 4 === 0 ? 55 : step % 2 === 0 ? 40 : 30;
    const lands = kicks?.has((step + 15) % 16) || kicks?.has((step + 14) % 16);
    return lands ? Math.max(level, KICK_LANDS) : level;
  }
  if (pitch === SNARE) return step === 4 || step === 12 ? 92 : 14;
  if (pitch === HIHAT_OPEN) return OPEN_LEVELS[step] ?? OPEN_LEVEL;
  return null;
}

/**
 * How far a drummer leans off a step, before the pocket is added: the kick sits
 * back on the one and comes forward on three, the hat's "e" hangs late and its "a"
 * hurries, the open hat is a hair early. The snare does not lean. It is a share of
 * a 16th, not a length of time: the model's lean was the same share from 70 to 170
 * BPM (24ms on the one at 70, 10ms at 170), so a faster beat leans less far.
 * @param {number} pitch
 * @param {number} stepIdx
 * @param {number} stepDuration - A 16th at the tempo playing, in seconds
 * @returns {number} Seconds; later is positive
 */
export function handLean(pitch, stepIdx, stepDuration) {
  const step = ((stepIdx % 16) + 16) % 16;
  let share = 0;
  if (pitch === KICK) share = step === 0 ? 0.113 : step === 8 || step === 10 ? -0.04 : 0;
  else if (pitch === HIHAT_CLOSED) {
    share = step === 0 ? 0.096 : step % 4 === 1 ? 0.1 : step % 4 === 3 ? -0.02 : 0.02;
  } else if (pitch === HIHAT_OPEN) share = -0.025;
  return share * stepDuration;
}

// The switch-up (ADR-0078): every second bar is played a little differently from the first,
// the same way each time round. What each hit gains or gives up there, at the top of the swing dial
const SWITCHED_HATS = { 2: 8, 8: -8, 10: -6, 14: 6 };
// ...and how much of its lean it keeps: the one has been stated, so it sits back less
const SWITCHED_LEAN = 0.5;

/**
 * What a hit gains or gives up in a switched bar: the kick on the beat eases and the kick
 * between the beats comes up, the last backbeat eases, the hats take another shape.
 * @param {number} pitch
 * @param {number} stepIdx
 * @returns {number} MIDI velocity, signed
 */
export function handSwitch(pitch, stepIdx) {
  const step = ((stepIdx % 16) + 16) % 16;
  if (pitch === KICK) return step === 0 ? -8 : step % 4 === 0 ? -6 : 8;
  if (pitch === SNARE) return step === 12 ? -8 : step === 4 ? 0 : 4;
  if (pitch === HIHAT_CLOSED) return SWITCHED_HATS[step] ?? 0;
  if (pitch === HIHAT_OPEN) return -5;
  return 0;
}

/**
 * Where a bar falls when the drums switch up every second bar: whether it is a switched
 * bar, and whether it is the one that turns back to the top. The turn is where the longest
 * take on the desk comes back round (a loop or a voice of 1, 2 or 4 bars, cut shorter or
 * not), so the drums set up the loop's return and not the middle of it; with no take, or
 * one of a bar, it is every second bar. Bars are counted from PLAY, as the takes' are.
 * @param {Object} state - The store's state
 * @param {number} bar - Bars since the beat was started
 * @returns {{switched: boolean, turns: boolean}}
 */
export function barOf(state, bar) {
  if (!state.grooveSettings?.switchUp) return { switched: false, turns: false };
  const takes = [state.smp, state.vox].filter((lane) => lane?.slices?.length > 0);
  const round = Math.max(2, ...takes.map((lane) => lane.bars));
  return { switched: bar % 2 === 1, turns: bar % round === round - 1 };
}

/** How many bars the drums take to come back to where they began */
export function barsRound(state) {
  if (!state.grooveSettings?.switchUp) return 1;
  const takes = [state.smp, state.vox].filter((lane) => lane?.slices?.length > 0);
  return Math.max(2, ...takes.map((lane) => lane.bars));
}

// How much of where a limb was on its last hit is still in its next
const DRIFT_KEEPS = 0.9;
// A hat hit a touch hard is followed by one a touch soft: how much of the last goes against the next
const TOUCH_TURNS = 0.7;
// Hats on every 16th are played lighter than hats on the eighths: lit pads from here up count as busy
const HATS_EIGHTHS = 8;

/** The steps a drum row is lit on */
function litSteps(steps, track) {
  const lit = new Set();
  for (let step = 0; step < 16; step++) {
    if (steps[`track-${track}_${step}`]?.active) lit.add(step);
  }
  return lit;
}

/**
 * A drummer's limbs wander: a hit a little late is followed by another a little
 * late. One of these is kept for a desk's drums and asked at every hit.
 */
export class Hand {
  /** @param {() => number} [rand] - Bell-shaped noise around 0, one wide */
  constructor(rand = gaussianRandom) {
    this.rand = rand;
    this.at = new Map();
    // The pads as the hand sees them: where the kicks are, and how busy the hat row is (0 to 1)
    this.kicks = new Set();
    this.busy = 0;
    this.touched = 0;
    // Whether the bar being played is a switched one
    this.switched = false;
  }

  /** How far a drum leans off a step: less far in a switched bar */
  lean(pitch, stepIdx, stepDuration) {
    return handLean(pitch, stepIdx, stepDuration) * (this.switched ? SWITCHED_LEAN : 1);
  }

  /** What a hit gains or gives up for the bar it is in */
  switchOf(pitch, stepIdx) {
    return this.switched ? handSwitch(pitch, stepIdx) : 0;
  }

  /**
   * The pads have changed: a hand plays a hit by what is around it.
   * @param {Object} steps - The store's pads
   */
  see(steps) {
    this.kicks = litSteps(steps, 0);
    this.busy = Math.max(0, Math.min(1, (litSteps(steps, 2).size - HATS_EIGHTHS) / 8));
  }

  /** How hard a drum is hit on a step, among the pads as they are */
  level(pitch, stepIdx) {
    return handLevel(pitch, stepIdx, this.kicks);
  }

  /**
   * The hat hand's unevenness from hit to hit: one a touch hard is followed by one a
   * touch soft, not each its own roll of the dice.
   * @returns {number} Around 0, one wide
   */
  touch() {
    this.touched = -this.touched * TOUCH_TURNS + this.rand() * Math.sqrt(1 - TOUCH_TURNS ** 2);
    return this.touched;
  }

  /**
   * Where a drum's limb has wandered to at this hit. Both hats are one hand.
   * @param {number} pitch
   * @param {number} humanizeAmount - 0 to 1: about a millisecond's wander at the bottom, three at the top
   * @returns {number} Seconds
   */
  drift(pitch, humanizeAmount) {
    const limb = pitch === HIHAT_OPEN ? HIHAT_CLOSED : pitch;
    const now =
      (this.at.get(limb) ?? 0) * DRIFT_KEEPS + this.rand() * Math.sqrt(1 - DRIFT_KEEPS ** 2);
    this.at.set(limb, now);
    return (now * (1 + 2 * humanizeAmount)) / 1000;
  }
}

/**
 * The pads as a played bar, for what follows a neighbour's accent (a ghost note's
 * level): each lit pad of a drum this shapes, at the level a hand would give it.
 * @param {Object} steps - The store's pads
 * @param {number} stepDuration - A 16th, in seconds
 * @param {Object} trackToPitch
 * @returns {{notes: Array<{pitch: number, startTime: number, velocity: number}>, stepSeconds: number}}
 */
export function handSequence(steps, stepDuration, trackToPitch) {
  const notes = [];
  const kicks = litSteps(steps, 0);
  for (const [id, pad] of Object.entries(steps)) {
    if (!pad.active) continue;
    const [track, step] = id.replace("track-", "").split("_").map(Number);
    const velocity = handLevel(trackToPitch[track], step, kicks);
    if (velocity !== null) {
      notes.push({ pitch: trackToPitch[track], startTime: step * stepDuration, velocity });
    }
  }
  return { notes, stepSeconds: stepDuration };
}
