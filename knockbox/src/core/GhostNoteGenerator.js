/**
 * Ghost Note Generator
 * Creates "connective tissue" ghost notes that smooth the groove
 * Based on J Dilla / MPC 3000 drumming techniques
 *
 * Ghost quantity (0-100%) controls HOW MANY ghosts appear
 * Humanize dial controls WHERE they land (timing) and HOW LOUD (velocity)
 * Ghost notes always have minimum 30% timing offset to preserve syncopation character
 */

import { DRUM_PITCHES, TRACK_TO_PITCH } from "../constants/drums.js";
import { handSequence } from "./Hand.js";
import { HAND_BLEND } from "./HumanizeEngine.js";
import { gaussianProbability, gaussianVelocity } from "./MathUtils.js";

// Minimum timing offset ratio - ghosts are always slightly off-grid
const MIN_OFFSET_RATIO = 0.3;

/**
 * Find nearest hit velocity for a given pitch and step
 * Used to inherit a neighbour's accent for ghost notes
 * @param {Object} played - The played bar (handSequence)
 * @param {number} pitch - MIDI pitch to match
 * @param {number} step - Current step index
 * @param {number} stepDuration - Duration of one step in seconds
 * @param {number} defaultVelocity - Fallback velocity if no hit found
 * @returns {number} the neighbour's level or default
 */
function levelBeside(played, pitch, step, stepDuration, defaultVelocity = 50) {
  if (!played?.notes) return defaultVelocity;

  const beside = played.notes.find((note) => {
    if (note.pitch !== pitch) return false;
    const noteStep = Math.round(note.startTime / (played.stepSeconds ?? stepDuration));
    // Look for hits within 1 step of the ghost position
    return Math.abs(noteStep - step) <= 1;
  });

  return beside?.velocity ?? defaultVelocity;
}

/**
 * Blend formula velocity with the neighbour's level
 * @param {number} formulaVelocity - Base velocity from formula
 * @param {number} besideLevel - Velocity from played bar
 * @returns {number} Blended velocity
 */
function blendGhostVelocity(formulaVelocity, besideLevel) {
  const weight = HAND_BLEND.ghostVelocityWeight;
  return formulaVelocity * (1 - weight) + besideLevel * weight;
}

/**
 * Quantize offset to MPC 3000 resolution (96 PPQN)
 * This creates the "chunky", committed feel of hardware timing
 * @param {number} offsetSeconds - The offset to quantize (in seconds)
 * @param {number} bpm - Current tempo
 * @returns {number} Quantized offset in seconds
 */
function quantizeToMPCTicks(offsetSeconds, bpm) {
  const PPQN = 96;
  const tickDuration = 60 / bpm / PPQN;
  const ticks = Math.round(offsetSeconds / tickDuration);
  return ticks * tickDuration;
}

/**
 * Get effective offset ratio - ensures ghosts are always off-grid
 * @param {number} humanizeAmount - Global humanize dial value (0-1)
 * @returns {number} Effective offset ratio (minimum 0.3)
 */
function getEffectiveOffsetRatio(humanizeAmount) {
  return Math.max(MIN_OFFSET_RATIO, humanizeAmount);
}

/** The loudest a ghost may be: a filling hat, and a ghost snare */
export const GHOST_HAT_CEILING = 70;
export const GHOST_SNARE_CEILING = 34;
const GHOST_SNARE_FLOOR = 20;

/**
 * Extract ghost notes based on per-track ghostQuantity settings
 * @param {Object} originalSteps - The original step pattern from the store
 * @param {number} bpm - Current tempo
 * @param {number} humanizeAmount - Controls ghost timing offsets and velocity (0-1)
 * @param {Object|null} trackSettings - Per-track ghost quantity settings
 * @param {string} hihatMode - 'friction', 'limp', or 'live'
 * @returns {Array<{pitch: number, step: number, startTime: number, velocity: number}>} Ghost notes to play
 */
