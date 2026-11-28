/**
 * Humanize Engine
 * Timing calculations for J Dilla / MPC 3000 style swing
 * Handles tuplet offsets, push/pull dynamics, and micro-variations
 */

import { DRUM_PITCHES } from "../constants/drums.js";
import { gaussianRandom } from "./MathUtils.js";

/**
 * MAX_BPM Ceiling for timing calculations
 * At higher tempos, timing offsets (+15-45ms) become a smaller percentage of beat duration,
 * reducing the psychoacoustic "rub" effect. Cap at 96 BPM for consistent groove character.
 * The sequencer still plays at user's tempo, but timing math uses effective BPM.
 * (Producer feedback: 00:13:23)
 */
export const DILLA_MAX_BPM = 96;

/**
 * How much of the hand (ADR-0075) is laid over the pocket: the weights the groove
 * model's answer had while there was one, so the drums sound as they did with it.
 */
export const HAND_BLEND = {
  velocityWeight: 0.3, // of a main hit's level, at the top of the swing dial
  microTimingWeight: 0.5, // of the hand's lean, up to 10ms of it, on top of the lean itself
  ghostVelocityWeight: 0.5, // of a ghost note's level (GhostNoteGenerator)
};

/**
 * Per-track swing multipliers - based on Dilla/MPC analysis
 * Kick swings hardest (it's the "drunk" element)
 * Hi-hats stay RIGID to create friction against lazy kick
 */
export const TRACK_SWING_MULTIPLIERS = {
  [DRUM_PITCHES.KICK]: 1.0, // MAXIMUM swing (the drunk, dragging element)
  [DRUM_PITCHES.SNARE]: 0.2, // Minimal swing (anchor/slingshot)
  [DRUM_PITCHES.HIHAT_CLOSED]: 0.3, // Mostly RIGID (creates friction)
  [DRUM_PITCHES.HIHAT_OPEN]: 0.4, // Slight swing
};

/**
 * Swing multipliers for "limp" mode - closed hi-hat gets enhanced swing
 * Open hi-hat retains original value (serves accent/anticipation role)
 * Based on producer feedback: 00:03:51 "Move the hats later... walking with a limp"
 */
export const TRACK_SWING_MULTIPLIERS_LIMP = {
  [DRUM_PITCHES.KICK]: 1.0,
  [DRUM_PITCHES.SNARE]: 0.2,
  [DRUM_PITCHES.HIHAT_CLOSED]: 0.62, // Producer's 62% swing (limp mode)
  [DRUM_PITCHES.HIHAT_OPEN]: 0.4, // Keep original (accent/anticipation role)
};

/**
 * Swing multipliers for "live" mode - both hi-hats get moderate swing
 * Simulates live drummer feel where hi-hat hand rushes ahead
 * Based on producer feedback: 00:02:12 BioBias tensor (hats rush)
 */
export const TRACK_SWING_MULTIPLIERS_LIVE = {
  [DRUM_PITCHES.KICK]: 1.0,
  [DRUM_PITCHES.SNARE]: 0.2,
  [DRUM_PITCHES.HIHAT_CLOSED]: 0.5, // Moderate swing (live drummer feel)
  [DRUM_PITCHES.HIHAT_OPEN]: 0.45, // Slightly less than closed (accent role)
};

/**
 * Calculate tuplet offset based on humanize level
 * Uses Dilla sweet spot (57%-60%), NOT triplet (66.7%)
 * Triplet swing is too "bouncy" - Dilla's feel is more "limping"
 * @param {number} stepDuration - Duration of one 16th note in seconds
 * @param {number} humanizeAmount - 0.0 to 1.0
 * @returns {number} Offset in seconds for tuplet swing
 */
export function getTupletOffset(stepDuration, humanizeAmount) {
  // Dilla Sweet Spot: 57% (septuplet) to 60% (quintuplet)
  // NOT triplet (66.7%) - that's standard MPC swing, too bouncy
  //
  // Swing percentages:
  // - 50% = straight (1:1)
  // - 57% = septuplet (4:3) - "limping" feel
  // - 60% = quintuplet (3:2) - "loose" feel
  // - 66.7% = triplet (2:1) - standard swing (too bouncy for Dilla)

  if (humanizeAmount < 0.5) {
    // Blend straight (50%) → septuplet (57%)
    const blend = humanizeAmount / 0.5;
    const straight = stepDuration * 0.5;
    const septuplet = stepDuration * 0.57;
    return straight + (septuplet - straight) * blend;
  } else {
    // Blend septuplet (57%) → quintuplet (60%)
    const blend = (humanizeAmount - 0.5) / 0.5;
    const septuplet = stepDuration * 0.57;
    const quintuplet = stepDuration * 0.6;
    return septuplet + (quintuplet - septuplet) * blend;
  }
}

