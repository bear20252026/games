/**
 * The drummer's ideas for a desk that is too bare or too full (see
 * docs/design/drummer-suggests/follows-on.html). Bare, he adds the part that
 * is missing and nothing else; full, he only takes pads off. What is too
 * full is not one number: it is more than the ways of playing at home at
 * that tempo ever carry on that row, so trap tempo has all the hats it likes
 * and few kicks, and a dance tempo the other way about. A row whose ghost
 * dial is well up is fuller than its pads say. Written rules; no DOM.
 */

import { FAMILIES, takeArts, takeOf, takePads } from "./Drummer.js";

const STEPS = 16;
const ROWS = { kick: 0, snare: 1, hat: 2, open: 3 };
const pad = (track, step) => `track-${track}_${step}`;
const all = Array.from({ length: STEPS }, (_, step) => step);
const litOn = (steps, track) => all.filter((step) => steps[pad(track, step)]?.active);
const hits = (row) => all.filter((step) => row[step] !== ".");

// The ways of playing at home at a tempo, the first of them the usual one
const AT_HOME = {
  boombap: ["boombap", "lean"],
  floor: ["floor"],
  halftime: ["halftime"],
  // The middle ground, where a backbeat with a bounce is at home
  none: ["bounce", "lean"],
};
// How many more than a way of playing ever carries is too many
const TOO_MANY = { kick: 3, snare: 3, hat: 1 };
// A ghost dial this high fills its row as a pad or so would
const GHOSTS_FILL = 60;
// How many beats to start from he has, and kicks to go under a snare
const STARTS = 6;
// The open hats of a beat to start from, by the way of playing: one for each beat he has,
// so that some carry one, some two and some none (ADR-0085)
const START_OPENS = {
  boombap: [
    "..............x.",
    "......x.......x.",
    "................",
    "..........x.....",
    "......x.........",
    "..............x.",
  ],
  lean: [
    "..............x.",
    "................",
    "......x.......x.",
    "..........x.....",
    "..............x.",
    "......x.........",
  ],
  bounce: [
    "..............x.",
    "......x.......x.",
    "..........x.....",
    "................",
    "..x...........x.",
    "......x.........",
  ],
  halftime: [
    "..............x.",
    "......x.........",
    "................",
    "......x.......x.",
    "..........x.....",
    "..............x.",
  ],
  floor: [
    "..x...x...x...x.",
    "......x.......x.",
    "..x...x...x...x.",
    "..............x.",
    "..x.......x.....",
    "......x.......x.",
  ],
};
// The sounds a beat to start from is played on, by row: the desk's own first, then others,
// so ANOTHER is another sound as well as other pads (ADR-0085). Each set is put together by
// how its sounds were made (samples/SOURCES.md): the same microphones, the same tuning up or
// down, the same weight of hit and length of ring. Every sound is in one set and no other.
export const KITS = [
  // The desk's own
  ["round", "crack", "tight", "open"],
  // Short and bright: each tuned up and close to the drum, none ringing past a tenth of a second or so
  ["punch", "snappy", "tick", "bright"],
  // Low and heavy: each tuned down and driven, the hats from the dark microphone
  ["deep", "heavy", "dark", "dark"],
  // Dry: the close microphones alone, little ring
  ["dead", "edge", "closed", "half"],
  // Quiet: the soft hits, a sidestick for the snare and the hat closed by the foot
  ["soft", "stick", "foot", "soft"],
  // The room: kick and snare from the far microphones, the hats left loose
  ["room", "room", "half", "loose"],
];
// What he calls each set, in the order above
export const KIT_SAYS = [
  "the desk's own.",
  "short and bright.",
  "low and heavy.",
  "dry and close.",
  "played quiet.",
  "out in the room.",
];
// Where the snare ghost dial is left when a row of snares is cut to its backbeat
const BACKBEAT_GHOSTS = 40;

/** The ways of playing at home where the tempo is */
export function atHome(calls) {
  return AT_HOME[calls ?? "none"];
}

