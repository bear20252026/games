/**
 * Sending
 * The desk's side of giving a beat a public link (ADR-0006, ADR-0007): the
 * steps of a send, the link and where it can be passed on, and reading a
 * beat's id out of the address it was opened from. No DOM.
 */

// How long a send that had to wait for a sign-in is remembered
const PENDING_MS = 20 * 60 * 1000;
const PENDING_KEY = "knockbox-send-after";

/**
 * Where a sent beat is opened from.
 * @param {string} origin - The site, e.g. https://knockbox.app
 * @param {string} id
 */
export function beatLink(origin, id) {
  return `${origin}/b/${encodeURIComponent(id)}`;
}

/** The link as it is written on the tape: no https:// */
export function shownLink(link) {
  return link.replace(/^https?:\/\//, "");
}

/**
 * Ready-made ways to pass a link on.
 * @param {string} link
 * @param {string} title
 * @param {string} [maker] - Whose beat it is, when the one passing it on may not have made it
 * @returns {{email: string, whatsapp: string}} Addresses to open
 */
export function shareLinks(link, title, maker) {
  // What it is, then what to do with it; the feed draws the beat's card from the link
  const what = `"${title}", a beat ${maker ? `by ${maker}` : "I made"} on Knockbox`;
  const words = `${what}. Press play, then flip it: ${link}`;
  return {
    email: `mailto:?subject=${encodeURIComponent(what)}&body=${encodeURIComponent(words)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(words)}`,
  };
}

/**
 * The id of the beat an address opens, if it is a beat's link.
 * @param {string} pathname - e.g. /b/x7k2
 * @returns {string|null}
 */
export function beatIdFrom(pathname) {
  const found = /^\/b\/([A-Za-z0-9_-]{1,64})\/?$/.exec(pathname ?? "");
  return found ? found[1] : null;
}

/**
 * Send a disk. The note asks what goes with it; the house rules are asked
 * about only if the server says they haven't been agreed to yet.
 * @param {Object} parts
 * @param {(choice: Object) => Promise<Object>} parts.send - Tell the server: ({ includeAudio, acceptRules })
 * @param {() => Promise<{includeAudio: boolean}|null>} parts.ask - The send note; null is "keep private"
 * @param {() => Promise<boolean>} parts.askRules - The house rules; false is "not now"
 * @returns {Promise<Object|null>} The server's reply, or null if the person backed out
 * @throws {ApiError} When the server refuses for any other reason
 */
export async function sendDisk({ send, ask, askRules }) {
  const choice = await ask();
  if (!choice) return null;
  const going = { includeAudio: choice.includeAudio === true };
  // The second box: into the crate only on a plain yes (FR-CRATE-02)
  if (choice.inCrate === true) going.inCrate = true;
  try {
    return await send(going);
  } catch (error) {
    if (error.code !== "rules_required") throw error;
  }
  if (!(await askRules())) return null;
  return send({ ...going, acceptRules: true });
}

/**
 * A guest pressed SEND and has to sign in first: the disk
 * is remembered, so the send can carry on once they are back from their inbox.
 * @param {Storage} storage
 */
export function rememberSend(storage, id, now = Date.now()) {
  try {
    storage.setItem(PENDING_KEY, JSON.stringify({ id, at: now }));
  } catch {
    // Storage is blocked: they press SEND again once signed in
  }
}

/**
 * The disk whose send was waiting, if it still is. Asking uses it up.
 * @param {Storage} storage
 * @returns {string|null}
 */
export function pendingSend(storage, now = Date.now()) {
  try {
    const kept = JSON.parse(storage.getItem(PENDING_KEY) ?? "null");
    storage.removeItem(PENDING_KEY);
    const fresh = kept && typeof kept.id === "string" && now - kept.at < PENDING_MS;
    return fresh ? kept.id : null;
  } catch {
    return null;
  }
}
