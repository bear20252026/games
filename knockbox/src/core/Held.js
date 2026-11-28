/**
 * Held
 * A guest's disks are kept for whoever holds this browser's cookie, and for
 * nobody else: with no email on the account there is no way back to them
 * (ADR-0035). The desk shows that until the account is theirs. No DOM.
 */

/** Set once the warning sign has rung on this browser */
export const HELD_SEEN = "knockbox-held-seen";

/**
 * @param {{guest: boolean}|null} user
 * @param {number} count - Disks in their box
 * @returns {boolean} Whether there is saved work that this browser alone holds
 */
export function isHeld(user, count) {
  return Boolean(user?.guest) && count > 0;
}

/** The ways a held beat is lost: a picture and two words each */
export const HELD_WAYS = [
  {
    words: "cookies cleared",
    icon: "M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-5-5zm-3 6a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm5 3.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM9 15a1 1 0 1 1 0 2 1 1 0 0 1 0-2z",
  },
  {
    words: "another device",
    icon: "M3 5h12a1 1 0 0 1 1 1v2h-2V7H4v8h8v2H2v-1h1zm12 4h6a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm1 2v7h4v-7z",
  },
  {
    words: "private window",
    icon: "M8.5 4h7l1.8 6H21v2H3v-2h3.7zM7.5 14a3 3 0 0 1 2.9 2.3 2.3 2.3 0 0 1 3.2 0A3 3 0 1 1 13.5 18a1 1 0 0 0-3 0 3 3 0 1 1-3-4zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm9 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z",
  },
];
