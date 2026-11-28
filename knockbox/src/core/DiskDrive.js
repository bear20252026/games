/**
 * DiskDrive
 * What the SAVE key and the disk box work through: who this browser is, how
 * full their box is, which disk the beat on the desk came from, and the
 * saving, loading, renaming and binning of disks. No DOM.
 *
 * status() is what the SAVE key shows:
 *   "empty"    nothing on the desk to keep
 *   "unsaved"  work that isn't on a disk yet
 *   "saving"   on its way to the server
 *   "saved"    the desk is what the disk in the drive holds
 *   "full"     unsaved work, no disk in the drive, and no blank disk left
 *   "visiting" the beat on the desk is someone else's, opened from its link
 */

import { loadBeat, saveBeat } from "./Disks.js";
import { flipOf, flipTitle } from "./Flips.js";

export class DiskDrive {
  /**
   * @param {Object} parts
   * @param {Api} parts.api
   * @param {Project} parts.project
   * @param {(file: Object) => Promise<Object>} [parts.pack] - Packs a take down on its way out (Packer.pack)
   */
  constructor({ api, project, pack }) {
    this.api = api;
    this.project = project;
    this.pack = pack;
    /** @type {{name: string, face: string, guest: boolean}|null} Nobody, until a first save */
    this.user = null;
    this.count = 0;
    /** How many disks the box holds; null where the operator has taken the limit off (ADR-0039) */
    this.limit = 3;
    /** Called when what other desks can see of this one may have changed: a save, a send, a rename, a bin */
    this.onOut = null;
    /**
     * @type {((id: string) => Promise<void>)|null} Bounces a disk's loop and puts it
     * with the disk: what its listeners hear, in place of the files it was made from (ADR-0042)
     */
    this.mixer = null;
    /** The site key of the bot check on the email forms; null where there is none */
    this.botKey = null;
    /** @type {{id: string, title: string}|null} The disk the desk was saved to or loaded from */
    this.disk = null;
    /**
     * @type {{id: string, title: string, by: {name: string, face: string}}|null}
     * Someone else's beat is on the desk, opened from its link. It can be
     * played and changed, but not kept: a copy would take its maker's audio.
     */
    this.visiting = null;
    /**
     * @type {{id: string|null, title: string|null, by: {name: string, face: string}}[]}
     * Where the beat on the desk came from, oldest first, itself last
     */
    this.chain = [];
    /** How many sent flips have been made from the beat on the desk */
    this.flips = 0;
    /**
     * @type {Object[]} Disks that didn't fit when a guest's beats were moved into this
     * account's full box, newest first (as of the last list())
     */
    this.waiting = [];
    this.busy = false;
    /** Has the API answered? Until it has, there is nowhere to save to */
    this.ready = false;
    this.observers = [];
    this.project.onDirtyChange(() => this.changed());
  }

  /**
   * Find out who this browser is. The desk works without an answer, so
   * this never throws: with no reply it is simply nobody yet.
   */
  async start() {
    try {
      this.took(await this.api.me());
      this.ready = true;
    } catch {
      // Saving will say what is wrong when it is tried
    }
    this.changed();
  }

  status() {
    if (this.busy) return "saving";
    if (this.visiting) return "visiting";
    if (!this.project.isDirty()) return this.disk ? "saved" : "empty";
    return !this.disk && this.isFull() ? "full" : "unsaved";
  }

  isFull() {
    return this.limit !== null && this.count >= this.limit;
  }

  /** How full the box is, in words: "2 of 3", or just "12" for a box with no limit (ADR-0039) */
  tally(count = this.count) {
    return this.limit === null ? `${count}` : `${count} of ${this.limit}`;
  }

  /**
   * Keep the beat on the desk: on the disk in the drive, else on `over`,
   * else on a blank disk.
   * @param {{id: string, title: string}} [over] - A disk picked to be written over
   * @param {string} [title] - The name for a new disk ("untitled n" without one), or for a disk written over
   * @returns {Promise<{saved: boolean, first?: boolean}>} `saved` is false
   *   when there is no blank disk and none was picked: the box should open.
   *   `first` marks the save that made this browser somebody.
   * @throws {ApiError} When the server refuses or can't be reached
   */
  async save(over = null, title = null) {
    const onto = over ?? this.disk;
    if (this.busy || this.visiting || (!onto && this.isFull())) return { saved: false };

    const mark = this.project.mark();
    // A disk written over takes the new beat's name; the one in the drive keeps its own
    const label =
      (over ? title : this.disk?.title) ?? onto?.title ?? title ?? `untitled ${this.count + 1}`;
    this.busy = true;
    this.changed();
    try {
      const reply = await saveBeat(this.api, this.project.snapshot(label), onto?.id, this.pack);
      const first = !this.user && Boolean(reply.user);
      this.took(reply);
      this.disk = { id: reply.beat.id, title: reply.beat.title };
      this.project.markClean(mark);
      // Out with its sounds: its listeners get the loop as it is now, not as it was
      if (reply.beat.sentAt && reply.beat.audioIncluded) {
        this.mixer?.(reply.beat.id).catch(() => {});
      }
      this.onOut?.();
      return { saved: true, first };
    } catch (error) {
      // The box filled up from somewhere else (another tab): count again
      if (error.code === "box_full") this.count = this.limit ?? this.count;
      throw error;
    } finally {
      this.busy = false;
      this.changed();
    }
  }