export function extractGhostNotes(
  originalSteps,
  bpm,
  humanizeAmount,
  trackSettings = null,
  hihatMode = "friction",
) {
  const stepDuration = 60 / bpm / 4; // 16th note duration
  const ghostNotes = [];
  const offsetRatio = getEffectiveOffsetRatio(humanizeAmount);
  // A ghost takes half its level from the hit beside it, at the level a hand gives that hit (ADR-0075)
  const played = handSequence(originalSteps, stepDuration, TRACK_TO_PITCH);

  // 1. SNARE GHOSTS (track 1)
  const snareQuantity = (trackSettings?.[1]?.ghostQuantity ?? 0) / 100;
  if (snareQuantity > 0) {
    ghostNotes.push(
      ...generateSnareGhosts(originalSteps, stepDuration, offsetRatio, snareQuantity, bpm, played),
    );
  }

  // 2. KICK GHOSTS (track 0)
  const kickQuantity = (trackSettings?.[0]?.ghostQuantity ?? 0) / 100;
  if (kickQuantity > 0) {
    ghostNotes.push(
      ...generateKickGhosts(originalSteps, stepDuration, offsetRatio, kickQuantity, bpm, played),
    );
  }

  // 3. CLOSED HI-HAT GHOSTS (track 2) - respects hihatMode
  const closedHihatQuantity = (trackSettings?.[2]?.ghostQuantity ?? 0) / 100;
  if (closedHihatQuantity > 0) {
    ghostNotes.push(
      ...generateClosedHiHatGhosts(
        originalSteps,
        stepDuration,
        offsetRatio,
        closedHihatQuantity,
        bpm,
        hihatMode,
      ),
    );
  }

  // 4. OPEN HI-HAT GHOSTS (track 3) - respects hihatMode for live mode rush
  const openHihatQuantity = (trackSettings?.[3]?.ghostQuantity ?? 0) / 100;
  if (openHihatQuantity > 0) {
    ghostNotes.push(
      ...generateOpenHiHatGhosts(
        originalSteps,
        stepDuration,
        offsetRatio,
        openHihatQuantity,
        bpm,
        hihatMode,
        played,
      ),
    );
  }

  // A ghost snare or hat is felt more than heard, whatever the model's nearest hit was.
  // A ghost kick (the stumble) and a ghost open hat (the slurp) are meant to be heard
  return ghostNotes.map((ghost) => {
    if (ghost.pitch === DRUM_PITCHES.HIHAT_CLOSED) {
      return { ...ghost, velocity: Math.min(ghost.velocity, GHOST_HAT_CEILING) };
    }
    if (ghost.pitch !== DRUM_PITCHES.SNARE || ghost.velocity <= GHOST_SNARE_CEILING) return ghost;
    // Brought down into the top of a ghost's range, not all to the one level
    const span = GHOST_SNARE_CEILING - GHOST_SNARE_FLOOR;
    return { ...ghost, velocity: Math.round(GHOST_SNARE_FLOOR + Math.random() * span) };
  });
}

/**
 * Generate SNARE ghost notes - the "drag" and "ruff"
 * Simulates drummer's left hand performing rudiments before/after backbeat
 * @param {Object} originalSteps - Step pattern
 * @param {number} stepDuration - Duration of one 16th note
 * @param {number} offsetRatio - Timing offset multiplier (0.3-1.0)
 * @param {number} quantity - Ghost quantity (0-1)
 * @param {number} bpm - Current tempo
 * @param {Object} played - played bar for velocity blending
 * @returns {Array} Snare ghost notes
 */
export function generateSnareGhosts(
  originalSteps,
  stepDuration,
  offsetRatio,
  quantity,
  bpm,
  played = null,
) {
  const ghosts = [];
  const baseProbability = 0.6; // Max probability at 100% quantity

  // Main snare positions (backbeats: beats 2 and 4)
  const mainSnareSteps = [4, 12];

  mainSnareSteps.forEach((mainStep) => {
    // === PRE-BEAT DRAG (step before main snare) ===
    const preDragStep = mainStep - 1; // Steps 3 and 11

    if (!originalSteps[`track-1_${preDragStep}`]?.active) {
      if (gaussianProbability(baseProbability * quantity)) {
        const lateOffset = stepDuration * 0.3 * offsetRatio;
        const baseTime = preDragStep * stepDuration + lateOffset;
        const quantizedTime = quantizeToMPCTicks(baseTime, bpm);

        // Velocity: blend the formula with the hit beside it
        // σ=22 for aggressive ghost dynamics (producer feedback: 00:08:41)
        const formulaVelocity = 25 + offsetRatio * 10;
        const besideLevel = levelBeside(
          played,
          DRUM_PITCHES.SNARE,
          preDragStep,
          stepDuration,
          formulaVelocity,
        );
        const blendedVelocity = blendGhostVelocity(formulaVelocity, besideLevel);

        ghosts.push({
          pitch: DRUM_PITCHES.SNARE,
          step: preDragStep,
          startTime: quantizedTime,
          velocity: gaussianVelocity(blendedVelocity, 22),
        });
      }
    }

    // === POST-BEAT CHATTER (step after main snare) ===
    const postChatterStep = mainStep + 1; // Steps 5 and 13

    if (!originalSteps[`track-1_${postChatterStep}`]?.active) {
      if (gaussianProbability(baseProbability * quantity * 0.7)) {
        const lateOffset = stepDuration * 0.2 * offsetRatio;
        const baseTime = postChatterStep * stepDuration + lateOffset;
        const quantizedTime = quantizeToMPCTicks(baseTime, bpm);

        const formulaVelocity = 22 + offsetRatio * 8;
        const besideLevel = levelBeside(
          played,
          DRUM_PITCHES.SNARE,
          postChatterStep,
          stepDuration,
          formulaVelocity,
        );
        const blendedVelocity = blendGhostVelocity(formulaVelocity, besideLevel);

        ghosts.push({
          pitch: DRUM_PITCHES.SNARE,
          step: postChatterStep,
          startTime: quantizedTime,
          velocity: gaussianVelocity(blendedVelocity, 20),
        });
      }
    }
  });

  return ghosts;
}

