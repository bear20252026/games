/**
 * Project
 * A beat as one thing that can be saved and brought back: the store's state,
 * plus the audio that lives outside it (the takes on the two lanes, and any
 * drum sounds of your own). No DOM.
 *
 * A snapshot:
 *   {
 *     version,                       // PROJECT_VERSION when it was made
 *     title,
 *     state,                         // the store, without what only matters while playing
 *     takes: { smp, vox },           // per lane: { trim, takeSeconds, fitted }, or absent;
 *                                    // with `record` it is a built-in loop, named and not carried
 *     drums: { kick: { inUse } },    // your own drum sounds, and whether each is switched in
 *     audio: [{ role, name, type, bytes }],   // "loop" | "vocal" | "drum:<key>"
 *   }
 */

import { keptSpan } from "./Caps.js";
import { encodeWav } from "./FileUtils.js";
import { builtInTakes } from "./Records.js";
import { soundId, TRACK_KEYS } from "./Sounds.js";

export const PROJECT_VERSION = 1;

// What each take lane's audio is called in a snapshot
const LANE_ROLES = { smp: "loop", vox: "vocal" };

// One step per version: MIGRATIONS[n] turns a version n snapshot into n + 1
const MIGRATIONS = {};

/**
 * The part of the store's state that belongs in a saved beat: everything
 * but what is only true of this moment (playing, a held key, a file mid-load,
 * an erased take that could still be brought back).
 */
export function persistable(state) {
  // What is armed and what is soloed are of the moment, not of the beat
  const { armedArt: _armedArt, solo: _solo, ...kept } = state;
  const lane = (key) => ({ ...state[key], loading: null, erased: false });
  // Pencil and whose a pad is are of the sitting (ADR-0058): a beat is saved as pads lit or not
  const steps = {};
  for (const [id, { pencil: _pencil, mine: _mine, ...pad }] of Object.entries(state.steps)) {
    steps[id] = pad;
  }
  return {
    ...kept,
    steps,
    transport: { bpm: state.transport.bpm },
    vox: lane("vox"),
    smp: lane("smp"),
  };
}

/**
 * Bring a snapshot made by an older version up to this one.
 * @param {Object} snapshot
 * @param {Object} [migrations] - Step per version, as MIGRATIONS
 * @param {number} [current] - The version to arrive at
 * @returns {Object} A snapshot at `current` (the one given, if it already was)
 */
export function migrate(snapshot, migrations = MIGRATIONS, current = PROJECT_VERSION) {
  const from = snapshot?.version;
  if (!Number.isInteger(from) || from < 1) throw new Error("Not a saved beat");
  if (from > current) throw new Error("This beat was saved by a newer Knockbox");

  let project = snapshot;
  for (let version = from; version < current; version++) {
    project = { ...migrations[version](project), version: version + 1 };
  }
  return project;
}

// A take that hasn't changed is written out once, not at every save
const WAV_FILES = new WeakMap();
// Nor is the part of a long file that a beat carries, while it is the same part
const CUT_FILES = new WeakMap();

/** Part of a loaded file as a WAV of its own: what a saved beat carries of a long one (ADR-0082) */
function cutFile(buffer, { from, to }, name) {
  const first = Math.round(from * buffer.sampleRate);
  const last = Math.min(buffer.length, Math.round(to * buffer.sampleRate));
  const cached = CUT_FILES.get(buffer);
  if (cached?.first !== first || cached.last !== last) {
    const channels = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      channels.push(buffer.getChannelData(c).subarray(first, last));
    }
    const bytes = encodeWav(channels, buffer.sampleRate);
    CUT_FILES.set(buffer, { first, last, bytes });
  }
  return {
    file: {
      name: `${name.replace(/\.[^./]+$/, "")}.wav`,
      type: "audio/wav",
      bytes: CUT_FILES.get(buffer).bytes,
    },
    // A time in the file as a time in the part, to the sample: as a trim reads it back
    place: (seconds) => (Math.round(seconds * buffer.sampleRate) - first) / buffer.sampleRate,
  };
}

