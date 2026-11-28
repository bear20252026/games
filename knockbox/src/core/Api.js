/**
 * Api
 * The desk's side of the Knockbox API: one method per route, each giving
 * back the parsed reply or throwing an ApiError. The session is a cookie the
 * browser keeps and sends by itself. No DOM.
 */

/** A refusal from the API; `code` is its error code, or "offline" when it couldn't be reached */
export class ApiError extends Error {
  /**
   * @param {string} code
   * @param {number} [status]
   * @param {Object} [details] - What came beside the code, e.g. `{ suggestion }`
   */
  constructor(code, status = 0, details = {}) {
    super(code);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class Api {
  /**
   * @param {Object} [options]
   * @param {typeof fetch} [options.fetch]
   * @param {string} [options.base] - Where the API is, if not this site
   */
  constructor({ fetch = (...args) => globalThis.fetch(...args), base = "" } = {}) {
    this.fetch = fetch;
    this.base = base;
  }

  /** @returns {Promise<Response>} A reply that was not a refusal */
  async send(method, path, { json, bytes } = {}) {
    const init = { method, credentials: "same-origin" };
    if (json !== undefined) {
      init.headers = { "Content-Type": "application/json" };
      init.body = JSON.stringify(json);
    }
    if (bytes) {
      init.headers = { "Content-Type": "application/octet-stream" };
      init.body = bytes;
    }

    let response;
    try {
      response = await this.fetch(`${this.base}${path}`, init);
    } catch {
      throw new ApiError("offline");
    }
    if (response.ok) return response;
    const refusal = await response.json().catch(() => null);
    const { error = "server_error", ...details } = refusal ?? {};
    throw new ApiError(error, response.status, details);
  }

  async json(method, path, body) {
    return (await this.send(method, path, body)).json();
  }

  /** Who this browser is: { user: { name, face, guest } | null, beats, limit, botKey } */
  me() {
    return this.json("GET", "/api/me");
  }

  /** Change the name or the face: { user } */
  updateMe(changes) {
    return this.json("PUT", "/api/me", { json: changes });
  }

  /** Is a name free: { free, problem?, suggestion? } */
  checkName(name) {
    return this.json("POST", "/api/name-check", { json: { name } });
  }

  /** Ask for a sign-in email: { email, botToken } -> { sent, ticket } */
  signIn(details) {
    return this.json("POST", "/api/signin", { json: details });
  }

  /** Hand over the key from an emailed link: { user, beats, limit, left } */
  redeem(key) {
    return this.json("POST", "/api/auth", { json: { key } });
  }

  /** Hand over the code from the email, with the ticket this browser was given for it */
  redeemCode(ticket, code) {
    return this.json("POST", "/api/auth", { json: { ticket, code } });
  }

  signOut() {
    return this.json("POST", "/api/signout", { json: {} });
  }

  /** Delete the account and everything in it */
  deleteMe() {
    return this.json("DELETE", "/api/me");
  }

  /**
   * A person's page. Its owner: { user, mine: true, email, rulesAccepted, sendingBlocked, beats, limit };
   * anyone else: { user: { name, face, since }, mine: false, beats } with only what is out.
   */
  profile(name) {
    return this.json("GET", `/api/users/${encodeURIComponent(name)}`);
  }

  /** Have something that happened on the desk counted; only its name is sent */
  count(name) {
    return this.send("POST", "/api/event", { json: { name } });
  }

  /** The disks in the box: { beats: [{ id, title, bpm, ... }], limit } */
  listBeats() {
    return this.json("GET", "/api/beats");
  }

  /** @param {Object} beat - A snapshot with its audio named by hash, not carried */
  createBeat(beat) {
    return this.json("POST", "/api/beats", { json: beat });
  }

  /** Write a beat over the one on a disk */
  updateBeat(id, beat) {
    return this.json("PUT", `/api/beats/${encodeURIComponent(id)}`, { json: beat });
  }

  renameBeat(id, title) {
    return this.json("PUT", `/api/beats/${encodeURIComponent(id)}`, { json: { title } });
  }

  /** Put a waiting disk in the box, over the kept disk `over` if there is no blank: { beat, beats, limit } */
  keepWaiting(id, over) {
    return this.json("POST", `/api/beats/${encodeURIComponent(id)}/keep`, {
      json: over ? { over } : {},
    });
  }

  deleteBeat(id) {
    return this.json("DELETE", `/api/beats/${encodeURIComponent(id)}`);
  }

  getBeat(id, { listening = false } = {}) {
    // Only to be heard where it sits in the crate: not an open of the beat
    return this.json(
      "GET",
      `/api/beats/${encodeURIComponent(id)}${listening ? "?for=listen" : ""}`,
    );
  }

  /** Give a beat its public link: { includeAudio, inCrate, acceptRules } -> { id, sentAt, audioIncluded, inCrate, link } */
  sendBeat(id, choice) {
    return this.json("POST", `/api/beats/${encodeURIComponent(id)}/send`, { json: choice });
  }

  /** Take the link back */
  unsendBeat(id) {
    return this.json("POST", `/api/beats/${encodeURIComponent(id)}/unsend`, { json: {} });
  }

  /** Keep your version of someone's sent beat on a disk of your own; replies as createBeat does */
  flipBeat(id, snapshot) {
    return this.json("POST", `/api/beats/${encodeURIComponent(id)}/flip`, { json: snapshot });
  }

  /** Someone else's sent beat was heard here; the server counts one play per listener per day */
  playBeat(id) {
    return this.send("POST", `/api/beats/${encodeURIComponent(id)}/play`, { json: {} });
  }

  /**
   * Put a sticker on someone else's sent beat, or take your own back off (ADR-0046).
   * @returns {Promise<{stickers: {offered: string[], counts: Object, mine: string[]}, user?: Object}>}
   */
  stick(id, kind, on = true) {
    const path = `/api/beats/${encodeURIComponent(id)}/stickers/${encodeURIComponent(kind)}`;
    return this.json(on ? "PUT" : "DELETE", path, on ? { json: {} } : undefined);
  }

  /** The sent beats you have stickered, the last one first: { beats } as the crate's */
  pile() {
    return this.json("GET", "/api/pile");
  }

  /** The sent flips of a beat: { flips: [{ id, title, bpm, by }] } */
  listFlips(id) {
    return this.json("GET", `/api/beats/${encodeURIComponent(id)}/flips`);
  }

  /** Beats from other desks: { beats: [{ id, title, bpm, tags, steps, sentAt, by, house }] } */
  crate() {
    return this.json("GET", "/api/crate");
  }

  /** What the day's beats have been like: { pulse: { count, span, sound } | null } */
  pulse() {
    return this.json("GET", "/api/pulse");
  }

  /** Report a sent beat: { beatId, reason, contact? } */
  report(details) {
    return this.json("POST", "/api/report", { json: details });
  }

  /** @param {string} sha256 @param {Uint8Array} bytes */
  /** Name the loop a beat's listeners will hear: { sha256, bytes } -> { upload } (ADR-0042) */
  putMix(id, file) {
    return this.json("PUT", `/api/beats/${encodeURIComponent(id)}/mix`, { json: file });
  }

  putAudio(sha256, bytes) {
    return this.json("PUT", `/api/audio/${sha256}`, { bytes });
  }

  /** @returns {Promise<Uint8Array>} One of a beat's audio files */
  async getAudio(sha256, beatId) {
    const path = `/api/audio/${sha256}?beat=${encodeURIComponent(beatId)}`;
    return new Uint8Array(await (await this.send("GET", path)).arrayBuffer());
  }
}
