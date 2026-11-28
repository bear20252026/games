/**
 * The drummer's takes (ADR-0057): from what was heard in a loop, four ways to
 * play along, each a pattern for the four drum rows and a setting for the
 * dials a maker already has. Written rules over a small library; no model,
 * no chance, no DOM: the same loop gets the same takes.
 */

const STEPS = 16;
export const TAKES_A_TIME = 4;

/**
 * The library. A family is a way of playing; each has the kicks it may choose
 * between (most usual first), and the snares, hats and hi-hat modes he goes
 * through as he is asked again. Rows are sixteen steps: "x" is a hit, and a
 * letter is a hit with a NOTE REPEAT key on it (f flam, d drag, 2 and 3 the
 * rolls, t the triplet).
 */
export const FAMILIES = {
  boombap: {
    kicks: [
      "x......x..x.....",
      "x.........x.....",
      "x..x......x.....",
      "x......x..x..x..",
      "x.x.......x.....",
      "x.......x.x.....",
    ],
    snares: ["....x.......x...", "....x.......f..."],
    hats: ["x.x.x.x.x.x.x.2.", "xxxxxxxxxxxxxxxx", "x.x.x.x.x.x.x.x."],
    open: "................",
    modes: ["friction", "limp"],
    ghost: { snare: 40, hat: 0 },
  },
  lean: {
    kicks: [
      "x.....x...x.....",
      "x..x..x...x.....",
      "x.........x..x..",
      "x.....x..x......",
      "x.....x....x....",
      "x.x...x...x.....",
    ],
    snares: ["....x..d....x...", "....x.......x..."],
    hats: ["x.x.x.xxx.x.x.t.", "xxxxxxxxxxxxxxxx", "x.x.x.x.x.x.x.x."],
    open: "................",
    modes: ["limp", "friction"],
    ghost: { snare: 60, hat: 60 },
  },
  halftime: {
    // At twice the tempo these are the kicks of a trap beat
    kicks: [
      "x.........x.....",
      "x.....x.........",
      "x..x............",
      "x.........x..x..",
      "x.....x.....x...",
      "x..x..x.....x...",
    ],
    snares: ["........x.......", "........x.....d."],
    hats: ["xxxxxxxxxxxxxxxx", "x.x.x.x.x.x.3.x.", "x.xxx.x.x.xxx.x."],
    open: "..............x.",
    modes: ["friction", "live"],
    ghost: { snare: 40, hat: 30 },
  },
  bounce: {
    kicks: [
      "x..x..x...x..x..",
      "x.....x..x...x..",
      "x..x......x..x..",
      "x.x....x..x.....",
      "x..x...x..x.....",
      "x.....x...xx....",
    ],
    snares: ["....f.......x...", "....x.......x..."],
    hats: ["x.xxx.xxx.xxx.xx", "xxxxxxx2xxxxxxx3", "x.x.x.x.x.x.x.x."],
    open: "..............x.",
    modes: ["live", "limp"],
    ghost: { snare: 40, hat: 100 },
  },
  // Four on the floor, for a dance tempo: the kick on every beat with the snare on two of them,
  // closed hats on the beat and open ones off it, and played straight
  floor: {
    kicks: [
      "x...x...x...x...",
      "x...x...x...x.x.",
      "x...x..xx...x...",
      "x...x...x..xx...",
      "x...x...x...x..x",
      "x..xx...x...x...",
    ],
    snares: ["....x.......x...", "....x.......f..."],
    hats: ["x...x...x...x...", "xx.xxx.xxx.xxx.x", "x..xx..xx..xx..x"],
    open: "..x...x...x...x.",
    modes: ["friction", "live"],
    ghost: { snare: 0, hat: 20 },
    swing: 10,
  },
};

/** The NOTE REPEAT key each letter of a row stands for */
const ARTS = { f: "flam", d: "drag", 2: "roll2", 3: "roll3", t: "trip" };

const steps = (row) => [...row].flatMap((c, i) => (c === "." ? [] : [i]));

// A kick is worth placing where the bass stands this far above the loop's average,
// and one with no bass under it costs the row no more than this
const KICK_MARGIN = 0.1;
// What a family's usual kick has over its others: he plays the usual thing unless the loop says otherwise
const USUAL = 0.12;

// The share of a loop's sound that is low end before it has a bass line to speak of
const BASS_TO_SPEAK_OF = 0.1;

/** Whether a loop has a bass line for a kick to go with: a voice or a thin melody has none */
export function hasBass(heard) {
  return (heard.bass ?? 1) >= BASS_TO_SPEAK_OF;
}

/**
 * How well a kick row sits with a loop's low end. The one is always played; each
 * kick after it counts for how far the bass on its step stands above the loop's
 * average, and a little against the row where it does not. So a kick goes with a
 * bass note, and a low end that is busy everywhere gets few.
 */
export function kickFit(row, heard) {
  const average = heard.low.reduce((sum, v) => sum + v, 0) / heard.low.length;
  return steps(row)
    .filter((step) => step !== 0)
    .reduce(
      (sum, step) => sum + Math.max(-KICK_MARGIN, heard.low[step] - average - KICK_MARGIN),
      0,
    );
}