/** An audio buffer as a WAV file, for a sound that was never a file (a mic take, a beatboxed drum) */
function wavFile(buffer, name) {
  if (!WAV_FILES.has(buffer)) {
    const channels = [];
    for (let c = 0; c < buffer.numberOfChannels; c++) channels.push(buffer.getChannelData(c));
    WAV_FILES.set(buffer, { type: "audio/wav", bytes: encodeWav(channels, buffer.sampleRate) });
  }
  return { name, ...WAV_FILES.get(buffer) };
}

export class Project {
  /**
   * @param {Object} parts
   * @param {Store} parts.store
   * @param {AudioEngine} parts.audioEngine
   * @param {VoxEngine[]} parts.takeEngines - One per take lane
   * @param {(bytes: Uint8Array) => Promise<AudioBuffer>} parts.decode
   * @param {() => void} [parts.onLoaded] - Called once a beat is on the desk,
   *   for whatever doesn't follow the store on its own
   * @param {(ref: string) => Promise<Uint8Array>} [parts.fetchLoop] - A built-in loop's
   *   file, by its record and id (ADR-0088)
   */
  constructor({ store, audioEngine, takeEngines, decode, onLoaded = () => {}, fetchLoop }) {
    this.fetchLoop = fetchLoop;
    // The desk as it is the maker's: set by the desk where something of the drummer's can be on trial
    this.standing = (state) => state;
    this.store = store;
    this.audioEngine = audioEngine;
    this.takeEngines = takeEngines;
    this.decode = decode;
    this.onLoaded = onLoaded;

    // Unsaved work: the state differs from when it was last saved or loaded,
    // or a drum sound has changed (those live outside the store)
    this.clean = this.mark();
    this.touches = 0;
    this.dirty = false;
    this.dirtyObservers = [];
    this.store.subscribe(() => this.checkDirty());
    // Each row's built-in sound is in the store; the engine is told when it changes (ADR-0049)
    this.store.subscribe(() => this.pickSounds());
    this.pickSounds();
  }

  /** Put on each row the built-in sound the beat names for it */
  pickSounds() {
    const { trackSettings } = this.store.getState();
    TRACK_KEYS.forEach((key, track) => {
      const sound = soundId(key, trackSettings?.[track]?.sound);
      if (this.audioEngine.kit && soundId(key, this.audioEngine.kit[key]) !== sound) {
        this.audioEngine.useSound(key, sound);
      }
    });
  }

  /**
   * The beat on the desk, as it stands.
   * @param {string} [title]
   */
  snapshot(title = "untitled") {
    const audio = [];
    const takes = {};
    for (const engine of this.takeEngines) {
      const take = engine.exportTake();
      if (!take) continue;
      const role = LANE_ROLES[engine.laneKey];
      const { trim, takeSeconds, fitted } = take;
      // A built-in loop goes by its name, as a built-in drum does: no file of it (FR-OPEN-15)
      if (take.file?.record) {
        takes[engine.laneKey] = { trim, takeSeconds, fitted, record: take.file.record };
        continue;
      }
      // Of a long file the beat carries what is heard and a little either side; the rest
      // stays in the tab (ADR-0082)
      const heard = trim ?? { start: 0, end: Math.min(take.audio.duration, takeSeconds) };
      const span = keptSpan(heard, take.audio.duration);
      if (!span) {
        takes[engine.laneKey] = { trim, takeSeconds, fitted };
        audio.push({ role, ...(take.file ?? wavFile(take.audio, `${role}.wav`)) });
        continue;
      }
      const part = cutFile(take.audio, span, take.file?.name ?? `${role}.wav`);
      takes[engine.laneKey] = {
        trim: trim && { start: part.place(trim.start), end: part.place(trim.end) },
        takeSeconds,
        fitted,
      };
      audio.push({ role, ...part.file });
    }

    const drums = {};
    for (const [key, buffer] of Object.entries(this.audioEngine.customBuffers)) {
      drums[key] = { inUse: this.audioEngine.hasCustomSample(key) };
      const file = this.audioEngine.customFiles[key] ?? wavFile(buffer, `${key}.wav`);
      audio.push({ role: `drum:${key}`, ...file });
    }

    const state = persistable(this.standing(this.store.getState()));
    const snapshot = { version: PROJECT_VERSION, title, state, takes, drums, audio };
    return snapshot;
  }