/**
 * Get micro-variation noise based on humanize level
 * Creates authentic "human" inconsistency
 * @param {number} humanizeAmount - 0.0 to 1.0
 * @returns {number} Random offset in seconds
 */
export function getMicroVariation(humanizeAmount) {
  // ±2ms at low humanize, ±8ms at high humanize
  const maxVariationMs = 2 + humanizeAmount * 6;
  return ((Math.random() - 0.5) * 2 * maxVariationMs) / 1000;
}

/**
 * Quantize offset to MPC 3000 resolution (96 PPQN)
 * This creates the "chunky", committed feel of hardware timing
 * @param {number} offsetSeconds - The offset to quantize (in seconds)
 * @param {number} bpm - Current tempo
 * @returns {number} Quantized offset in seconds
 */
export function quantizeToMPCTicks(offsetSeconds, bpm) {
  const PPQN = 96;
  const tickDuration = 60 / bpm / PPQN;
  const ticks = Math.round(offsetSeconds / tickDuration);
  return ticks * tickDuration;
}

/**
 * Calculate push/pull offset based on instrument type and hi-hat mode
 * Kick DRAGS (late), Snare ANCHORS (on-grid/early)
 * In 'limp' mode, closed hi-hat also drags late
 * @param {number} pitch - MIDI pitch of the instrument
 * @param {number} humanizeAmount - Combined humanize amount (0-1)
 * @param {string} hihatMode - 'friction' (default, rigid) or 'limp' (closed HH drags)
 * @param {Function} rand - Source of 0-1 randomness; pass `() => 0.5` for the average pull
 * @returns {number} Offset in seconds
 */
export function getPushPullOffset(
  pitch,
  humanizeAmount,
  hihatMode = "friction",
  rand = Math.random,
) {
  let offset = 0;

  if (pitch === DRUM_PITCHES.KICK) {
    // KICK: Always LATE (positive offset = drag behind the grid)
    // +15ms to +45ms late, scaled by humanize amount
    const maxDragMs = 45;
    const minDragMs = 15;
    const dragRange = maxDragMs - minDragMs;
    const baseDrag = (minDragMs + dragRange * humanizeAmount) / 1000;
    // Add random variation (±20%)
    offset = baseDrag * (0.8 + rand() * 0.4);
  } else if (pitch === DRUM_PITCHES.SNARE) {
    // SNARE: Aggressive anchor/slingshot - always EARLY (negative offset)
    // Range: -10ms to -25ms based on humanize amount (producer feedback: 00:03:07)
    const minRushMs = 12;
    const maxRushMs = 45;
    const rushRange = maxRushMs - minRushMs;
    const rush = minRushMs + rushRange * humanizeAmount;
    // The same shift every hit (a tenth either way): the early snare is the snap
    offset = -(rush * (0.9 + rand() * 0.2)) / 1000;
  } else if (hihatMode === "limp" && pitch === DRUM_PITCHES.HIHAT_CLOSED) {
    // CLOSED HI-HAT in LIMP mode: Drags late like the kick (walking with a limp)
    // +8ms to +20ms late based on humanize amount (producer feedback: 00:03:51)
    // Open hi-hat stays rigid (accent/anticipation function)
    const maxDragMs = 20;
    const minDragMs = 8;
    const dragRange = maxDragMs - minDragMs;
    const baseDrag = (minDragMs + dragRange * humanizeAmount) / 1000;
    offset = baseDrag * (0.8 + rand() * 0.4);
  } else if (hihatMode === "live") {
    // LIVE mode: Both hi-hats RUSH (negative offset = ahead of grid)
    // Simulates live drummer BioBias where hi-hat hand anticipates the beat
    // (producer feedback: 00:02:12)
    if (pitch === DRUM_PITCHES.HIHAT_CLOSED) {
      // Closed hi-hat rushes more aggressively: -8ms to -26ms
      const maxRushMs = 26;
      const minRushMs = 8;
      const rushRange = maxRushMs - minRushMs;
      const baseRush = (minRushMs + rushRange * humanizeAmount) / 1000;
      offset = -baseRush * (0.8 + rand() * 0.4); // Negative = early
    } else if (pitch === DRUM_PITCHES.HIHAT_OPEN) {
      // Open hi-hat rushes slightly less: -3ms to -8ms (still serves accent role)
      const maxRushMs = 8;
      const minRushMs = 3;
      const rushRange = maxRushMs - minRushMs;
      const baseRush = (minRushMs + rushRange * humanizeAmount) / 1000;
      offset = -baseRush * (0.8 + rand() * 0.4); // Negative = early
    }
  }
  // In friction mode: Hi-hats have no push/pull offset - stay rigid for FRICTION

  return offset;
}

