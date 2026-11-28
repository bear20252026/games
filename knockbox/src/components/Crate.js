/**
 * Crate
 * The disk file of beats from other desks: a lock-up box with a smoked lid,
 * on the wood under your own disk box (ADR-0021, ADR-0023). Turn the key,
 * or take the pulse toast's, and the crate opens over the whole desk
 * (ADR-0031): a sleeve for every beat, printed with its pattern, narrowed by
 * the keys along the top. Pull one out to see whose it is; play it where it
 * sits, or flip it. Its stickers are on the pulled sleeve to be put on and
 * taken back, and the beats a person has stickered are their pile (ADR-0046).
 *
 * It stays off the desk while there is nothing in it.
 */

import {
  CRATE_FILTERS,
  CRATE_LOOK_MS,
  CRATE_WARM_MS,
  crateCount,
  crateShown,
  crateUnfiltered,
  pickedAfter,
  pileAfter,
  pileCount,
  sameCrate,
  stickered,
} from "../core/Crate.js";
import { stickerName, stickerStack } from "../core/Stickers.js";
import { sticker } from "../stickers.js";
import { faceUrl } from "./AccountMenu.js";
import { diskColour } from "./DiskBox.js";
import { Toast } from "./Toast.js";

// Disks seen through the lid, however many the file holds
const SHOWN = 7;
// Sleeves to a page of the open crate
const PER = 8;

const REFUSALS = {
  offline: "Couldn't reach the server. Try again.",
};

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // Titles and names are typed by people: always text, never markup
  if (text !== undefined) node.textContent = text;
  return node;
}

function key(className, text, action) {
  const button = el("button", className, text);
  button.type = "button";
  button.addEventListener("click", action);
  return button;
}

/** A beat's pattern as pads: a row for each drum */
function pads(className, steps) {
  const grid = el("span", className);
  for (const row of steps ?? []) {
    for (const on of row) grid.append(el("i", on === "1" ? "is-on" : ""));
  }
  return grid;
}

export class Crate {
  /**
   * @param {Object} options
   * @param {DiskDrive} options.disks
   * @param {(beat: Object) => Promise<boolean>} options.onFlip - Make a version
   *   of a crate beat on a disk of the person's own; resolves false if they backed out
   */
  constructor({ disks, onFlip, onPreview, onReady, onQuiet }) {
    // Make a pulled beat ready to play before it is asked for
    this.onReady = onReady;
    this.disks = disks;
    this.onFlip = onFlip;
    this.onPreview = onPreview;
    this.onQuiet = onQuiet;
    this.root = document.querySelector("#crate");
    /** What is in the crate, newest first */
    this.beats = [];
    /** The beats this person has stickered, the last one first, and whether the open crate is showing them */
    this.pile = [];
    this.inPile = false;
    /** The id of the sleeve pulled out, if the crate is open */
    this.picked = null;
    /** Which key of each group is down, and which page of sleeves is up */
    this.keys = crateUnfiltered();
    this.page = 0;
    /** The id of the beat playing where it sits, if one is */
    this.sounding = null;
    /** True from PLAY IT HERE being pressed until the beat is heard */
    this.readying = false;
    /** The id of the sleeve whose beat was last made ready, and the wait before it is */
    this.warmed = null;
    this.warming = null;
    /** The open crate, over the desk; null while it is shut */
    this.open = null;
  }