  /**
   * Put a disk's beat on the desk in place of what is there.
   * @returns {Promise<string[]>} The roles of any audio that couldn't be put back
   */
  async load(id) {
    const beat = await loadBeat(this.api, id);
    const missing = await this.project.restore(beat);
    this.disk = { id: beat.id, title: beat.title };
    this.visiting = null;
    this.chain = beat.chain ?? [];
    this.flips = beat.flips ?? 0;
    this.changed();
    return missing;
  }

  /**
   * Take the beat another desk in this browser handed over (ADR-0040). It is
   * the disk it was on if that disk is now in this box; otherwise, or if it
   * had changed since, it is unsaved work.
   * @param {{snapshot: Object, disk: {id: string, title: string}|null, dirty: boolean}} beat
   * @returns {Promise<string[]>} The roles of any audio that couldn't be put back
   */
  async adopt({ snapshot, disk, dirty }) {
    const missing = await this.project.restore(snapshot);
    const box = disk ? await this.list().catch(() => []) : [];
    const kept = box.some((beat) => beat.id === disk.id);
    this.disk = kept ? { id: disk.id, title: disk.title } : null;
    this.visiting = null;
    this.chain = [];
    this.flips = 0;
    if (!kept || dirty) this.project.touch();
    this.changed();
    return missing;
  }

  /**
   * Put the beat behind a link on the desk. Your own goes in the drive like
   * any disk of yours; someone else's is only visiting.
   * @param {string} id
   * @returns {Promise<{beat: Object, mine: boolean, missing: string[]}>}
   * @throws {ApiError} not_available when the link leads nowhere
   */
  async open(id) {
    const beat = await loadBeat(this.api, id);
    const missing = await this.project.restore(beat);
    this.disk = beat.mine ? { id: beat.id, title: beat.title } : null;
    // What the room it is heard in shows of it, and plays: its maker's loop where it was sent
    // with its sounds (FR-OPEN-12, FR-OPEN-13)
    this.visiting = beat.mine
      ? null
      : {
          id: beat.id,
          title: beat.title,
          by: beat.by,
          bpm: beat.bpm,
          tags: beat.tags ?? [],
          mix: beat.mix ?? null,
          // The built-in loop on it, by its record and id (FR-OPEN-15)
          loop: beat.takes?.smp?.record ?? null,
          // What its listeners say it has got, and which of those this one said (FR-STICK-03)
          stickers: beat.stickers ?? null,
          updatedAt: beat.updatedAt,
        };
    this.chain = beat.chain ?? [];
    this.flips = beat.flips ?? 0;
    this.changed();
    return { beat, mine: beat.mine, missing };
  }

  /**
   * Flip the beat that is visiting: your version of it, as the desk stands,
   * goes on a disk of your own. Its maker's audio stays behind, so the desk
   * is left with the pattern and the feel and both lanes empty.
   * @returns {Promise<Object|null>} The server's reply, as for a first save;
   *   null when there is nothing visiting to flip
   * @throws {ApiError} e.g. box_full, not_available, offline
   */
  async flip() {
    const from = this.visiting;
    if (!from || this.busy) return null;

    const snapshot = flipOf(this.project.snapshot(flipTitle(from.title)));
    this.busy = true;
    this.changed();
    try {
      const reply = await this.api.flipBeat(from.id, snapshot);
      this.took(reply);
      await this.project.restore(snapshot);
      const { id, title } = reply.beat;
      this.disk = { id, title };
      this.visiting = null;
      const { name, face } = this.user;
      this.chain = [...this.chain, { id, title, by: { name, face } }];
      this.flips = 0;
      return reply;
    } catch (error) {
      if (error.code === "box_full") this.count = this.limit ?? this.count;
      throw error;
    } finally {
      this.busy = false;
      this.changed();
    }
  }

