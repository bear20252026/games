/**
 * DiskBox
 * The box of floppy disks on the wood left of the sampler: one disk per
 * saved beat, standing label-up, with the count of the three free disks on a
 * strip of tape. Pick a disk up to LOAD it onto the pads, RENAME its label
 * or BIN it. When the box is full, SAVE opens it so a disk can be picked to
 * write over. A disk that didn't fit when you signed in lies on top of the
 * box until it is put in over another, or binned (ADR-0038).
 *
 * It stays off the desk until the API has answered, like the SAVE key.
 */

import { isHeld } from "../core/Held.js";
import { beatLink, shareLinks, shownLink } from "../core/Sending.js";
import { faceUrl } from "./AccountMenu.js";
import { LcdMessage } from "./LcdMessage.js";
import { SendNote } from "./SendNote.js";
import { Toast } from "./Toast.js";

// A blank thrown out, the new disk pushed in, the box knocked (ms)
const EJECT_MS = 380;
// Between one disk and the next, when a boxful moves together
const CARRY_GAP_MS = 90;
const PUSH_MS = 240;
const KNOCK_MS = 200;

// How many disks stand in the box, however many it holds (ADR-0039)
const SLOTS = 3;

// Label colours
const COLOURS = ["#c8241a", "#2a9d8f", "#facc15", "#3b82c4"];
const TITLE_LENGTH = 40;

const REFUSALS = {
  offline: "Couldn't reach the server. Nothing was changed.",
  sending_blocked: "This account can't send beats any more.",
  claim_required: "Sign in first, then send.",
  not_available: "That disk isn't there any more.",
  bad_title: "A label needs 1 to 40 characters.",
  box_full: "The box is full. Pick a disk to write over.",
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // Titles are typed by people: always text, never markup
  if (text !== undefined) node.textContent = text;
  return node;
}

/** A disk's label colour: its id picks one, so it keeps its colour for good */
export function diskColour(id) {
  let sum = 0;
  for (const letter of id) sum += letter.charCodeAt(0);
  return COLOURS[sum % COLOURS.length];
}

/** A floppy disk: its body, shutter and label */
export function floppy(className, title, colour) {
  const disk = el("span", `floppy ${className}`);
  disk.style.setProperty("--label", colour);
  disk.append(el("span", "floppy-shutter"), el("span", "floppy-label", title));
  return disk;
}

export class DiskBox {
  /**
   * @param {Object} options
   * @param {DiskDrive} options.disks
   * @param {(id: string) => Promise<boolean>} options.onLoad - Put a disk's
   *   beat on the pads; resolves false if the person backed out
   * @param {(beat: Object) => Promise<Object|null>} options.onSend - Give a
   *   disk its public link; resolves with the server's reply, or null if nothing was sent
   * @param {(beat: Object, kept: Object[]) => Promise<Object|null>} options.onFull - No
   *   blank for a waiting disk: resolves with the kept disk to write over, or null
   * @param {() => void} [options.onCopied] - A beat's link went on the clipboard
   */
  constructor({ disks, onLoad, onSend, onFull, onCopied }) {
    this.disks = disks;
    this.onCopied = onCopied;
    this.onLoad = onLoad;
    this.onSend = onSend;
    this.onFull = onFull;
    /** Disks that didn't fit in the box, lying on top of it */
    this.waiting = [];
    this.root = document.querySelector("#disk-box");
    /** The disks in the box, newest first */
    this.beats = [];
    /** The id of the disk picked up, if one is */
    this.picked = null;
    /** What is being done to the picked disk: null, "rename" or "bin" */
    this.doing = null;
    /** The id of a new disk on its way over from the middle of the desk */
    this.arriving = null;
  }