  /**
   * Put a saved beat on the desk in place of what is there.
   * @param {Object} snapshot - As snapshot() made it, at any version
   * @returns {Promise<string[]>} The roles of any audio that couldn't be put
   *   back (empty when the whole beat came back)
   */
  async restore(snapshot) {
    const project = migrate(snapshot);
    const files = new Map(project.audio.map((file) => [file.role, file]));

    // Decode everything first: a file that can't be read leaves the desk as it was
    const buffers = new Map();
    for (const file of project.audio) buffers.set(file.role, await this.decode(file.bytes));
    // A built-in loop is fetched from the site by its name. One that can't be had (its
    // record since taken away, or no connection) is reported as missing, like a lost file
    for (const [lane, { record }] of Object.entries(builtInTakes(project.takes))) {
      const role = LANE_ROLES[lane];
      if (!role || files.has(role) || !this.fetchLoop) continue;
      try {
        const bytes = await this.fetchLoop(record);
        buffers.set(role, await this.decode(bytes));
        files.set(role, { role, name: `${record.split("/")[1]}.wav`, type: "audio/wav", bytes });
      } catch {
        // Left out: open() says which lane came back empty
      }
    }

    // What changes from here until the beat is whole is the beat arriving, not its maker at work
    this.store.opening = true;
    try {
      return await this.open(project, files, buffers);
    } finally {
      this.store.opening = false;
    }
  }

  /** Put a read beat on the desk: restore(), once everything in it is decoded */
  async open(project, files, buffers) {
    // The lanes go on empty and are filled as each take is read, so the
    // desk never shows chops for audio that isn't there yet
    for (const engine of this.takeEngines) engine.drop();
    const state = { ...project.state };
    for (const key of Object.keys(LANE_ROLES)) state[key] = { ...state[key], slices: [] };
    this.store.dispatch({ type: "LOAD_PROJECT", payload: state });

    this.audioEngine.clearCustomSamples();
    for (const [key, { inUse }] of Object.entries(project.drums ?? {})) {
      const role = `drum:${key}`;
      if (!buffers.has(role)) continue;
      const { name, type, bytes } = files.get(role);
      this.audioEngine.replaceSample(buffers.get(role), key, { name, type, bytes });
      if (!inUse) this.audioEngine.useCustomSample(key, false);
    }

    const missing = [];
    for (const engine of this.takeEngines) {
      const take = project.takes?.[engine.laneKey];
      const role = LANE_ROLES[engine.laneKey];
      if (!take) continue;
      const { name, type, bytes } = files.get(role) ?? {};
      // A built-in loop stays one: saved again it is still named, not carried
      const from = builtInTakes({ [engine.laneKey]: take })[engine.laneKey]?.record;
      const file = bytes ? { name, type, bytes, ...(from && { record: from }) } : null;
      const lane = project.state[engine.laneKey];
      const back =
        buffers.has(role) && (await engine.importTake(buffers.get(role), { ...take, file }, lane));
      if (!back) missing.push(role);
    }

    this.onLoaded();
    this.markClean();
    return missing;
  }

  // ---- Unsaved work ----

  stateKey() {
    return JSON.stringify(persistable(this.standing(this.store.getState())));
  }

  isDirty() {
    return this.dirty;
  }

  /** Something outside the store changed (a drum sound was loaded, switched or reset) */
  touch() {
    this.touches++;
    this.checkDirty();
  }

  /**
   * The desk as it stands now, to hand to markClean() later. A save takes a
   * while; whatever changes on the desk meanwhile is still unsaved after it.
   */
  mark() {
    return { key: this.stateKey(), touches: this.touches ?? 0 };
  }

  /**
   * What is on the desk is now what is saved.
   * @param {Object} [mark] - From mark(), when the save was of the desk as it was then
   */
  markClean(mark = this.mark()) {
    this.clean = mark;
    this.checkDirty();
  }

  /**
   * @param {(dirty: boolean) => void} callback - Called when there starts or stops being unsaved work
   * @returns {Function} Unsubscribe function
   */
  onDirtyChange(callback) {
    this.dirtyObservers.push(callback);
    return () => {
      this.dirtyObservers = this.dirtyObservers.filter((cb) => cb !== callback);
    };
  }

  checkDirty() {
    const dirty = this.touches !== this.clean.touches || this.stateKey() !== this.clean.key;
    if (dirty === this.dirty) return;
    this.dirty = dirty;
    for (const observer of this.dirtyObservers) observer(dirty);
  }
}
