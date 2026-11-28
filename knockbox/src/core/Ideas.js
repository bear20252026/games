/**
 * The drummer's ideas (ADR-0062, ADR-0063): what he would suggest for the
 * desk as it stands, from where the pads sit in the bar and what he heard in
 * the loop. Each is one change the maker can try and put back. A "fix" is
 * something measurably off; a "spark" is something to try. Written rules;
 * no model, no chance, no DOM.
 */

import { atHome, bareOrFull, KIT_SAYS, KITS } from "./Density.js";
import { FAMILIES, followFor, hasBass, takeArts, takeOf, takePads } from "./Drummer.js";

const STEPS = 16;
// The backbeats: the 2 and the 4
const BACKBEATS = [
  [4, "the 2"],
  [12, "the 4"],
];
// A bass note stands this far above the loop's average before a kick is moved to it
const BASS_NOTE = 0.3;
// A top end this busy is crowded by hats on nearly every step
const CROWDED_TOP = 0.6;
const MANY_HATS = 12;
// Fewer chops than this and a shuffle has little to deal
const CHOPS_TO_FLIP = 4;

const pad = (track, step) => `track-${track}_${step}`;
const lit = (steps, track, step) => Boolean(steps[pad(track, step)]?.active);

/** A snare one step off a backbeat that has none: the hit is moved onto it */
function snareOffTheBackbeat(steps) {
  // Half-time, with its snare on the 3, is not a mistake
  if (lit(steps, 1, 8) && !lit(steps, 1, 4) && !lit(steps, 1, 12)) return [];
  const ideas = [];
  for (const [beat, name] of BACKBEATS) {
    if (lit(steps, 1, beat)) continue;
    const late = lit(steps, 1, beat + 1);
    const early = lit(steps, 1, beat - 1);
    if (late === early) continue;
    ideas.push({
      id: `snare-${beat}`,
      kind: "fix",
      says: late ? `snare's late. pull it onto ${name}?` : `snare's early. sit it on ${name}?`,
      on: [pad(1, beat)],
      off: [pad(1, late ? beat + 1 : beat - 1)],
    });
  }
  return ideas;
}

/** A kick with no bass under it, a step from a bass note that has no kick: the kick is moved to the note */
function kickOffTheBass(steps, heard) {
  // The bass is the loop's own low end; a loop without one says nothing about the kick
  if (!hasBass(heard)) return [];
  const average = heard.low.reduce((sum, v) => sum + v, 0) / STEPS;
  let best = null;
  for (let step = 1; step < STEPS; step++) {
    if (!lit(steps, 0, step) || heard.low[step] > average) continue;
    for (const to of [step - 1, step + 1]) {
      if (to < 1 || to >= STEPS || lit(steps, 0, to) || lit(steps, 1, to)) continue;
      if (heard.low[to] - average < BASS_NOTE) continue;
      const gain = heard.low[to] - heard.low[step];
      if (!best || gain > best.gain) best = { step, to, gain };
    }
  }
  if (!best) return [];
  return [
    {
      id: `kick-${best.step}`,
      kind: "fix",
      says: "kick's off the bass. slide it over?",
      on: [pad(0, best.to)],
      off: [pad(0, best.step)],
    },
  ];
}

/** The loop leaning on a drum that sits the other way from it: FOLLOW goes to the drum that suits */
function loopOnTheWrongPocket(smp, heard) {
  const suits = followFor(heard);
  if (suits === smp.follow) return [];
  const says = {
    kick: "loop lays back. lean it on the kick?",
    snare: "loop sits early. lean it on the snare?",
    hat: "loop's straight. lock it to the hats?",
  };
  // A straight loop on a lazy kick is a matter of taste; an early one is being dragged
  return [
    {
      id: `follow-${suits}`,
      kind: suits === "hat" ? "spark" : "fix",
      says: says[suits],
      set: [{ lane: "smp", key: "follow", value: suits }],
    },
  ];
}

/** Hats on nearly every step under a top end that is already busy: every other one comes off */
function hatsCrowdTheTop(steps, heard) {
  const hats = Array.from({ length: STEPS }, (_, step) => step).filter((step) =>
    lit(steps, 2, step),
  );
  if (hats.length < MANY_HATS || heard.busy.high <= CROWDED_TOP) return [];
  return [
    {
      id: "hats-thin",
      kind: "spark",
      says: "top end's busy. thin the hats?",
      on: [],
      off: hats.filter((step) => step % 2 === 1).map((step) => pad(2, step)),
    },
  ];
}

// A step is under the voice where it sounds in half the take's bars or more
const UNDER_THE_VOICE = 0.5;
// Hats to take off before thinning under the voice is worth saying
const HATS_ON_THE_VOICE = 3;
// A voice has to be there for most of this many steps before its gaps mean anything
const VOICE_TO_SPEAK_OF = 4;
// The step the end of the bar lands on: an open hat there, or the hat that rolls into the one
const FILL_STEP = 14;
// The last beat of the bar, where it turns
const TURN = [12, 13, 14, 15];

