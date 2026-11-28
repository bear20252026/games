// Track mapping: 0=Kick, 1=Snare, 2=Hi-hat closed, 3=Hi-hat open
function generateSteps(numTracks, numSteps) {
  const obj = {};
  for (let i = 0; i < numTracks; i++) {
    for (let j = 0; j < numSteps; j++) {
      const uuid = `track-${i}_${j}`;
      const newObj = {
        id: uuid,
        // A desk opens with nothing lit: the drummer offers a beat to start from (ADR-0066)
        active: false,
        art: null, // articulation: null | 'flam' | 'drag' | 'roll2' | 'roll3' | 'trip'
      };
      obj[uuid] = newObj;
    }
  }
  return obj;
}

const initialState = {
  transport: {
    bpm: 88, // Dilla sweet spot: 86-94 BPM
    isPlaying: false,
  },
  steps: generateSteps(4, 16),
  humanizeValue: 0,
  // NOTE REPEAT key currently held down: null = plain step entry,
  // otherwise the articulation that tapping a pad will paint
  armedArt: null,
  // Rows soloed for listening, by row (0 to 3, "smp", "vox"). Never saved with a beat (ADR-0053)
  solo: {},
  // Global groove settings
  grooveSettings: {
    hihatMode: "friction", // 'friction' (rigid hats) | 'limp' (closed HH drags late)
    switchUp: false, // every second bar played a little differently, with a turn back to the top (ADR-0078)
  },
  // Per-track settings
  // swingLocked: if true, track stays on-grid regardless of humanize dial
  // ghostQuantity: 0-100 (controls density of ghost notes, independent of humanize dial)
  // sound: which built-in drum the row plays, by id (null: the row's first; core/Sounds.js)
  trackSettings: {
    0: { swingLocked: false, ghostQuantity: 0, sound: null, muted: false }, // Kick: unlocked, no ghosts
    1: { swingLocked: false, ghostQuantity: 0, sound: null, muted: false }, // Snare: unlocked, 50% ghosts
    2: { swingLocked: false, ghostQuantity: 0, sound: null, muted: false }, // Hi-hat closed: unlocked, no ghosts
    3: { swingLocked: false, ghostQuantity: 0, sound: null, muted: false }, // Hi-hat open: unlocked, no ghosts
  },
  // Mixer: each row's fader, 0-100 (80 is unity). Drum rows by track, take rows by lane.
  mix: { 0: 80, 1: 80, 2: 80, 3: 80, smp: 80, vox: 80 },
  // VOX lane: a voice take cut at its onsets and dropped into the pocket.
  // Only the markers live here; the audio itself stays in VoxEngine.
  vox: {
    mode: "vocal", // what the mic does with a take: 'vocal' (VOX lane) | 'beatbox' (drum pattern)
    bars: 2, // loop length of the take (1, 2 or 4)
    origin: "mic", // where the take came from: 'mic' | 'file' (a dropped or loaded loop)
    takeBpm: 88, // tempo the take was made at (for a loop: worked out from its length)
    tightness: 100, // 0 = timing as performed, 100 = locked to the pocket
    follow: "kick", // whose pocket it leans on: 'kick' | 'snare' | 'hat'
    offset: 0, // seconds the whole take is slid against the beat (+ = later)
    chop: "auto", // how the take was cut: 'auto' | 'beats' | 'bars' | 'whole' | 'edit' (by hand)
    resolution: "16", // grid it snaps to: '16' | '8' | 'trip'
    gain: 1,
    muted: false, // lane silenced: not played, left out of the stereo bounce, take kept
    erased: false, // a take was erased and can still be brought back
    fx: 0, // SAUCE fader, 0-100: how much of the take is sent to the chorus, echo and hall
    tune: false, // TUNE key: each chop nudged onto the nearest note of the loop's key
    key: null, // a loaded loop's key, { name, scale, cents }; null for a mic take or no clear key
    loading: null, // name of the file being read onto this lane, while it is
    slices: [], // { id, start, end, onset, source, muted } in seconds within the take
  },
  // SMP lane: a loaded or dropped loop, on its own row. Same shape as vox.
  smp: {
    bars: 2, // loop length of the take (1, 2 or 4)
    origin: "file", // where the take came from: 'mic' | 'file' (a dropped or loaded loop)
    takeBpm: 88, // tempo the take was made at (for a loop: worked out from its length)
    tightness: 100, // 0 = timing as performed, 100 = locked to the pocket
    follow: "kick", // whose pocket it leans on: 'kick' | 'snare' | 'hat'
    offset: 0, // seconds the whole take is slid against the beat (+ = later)
    chop: "auto", // how the take was cut: 'auto' | 'beats' | 'bars' | 'whole' | 'edit' (by hand)
    resolution: "16", // grid it snaps to: '16' | '8' | 'trip'
    gain: 1,
    muted: false, // lane silenced: not played, left out of the stereo bounce, take kept
    erased: false, // a take was erased and can still be brought back
    fx: 0, // SAUCE fader, 0-100: how much of the take is sent to the chorus, echo and hall
    tune: false, // TUNE key: each chop nudged onto the nearest note of the loop's key
    key: null, // a loaded loop's key, { name, scale, cents }; null for a mic take or no clear key
    loading: null, // name of the file being read onto this lane, while it is
    slices: [], // { id, start, end, onset, source, muted } in seconds within the take
  },
};

export default initialState;