/** The families in the order they suit a loop at this tempo */
export function familyOrder(heard, bpm) {
  const suits = {
    // The usual thing, most of all in the middle tempos
    boombap: 1 - Math.abs(bpm - 90) / 60,
    // Slow, and a loop that itself sits late
    lean: 1 - Math.abs(bpm - 78) / 50 + Math.max(0, heard.lean) * 2,
    // Room to fill: a slow or a sparse loop. Quick enough, the same thing is a trap beat
    halftime:
      Math.max(1 - Math.abs(bpm - 70) / 60, 1 - Math.abs(bpm - 140) / 40) +
      (heard.busy.mid < 0.35 ? 0.3 : 0),
    // Quick, and a top end left open for the hats
    bounce: 1 - Math.abs(bpm - 108) / 50 + (heard.busy.high < 0.35 ? 0.2 : 0),
    // A dance tempo
    floor: 1 - Math.abs(bpm - 122) / 35,
  };
  return Object.keys(suits).sort((a, b) => suits[b] - suits[a]);
}

/**
 * How far up the swing dial goes: more for a loop whose off-beats sit late.
 * A way of playing that is played straight has its own, low place to start from.
 */
export function swingFor(heard, mode, straight = null) {
  const late = Math.max(0, Math.min(0.3, heard.lean));
  const base = straight ?? (mode === "limp" ? 70 : mode === "live" ? 60 : 55);
  return Math.round(Math.min(100, base + late * 100));
}

// How far off the grid a loop's off-beats sit, as a share of a step, before it counts as late or early
const SITS_OFF = 0.06;

/**
 * Whose pocket a loop should lean on (its FOLLOW key): a loop that sits late lies
 * back with the kick, one that sits early pushes with the snare, and a straight
 * one keeps time with the hats.
 * @param {Object} heard - From listenToLoop
 * @returns {"kick" | "snare" | "hat"}
 */
export function followFor(heard) {
  if (heard.lean >= SITS_OFF) return "kick";
  if (heard.lean <= -SITS_OFF) return "snare";
  return "hat";
}

/**
 * The drummer's takes for a loop.
 * @param {Object} heard - From listenToLoop
 * @param {number} bpm - The session's tempo
 * @param {number} [round=0] - Asked again, he brings each family's next kick, hats, snare and mode
 * @returns {Array<{family: string, rows: string[], mode: string, swing: number, ghost: Object}>}
 *   rows are kick, snare, hat, open hat; ghost is keyed by drum row (1 snare, 2 hat)
 */
export function drumTakes(heard, bpm, round = 0) {
  return familyOrder(heard, bpm)
    .slice(0, TAKES_A_TIME)
    .map((name) => takeOf(name, heard, round));
}

// What he goes by where there is no loop to hear: nothing in the bar, so each family's usual things
const NOTHING_HEARD = {
  low: Array(STEPS).fill(0),
  mid: Array(STEPS).fill(0),
  high: Array(STEPS).fill(0),
  busy: { low: 0, mid: 0, high: 0 },
  lean: 0,
  bass: 0,
};

/**
 * One way of playing, as a take.
 * @param {string} name - The family
 * @param {Object|null} heard - From listenToLoop; null where there is no loop
 * @param {number} [round=0]
 */
export function takeOf(name, heard, round = 0) {
  heard ??= NOTHING_HEARD;
  const crowded = heard.busy.high > 0.5;
  const family = FAMILIES[name];
  const worth = (row) => kickFit(row, heard) + (row === family.kicks[0] ? USUAL : 0);
  // With no bass line to go by, the family's kicks in their usual order
  const kicks = hasBass(heard)
    ? [...family.kicks].sort((a, b) => worth(b) - worth(a))
    : family.kicks;
  // Under a busy top end he fills little between his hats; an open one has him fill it
  const { hats } = family;
  const fill = crowded ? Math.min(family.ghost.hat, 30) : family.ghost.hat;
  // Each part comes round at its own pace, so it is a long while before a take is heard twice
  const mode = family.modes[(round >> 1) % family.modes.length];
  return {
    family: name,
    rows: [
      kicks[round % kicks.length],
      family.snares[round % family.snares.length],
      hats[round % hats.length],
      family.open,
    ],
    mode,
    swing: swingFor(heard, mode, family.swing),
    ghost: { 1: family.ghost.snare, 2: fill },
  };
}

/** The ids of the pads a take lights, as the store names them */
export function takePads(take) {
  return take.rows.flatMap((row, track) => steps(row).map((step) => `track-${track}_${step}`));
}

/** The NOTE REPEAT key on each pad of a take that has one, by pad id */
export function takeArts(take) {
  const arts = {};
  take.rows.forEach((row, track) => {
    [...row].forEach((c, step) => {
      if (ARTS[c]) arts[`track-${track}_${step}`] = ARTS[c];
    });
  });
  return arts;
}

export { STEPS };