/**
 * Where a triplet on the hat goes (ADR-0087): on the two steps before what the end of the
 * bar lands on, so into an open hat there and otherwise into the one. Nowhere with a NOTE
 * REPEAT key on the last beat already, on any row, or with an open hat under it.
 * @returns {{at: number, into: string}|null}
 */
function tripletAt(steps) {
  const keyed = (track) =>
    TURN.some((step) => lit(steps, track, step) && steps[pad(track, step)].art);
  if ([0, 1, 2, 3].some(keyed)) return null;
  if (lit(steps, 3, FILL_STEP)) {
    const at = FILL_STEP - 2;
    return lit(steps, 3, at) || lit(steps, 3, at + 1) ? null : { at, into: "the open hat" };
  }
  return lit(steps, 3, FILL_STEP + 1) ? null : { at: FILL_STEP, into: "the one" };
}

/** The pads of that triplet: the hat lit with its key, the hat it plays through put out */
function tripletOn(steps, at) {
  return {
    on: [pad(2, at)],
    off: lit(steps, 2, at + 1) ? [pad(2, at + 1)] : [],
    arts: { [pad(2, at)]: "trip" },
  };
}
// A take leans on a pocket only when it is this tight or more; looser, it is heard as performed
const POCKETED = 50;
// Chops this scattered about the grid, as a share of a step, are loose; under it they sit together
const LOOSE = 0.2;
const TOGETHER = 0.15;
// A whole take this late or early, as a share of a step, is slid back
const SLID = 0.15;

/** Where the voice sounds on the bar as it plays: slid with the take */
function underTheVoice(vox, sounding) {
  const slid = Math.round(vox.offset / (60 / vox.takeBpm / 4));
  return (step) => sounding[(((step - slid) % STEPS) + STEPS) % STEPS] >= UNDER_THE_VOICE;
}

/** Off-beat hats on steps the voice is singing over: they come off there */
function hatsOnTheVoice(steps, sung) {
  const off = [];
  for (let step = 1; step < STEPS; step += 2) {
    if (lit(steps, 2, step) && sung(step)) off.push(pad(2, step));
  }
  if (off.length < HATS_ON_THE_VOICE) return [];
  return [
    {
      id: "vox-hats",
      kind: "spark",
      says: "hats are stepping on the vocal. thin them there?",
      on: [],
      off,
    },
  ];
}

/** The voice leaves the end of the bar: a triplet on the hat rolls into what it lands on */
function gapAtTheTurn(steps, sung) {
  const there = Array.from({ length: STEPS }, (_, step) => step).filter(sung).length;
  const turn = tripletAt(steps);
  // The voice leaves the triplet's two steps and the one before them
  if (there < VOICE_TO_SPEAK_OF || !turn || [-1, 0, 1].some((by) => sung(turn.at + by))) return [];
  return [
    {
      id: "vox-fill",
      kind: "spark",
      says: `vocal leaves the end of the bar. roll into ${turn.into}?`,
      ...tripletOn(steps, turn.at),
    },
  ];
}

/**
 * How the voice sits against the grid, from where its chops were cut: how late
 * on the whole (lean), and how scattered, each as a share of a step.
 */
export function voiceTiming(vox) {
  const step = 60 / vox.takeBpm / 4;
  const late = vox.slices
    .filter((slice) => !slice.muted)
    .map((slice) => {
      const at = ((slice.at ?? slice.onset) + vox.offset) / step;
      return at - Math.round(at);
    });
  if (late.length === 0) return { lean: 0, scatter: 0 };
  const lean = late.reduce((sum, v) => sum + v, 0) / late.length;
  const scatter = Math.sqrt(late.reduce((sum, v) => sum + (v - lean) ** 2, 0) / late.length);
  return { lean, scatter };
}

/** The voice's timing: which drum it leans on where it is pocketed, and slid or tightened where it is not */
function voiceOffTheBeat(vox) {
  const { lean, scatter } = voiceTiming(vox);
  const set = (key, value) => [{ lane: "vox", key, value }];
  if (vox.tightness >= POCKETED) {
    const suits = followFor({ lean });
    if (suits === "hat" || suits === vox.follow) return [];
    return [
      {
        id: `vox-follow-${suits}`,
        kind: "fix",
        says:
          suits === "kick"
            ? "vocal lays back. lean it on the kick?"
            : "vocal sits early. lean it on the snare?",
        set: set("follow", suits),
      },
    ];
  }
  if (Math.abs(lean) >= SLID && scatter < TOGETHER) {
    return [
      {
        id: "vox-slide",
        kind: "fix",
        says:
          lean > 0
            ? "vocal's late all the way through. slide it earlier?"
            : "vocal's early all the way through. slide it later?",
        set: set("offset", vox.offset - lean * (60 / vox.takeBpm / 4)),
      },
    ];
  }
  if (scatter >= LOOSE) {
    return [
      {
        id: "vox-tight",
        kind: "spark",
        says: "vocal's loose on the beat. tighten it up?",
        set: set("tightness", 100),
      },
    ];
  }
  return [];
}