  init() {
    this.disks.onChange(() => {
      // A label being written on is left alone
      if (this.doing !== "rename") this.render();
    });
    document.addEventListener("pointerdown", (e) => {
      // Answering the note about unsaved work isn't putting the disk down
      if (e.target.closest?.(".keep-note")) return;
      if (this.picked && !this.root.contains(e.target)) this.putDown();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.picked) this.putDown();
    });
    this.render();
  }

  /** Look in the box again (after a save, or once it is known who this is) */
  async refresh() {
    if (!this.disks.user) {
      // Nobody's box: empty
      this.beats = [];
      this.waiting = [];
      this.render();
      return;
    }
    try {
      this.beats = await this.disks.list();
      this.waiting = this.disks.waiting.map((beat) => ({ ...beat, waiting: true }));
    } catch {
      // The box keeps showing what it last knew
    }
    this.render();
  }

  /**
   * The disks leave with whoever is signing out: lifted out of the box one
   * after another, front first. They stay out until the next render().
   */
  async carryOff() {
    this.pick(null);
    const kept = [...this.root.querySelectorAll("button.disk-slot")].reverse();
    if (!kept.length || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    await Promise.all(
      kept.map(
        (slot, i) =>
          slot.animate(
            [
              { transform: "none", opacity: 1 },
              { transform: "translateY(-70%) rotate(-2deg)", opacity: 1, offset: 0.5 },
              { transform: "translate(-30%, -150%) rotate(-12deg)", opacity: 0 },
            ],
            {
              duration: EJECT_MS,
              delay: i * CARRY_GAP_MS,
              easing: "cubic-bezier(0.4, 0, 0.7, 0.3)",
              fill: "forwards",
            },
          ).finished,
      ),
    );
  }

  /**
   * The box as it now stands is set down: whatever is in it (someone's
   * disks, or blanks) drops into its slots, back to front.
   */
  async setDown() {
    await this.refresh();
    const slots = [...this.root.querySelectorAll(".disk-slot")];
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    await Promise.all(
      slots.map(
        (slot, i) =>
          slot.animate(
            [
              { transform: "translateY(-55%)", opacity: 0 },
              { transform: "translateY(4%)", opacity: 1, offset: 0.75 },
              { transform: "none", opacity: 1 },
            ],
            {
              duration: PUSH_MS,
              delay: i * CARRY_GAP_MS,
              easing: "cubic-bezier(0.3, 0, 0.3, 1)",
              fill: "backwards",
            },
          ).finished,
      ),
    );
  }

  /**
   * A new disk comes over from the middle of the desk. The box throws out a
   * blank (or the disk being written over) to make its place; the disk hangs
   * over the gap, then is pushed in and the box takes the knock.
   * @param {Object} namer - From DiskNamer.open(), holding the disk
   * @param {string} id - The beat it holds
   * @param {string} [overId] - The kept disk it replaces, when the box was full
   */
  async takeIn(namer, id, overId) {
    const kept = [...this.root.querySelectorAll("button.disk-slot")];
    const out = overId
      ? kept.find((slot) => slot.dataset.id === overId)
      : this.root.querySelector("span.disk-slot");
    // The newest disk stands at the front, whichever one made way for it
    const blank = overId ? kept.at(-1) : out;
    if (!blank || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      namer.remove();
      await this.refresh();
      return;
    }
    const { left, top, width, height } = blank.getBoundingClientRect();
    const lift = height * 0.62;
    const thrown = out.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: "translateY(-58%) rotate(-3deg)", opacity: 1, offset: 0.45 },
        { transform: "translate(55%, -95%) rotate(26deg)", opacity: 0 },
      ],
      { duration: EJECT_MS, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)", fill: "forwards" },
    ).finished;
    const carried = namer.carryTo({ x: left + width / 2, y: top + height / 2 - lift, width });

    // The new disk is drawn in the gap but kept out of sight until the one in the air is over it
    this.arriving = id;
    await thrown;
    await this.refresh();
    await carried;
    const slot = this.root.querySelector(".disk-slot.is-arriving");
    this.arriving = null;
    slot?.classList.remove("is-arriving");
    namer.remove();
    if (!slot) return;

    await slot.animate([{ transform: `translateY(${-lift}px)` }, { transform: "none" }], {
      duration: PUSH_MS,
      easing: "cubic-bezier(0.55, 0, 0.85, 0.4)",
    }).finished;
    this.root
      .querySelector(".disk-box-front")
      .animate(
        [
          { transform: "none" },
          { transform: "translateY(0.2em) rotate(-0.6deg)" },
          { transform: "none" },
        ],
        { duration: KNOCK_MS, easing: "ease-out" },
      );
  }

  pick(id) {
    this.picked = id;
    this.doing = null;
    this.render();
  }

  putDown() {
    this.pick(null);
  }

  colourOf(beat) {
    return diskColour(beat.id);
  }

  render() {
    const { disks, root } = this;
    root.hidden = !disks.ready;
    root.classList.toggle("is-open", this.picked !== null);
    // A guest's disks are held by this browser, not kept: they sit loose, labels in pencil,
    // and settle into the box when the account is made theirs (ADR-0035)
    const held = isHeld(disks.user, this.beats.length);
    root.classList.toggle("is-settling", this.wasHeld === true && !held && this.beats.length > 0);
    root.classList.toggle("is-held", held);
    this.wasHeld = held;
    const beat = [...this.beats, ...this.waiting].find((kept) => kept.id === this.picked);
    if (this.picked && !beat) this.picked = null;

    const stack = el("div", "disk-stack");
    // Newest at the front: drawn last, furthest right. A box that holds more than its
    // slots shows the newest; the rest are on its owner's page
    const standing = this.beats.slice(0, SLOTS).reverse();
    standing.forEach((kept, i) => {
      const button = el("button", "disk-slot");
      button.type = "button";
      button.style.setProperty("--i", i);
      button.dataset.id = kept.id;
      button.setAttribute("aria-label", `Pick up the disk "${kept.title}"`);
      button.classList.toggle("is-picked", kept.id === this.picked);
      button.classList.toggle("is-in-drive", kept.id === disks.disk?.id);
      button.classList.toggle("is-arriving", kept.id === this.arriving);
      button.append(floppy("floppy-small floppy-standing", kept.title, this.colourOf(kept)));
      if (kept.sentAt) button.append(el("span", "disk-stamp", "sent"));
      button.addEventListener("click", () => this.pick(kept.id === this.picked ? null : kept.id));
      stack.append(button);
    });
    for (let i = standing.length; i < Math.min(disks.limit ?? SLOTS, SLOTS); i++) {
      const blank = el("span", "disk-slot");
      blank.style.setProperty("--i", i);
      blank.append(floppy("floppy-small floppy-standing floppy-blank", "blank", "#b9ae97"));
      stack.append(blank);
    }

    // Whose box this is, written on it: the disk file beside it is everyone else's
    const front = el("div", "disk-box-front");
    const { user } = disks;
    if (user) {
      const face = el("img", "disk-box-face");
      face.src = faceUrl(user.face);
      face.alt = "";
      front.append(face, el("span", "disk-box-owner", user.name));
    }
    front.append(el("span", "disk-box-label", "My beats"));
    if (held) front.append(el("span", "disk-box-lamp"));
    const count = el("span", "disk-count");
    count.append(el("b", "", disks.tally(this.beats.length)), " disks");

    root.replaceChildren(stack, front, count);
    // No room for these when their maker signed in: on top of the box, under a lamp
    // The newest on top of the pile: drawn last
    [...this.waiting].reverse().forEach((kept, i) => {
      const button = el("button", "disk-waiting");
      button.type = "button";
      // More than a few lie in one pile
      button.style.setProperty("--i", Math.min(i, 2));
      button.setAttribute("aria-label", `"${kept.title}" didn't fit in the box. Pick it up`);
      button.classList.toggle("is-picked", kept.id === this.picked);
      button.append(
        floppy("floppy-small", kept.title, this.colourOf(kept)),
        el("span", "disk-box-lamp"),
      );
      button.addEventListener("click", () => this.pick(kept.id === this.picked ? null : kept.id));
      root.append(button);
    });
    if (beat) root.append(this.renderPicked(beat));
  }

  /** The disk in the hand: bigger, with what can be done to it beside it */
  renderPicked(beat) {
    const hand = el("div", "disk-hand");
    const disk = floppy("floppy-big", "", this.colourOf(beat));
    const label = disk.querySelector(".floppy-label");
    if (beat.sentAt) {
      // In the crate, the stamp says so
      const stamp = beat.inCrate ? ["disk-stamp is-crate", "in the crate"] : ["disk-stamp", "sent"];
      disk.append(el("span", ...stamp));
    }
    hand.append(disk);

    if (this.doing === "rename") {
      const input = el("input", "floppy-title-input");
      input.type = "text";
      input.maxLength = TITLE_LENGTH;
      input.value = beat.title;
      input.setAttribute("aria-label", "Disk label");
      input.addEventListener("keydown", (e) => {
        // Esc here only stops the renaming; the disk stays in the hand
        e.stopPropagation();
        if (e.key === "Enter") this.rename(beat, input.value);
        if (e.key === "Escape") this.pick(beat.id);
      });
      label.append(input);
      queueMicrotask(() => input.select());
    } else {
      label.append(el("span", "floppy-title", beat.title));
      // The credit goes above the tempo: on a full label it is the tempo that gives way
      if (beat.flippedFrom) {
        label.append(el("span", "floppy-from", `flipped from ${beat.flippedFrom}`));
      }
      label.append(el("span", "floppy-bpm", `${beat.bpm} bpm`));
    }

    const tabs = el("div", "disk-tabs");
    const tab = (text, hot, action) => {
      const button = el("button", hot ? "disk-tab is-hot" : "disk-tab", text);
      button.type = "button";
      button.addEventListener("click", action);
      tabs.append(button);
    };
    if (this.doing === "bin") {
      tab("Bin it for good", true, () => this.bin(beat));
      tab("Keep it", false, () => this.pick(beat.id));
    } else if (this.doing === "rename") {
      tab("Done", true, () => this.rename(beat, hand.querySelector("input").value));
      tab("Cancel", false, () => this.pick(beat.id));
    } else if (beat.waiting) {
      tab("Put in the box", true, () => this.putIn(beat));
      tab("Bin", false, () => this.act("bin"));
    } else {
      tab("Load", true, () => this.load(beat));
      tab("Rename", false, () => this.act("rename"));
      if (beat.sentAt) tab("Unsend", false, () => this.unsend(beat));
      else tab("Send", false, () => this.send(beat));
      tab("Bin", false, () => this.act("bin"));
    }
    hand.append(tabs);
    if (beat.sentAt && !this.doing) hand.append(this.renderSent(beat));
    return hand;
  }

  /** Under a sent disk: its link on a strip of tape, and the ways to pass it on */
  renderSent(beat) {
    const link = beatLink(window.location.origin, beat.id);
    const { email, whatsapp } = shareLinks(link, beat.title);
    const sent = el("div", "disk-sent");
    sent.append(el("span", "disk-link", shownLink(link)));
    const ways = el("div", "disk-ways");
    const copy = el("button", "disk-tab is-hot", "Copy");
    copy.type = "button";
    copy.addEventListener("click", () => this.copy(beat));
    ways.append(copy);
    for (const [text, href] of [
      ["Email", email],
      ["WhatsApp", whatsapp],
    ]) {
      const way = el("a", "disk-tab", text);
      way.href = href;
      way.target = "_blank";
      way.rel = "noopener";
      ways.append(way);
    }
    sent.append(ways);
    return sent;
  }

  /** Pick a disk up by its id, if it is in the box, and start sending it */
  async sendById(id) {
    await this.refresh();
    const beat = this.beats.find((kept) => kept.id === id);
    if (!beat || beat.sentAt) return;
    this.pick(id);
    await this.send(beat);
  }

  /**
   * Share on the cassette: the disk is sent, or is out already, and its link comes back to
   * the middle of the view. The disk stays in its box: what else can be done to it is there
   */
  async share(id) {
    await this.refresh();
    const beat = this.beats.find((kept) => kept.id === id);
    if (!beat) return;
    if (beat.sentAt) await this.handOver(beat);
    // Asked from across the desk, its note lies in the middle, not over by the box
    else await this.send(beat, { centred: true });
  }

  /** The link of a beat that is out, copied and on a note with the ways to pass it on */
  async handOver(beat) {
    this.putDown();
    const link = beatLink(window.location.origin, beat.id);
    // The note does not wait on the clipboard: a browser can keep it, or never answer
    await SendNote.out({
      title: beat.title,
      shown: shownLink(link),
      copy: () => this.copy(beat, { quiet: true }),
      ...shareLinks(link, beat.title),
    });
  }

  async send(beat, where = {}) {
    try {
      const reply = await this.onSend(beat, where);
      if (!reply) return;
      beat.sentAt = reply.sentAt;
      beat.audioIncluded = reply.audioIncluded;
      beat.inCrate = reply.inCrate === true;
      if (where.centred) return await this.handOver(beat);
      this.pick(beat.id);
      await this.copy(beat);
    } catch (error) {
      this.refuse(error);
    }
  }

  /**
   * The link goes on the clipboard, and the display says so
   * @returns {Promise<boolean>} Whether the browser took it
   */
  async copy(beat, { quiet = false } = {}) {
    const link = beatLink(window.location.origin, beat.id);
    try {
      await navigator.clipboard.writeText(link);
      this.onCopied?.();
      if (!quiet) LcdMessage.show(["Link copied", "Paste it anywhere"], 4200);
      return true;
    } catch {
      // The browser kept the clipboard to itself: the link is on the tape to copy by hand
      if (!quiet) LcdMessage.show(["Sent", "The link is by the disk"], 4200);
      return false;
    }
  }

  async unsend(beat) {
    try {
      await this.disks.unsend(beat.id);
      beat.sentAt = null;
      beat.audioIncluded = false;
      beat.inCrate = false;
      this.pick(beat.id);
      LcdMessage.show(["Unsent", "The link has stopped working"], 4200);
    } catch (error) {
      this.refuse(error);
    }
  }

  act(doing) {
    this.doing = doing;
    this.render();
  }

  async load(beat) {
    try {
      if (await this.onLoad(beat.id)) this.putDown();
    } catch (error) {
      this.refuse(error);
    }
  }

  async rename(beat, title) {
    try {
      const renamed = await this.disks.rename(beat.id, title);
      beat.title = renamed.title;
      this.pick(beat.id);
    } catch (error) {
      this.refuse(error);
    }
  }

  async bin(beat) {
    try {
      await this.disks.bin(beat.id);
      this.beats = this.beats.filter((kept) => kept.id !== beat.id);
      this.waiting = this.waiting.filter((kept) => kept.id !== beat.id);
      this.putDown();
      LcdMessage.show(["Binned", `${this.disks.tally(this.beats.length)} disks used`]);
    } catch (error) {
      this.refuse(error);
    }
  }

  /**
   * A waiting disk goes in the box: into a blank's place if there is one,
   * else over a kept disk that is asked for. Called off, it stays where it lies.
   */
  async putIn(beat) {
    try {
      let over = null;
      if (this.disks.limit !== null && this.beats.length >= this.disks.limit) {
        this.putDown();
        over = await this.onFull(beat, this.beats);
        if (!over) return;
      }
      await this.disks.keepWaiting(beat.id, over?.id);
      this.putDown();
      await this.setDown();
      LcdMessage.show(over ? ["In the box", `Over ${over.title}`] : ["In the box", beat.title]);
    } catch (error) {
      this.refuse(error);
      if (error.code === "box_full" || error.code === "not_found") this.refresh();
    }
  }

  /** Signed in with a full box: the disks that didn't fit are shown, and the first is asked about */
  async offerWaiting() {
    await this.refresh();
    if (this.waiting[0]) await this.putIn(this.waiting[0]);
  }

  refuse(error) {
    Toast.show(REFUSALS[error.code] ?? "That didn't work. Try again.", "warning");
    // The box may not be what it was thought to be
    if (error.code === "not_available") this.refresh();
  }
}
