/**
 * Locks
 * Whether a drum row is held on the grid whatever the swing dial says.
 */

/**
 * @param {Object} state
 * @param {number} track
 * @returns {{locked: boolean, held: boolean}} `held`: locked by LIVE mode (the kick), not by the maker
 */
export function swingLock(state, track) {
  const held = state.grooveSettings?.hihatMode === "live" && track === 0;
  return { locked: held || Boolean(state.trackSettings?.[track]?.swingLocked), held };
}