// The tempos at which a beat is in another way of playing's country
const BOOM_BAP_TO = 95;
const FLOOR_FROM = 110;
const TRAP_FROM = 133;
// Swing above this is too drunk for four on the floor
const TOO_DRUNK = 30;

/** The way of playing a tempo calls for; none in the middle ground, where a backbeat with a bounce is at home */
export function tempoCalls(bpm) {
  if (bpm <= BOOM_BAP_TO) return "boombap";
  if (bpm >= TRAP_FROM) return "halftime";
  return bpm >= FLOOR_FROM ? "floor" : null;
}

/** The way the drums on the pads are played, as far as the kick and snare say */
export function wayOf(steps) {
  if ([0, 4, 8, 12].every((beat) => lit(steps, 0, beat))) return "floor";
  const backbeat = lit(steps, 1, 4) || lit(steps, 1, 12);
  if (lit(steps, 1, 8) && !backbeat) return "halftime";
  return backbeat ? "backbeat" : null;
}

// How many of his bounces he has to go through
const BOUNCES = 3;
// On a beat drawn at that tempo there is no move to speak of
const AT_HOME = {
  floor: "four on the floor?",
  halftime: "half-time it?",
  boombap: "boom bap it?",
};
const MOVED = {
  floor: "it's moving now. four on the floor?",
  halftime: "that's trap tempo. half-time it?",
  boombap: "slowed right down. boom bap it?",
};

/**
 * The tempo has gone where the drums on the pads are not at home: he offers
 * the way of playing that is, as a whole take and its feel. It is something
 * off where the tempo moved there since the drums were drawn, and something
 * to try on a beat that was drawn that way at that tempo.
 */
function drumsOutOfTheirTempo(steps, { bpm, drumsBpm, swing, heard }) {
  const calls = tempoCalls(bpm);
  const way = wayOf(steps);
  if (!way) return [];
  const kind = tempoCalls(drumsBpm) === calls ? "spark" : "fix";
  if (!calls) {
    // Between the slow tempos and the dance ones a backbeat is at home as it is; the floor and half-time are not
    if (way === "backbeat") return [];
    const rounds = [];
    for (let round = 0; round < BOUNCES; round++) {
      const take = takeOf("bounce", heard, round);
      const on = takePads(take);
      rounds.push({
        on,
        off: Object.keys(steps).filter((id) => steps[id].active && !on.includes(id)),
        arts: takeArts(take),
        feel: { mode: take.mode, swing: take.swing },
      });
    }
    return [
      {
        id: "style-bounce",
        kind,
        asks: "style-bounce",
        says: "that's bounce tempo. bounce it?",
        ...rounds[0],
        rounds,
      },
    ];
  }
  // A slow beat drawn slow is asked about its groove, not its pattern (onTheGrid)
  if (calls === "boombap" && kind === "spark") return [];
  if (calls === "floor" && way === "floor") {
    if (swing <= TOO_DRUNK) return [];
    return [
      {
        id: "style-straight",
        kind,
        asks: "style-straight",
        says: "bit drunk for the floor. straighten it out?",
        feel: { swing: FAMILIES.floor.swing },
      },
    ];
  }
  const suits =
    (calls === "floor" && way === "backbeat") ||
    (calls === "halftime" && way !== "halftime") ||
    (calls === "boombap" && way === "floor");
  if (!suits) return [];
  const take = takeOf(calls, heard);
  const on = takePads(take);
  const drums = Object.keys(steps).filter((id) => steps[id].active && !on.includes(id));
  return [
    {
      id: `style-${calls}`,
      kind,
      // The question is the way of playing, whatever the pads it would take off
      asks: `style-${calls}`,
      says: (kind === "fix" ? MOVED : AT_HOME)[calls],
      on,
      off: drums,
      arts: takeArts(take),
      feel: { mode: take.mode, swing: take.swing },
    },
  ];
}