/**
 * Pick the swing-multiplier table for a hi-hat mode
 * @param {string} hihatMode - 'friction', 'limp', or 'live'
 * @returns {Object} Pitch → multiplier
 */
function swingMultipliersFor(hihatMode) {
  if (hihatMode === "limp") return TRACK_SWING_MULTIPLIERS_LIMP;
  if (hihatMode === "live") return TRACK_SWING_MULTIPLIERS_LIVE;
  return TRACK_SWING_MULTIPLIERS;
}

/**
 * The pocket: where a voice sits on a given step once the per-hit jitter is
 * averaged out. It's the steady part of getHumanizedNote (average push/pull
 * plus tuplet swing, no hand, no randomness), so anything that needs to
 * lean with the groove — roll subdivisions, vocal chops — can ask where the
 * pocket is without rolling dice.
 * @param {number} pitch - Drum pitch whose feel to follow
 * @param {number} stepIdx - Step index (any integer; wraps every 16)
 * @param {number} humanizeAmount - 0.0 to 1.0
 * @param {number} bpm - Current tempo
 * @param {string} hihatMode - 'friction', 'limp', or 'live'
 * @param {boolean} swingLocked - If true the voice stays on the grid
 * @returns {number} Offset from the straight grid in seconds
 */
export function getPocketOffset(
  pitch,
  stepIdx,
  humanizeAmount,
  bpm,
  hihatMode = "friction",
  swingLocked = false,
) {
  const isLiveModeKickLock = hihatMode === "live" && pitch === DRUM_PITCHES.KICK;
  if (swingLocked || isLiveModeKickLock || humanizeAmount === 0) return 0;

  const stepDuration = 60 / Math.min(bpm, DILLA_MAX_BPM) / 4;
  const swingMultiplier = swingMultipliersFor(hihatMode)[pitch] || 0.5;

  if (holdsTheOne(pitch, stepIdx, hihatMode)) return 0;
  let offset = getPushPullOffset(pitch, humanizeAmount, hihatMode, () => 0.5);
  if (Math.abs(stepIdx % 2) === 1) {
    const easedHumanize = 1 - (1 - humanizeAmount) ** 3;
    offset +=
      getTupletOffset(stepDuration, humanizeAmount) * easedHumanize * swingMultiplier * 0.15;
  }
  return quantizeToMPCTicks(offset, bpm);
}

/**
 * Get the humanized time and velocity for a note
 * @param {number} trackIdx - Track index (0-3)
 * @param {number} stepIdx - Step index (0-15)
 * @param {number} baseTime - The quantized grid time (AudioContext absolute time)
 * @param {number} humanizeAmount - The swing dial (0.0 = grid, 1.0 = all of it)
 * @param {Object} pitchMap - Map of track index to MIDI pitch
 * @param {number} bpm - Current tempo
 * @param {Object|null} trackSettings - Per-track settings (swingLocked bypasses humanization)
 * @param {string} hihatMode - 'friction', 'limp', or 'live'
 * @param {boolean} eighths - The hats are eighths with nothing between them
 * @param {import("./Hand.js").Hand|null} hand - The desk's hand: with it the hit is leaned, levelled and
 *   drifted as a drummer's; without it, it is the pocket with a roll of the dice
 * @returns {{ time: number, velocity: number }} Humanized playback event
 */
