/**
 * The built-in drums
 * Each row has a few sounds to pick from, every one a file Knockbox may hand
 * out (ADR-0043, samples/SOURCES.md). The first is what a new desk plays. A
 * row's pick is kept with the beat by its id, so it goes wherever the beat
 * goes (ADR-0049). No DOM; the engine and the row's readout both read this.
 */

/** The rows, top to bottom, by the name their sound goes under */
export const TRACK_KEYS = ["kick", "snare", "hihat-closed", "hihat-open"];

const SOUNDS = {
  kick: { short: "kick", ids: ["round", "dead", "deep", "punch", "room", "soft"] },
  snare: { short: "snr", ids: ["crack", "snappy", "heavy", "edge", "stick", "room"] },
  "hihat-closed": { short: "hh", ids: ["tight", "closed", "tick", "foot", "dark", "half"] },
  "hihat-open": { short: "oh", ids: ["open", "loose", "half", "bright", "dark", "soft"] },
};

/** The sounds a row can be switched between, the one a new desk plays first */
export function soundsFor(key) {
  return SOUNDS[key]?.ids ?? [];
}

/** A row's pick as it stands: the id given, or the first where it is missing or not one of the row's */
export function soundId(key, id) {
  const ids = soundsFor(key);
  return ids.includes(id) ? id : ids[0];
}

/** The file in samples/ a pick is: the first keeps the row's own name, as it always had */
export function soundFile(key, id) {
  const picked = soundId(key, id);
  return picked === soundsFor(key)[0] ? `${key}.wav` : `${key}-${picked}.wav`;
}

/** What the readout says for a pick, as a sampler names a file: "deep.wav" */
export function soundLabel(key, id) {
  return `${soundId(key, id)}.wav`;
}

/** What goes before it where the row's name is put away: "kick_" */
export function soundPrefix(key) {
  return `${SOUNDS[key].short}_`;
}

/**
 * The pick one step on or back, going round.
 * @param {string} key
 * @param {string|null} id - Null when the row is on a sound of the maker's own: on from there is the first, back the last
 * @param {number} by - 1 or -1
 */
export function stepSound(key, id, by) {
  const ids = soundsFor(key);
  if (id === null) return by > 0 ? ids[0] : ids[ids.length - 1];
  return ids[(ids.indexOf(soundId(key, id)) + by + ids.length) % ids.length];
}

/**
 * What a take row's readout says: a loaded loop by its file's name, a voice
 * take as a file of the desk's own naming.
 * @param {string} laneKey - "smp" or "vox"
 * @param {string} [fileName] - The loaded file's name, where there is one
 */
export function takeLabel(laneKey, fileName) {
  if (laneKey === "vox") return "vox.wav";
  return fileName || "loop.wav";
}