// What he says of each idea after it is asked: on trial, kept, put back after a try, and waved off
// unheard. Each is about the thing he offered, so his answer is to the choice the maker made.
const REPLIES = {
  // Kept, he says where the sounds are changed by hand: the lesson of it (ADR-0086)
  sounds: [
    "other drums. like it?",
    "tap a drum's name to swap it.",
    "all yours again.",
    "your drums stay.",
  ],
  "switch-up": [
    "bar two's switched up. hear it?",
    "switch-up stays. tap me to take it off",
    "every bar the same again.",
    "same every bar it is.",
  ],
  "switch-off": [
    "same every bar now. better?",
    "switch-up's off.",
    "switch-up's back.",
    "switch-up stays.",
  ],
  groove: [
    "feel that swing?",
    "in the pocket. tap me for other grooves",
    "back on the grid.",
    "straight it stays.",
  ],
  "groove-trap": [
    "hear the hats roll?",
    "hats are rolling. tap me for more",
    "hats are back as they were.",
    "straight it stays.",
  ],
  "groove-floor": [
    "feel it shuffle?",
    "it shuffles. tap me for more",
    "back on the grid.",
    "straight it stays.",
  ],
  "groove-other": [
    "how's this one?",
    "that one sits right. tap me for more",
    "back to your groove.",
    "your groove stays.",
  ],
  snare: [
    "hear it land?",
    "right on the backbeat.",
    "snare's back where you had it.",
    "your snare, your pocket.",
  ],
  kick: [
    "feel it lock with the bass?",
    "locked in with the bass.",
    "kick's back where it was.",
    "cool, the kick stays.",
  ],
  follow: [
    "hear it lean?",
    "sits in the pocket now.",
    "loop's back where it sat.",
    "loose it stays.",
  ],
  start: ["there's a start. like it?", "that's a start.", "all yours again.", "your desk, then."],
  "bare-snare": [
    "there's your backbeat. like it?",
    "backbeat's in.",
    "snare's off again.",
    "no snare, then.",
  ],
  "bare-kick": [
    "feel it under there?",
    "it's got a foot now.",
    "kick's off again.",
    "no kick, then.",
  ],
  "bare-hats": [
    "that the top it needed?",
    "top end's in.",
    "hats are off again.",
    "no hats, then.",
  ],
  "full-kick": ["more room now?", "room to move.", "your kicks are all back.", "busy kick it is."],
  "full-snare": [
    "hear the backbeat now?",
    "backbeat's clear.",
    "your snares are all back.",
    "busy snare it is.",
  ],
  "full-hats": ["more air up top?", "top end can breathe.", "hats are all back.", "busy it is."],
  "hats-thin": ["more air up top?", "top end can breathe.", "hats are all back.", "busy it is."],
  "hats-open": [
    "hear it breathe?",
    "lets the bar breathe.",
    "hat's closed again.",
    "tight hats. got it.",
  ],
  "hats-trip": [
    "catch that roll?",
    "that's the TRIP key. try it on a pad.",
    "roll's gone.",
    "straight in, then.",
  ],
  "chops-flip": [
    "how's that order?",
    "that flip works.",
    "chops are back in order.",
    "as you chopped it, then.",
  ],
  "loop-sauce": ["hear it open up?", "saucy.", "dry again.", "dry it is."],
  "ghosts-back": ["cleaner?", "less is more.", "ghosts are back up.", "busy it stays."],
  "vox-hats": [
    "hear the vocal now?",
    "vocal's got its room.",
    "hats are back under it.",
    "fair. keep them driving.",
  ],
  "vox-fill": [
    "feel that pickup?",
    "carries the vocal to the one.",
    "roll's gone.",
    "let it hang, then.",
  ],
  vox: [
    "sitting better?",
    "vocal's in the pocket.",
    "vocal's back as you sang it.",
    "loose works too.",
  ],
  "style-floor": [
    "feel it move?",
    "that's a floor filler.",
    "your drums are back.",
    "keeping the bounce. respect.",
  ],
  "style-halftime": [
    "feel the space?",
    "half-time. heavy.",
    "your drums are back.",
    "keep it running, then.",
  ],
  "style-boombap": [
    "head nodding?",
    "that's the nod.",
    "your drums are back.",
    "keep it driving, then.",
  ],
  "style-bounce": [
    "got that bounce now?",
    "that's the bounce.",
    "your drums are back.",
    "as it was, then.",
  ],
  "kick-switch": [
    "how's that kick?",
    "new kick's in. tap me for more",
    "your kick's back.",
    "kick stays.",
  ],
  "style-straight": [
    "straighter?",
    "straight down the middle.",
    "swing's back up.",
    "drunk it stays.",
  ],
};
const PLAIN = ["like that?", "bet.", "cool.", "cool."];

/**
 * The rows an idea would change: drum rows by number, "smp" for the loop's and
 * "vox" for the voice's. An idea is tried by ear, so one that changes only rows
 * that are not heard (muted, or left out by a solo) is not one to raise.
 * @param {Object} idea
 * @returns {Array<number|string>}
 */
export function rowsOf(idea) {
  const rows = new Set();
  for (const go of [idea, ...(idea.rounds ?? [])]) {
    for (const id of [...(go.on ?? []), ...(go.off ?? [])]) {
      rows.add(Number(id.slice(id.indexOf("-") + 1, id.indexOf("_"))));
    }
    for (const track of Object.keys(go.ghost ?? {})) rows.add(Number(track));
    // The swing, the hi-hat mode and the switch-up are heard on any drum
    if (go.feel || go.switchUp !== undefined) for (const track of [0, 1, 2, 3]) rows.add(track);
    for (const track of Object.keys(go.sounds ?? {})) rows.add(Number(track));
  }
  for (const { lane } of idea.set ?? []) rows.add(lane);
  if (idea.shuffle) rows.add("smp");
  return [...rows];
}

/**
 * The drum rows an idea changes the sound of without touching a pad: all of
 * them where it sets the swing or the hi-hat mode, and those whose ghost dials
 * it turns. On trial their lit pads are shown in pencil, as pads of his are.
 * @param {Object} idea
 * @returns {number[]}
 */