/**
 * How hard a voice plays a step when it is in the pocket: the accent
 * pattern without the per-hit variation. Only the closed hi-hat is shaped
 * by its own pulse; the kick and the snare by the accent of the bar.
 * @param {number} pitch - MIDI pitch of the drum voice
 * @param {number} stepIdx - Step in the bar
 * @param {number} humanizeAmount - 0.0 to 1.0
 * @returns {number} MIDI velocity
 */
export function getPocketVelocity(pitch, stepIdx, humanizeAmount) {
  if (humanizeAmount === 0) return 100;
  if (pitch !== DRUM_PITCHES.HIHAT_CLOSED)
    return Math.round(100 + accent(pitch, stepIdx, humanizeAmount));
  return Math.round(hatPulse(stepIdx, humanizeAmount));
}

/**
 * FRICTION, the feel a desk starts on: the kick on the one holds the grid and the bar
 * hangs off it. LIMP lets that kick drag with the rest; LIVE locks every kick itself.
 */
export function holdsTheOne(pitch, stepIdx, hihatMode) {
  return hihatMode === "friction" && pitch === DRUM_PITCHES.KICK && stepIdx % 16 === 0;
}

// Where the hat hand lands across a beat at full swing: down, e, and, a
const HAT_PULSE = [116, 58, 90, 66];

// The "and" where the hats are eighths with nothing between them: lighter, so two levels still rock
const HAT_AND_ALONE = 74;

// A hat row lit on every 16th is played lighter than one on the eighths: this much off the
// beat and the "and" at the busiest; the "e" and the "a" are light already
const HAT_BUSY_EASE = 0.15;

/**
 * The hat's level on a step: the pulse across each beat, a little more into beats 2 and 4
 * and a little less on 3. `eighths` is for a hat row with nothing lit, and no ghosts asked
 * for, between its eighths; `busy` (0 to 1) is how far past the eighths the row is lit.
 */
export function hatPulse(stepIdx, humanizeAmount, eighths = false, busy = 0) {
  const step = ((stepIdx % 16) + 16) % 16;
  const lean = step === 4 || step === 12 ? 8 : step === 2 || step === 10 ? 4 : step === 8 ? -8 : 0;
  let level = (eighths && step % 4 === 2 ? HAT_AND_ALONE : HAT_PULSE[step % 4]) + lean;
  if (step % 2 === 0) level *= 1 - HAT_BUSY_EASE * busy;
  return 100 + (level - 100) * Math.min(1, humanizeAmount * 1.4);
}

/**
 * How much harder or softer than level a drawn kick or snare is hit, with the dial up:
 * the one hardest and a pickup kick soft; four a little over two, and a snare off the
 * backbeat soft. Other drums are level.
 */
export function accent(pitch, stepIdx, humanizeAmount) {
  const step = ((stepIdx % 16) + 16) % 16;
  let by = 0;
  if (pitch === DRUM_PITCHES.KICK) by = step === 0 ? 12 : step % 4 === 0 ? 4 : -14;
  else if (pitch === DRUM_PITCHES.SNARE) by = step === 12 ? 8 : step === 4 ? 2 : -12;
  return by * Math.min(1, humanizeAmount * 1.4);
}

