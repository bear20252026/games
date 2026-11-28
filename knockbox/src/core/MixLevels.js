/**
 * Mixer levels
 * Every row has a fader from 0 to 100. UNITY_LEVEL is "as recorded"; above
 * it is a few dB of boost. The taper is squared, so the fader's travel feels
 * even to the ear rather than bunching all the change at the bottom.
 */

export const UNITY_LEVEL = 80;
export const MAX_LEVEL = 100;

/** Fader position (0-100) to a gain multiplier */
export function levelToGain(level) {
  return (level / UNITY_LEVEL) ** 2;
}

/** Fader position as the dB legend beside it */
export function levelToDb(level) {
  if (level <= 0) return "-∞ dB";
  const db = 20 * Math.log10(levelToGain(level));
  return `${db > 0.05 ? "+" : ""}${db.toFixed(1)} dB`;
}