export function feelRows(idea) {
  const rows = new Set();
  for (const go of [idea, ...(idea.rounds ?? [])]) {
    for (const track of Object.keys(go.ghost ?? {})) rows.add(Number(track));
    if (go.feel || go.switchUp !== undefined) for (const track of [0, 1, 2, 3]) rows.add(track);
  }
  return [...rows].sort();
}

/**
 * The drum rows an idea puts another sound on without touching a pad of theirs. On trial
 * their lit pads are shown in pencil, as under a feel of his.
 * @param {Object} idea
 * @returns {number[]}
 */
export function soundRows(idea) {
  const rows = new Set();
  for (const go of [idea, ...(idea.rounds ?? [])]) {
    if (go.on || go.off) continue;
    for (const track of Object.keys(go.sounds ?? {})) rows.add(Number(track));
  }
  return [...rows].sort();
}

/**
 * What an idea asks of the maker, as a word to tell one asking from another.
 * An idea waved off is not asked again; the same idea about a desk that has
 * changed under it (other hats to thin, another place for the voice) is
 * another question, and may be. By default the question is the change he
 * would make; an idea says its own where that change shifts with things
 * that are beside the point.
 */
export function questionOf(idea) {
  return (
    idea.asks ??
    JSON.stringify([idea.on, idea.off, idea.arts, idea.set, idea.feel, idea.ghost, idea.shuffle])
  );
}

// What a kept idea leads to: the ideas that go with it, said sooner than they would be alone
const FOLLOWS = {
  start: ["groove"],
  "bare-snare": ["bare-hats", "groove"],
  "bare-kick": ["bare-hats", "groove"],
  "bare-hats": ["groove"],
  "full-kick": ["groove"],
  "full-snare": ["groove"],
  "full-hats": ["hats-open"],
  groove: ["hats-open"],
  "hats-thin": ["hats-open"],
  "hats-open": ["hats-trip"],
  "style-floor": ["loop-sauce"],
  "vox-hats": ["vox-fill"],
};

/** The name among these that an idea's id starts with, the longest: "vox-hats" is not any "vox" idea */
function stemOf(id, names) {
  return names
    .filter((name) => id === name || id.startsWith(`${name}-`))
    .sort((a, b) => b.length - a.length)[0];
}

/**
 * The ideas that follow on from one that was kept, as the names their ids start with.
 * @param {string} id - The kept idea's id
 * @returns {string[]}
 */
export function followsOn(id) {
  return FOLLOWS[stemOf(id, Object.keys(FOLLOWS))] ?? [];
}

/** Whether an idea is one of those names */
export function isOneOf(idea, names) {
  return stemOf(idea.id, names) !== undefined;
}

/**
 * His words for an idea once asked.
 * @param {string} id - The idea's id
 * @returns {{trying: string, kept: string, back: string, nah: string}}
 */
export function repliesFor(id) {
  // The longest name the id starts with, so "vox-hats" is not answered as any "vox" idea
  const stem = stemOf(id, Object.keys(REPLIES));
  const [trying, kept, back, nah] = REPLIES[stem] ?? PLAIN;
  return { trying, kept, back, nah };
}

// Swing under this is drums on the grid
const ON_THE_GRID = 20;
// The grooves he can put on drums as they stand, in the order he goes through them
const GROOVES = ["lean", "bounce", "boombap"];

/** His grooves in the order for a tempo: between the slow tempos and the dance ones the bounce comes first */
function groovesAt(bpm) {
  return bpm > BOOM_BAP_TO ? ["bounce", "lean", "boombap"] : GROOVES;
}

// At a dance tempo the groove is a shuffle, small enough to stay on the floor: dials only
const SHUFFLES = [
  { feel: { mode: "live", swing: 25 }, ghost: { 2: 30 } },
  { feel: { mode: "friction", swing: 20 }, ghost: { 1: 40 } },
  { feel: { mode: "limp", swing: 30 }, ghost: { 2: 30 } },
];

// At a trap tempo the groove is in the hats: each of these is the hat row he leaves, with its keys
const ROLLS = ["xxxxx.x2xxxxt.x.", "x.x.t.x.x.x.t.x.", "x.xx.xx.x.xx.x3."];
const ROLL_KEYS = { 2: "roll2", 3: "roll3", t: "trip" };
const ROLL_SWING = 15;
const HAT = 2;
const OPEN = 3;

/** Whether any hat on the pads has a NOTE REPEAT key on it */
function hatKeys(steps) {
  return Array.from({ length: STEPS }, (_, step) => steps[pad(HAT, step)]).some(
    (hat) => hat?.active && hat.art,
  );
}

/** The hats rolled, three ways: pads lit and put out to make each row, its keys, and an open hat to end the bar */
function hatsThatRoll(steps) {
  const lit = (track, step) => Boolean(steps[pad(track, step)]?.active);
  const noOpen = !Array.from({ length: STEPS }, (_, step) => step).some((step) => lit(OPEN, step));
  return ROLLS.map((row) => {
    const on = [];
    const off = [];
    const arts = {};
    [...row].forEach((c, step) => {
      const key = ROLL_KEYS[c];
      // A pad that is to carry a key is lit again with it, its own or not
      if (c !== "." && (!lit(HAT, step) || key)) on.push(pad(HAT, step));
      if (c === "." && lit(HAT, step)) off.push(pad(HAT, step));
      if (key) arts[pad(HAT, step)] = key;
    });
    if (noOpen) on.push(pad(OPEN, FILL_STEP));
    return { on, off, arts, feel: { mode: "live", swing: ROLL_SWING }, ghost: { [HAT]: 40 } };
  });
}