export function getHumanizedNote(
  trackIdx,
  stepIdx,
  baseTime,
  humanizeAmount,
  pitchMap,
  bpm,
  trackSettings = null,
  hihatMode = "friction",
  eighths = false,
  hand = null,
) {
  const defaultVelocity = 100;
  const targetPitch = pitchMap[trackIdx];

  // Check if track has swing locked - return grid time if so
  const isSwingLocked = trackSettings?.[trackIdx]?.swingLocked ?? false;

  // Live mode auto-locks kick for cohesive groove (rushing hats + steady kick)
  const isLiveModeKickLock = hihatMode === "live" && targetPitch === DRUM_PITCHES.KICK;

  // A row the maker locked is on the grid and level
  if (isSwingLocked) {
    return { time: baseTime, velocity: defaultVelocity };
  }
  // LIVE holds the kick's timing, not how hard it is hit
  if (isLiveModeKickLock) {
    const level =
      defaultVelocity +
      accent(targetPitch, stepIdx, humanizeAmount) +
      (hand?.switchOf(targetPitch, stepIdx) ?? 0) * humanizeAmount;
    return { time: baseTime, velocity: Math.round(level) };
  }

  // Safety check - return grid time at 0% humanize
  if (humanizeAmount === 0) {
    return { time: baseTime, velocity: defaultVelocity };
  }

  // Use effective BPM capped at 96 for timing calculations
  // At higher tempos, this preserves the groove feel by making offsets
  // represent the same proportion of the beat as at 96 BPM
  const effectiveBpm = Math.min(bpm, DILLA_MAX_BPM);
  const stepDuration = 60 / effectiveBpm / 4;
  // Select swing multipliers based on mode
  const swingMultiplier = swingMultipliersFor(hihatMode)[targetPitch] || 0.5;

  // 1. Push/Pull: Dilla "Drunk" Formula (includes closed hi-hat drag in limp mode)
  const onTheOne = holdsTheOne(targetPitch, stepIdx, hihatMode);
  const pushPullOffset = onTheOne ? 0 : getPushPullOffset(targetPitch, humanizeAmount, hihatMode);

  // 2. Tuplet swing (apply only to off-beat steps)
  let tupletSwing = 0;
  if (stepIdx % 2 === 1) {
    const baseTupletOffset = getTupletOffset(stepDuration, humanizeAmount);
    const easedHumanize = 1 - (1 - humanizeAmount) ** 3;
    tupletSwing = baseTupletOffset * easedHumanize * swingMultiplier * 0.15;
  }

  // 3. The hand's lean off the step, scaled as the swing is for this drum in this mode
  // The lean is a share of a 16th at the tempo playing, not of the capped one the pocket uses
  const lean = hand ? hand.lean(targetPitch, stepIdx, 60 / bpm / 4) : 0;
  const leanOffset = lean * humanizeAmount * swingMultiplier;

  // 4. The small movement from hit to hit: some more of the lean (10ms of it at most) and
  // the limb's drift; with no hand, a roll of the dice
  let microVariation = 0;
  if (hand) {
    const cappedLean = Math.max(-0.01, Math.min(0.01, lean));
    microVariation =
      cappedLean * HAND_BLEND.microTimingWeight * humanizeAmount +
      hand.drift(targetPitch, humanizeAmount) * swingMultiplier;
  } else {
    microVariation = getMicroVariation(humanizeAmount) * swingMultiplier;
  }

  // 6. Combine all timing offsets
  const rawOffset = onTheOne ? 0 : pushPullOffset + leanOffset + tupletSwing + microVariation;

  // 7. Quantize to MPC 3000 resolution for authentic "chunky" feel
  const totalOffset = quantizeToMPCTicks(rawOffset, bpm);
  const humanizedTime = baseTime + totalOffset;

  // 8. Calculate velocity
  let finalVelocity = defaultVelocity;

  if (targetPitch === DRUM_PITCHES.HIHAT_CLOSED) {
    // Closed hi-hat uses AMPLITUDE MODULATION (formula-driven for Dilla friction)
    // A hand's pulse across the beat, not loud and whisper
    // With a hand, lighter where the row is busy, and uneven as a hand is: hard then soft
    finalVelocity =
      hatPulse(stepIdx, humanizeAmount, eighths, hand?.busy ?? 0) +
      (hand ? hand.touch() : gaussianRandom()) * 5 * humanizeAmount;
  } else {
    // Kick and snare have a shape of their own, so a bar has accents with or without the model
    const level = defaultVelocity + accent(targetPitch, stepIdx, humanizeAmount);
    finalVelocity = level + gaussianRandom() * 3 * humanizeAmount;
    // The hand's level for this drum on this step is laid over it
    const laid = hand ? hand.level(targetPitch, stepIdx) : null;
    if (laid && humanizeAmount > 0) {
      const weight = HAND_BLEND.velocityWeight * humanizeAmount;
      finalVelocity = finalVelocity * (1 - weight) + laid * weight;
    }
  }

  // A switched bar (ADR-0078) is played a little differently, by as much as the swing dial is up
  finalVelocity += (hand?.switchOf(targetPitch, stepIdx) ?? 0) * humanizeAmount;

  return {
    time: humanizedTime,
    velocity: Math.round(Math.max(1, Math.min(127, finalVelocity))),
  };
}