  init() {
    this.watch();
    document.addEventListener("keydown", (e) => {
      if (!this.open) return;
      if (e.key === "Escape") this.shut();
      if (e.key === "Tab") this.keepFocus(e);
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        this.step(e.key === "ArrowRight" ? 1 : -1);
      }
    });
    this.render();
  }

  /** Look in the crate again (once it is known who this is: nobody finds their own beat in it) */
  async refresh() {
    let beats = this.beats;
    let pile = this.pile;
    try {
      // A pile that can't be read is no reason to hide the crate
      [beats, pile] = await Promise.all([this.disks.crate(), this.disks.pile().catch(() => pile)]);
    } catch {
      // The crate keeps showing what it last knew
    }
    // Nothing new: nothing is drawn again, so a look costs the person at the crate nothing
    if (this.read && sameCrate(beats, this.beats) && sameCrate(pile, this.pile)) return;
    this.read = true;
    this.put(beats, pile);
  }

  /** The sleeves being looked through: the crate's, or the person's own pile */
  list() {
    return this.inPile ? this.pile : this.beats;
  }

  /** The crate as it now is. A beat taken back is gone from it, and the crate stays up */
  put(beats, pile = this.pile) {
    const before = this.list();
    // An emptied pile gives way to the crate
    if (!pile.length) this.inPile = false;
    const picked = pickedAfter(before, this.inPile ? pile : beats, this.picked);
    if (picked !== this.picked && this.sounding === this.picked) this.quiet();
    this.beats = beats;
    this.pile = pile;
    this.picked = picked;
    this.render();
  }

  /**
   * A beat its maker took back, found out by asking for it: its sleeve goes without a word.
   * @param {string} id
   */
  drop(id) {
    const without = (beats) => beats.filter((beat) => beat.id !== id);
    if (without(this.beats).length === this.beats.length && !this.pile.some((b) => b.id === id)) {
      return;
    }
    this.put(without(this.beats), without(this.pile));
    this.refresh();
  }

  /** Keep up with the other desks: look again on coming back to the tab, and now and then while it is open (FR-CRATE-08) */
  watch() {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) this.refresh();
    });
    setInterval(() => {
      if (this.open && !document.hidden) this.refresh();
    }, CRATE_LOOK_MS);
  }

  /** The sleeves the keys let through */
  shown() {
    return crateShown(this.list(), this.keys, Date.now());
  }

  /** Open the crate, with one sleeve already pulled so the side is never bare */
  unlock(id) {
    if (!this.beats.length) return;
    // Unlocked from the desk it is the crate; come back to after a flip, it is as it was left
    if (id === undefined) this.inPile = false;
    this.picked = id ?? this.beats[0].id;
    this.render();
    this.open?.querySelector(".dig-sleeve.is-picked")?.focus();
    // What was read when the desk loaded may be old by now
    this.refresh();
  }

  /** Shut the crate; what was playing in it stops */
  shut() {
    const was = Boolean(this.open);
    this.quiet();
    this.picked = null;
    this.render();
    if (was) this.root.querySelector(".crate-pull")?.focus();
  }

  pick(id) {
    if (id !== this.sounding) this.quiet();
    this.picked = id;
    const at = this.shown().findIndex((beat) => beat.id === id);
    if (at >= 0) this.page = Math.floor(at / PER);
    this.render();
    this.open?.querySelector(".dig-sleeve.is-picked")?.focus();
  }

  /** The next sleeve, or the one before */
  step(by) {
    const shown = this.shown();
    const next = shown[shown.findIndex((beat) => beat.id === this.picked) + by];
    if (next) this.pick(next.id);
  }

  /** Turn to the pile, or back to the crate; the first sleeve there is pulled */
  turnTo(pile) {
    this.inPile = pile && this.pile.length > 0;
    this.keys = crateUnfiltered();
    this.page = 0;
    this.quiet();
    this.picked = this.list()[0]?.id ?? null;
    this.render();
    this.open?.querySelector(".dig-pile")?.focus();
  }

  /**
   * Put a sticker on the pulled beat, or take the person's own back off. The
   * sleeve says so at once, in the crate and in the pile.
   */
  async stick(beat, kind, on) {
    if (this.sticking) return;
    this.sticking = true;
    try {
      const stickers = await this.disks.stick(beat.id, kind, on);
      this.beats = stickered(this.beats, beat.id, stickers);
      this.pile = pileAfter(this.pile, { ...beat, stickers }, this.inPile);
      this.render();
      this.open?.querySelector(`.dig-stickers .stk-${kind}`)?.focus();
    } catch (error) {
      // Taken back by its maker: it is simply not in the crate any more
      if (error.code === "not_available") return this.drop(beat.id);
      Toast.show(
        error.code === "slow_down"
          ? "That's a lot of stickers. Try again in a while."
          : "Couldn't do that with the sticker. Try again.",
        "warning",
      );
    } finally {
      this.sticking = false;
    }
  }

  /** Press a key of one group; the first sleeve it leaves is pulled */
  narrow(group, index) {
    this.keys = { ...this.keys, [group]: index };
    this.page = 0;
    const shown = this.shown();
    if (!shown.some((beat) => beat.id === this.picked)) {
      this.quiet();
      this.picked = shown[0]?.id ?? this.picked;
    }
    this.render();
  }

  turn(by) {
    const shown = this.shown();
    this.page += by;
    this.pick(shown[this.page * PER]?.id ?? this.picked);
  }

  /** A sleeve that stays out has its beat made ready, so PLAY IT HERE answers at once */
  warm(beat) {
    if (beat?.id === this.warmed) return;
    this.warmed = beat?.id ?? null;
    clearTimeout(this.warming);
    if (!beat) return;
    this.warming = setTimeout(() => {
      if (this.picked === beat.id && this.sounding !== beat.id) this.onReady?.(beat);
    }, CRATE_WARM_MS);
  }

  /** Stop what is playing where it sits */
  quiet() {
    if (!this.sounding) return;
    this.sounding = null;
    this.readying = false;
    this.onQuiet();
  }

  /** The desk's own PLAY was pressed: the crate's beat gives way without stopping the desk */
  hush() {
    if (!this.sounding) return;
    this.sounding = null;
    this.readying = false;
    if (this.open) this.render();
  }

  /** Tab goes round the open crate, not off under it */
  keepFocus(e) {
    const stops = [...this.open.querySelectorAll("button:not(:disabled)")];
    const first = stops[0];
    const last = stops[stops.length - 1];
    if (!this.open.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  render() {
    const { root } = this;
    const beat = this.list().find((kept) => kept.id === this.picked);
    if (this.picked && !beat) this.picked = null;
    this.warm(beat);
    root.hidden = !this.beats.length;
    root.classList.toggle("is-open", Boolean(beat));

    const pull = el("button", "crate-pull");
    pull.type = "button";
    pull.setAttribute("aria-label", "Unlock the disk file of beats from other desks");
    pull.setAttribute("aria-haspopup", "dialog");
    pull.setAttribute("aria-expanded", String(Boolean(beat)));
    const lid = el("span", "crate-lid");
    const standing = el("span", "crate-disks");
    this.beats.slice(0, SHOWN).forEach((kept, i) => {
      const disk = el("i", "crate-disk");
      disk.style.setProperty("--label", diskColour(kept.id));
      // Not quite level, as things filed in a hurry aren't
      disk.style.setProperty("--h", `${(i * 7) % 4}`);
      standing.append(disk);
    });
    lid.append(standing);
    const front = el("span", "crate-front");
    front.append(el("i", "crate-lock"), el("i", "crate-key"));
    pull.append(lid, front);
    pull.addEventListener("click", () => this.unlock());

    root.replaceChildren(
      pull,
      el("span", "crate-tape", "from other desks"),
      el("span", "crate-count", crateCount(this.beats)),
    );

    const fresh = beat ? this.renderOpen(beat) : null;
    if (fresh && this.open) {
      // Already open: only what is in it changes, so it doesn't come up over the desk again
      this.open.replaceChildren(...fresh.childNodes);
      return;
    }
    this.open?.remove();
    this.open = fresh;
    if (fresh) document.body.append(fresh);
  }

  /** The crate open over the whole desk: its keys, a page of sleeves, and the one pulled out */
  renderOpen(picked) {
    const over = el("div", "crate-open");
    over.setAttribute("role", "dialog");
    over.setAttribute("aria-modal", "true");
    over.setAttribute("aria-label", "Beats from other desks");

    const shown = this.shown();
    const pages = Math.max(1, Math.ceil(shown.length / PER));
    this.page = Math.min(this.page, pages - 1);
    const all = this.list();
    const narrowed = shown.length !== all.length;

    const top = el("div", "dig-top");
    const name = el("h2", "dig-name", "The ");
    name.append(el("em", "", "crate"));
    const shut = key("dig-shut", "✕", () => this.shut());
    shut.setAttribute("aria-label", "Back to the desk");
    // How many are left is said only once the keys have taken some away
    top.append(
      name,
      el("span", "dig-left", narrowed ? `${shown.length} of ${all.length}` : ""),
      shut,
    );
    if (this.pile.length) {
      // The records this person stickered, wherever they came from (FR-STICK-04)
      const tab = key("dig-pile", undefined, () => this.turnTo(!this.inPile));
      tab.append(el("b", "", "your pile"), el("small", "", pileCount(this.pile)));
      tab.setAttribute("aria-pressed", String(this.inPile));
      name.after(tab);
    }

    const keys = el("div", "dig-keys");
    for (const [group, options] of Object.entries(CRATE_FILTERS)) {
      const row = el("div", "dig-seg");
      row.setAttribute("role", "group");
      row.setAttribute("aria-label", group);
      options.forEach(([label], i) => {
        const button = key("dig-key", label, () => this.narrow(group, i));
        button.setAttribute("aria-pressed", String(this.keys[group] === i));
        row.append(button);
      });
      keys.append(row);
    }
    if (Object.values(this.keys).some(Boolean)) {
      keys.append(
        key("dig-clear", "clear", () => {
          this.keys = crateUnfiltered();
          this.page = 0;
          this.render();
        }),
      );
    }

    const sleeves = el("div", "dig-sleeves");
    if (!shown.length) sleeves.append(el("p", "dig-none", "Nothing in the crate like that yet."));
    for (const beat of shown.slice(this.page * PER, this.page * PER + PER)) {
      sleeves.append(this.renderSleeve(beat, beat.id === picked.id));
    }
    const body = el("div", "dig-body");
    body.append(sleeves);
    if (shown.some((beat) => beat.id === picked.id)) body.append(this.renderPulled(picked));

    over.append(top, keys, body);
    if (pages > 1) {
      const pager = el("div", "dig-pager");
      const back = key("dig-turn", "←", () => this.turn(-1));
      back.setAttribute("aria-label", "Newer beats");
      back.disabled = this.page === 0;
      const on = key("dig-turn", "→", () => this.turn(1));
      on.setAttribute("aria-label", "Older beats");
      on.disabled = this.page >= pages - 1;
      pager.append(back, el("span", "", `${this.page + 1} / ${pages}`), on);
      over.append(pager);
    }
    return over;
  }

  /** One sleeve: its pattern printed on it, its title, its tempo and whose it is */
  renderSleeve(beat, isPicked) {
    const sleeve = key("dig-sleeve", undefined, () => this.pick(beat.id));
    sleeve.dataset.id = beat.id;
    // The feel is the sleeve's colour
    sleeve.dataset.feel = beat.tags[1]?.toLowerCase() ?? "";
    sleeve.classList.toggle("is-picked", isPicked);
    sleeve.setAttribute("aria-pressed", String(isPicked));
    sleeve.append(
      pads("dig-art", beat.steps),
      el("b", "dig-title", beat.title),
      el("small", "dig-credit", `${beat.bpm} BPM · ${beat.by.name}`),
    );
    // What its listeners say it has got, stacked on its corner: the one most of them said on top
    const counts = beat.stickers?.counts;
    const stack = el("span", "dig-stack");
    for (const kind of stickerStack(counts)) stack.append(sticker(kind, { count: counts[kind] }));
    if (stack.childElementCount) sleeve.append(stack);
    return sleeve;
  }

  /** The sleeve pulled out: whose it is, what it is like, and what can be done with it */
  renderPulled(beat) {
    const pulled = el("div", "dig-pulled");
    const who = el("div", "dig-who");
    const face = el("img", "dig-face");
    face.src = faceUrl(beat.by.face);
    face.alt = "";
    const by = el("span", "dig-by", "a beat by ");
    by.append(el("b", "", beat.by.name));
    who.append(face, by);

    // Worked out from the beat; nobody typed them
    const tags = el("div", "dig-tags");
    for (const text of beat.tags) tags.append(el("span", "", text));

    const acts = el("div", "dig-acts");
    const sounding = this.sounding === beat.id;
    // Pressed and not yet heard: the key says the beat is on its way, and a press calls it off
    const readying = sounding && this.readying;
    const play = key(
      "dig-act is-hot",
      readying ? "GETTING IT READY" : sounding ? "■ STOP" : "▶ PLAY IT HERE",
      () => (sounding ? this.shush() : this.preview(beat)),
    );
    play.classList.toggle("is-readying", readying);
    play.setAttribute("aria-busy", String(readying));
    play.setAttribute("aria-pressed", String(sounding));
    acts.append(
      play,
      key("dig-act", "FLIP IT", () => this.flip(beat)),
    );
    // Its stickers, to be put on and taken back from here as in the listening room (FR-STICK-05)
    const { offered = [], counts = {}, mine = [] } = beat.stickers ?? {};
    const stickers = el("div", "dig-stickers");
    for (const kind of offered) {
      const has = mine.includes(kind);
      const one = sticker(kind, { tag: "button", count: counts[kind], mine: has });
      one.setAttribute(
        "aria-label",
        has ? `Peel your ${stickerName(kind)} sticker back off` : `Stick: ${stickerName(kind)}`,
      );
      one.setAttribute("aria-pressed", String(has));
      one.addEventListener("click", () => this.stick(beat, kind, !has));
      stickers.append(one);
    }
    pulled.append(
      el("h3", "dig-pulled-title", beat.title),
      who,
      tags,
      pads("dig-grid", beat.steps),
      stickers,
      acts,
    );
    return pulled;
  }

  shush() {
    this.quiet();
    this.render();
    this.open?.querySelector(".dig-act.is-hot")?.focus();
  }

  /** Play it where it sits: the pads keep what is on them */
  async preview(beat) {
    try {
      this.sounding = beat.id;
      this.readying = true;
      this.render();
      this.open?.querySelector(".dig-act.is-hot")?.focus();
      const started = await this.onPreview(beat);
      // Stopped, or another pulled, meanwhile: that press has drawn the key already
      if (this.sounding !== beat.id) return;
      this.readying = false;
      // Nothing in it to hear: the key comes back up
      if (!started) this.sounding = null;
      this.render();
      this.open?.querySelector(".dig-act.is-hot")?.focus();
    } catch (error) {
      this.sounding = null;
      this.readying = false;
      // Taken back by its maker: it is simply not in the crate any more
      if (error.code === "not_available") return this.drop(beat.id);
      this.render();
      Toast.show(REFUSALS[error.code] ?? "Couldn't fetch that beat. Try again.", "warning");
    }
  }

  /** Make a version of your own of it: the one way from the crate to the pads (ADR-0044) */
  async flip(beat) {
    // The crate shuts first: a note about unsaved work is answered on the desk
    this.shut();
    try {
      if (!(await this.onFlip(beat))) this.unlock(beat.id);
    } catch (error) {
      // Taken back by its maker: the crate comes back up without it
      if (error.code === "not_available") {
        this.drop(beat.id);
        return this.unlock();
      }
      Toast.show(REFUSALS[error.code] ?? "Couldn't fetch that beat. Try again.", "warning");
    }
  }
}