/** A way of playing's feel alone: its hi-hat mode, swing and ghost dials, and no pads */
function grooveOf(name, heard) {
  const take = takeOf(name, heard);
  return { feel: { mode: take.mode, swing: take.swing }, ghost: take.ghost };
}

/**
 * Drums played dead on the grid, under a dance tempo: he offers the lean, the
 * late hats and the ghost notes, and leaves every pad where it is. It is the
 * first thing he has to try, so a plain beat hears what the feel does.
 */
function onTheGrid(steps, { bpm, swing, ghosts, heard }) {
  if (swing >= ON_THE_GRID || !wayOf(steps)) return [];
  if (bpm >= TRAP_FROM) {
    // Hats with a key on them are rolling already
    const rounds = hatsThatRoll(steps);
    if (hatKeys(steps) || rounds.length === 0) return [];
    return [
      {
        id: "groove-trap",
        kind: "spark",
        asks: "groove",
        says: "want more groove?",
        ...rounds[0],
        rounds,
      },
    ];
  }
  if (bpm >= FLOOR_FROM) {
    return [
      {
        id: "groove-floor",
        kind: "spark",
        asks: "groove",
        says: "want more groove?",
        ...SHUFFLES[0],
        rounds: SHUFFLES,
      },
    ];
  }
  const rounds = groovesAt(bpm).map((name) => grooveOf(name, heard));
  // The first time, only the dials that are below his are turned up
  const up = Object.entries(rounds[0].ghost).filter(
    ([track, value]) => (ghosts[track] ?? 0) < value,
  );
  rounds[0] = { ...rounds[0], ghost: Object.fromEntries(up) };
  return [
    {
      id: "groove",
      kind: "spark",
      // One question, however the dials stand
      asks: "groove",
      says: "want more groove?",
      ...rounds[0],
      rounds,
    },
  ];
}

/**
 * Drums with a groove on them already: tapped, he has the other grooves to
 * go through, the one that is on left out. Only when asked, so a groove the
 * maker has settled on is not questioned while they work.
 */
function otherGrooves(steps, { bpm, swing, mode, heard }) {
  if (!wayOf(steps)) return [];
  const trap = bpm >= TRAP_FROM;
  // At a trap tempo the groove is on the hats' keys, not the swing dial
  if (trap ? !hatKeys(steps) : swing < ON_THE_GRID) return [];
  const all = trap
    ? hatsThatRoll(steps)
    : bpm >= FLOOR_FROM
      ? SHUFFLES
      : groovesAt(bpm).map((name) => grooveOf(name, heard));
  if (all.length === 0) return [];
  const on = all.findIndex((groove) => groove.feel.mode === mode && groove.feel.swing === swing);
  // From the one after the groove that is on, round to the one before it
  const rounds = on < 0 ? all : [...all.slice(on + 1), ...all.slice(0, on)];
  return [
    {
      id: "groove-other",
      kind: "spark",
      asks: "groove-other",
      asked: true,
      says: "try another groove?",
      ...rounds[0],
      rounds,
    },
  ];
}

// A loop that lands on this few of the bar's steps, in its body and its top, has room for sauce
const ROOM_FOR_SAUCE = 0.3;
const SOME_SAUCE = 35;
// Hats on this many steps are a pattern to dress
const HATS_TO_DRESS = 8;
// Ghost dials this high crowd a loop this busy; they come back to here
const MANY_GHOSTS = 60;
const BUSY_LOOP = 0.6;
const FEWER_GHOSTS = 30;

/**
 * Drums with a groove on them that are played the same every bar: he can switch up every
 * second bar (ADR-0078). Asked once; with it on, taking it off is his when tapped.
 */
function everyBarTheSame(steps, { swing, switchUp }) {
  if (swing < ON_THE_GRID || !wayOf(steps)) return [];
  if (switchUp) {
    return [
      {
        id: "switch-off",
        kind: "spark",
        asks: "switch-off",
        asked: true,
        says: "same every bar again?",
        switchUp: false,
      },
    ];
  }
  return [
    {
      id: "switch-up",
      kind: "spark",
      asks: "switch-up",
      says: "switch it up every 2nd bar?",
      switchUp: true,
    },
  ];
}

/** A dry loop with space between its notes: some sauce fills it */
function drySparseLoop(smp, heard) {
  if (smp.fx > 0 || heard.busy.mid >= ROOM_FOR_SAUCE || heard.busy.high >= ROOM_FOR_SAUCE)
    return [];
  return [
    {
      id: "loop-sauce",
      kind: "spark",
      says: "loop's got space in it. bit of sauce?",
      set: [{ lane: "smp", key: "fx", value: SOME_SAUCE }],
    },
  ];
}

