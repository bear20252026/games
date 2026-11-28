/**
 * Heard
 * Which rows are heard (ADR-0053). A row is a drum row (0 to 3) or a take
 * lane ("smp", "vox"). A muted row is not heard. While any row is soloed,
 * the soloed rows are heard and no other, muted or not.
 */

/** Every row that can be muted or soloed, top of the desk to bottom */
export const ROWS = [0, 1, 2, 3, "smp", "vox"];

const isLane = (row) => typeof row === "string";

/** Is this row muted? A drum row's mute is in its track settings, a take lane's in its lane */
export function isMuted(state, row) {
  return Boolean(isLane(row) ? state[row]?.muted : state.trackSettings?.[row]?.muted);
}

/** Is this row soloed? */
export function isSoloed(state, row) {
  return Boolean(state.solo?.[row]);
}

/** Is this row heard, as the desk stands? */
export function isHeard(state, row) {
  const anySolo = Object.values(state.solo ?? {}).some(Boolean);
  return anySolo ? isSoloed(state, row) : !isMuted(state, row);
}