/**
 * The most a row carries before it is too full, at this tempo and with its ghost dial where it is.
 * @param {"kick"|"snare"|"hat"} row
 * @param {string|null} calls - From tempoCalls
 * @param {number} [ghost=0] - The row's ghost dial
 * @returns {number} Infinity where no number of pads is too many
 */
export function roomFor(row, calls, ghost = 0) {
  const key = row === "kick" ? "kicks" : row === "snare" ? "snares" : "hats";
  const most = Math.max(
    ...atHome(calls).flatMap((name) => FAMILIES[name][key].map((r) => hits(r).length)),
  );
  // Hats on every step are a way of playing in themselves wherever he plays them so
  if (row === "hat" && most >= STEPS) return Infinity;
  return most + TOO_MANY[row] - 1 - (ghost >= GHOSTS_FILL ? 1 : 0);
}

/** A beat to start from: the kicks and snares of the ways of playing at home, each once */
function starts(calls, heard) {
  const seen = new Set();
  const takes = [];
  for (const name of atHome(calls)) {
    for (let round = 0; round < STARTS; round++) {
      const take = takeOf(name, heard, round);
      const key = `${take.rows[0]} ${take.rows[1]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      takes.push(take);
    }
  }
  return takes.slice(0, STARTS).map((take, nth) => {
    const open = START_OPENS[take.family][nth];
    // An open hat is played in place of the closed one, not over it
    const hat = [...take.rows[2]].map((c, step) => (open[step] === "." ? c : ".")).join("");
    return { ...take, rows: [take.rows[0], take.rows[1], hat, open] };
  });
}

/** The pads of a take on these rows, and their NOTE REPEAT keys */
function part(take, tracks) {
  const mine = (id) => tracks.includes(Number(id.slice(6, id.indexOf("_"))));
  const on = takePads(take).filter(mine);
  const arts = Object.fromEntries(Object.entries(takeArts(take)).filter(([id]) => mine(id)));
  return { on, arts };
}

/** The sounds the nth beat to start from is played on, for these rows */
function kit(nth, tracks) {
  const sounds = KITS[nth % KITS.length];
  return Object.fromEntries(tracks.map((track) => [track, sounds[track]]));
}

/**
 * His ideas for the desk as it stands, bare ones first.
 * @param {Object} steps - Pad state by id
 * @param {Object} desk
 * @param {string|null} desk.calls - The way of playing the tempo calls for (tempoCalls)
 * @param {Object} [desk.ghosts] - Where each drum row's ghost dial is, by row
 * @param {Object|null} [desk.heard] - What he heard in the loop, as it is played now
 * @param {boolean} [desk.hasLoop]
 * @returns {Object[]} Ideas, as ideasFor gives them
 */
export function bareOrFull(steps, { calls, ghosts = {}, heard = null, hasLoop = false }) {
  const kicks = litOn(steps, ROWS.kick);
  const snares = litOn(steps, ROWS.snare);
  const hats = litOn(steps, ROWS.hat);
  const opens = litOn(steps, ROWS.open);
  const half = calls === "halftime";
  const ideas = [];

  if (kicks.length === 0 && snares.length === 0) {
    // With a loop on the desk his takes are the beat to start from (FR-DESK-28)
    if (hasLoop) return [];
    const blank = hats.length === 0 && opens.length === 0;
    // Hats of the maker's are left as they are; with none down, his come with the beat
    const tracks = blank ? [0, 1, 2, 3] : [ROWS.kick, ROWS.snare];
    const rounds = starts(calls, heard).map((take, nth) => ({
      ...part(take, tracks),
      sounds: kit(nth, tracks),
    }));
    return [
      {
        id: "start",
        kind: "spark",
        // A blank desk and hats with nothing under them are two askings
        asks: blank ? "start" : "start-under",
        // The desk has nothing on it: he says so at once, and need not wait for the beat to go round
        opens: blank,
        // Kept, it is still his, as his takes are: a loop that lands later gets drums to fit it in its place
        his: true,
        says: blank
          ? "want a beat to start from?"
          : "nothing under it yet. want a beat to start from?",
        ...rounds[0],
        rounds,
      },
    ];
  }
  if (snares.length === 0) {
    // The whole backbeat, on a kick or not: a snare over a kick is a backbeat all the same
    ideas.push({
      id: "bare-snare",
      kind: "spark",
      says: half
        ? "kick's on its own. snare on the 3?"
        : "kick's on its own. backbeat on the 2 and 4?",
      on: (half ? [8] : [4, 12]).map((step) => pad(ROWS.snare, step)),
    });
  } else if (kicks.length === 0) {
    // His usual kicks for the tempo, each once
    const rounds = [...new Set(atHome(calls).flatMap((name) => FAMILIES[name].kicks))]
      .slice(0, STARTS)
      .map((row) => ({ on: hits(row).map((step) => pad(ROWS.kick, step)) }));
    ideas.push({
      id: "bare-kick",
      kind: "spark",
      asks: "bare-kick",
      says: "needs a foot under it. kick on the one?",
      ...rounds[0],
      rounds,
    });
  } else if (!half && snares.length === 1 && (snares[0] === 4 || snares[0] === 12)) {
    // Half a backbeat, and nothing else on the row: the other half
    const [has, wants] = snares[0] === 4 ? ["2", "4"] : ["4", "2"];
    ideas.push({
      id: "bare-snare",
      kind: "spark",
      says: `snare's only on the ${has}. one on the ${wants} as well?`,
      on: [pad(ROWS.snare, 16 - snares[0])],
    });
  } else if (hats.length === 0 && opens.length === 0) {
    ideas.push({
      id: "bare-hats",
      kind: "spark",
      says: "no top end yet. eighth hats?",
      on: all.filter((step) => step % 2 === 0).map((step) => pad(ROWS.hat, step)),
    });
  }

  if (kicks.length > roomFor("kick", calls, ghosts[ROWS.kick])) {
    // The maker's kicks that sit on one of his usual patterns stay; the best fit first
    const kept = atHome(calls)
      .flatMap((name) => FAMILIES[name].kicks)
      .map((row) => kicks.filter((step) => row[step] !== "."))
      .filter((stay) => stay.length >= 2)
      .sort((a, b) => b.length - a.length);
    const seen = new Set();
    const rounds = [];
    for (const stay of kept) {
      if (seen.has(stay.join())) continue;
      seen.add(stay.join());
      rounds.push({
        off: kicks.filter((step) => !stay.includes(step)).map((step) => pad(ROWS.kick, step)),
      });
    }
    if (rounds.length > 0) {
      ideas.push({
        id: "full-kick",
        kind: "spark",
        says: "lot of kick in there. strip it back?",
        ...rounds[0],
        rounds: rounds.slice(0, STARTS),
      });
    }
  }
  if (snares.length > roomFor("snare", calls, ghosts[ROWS.snare])) {
    const stay = snares.filter((step) => (half ? step === 8 : step === 4 || step === 12));
    // Only where a backbeat of theirs is among them: he takes off, he does not add
    if (stay.length > 0) {
      const dial = ghosts[ROWS.snare] ?? 0;
      ideas.push({
        id: "full-snare",
        kind: "spark",
        says: half ? "snare's everywhere. just the 3?" : "snare's everywhere. just the backbeat?",
        off: snares.filter((step) => !stay.includes(step)).map((step) => pad(ROWS.snare, step)),
        // So the row is not left bare of the little notes the others were
        ghost: dial < BACKBEAT_GHOSTS ? { [ROWS.snare]: BACKBEAT_GHOSTS } : {},
      });
    }
  }
  if (hats.length > roomFor("hat", calls, ghosts[ROWS.hat])) {
    // Down to eighths: the hats between them come off
    ideas.push({
      id: "full-hats",
      kind: "spark",
      says: "sixteenths all the way. try eighths?",
      off: hats.filter((step) => step % 2 === 1).map((step) => pad(ROWS.hat, step)),
    });
  }
  return ideas;
}