/**
 * Generate KICK ghost notes - the "stumble"
 * Creates "falling down stairs" sensation, destabilizes groove just enough
 * @param {Object} originalSteps - Step pattern
 * @param {number} stepDuration - Duration of one 16th note
 * @param {number} offsetRatio - Timing offset multiplier (0.3-1.0)
 * @param {number} quantity - Ghost quantity (0-1)
 * @param {number} bpm - Current tempo
 * @param {Object} played - played bar for velocity blending
 * @returns {Array} Kick ghost notes
 */
export function generateKickGhosts(
  originalSteps,
  stepDuration,
  offsetRatio,
  quantity,
  bpm,
  played = null,
) {
  const ghosts = [];
  const baseProbability = 0.5; // Max probability at 100% quantity

  // Ghost kick candidates - weak 16ths ("e" and "a" subdivisions)
  const ghostKickCandidates = [
    { step: 15, weight: 0.8 }, // "a" of beat 4 - MOST COMMON
    { step: 7, weight: 0.5 }, // "a" of beat 2
    { step: 3, weight: 0.4 }, // "a" of beat 1
    { step: 11, weight: 0.45 }, // "a" of beat 3
  ];

  ghostKickCandidates.forEach((candidate) => {
    if (originalSteps[`track-0_${candidate.step}`]?.active) return;

    const probability = baseProbability * quantity * candidate.weight;

    if (gaussianProbability(probability)) {
      const lateOffset = stepDuration * 0.25 * offsetRatio;
      const baseTime = candidate.step * stepDuration + lateOffset;
      const quantizedTime = quantizeToMPCTicks(baseTime, bpm);

      // Kick ghosts are louder than snare ghosts
      // σ=25 for maximum "stumble" dynamics
      const formulaVelocity = 60 + offsetRatio * 15;
      const besideLevel = levelBeside(
        played,
        DRUM_PITCHES.KICK,
        candidate.step,
        stepDuration,
        formulaVelocity,
      );
      const blendedVelocity = blendGhostVelocity(formulaVelocity, besideLevel);

      ghosts.push({
        pitch: DRUM_PITCHES.KICK,
        step: candidate.step,
        startTime: quantizedTime,
        velocity: gaussianVelocity(blendedVelocity, 25),
      });
    }
  });

  return ghosts;
}

/**
 * Generate CLOSED HI-HAT ghost notes - the "skip"
 * Creates shuffle/friction texture that contrasts with straight main hats
 * In limp mode, adds extra late offset to match main note drag
 * @param {Object} originalSteps - Step pattern
 * @param {number} stepDuration - Duration of one 16th note
 * @param {number} offsetRatio - Timing offset multiplier (0.3-1.0)
 * @param {number} quantity - Ghost quantity (0-1)
 * @param {number} bpm - Current tempo
 * @param {string} hihatMode - 'friction' (default) or 'limp' (adds late drag)
 * @returns {Array} Closed hi-hat ghost notes
 */
export function generateClosedHiHatGhosts(
  originalSteps,
  stepDuration,
  offsetRatio,
  quantity,
  bpm,
  hihatMode = "friction",
) {
  const ghosts = [];
  // At the top of the dial nearly every pocket between the hats is filled
  const baseProbability = 0.92;

  // SKIPPING GHOSTS - "e" and "a" 16th notes (odd steps)
  const skipCandidates = [1, 3, 5, 7, 9, 11, 13, 15];

  skipCandidates.forEach((step) => {
    if (originalSteps[`track-2_${step}`]?.active) return;

    if (gaussianProbability(baseProbability * quantity)) {
      // Where the fill sits says the mode. Friction: swung late against straight hats.
      // Limp: later still. Live: ahead of the grid, the hand hurrying into the next hit
      let offset = ((15 + Math.random() * 20) / 1000) * offsetRatio;
      if (hihatMode === "limp") offset += (8 + Math.random() * 4) / 1000;
      else if (hihatMode === "live") offset = -((10 + Math.random() * 12) / 1000) * offsetRatio;

      // The hand's own pulse: the "e" is the lightest touch, the "a" leans into the next beat
      const level = (step % 4 === 1 ? 42 : 58) + (Math.random() - 0.5) * 12;

      ghosts.push({
        pitch: DRUM_PITCHES.HIHAT_CLOSED,
        step: step,
        startTime: quantizeToMPCTicks(step * stepDuration + offset, bpm),
        velocity: Math.round(level),
      });
    }
  });

  return ghosts;
}