  /**
   * Give a disk its public link, or change what goes with it.
   * @param {string} id
   * @param {{includeAudio?: boolean, acceptRules?: boolean}} choice
   * @returns {Promise<{id: string, sentAt: number, audioIncluded: boolean, link: string}>}
   * @throws {ApiError} e.g. claim_required, rules_required, sending_blocked
   */
  async send(id, choice) {
    // The loop goes first, so the link never plays without it
    if (choice.includeAudio) await this.mixer?.(id);
    const sent = await this.api.sendBeat(id, choice);
    this.onOut?.();
    return sent;
  }

  /** Take a disk's link back: it stops working at once */
  async unsend(id) {
    const reply = await this.api.unsendBeat(id);
    this.onOut?.();
    return reply;
  }

  /**
   * Load a disk, asking first if that would lose unsaved work.
   * @param {string} id
   * @param {() => Promise<"save"|"drop"|"cancel">} ask - What to do with the beat on the pads
   * @returns {Promise<{loaded: boolean, full?: boolean, missing?: string[]}>}
   *   `full` when the answer was to save but there is no blank disk: nothing
   *   was loaded, and a disk needs picking to write over.
   */
  /** What is in the crate of beats from other desks, front first */
  async crate() {
    return (await this.api.crate()).beats;
  }

  /** The beats this person has stickered, the last one first (FR-STICK-04) */
  async pile() {
    return (await this.api.pile()).beats;
  }

  /**
   * Put a sticker on someone else's beat, or take your own back off. A first
   * one makes a guest of whoever had no session, as a first SAVE does.
   * @param {string} id
   * @param {string} kind
   * @param {boolean} [on] - False to take it back
   * @returns {Promise<{offered: string[], counts: Object, mine: string[]}>} The beat's stickers as they now are
   */
  async stick(id, kind, on = true) {
    const reply = await this.api.stick(id, kind, on);
    this.took(reply);
    if (this.visiting?.id === id) this.visiting.stickers = reply.stickers;
    this.changed();
    return reply.stickers;
  }

  /**
   * Open a beat that isn't in the box (from the crate), asking first about
   * unsaved work as loadOver does.
   * @param {string} id
   * @param {() => Promise<"save"|"drop"|"cancel">} ask
   * @returns {Promise<{opened: boolean, full?: boolean, beat?: Object, missing?: string[]}>}
   */
  async openOver(id, ask) {
    // Someone else's beat on the desk was never the visitor's to save: nothing to ask about
    if (!this.visiting && this.project.isDirty()) {
      const answer = await ask();
      if (answer === "cancel") return { opened: false };
      if (answer === "save" && !(await this.save()).saved) return { opened: false, full: true };
    }
    return { opened: true, ...(await this.open(id)) };
  }

  async loadOver(id, ask) {
    if (this.project.isDirty()) {
      const answer = await ask();
      if (answer === "cancel") return { loaded: false };
      if (answer === "save" && !(await this.save()).saved) return { loaded: false, full: true };
    }
    return { loaded: true, missing: await this.load(id) };
  }

  /** @returns {Promise<Object[]>} The disks in the box, newest first */
  async list() {
    const reply = await this.api.listBeats();
    this.count = reply.beats.length;
    this.limit = reply.limit;
    this.waiting = reply.waiting ?? [];
    this.changed();
    return reply.beats;
  }

  /**
   * Put a disk that didn't fit in the box (ADR-0038): into a blank's place,
   * or over the kept disk `overId`, which is gone for good.
   */
  async keepWaiting(id, overId) {
    this.took(await this.api.keepWaiting(id, overId));
    if (overId && this.disk?.id === overId) this.unseat();
    this.changed();
    this.onOut?.();
  }

  /** The beat is still on the desk, but no longer on any disk */
  unseat() {
    this.disk = null;
    this.chain = [];
    this.flips = 0;
    this.project.touch();
  }

  async rename(id, title) {
    const { beat } = await this.api.renameBeat(id, title);
    if (this.disk?.id === id) this.disk = { id, title: beat.title };
    this.changed();
    this.onOut?.();
    return beat;
  }

  async bin(id) {
    this.took(await this.api.deleteBeat(id));
    if (this.disk?.id === id) this.unseat();
    this.changed();
    this.onOut?.();
  }

  /** Take what a reply says about who this is and how full the box is */
  took({ user, beats, limit, botKey }) {
    if (botKey !== undefined) this.botKey = botKey;
    if (user !== undefined) this.user = user;
    if (beats !== undefined) this.count = beats;
    if (limit !== undefined) this.limit = limit;
  }

  /**
   * @param {() => void} callback - Called when anything the key or box shows may have changed
   * @returns {Function} Unsubscribe function
   */
  onChange(callback) {
    this.observers.push(callback);
    return () => {
      this.observers = this.observers.filter((cb) => cb !== callback);
    };
  }

  changed() {
    for (const observer of this.observers) observer();
  }
}