/**
 * Hats that never change through the bar: opened at the end of it, then a triplet into what
 * the bar lands on. An open hat is a hat played, and counts as one (ADR-0087).
 */
function plainHats(steps) {
  const all = Array.from({ length: STEPS }, (_, step) => step);
  const hats = all.filter((step) => lit(steps, 2, step) || lit(steps, 3, step));
  if (hats.length < HATS_TO_DRESS) return [];
  const opened = all.some((step) => lit(steps, 3, step));
  const turn = tripletAt(steps);
  const ideas = [];
  if (!opened) {
    ideas.push({
      id: "hats-open",
      kind: "spark",
      says: "hats never breathe. open one at the end of the bar?",
      on: [pad(3, FILL_STEP)],
      off: lit(steps, 2, FILL_STEP) ? [pad(2, FILL_STEP)] : [],
    });
  }
  if (turn) {
    ideas.push({
      id: "hats-trip",
      kind: "spark",
      // One question of a beat, wherever its open hat is by then
      asks: "hats-trip",
      says: `triplet into ${turn.into}?`,
      ...tripletOn(steps, turn.at),
    });
  }
  return ideas;
}

/** Ghost dials well up under a loop that is busy already: they come back */
function ghostsCrowdTheLoop(ghosts, heard) {
  if (Math.max(heard.busy.mid, heard.busy.high) <= BUSY_LOOP) return [];
  const up = Object.entries(ghosts).filter(([, value]) => value >= MANY_GHOSTS);
  if (up.length === 0) return [];
  return [
    {
      id: "ghosts-back",
      kind: "spark",
      says: "lot going on already. pull the ghosts back?",
      ghost: Object.fromEntries(up.map(([track]) => [track, FEWER_GHOSTS])),
    },
  ];
}

// The set he offers first where the tempo is: its place in KITS
const KIT_AT = { boombap: 2, none: 5, floor: 3, halftime: 1 };
// Bars the sounds are left alone before he speaks of them unasked: the beat is heard first
export const SOUNDS_BARS = 16;

/**
 * A whole beat, on other drums (ADR-0086): the sets his starts are played on, the one for
 * the tempo first and the desk's own last, any that is on the desk already left out. No pad
 * is changed, and no row on a file of the maker's. He raises it himself only while every row
 * is still on the desk's first sound; otherwise it waits to be asked.
 * @param {Object} steps
 * @param {Object} desk
 * @param {number} desk.bpm
 * @param {string[]} desk.sounds - The built-in sound each drum row is on, kick to open hat
 * @param {number[]} desk.own - The rows on a file of the maker's
 */
function otherDrums(steps, { bpm, sounds, own }) {
  const all = Array.from({ length: STEPS }, (_, step) => step);
  const on = (track) => all.some((step) => lit(steps, track, step));
  if (!on(0) || !on(1) || !(on(2) || on(3))) return [];
  const rows = [0, 1, 2, 3].filter((track) => !own.includes(track));
  const first = KIT_AT[tempoCalls(bpm) ?? "none"];
  const order = [first, ...[1, 2, 3, 4, 5, 0].filter((kit) => kit !== first)];
  const rounds = order
    .filter((kit) => rows.some((track) => KITS[kit][track] !== sounds[track]))
    .map((kit) => ({
      sounds: Object.fromEntries(rows.map((track) => [track, KITS[kit][track]])),
      trying: `${KIT_SAYS[kit]} like it?`,
    }));
  if (rounds.length === 0) return [];
  const given = own.length === 0 && sounds.every((id, track) => id === KITS[0][track]);
  return [
    {
      id: "sounds",
      kind: "spark",
      // One question, whichever set the tempo has him offer first
      asks: "sounds",
      asked: !given,
      bars: SOUNDS_BARS,
      // Asked for, his sounds go over a built-in sound the maker picked; never over a file of theirs
      overPicks: true,
      says: "same beat, other drums?",
      ...rounds[0],
      rounds,
    },
  ];
}

// How many other kicks he has for a beat that wants for nothing
const KICKS_TO_SWITCH = 6;

/**
 * A whole beat with nothing off and nothing missing: tapped, he has his usual
 * kicks for the tempo to go under it, the snare and the hats left as they are.
 * Only when asked, and last of all: a beat that knocks is not questioned.
 */
function otherKicks(steps, bpm) {
  const all = Array.from({ length: STEPS }, (_, step) => step);
  const on = (track) => all.filter((step) => lit(steps, track, step));
  const kicks = on(0);
  if (kicks.length === 0 || on(1).length === 0 || on(2).length + on(3).length === 0) return [];
  const rows = [...new Set(atHome(tempoCalls(bpm)).flatMap((name) => FAMILIES[name].kicks))];
  const rounds = rows
    .map((row) => all.filter((step) => row[step] !== "."))
    .filter((his) => his.join() !== kicks.join())
    .slice(0, KICKS_TO_SWITCH)
    .map((his) => ({
      on: his.filter((step) => !kicks.includes(step)).map((step) => pad(0, step)),
      off: kicks.filter((step) => !his.includes(step)).map((step) => pad(0, step)),
    }));
  if (rounds.length === 0) return [];
  return [
    {
      id: "kick-switch",
      kind: "spark",
      asks: "kick-switch",
      asked: true,
      says: "switch up the kick?",
      ...rounds[0],
      rounds,
    },
  ];
}