/**
 * Generate OPEN HI-HAT ghost notes - the "slurp"
 * Creates "breathing" texture - short open hat choked by following kick
 * In live mode, ghosts rush early like a live drummer
 * @param {Object} originalSteps - Step pattern
 * @param {number} stepDuration - Duration of one 16th note
 * @param {number} offsetRatio - Timing offset multiplier (0.3-1.0)
 * @param {number} quantity - Ghost quantity (0-1)
 * @param {number} bpm - Current tempo
 * @param {string} hihatMode - 'friction' (default), 'limp', or 'live' (adds early rush)
 * @param {Object} played - played bar for velocity blending
 * @returns {Array} Open hi-hat ghost notes
 */
export function generateOpenHiHatGhosts(
  originalSteps,
  stepDuration,
  offsetRatio,
  quantity,
  bpm,
  hihatMode = "friction",
  played = null,
) {
  const ghosts = [];
  const baseProbability = 0.4;

  // SLURP GHOSTS - Open hat on "a" before downbeats
  const slurpCandidates = [3, 7, 11, 15];
  slurpCandidates.forEach((step) => {
    if (originalSteps[`track-3_${step}`]?.active) return;
    if (originalSteps[`track-2_${step}`]?.active) return;

    if (gaussianProbability(baseProbability * quantity)) {
      const lateOffset = stepDuration * 0.15 * offsetRatio;

      // Mode-specific offset for open hi-hat ghosts
      let modeOffset = 0;
      if (hihatMode === "live") {
        // Live mode: ghosts rush early (-3 to -8ms) like a live drummer
        modeOffset = -(3 + Math.random() * 5) / 1000;
      }
      // In friction and limp modes, open hi-hat ghosts stay on their default timing
      // (open hi-hat serves accent/anticipation role, doesn't drag in limp mode)

      const baseTime = step * stepDuration + lateOffset + modeOffset;

      const formulaVelocity = 55 + offsetRatio * 20;
      const besideLevel = levelBeside(
        played,
        DRUM_PITCHES.HIHAT_OPEN,
        step,
        stepDuration,
        formulaVelocity,
      );
      const blendedVelocity = blendGhostVelocity(formulaVelocity, besideLevel);

      ghosts.push({
        pitch: DRUM_PITCHES.HIHAT_OPEN,
        step: step,
        startTime: quantizeToMPCTicks(baseTime, bpm),
        velocity: gaussianVelocity(blendedVelocity, 25),
      });
    }
  });

  return ghosts;
}

// The turn (ADR-0078, ADR-0079): soft notes in the last beat of the bar that goes back to the
// top. Each comes in at a set point on a ghost dial, so the same dials always give the same notes
const TURN_NOTES = [
  // A snare ghost just before the one
  { track: 1, dials: [1], from: 30, step: 15, level: 30, late: 0.2 },
  // A kick pickup
  { track: 0, dials: [0], from: 50, step: 14, level: 36, late: 0.1 },
  // The hat opening on the last 16th: either hat row's dial
  { track: 3, dials: [2, 3], from: 70, step: 15, level: 42, late: 0 },
];

/**
 * The notes he adds at the turn, for the pads and the dials as they stand. Never where a
 * pad is lit on that row, never on a row with nothing lit. Nothing is left to chance: a
 * pad lit or put out elsewhere does not change them (ADR-0079).
 * @param {Object} originalSteps - The store's pads
 * @param {number} bpm
 * @param {number} humanizeAmount - 0 to 1
 * @param {Object|null} trackSettings - Per-track ghost dials
 * @returns {Array<{pitch: number, track: number, step: number, startTime: number, velocity: number}>}
 */
export function extractTurnNotes(originalSteps, bpm, humanizeAmount, trackSettings = null) {
  const stepDuration = 60 / bpm / 4;
  const offsetRatio = getEffectiveOffsetRatio(humanizeAmount);
  const lit = (track, step) => originalSteps[`track-${track}_${step}`]?.active;
  const rowLit = (track) =>
    Array.from({ length: 16 }, (_, step) => step).some((s) => lit(track, s));
  const notes = [];
  for (const { track, dials, from, step, level, late } of TURN_NOTES) {
    const dial = Math.max(...dials.map((row) => trackSettings?.[row]?.ghostQuantity ?? 0));
    // The open hat belongs to whichever hat row is played
    const played = track === 3 ? rowLit(2) || rowLit(3) : rowLit(track);
    if (dial < from || !played || lit(track, step)) continue;
    notes.push({
      pitch: TRACK_TO_PITCH[track],
      track,
      step,
      startTime: quantizeToMPCTicks(step * stepDuration + stepDuration * late * offsetRatio, bpm),
      velocity: level,
    });
  }
  return notes;
}
