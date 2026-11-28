/**
 * Articulations
 * Turns one programmed hit into a drummer's gesture: a flam, a drag, a
 * roll, or a triplet that rises. Grace notes hang off the humanized main hit; roll subdivisions are
 * spread between this step's actual time and the *pocket* of a later step,
 * so they stretch and lean exactly as the swing does instead of sitting on
 * a straight sub-grid.
 */

/** Articulation ids, in the order the NOTE REPEAT keys show them */
export const ARTICULATIONS = ["flam", "drag", "roll2", "roll3", "trip"];

// Roll shapes: `hits` evenly spaced across `span` steps (the first is the main hit)
const ROLLS = {
  roll2: { hits: 2, span: 1 },
  roll3: { hits: 3, span: 1 },
  trip: { hits: 3, span: 2 }, // the lazy triplet: three hits over two 16ths
};

// Grace notes: how far ahead of the main hit, and how hard
const GRACE_GAP_MIN_MS = 18;
const GRACE_GAP_MAX_MS = 40;
const GRACE_VELOCITY = 0.5;
const DRAG_FIRST_VELOCITY = 0.4;

// Each roll hit is this much quieter than the one before it
const ROLL_DECAY = 0.8;
const MIN_VELOCITY = 24;
// The triplet is played the other way: each hit harder than the last, in even steps, up to the step's own loudness
const TRIP_RAMP = [0.6, 0.8, 1];

const scale = (v) => Math.round(Math.max(MIN_VELOCITY, v));

/**
 * How hard the main hit of a step is played under its articulation: a
 * triplet starts soft and rises; every other key leaves it as it is.
 * @param {string|null} art - Articulation id, or null for a plain hit
 * @param {number} velocity - The step's MIDI velocity
 */
export function mainVelocity(art, velocity) {
  return art === "trip" ? scale(velocity * TRIP_RAMP[0]) : velocity;
}

/**
 * Extra hits an articulation adds around a main hit.
 * @param {string|null} art - Articulation id, or null for a plain hit
 * @param {Object} hit - The humanized main hit
 * @param {number} hit.time - When the main hit lands (seconds)
 * @param {number} hit.velocity - Its MIDI velocity
 * @param {number} hit.baseTime - Straight-grid time of its step (seconds)
 * @param {number} hit.stepDuration - Length of one 16th at the real tempo
 * @param {number} hit.humanizeAmount - 0.0 to 1.0; looser feel widens flams
 * @param {Function} pocketAt - `(stepsAhead) => seconds`: pocket offset of the step that many 16ths later
 * @returns {Array<{time: number, velocity: number}>} Extra hits (never includes the main one)
 */
export function expandArticulation(art, hit, pocketAt) {
  const { time, velocity, baseTime, stepDuration, humanizeAmount } = hit;
  if (art === "flam" || art === "drag") {
    const gap = (GRACE_GAP_MIN_MS + (GRACE_GAP_MAX_MS - GRACE_GAP_MIN_MS) * humanizeAmount) / 1000;
    const graces = [{ time: time - gap, velocity: scale(velocity * GRACE_VELOCITY) }];
    if (art === "drag") {
      graces.unshift({ time: time - gap * 2, velocity: scale(velocity * DRAG_FIRST_VELOCITY) });
    }
    return graces;
  }

  const roll = ROLLS[art];
  if (!roll) return [];

  // The roll ends where the step `span` 16ths later sits in the pocket
  const end = baseTime + roll.span * stepDuration + pocketAt(roll.span);
  const extras = [];
  for (let k = 1; k < roll.hits; k++) {
    extras.push({
      time: time + ((end - time) * k) / roll.hits,
      velocity: scale(velocity * (art === "trip" ? TRIP_RAMP[k] : ROLL_DECAY ** k)),
    });
  }
  return extras;
}