/**
 * What he would suggest now, the measurably off first.
 * @param {Object} desk
 * @param {Object} desk.steps - The store's pads
 * @param {Object} desk.smp - The loop's row
 * @param {boolean} desk.hasLoop - A loop is on the desk
 * @param {Object|null} desk.heard - From listenToLoop, once he has heard this loop
 * @param {Object} [desk.vox] - The voice's row, where there is a take on it
 * @param {number[]|null} [desk.sounding] - From soundingSteps, once he has heard the voice
 * @param {number} [desk.bpm] - The session's tempo
 * @param {number} [desk.drumsBpm] - The tempo when the drums on the pads were last changed
 * @param {number} [desk.swing] - Where the swing dial is, 0 to 100
 * @param {Object} [desk.ghosts] - Where each drum row's ghost dial is, by row
 * @param {string} [desk.mode] - The hi-hat mode
 * @returns {Array<{id: string, kind: "fix"|"spark", says: string, switchUp?: boolean, on?: string[], off?: string[], arts?: Object, feel?: {mode?: string, swing: number}, ghost?: Object, set?: Array<{lane: string, key: string, value: *}>, shuffle?: boolean}>}
 */
export function ideasFor({
  steps,
  smp,
  hasLoop,
  heard,
  vox = null,
  sounding = null,
  bpm = null,
  drumsBpm = bpm,
  swing = 0,
  ghosts = {},
  mode = null,
  switchUp = false,
  sounds = null,
  own = [],
}) {
  const ideas = [...snareOffTheBackbeat(steps)];
  if (bpm !== null) {
    // What the desk lacks, or has too much of, comes before what could be done with it
    ideas.push(
      ...bareOrFull(steps, {
        calls: tempoCalls(bpm),
        ghosts,
        heard: hasLoop ? heard : null,
        hasLoop,
      }),
    );
    ideas.push(...onTheGrid(steps, { bpm, swing, ghosts, heard: hasLoop ? heard : null }));
    ideas.push(...otherGrooves(steps, { bpm, swing, mode, heard: hasLoop ? heard : null }));
    ideas.push(
      ...drumsOutOfTheirTempo(steps, { bpm, drumsBpm, swing, heard: hasLoop ? heard : null }),
    );
  }
  if (hasLoop && heard) {
    ideas.push(...kickOffTheBass(steps, heard));
    ideas.push(...loopOnTheWrongPocket(smp, heard));
    ideas.push(...hatsCrowdTheTop(steps, heard));
    ideas.push(...ghostsCrowdTheLoop(ghosts, heard));
    ideas.push(...drySparseLoop(smp, heard));
  }
  if (vox && vox.slices.length > 0 && !vox.muted) {
    ideas.push(...voiceOffTheBeat(vox));
    // Chops dealt out of order no longer sound where the take does
    const asSung = vox.slices.every((slice, i) => slice.source === i);
    if (sounding && asSung) {
      const sung = underTheVoice(vox, sounding);
      ideas.push(...hatsOnTheVoice(steps, sung));
      ideas.push(...gapAtTheTurn(steps, sung));
    }
  }
  const hats = plainHats(steps);
  ideas.push(...hats.filter((idea) => idea.id === "hats-open"));
  if (hasLoop && smp.slices.length >= CHOPS_TO_FLIP) {
    // Another go deals them again
    ideas.push({ id: "chops-flip", kind: "spark", says: "flip the chops?", shuffle: true });
  }
  // With a loop his takes are the other drums to hear (FR-DESK-28)
  // After what the beat lacks and what could be done with one bar of it
  const drums = bpm !== null && sounds ? otherDrums(steps, { bpm, sounds, own }) : [];
  // Heard before the switch-up is: the sounds are the plainer thing to listen for
  ideas.push(...drums.filter((idea) => !idea.asked));
  ideas.push(...everyBarTheSame(steps, { swing, switchUp }));
  // The triplet after both: the feel, the sounds and the phrase are heard before a key is (ADR-0087)
  ideas.push(...hats.filter((idea) => idea.id === "hats-trip"));
  // Where the sounds are no longer the desk's first it waits to be asked. The kick is still
  // last: it is offered again at every tap, so anything after it would never be reached
  ideas.push(...drums.filter((idea) => idea.asked));
  if (bpm !== null && !hasLoop) ideas.push(...otherKicks(steps, bpm));
  // Hats that crowd the loop's top end are thinned for the loop, not for their number
  const thinned = ideas.some((idea) => idea.id === "hats-thin");
  const kept = ideas.filter((idea) => !(thinned && idea.id === "full-hats"));
  return [
    ...kept.filter((idea) => idea.kind === "fix"),
    ...kept.filter((idea) => idea.kind === "spark"),
  ];
}
