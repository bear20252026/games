/**
 * Gate
 * What asks for sign-in, and of whom (ADR-0081). A beat is made, played and
 * saved by anyone; it is when it leaves the desk as sound, or goes out to
 * other people, or someone else's is taken, that a name is asked for. What
 * was reached for is remembered, so it can be done once they are signed in,
 * here or on the tab an emailed link opens. No DOM.
 */

/** The things that ask. MIDI is not among them: it is the taste. */
export const ASKS = ["wav", "stems", "groove", "link", "video", "flip"];

// What the sheet says is coming, for each
const NEXT = {
  wav: "Your WAV is next.",
  stems: "Your stems are next.",
  groove: "Your groove is next.",
  link: "Your link is next.",
  video: "Your video is next.",
  flip: "Your flip is next.",
};

const PENDING_KEY = "knockbox-asked";
// A little longer than the emailed link lasts
const PENDING_MS = 20 * 60 * 1000;

/**
 * Does this ask this person to sign in first?
 * @param {string} what
 * @param {{guest: boolean}|null} user - Who the browser is; null for nobody
 */
export function asks(what, user) {
  return ASKS.includes(what) && !(user && user.guest === false);
}

/**
 * The lines the sign-in sheet carries for what was reached for. The beat is
 * said to be saved only when it is.
 * @param {{what: string, saved: boolean}} why
 * @returns {string[]}
 */
export function sheetWords({ what, saved }) {
  const next = NEXT[what];
  return [...(saved ? ["Your beat is saved."] : []), ...(next ? [next] : [])];
}

/**
 * Remember what was reached for, for the desk they are signed in on.
 * @param {Storage} storage
 * @param {{what: string, id?: string}} asked - `id`: the beat a flip is of
 */
export function rememberAsk(storage, { what, id }, now = Date.now()) {
  try {
    storage.setItem(PENDING_KEY, JSON.stringify({ what, id, at: now }));
  } catch {
    // Storage is blocked: they press it again once signed in
  }
}

/** The sheet was put away with nothing sent: nothing is waiting */
export function forgetAsk(storage) {
  try {
    storage.removeItem(PENDING_KEY);
  } catch {
    // Nothing was kept
  }
}

/**
 * What was waiting for a sign-in, if it still is. Asking uses it up.
 * @param {Storage} storage
 * @returns {{what: string, id?: string}|null}
 */
export function pendingAsk(storage, now = Date.now()) {
  try {
    const kept = JSON.parse(storage.getItem(PENDING_KEY) ?? "null");
    storage.removeItem(PENDING_KEY);
    if (!kept || !ASKS.includes(kept.what) || !(now - kept.at < PENDING_MS)) return null;
    const id = typeof kept.id === "string" && /^[\w-]{1,40}$/.test(kept.id) ? kept.id : undefined;
    return { what: kept.what, id };
  } catch {
    return null;
  }
}
