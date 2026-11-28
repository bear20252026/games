/**
 * Room
 * Someone else's beat, opened from its link where the desk fits: a room to
 * listen in, over the whole desk (ADR-0044). A turntable with the beat's
 * record on it, its sleeve beside it, one PLAY key, and FLIP IT, which is
 * the way to the desk. The desk is still under it with the beat loaded, as
 * a flip is the desk as it stands, but none of its tools are in reach.
 *
 * Once the record has played, a sheet of stickers lies under the turntable:
 * what the listener says the beat has got goes on its sleeve (ADR-0046).
 */

import { flipsLine } from "../core/Player.js";
import { flipCredit, ROOM_KEY, roomLabel, roomTags } from "../core/Room.js";
import { STICKER_KINDS, stickerName } from "../core/Stickers.js";
import { sticker } from "../stickers.js";
import { faceUrl } from "./AccountMenu.js";
import { askReport } from "./BeatTag.js";
import { LcdMessage } from "./LcdMessage.js";
import { Toast } from "./Toast.js";

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // Titles and names are typed by people: always text, never markup
  if (text !== undefined) node.textContent = text;
  return node;
}

function key(className, text, onClick) {
  const button = el("button", className, text);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

export const Room = {
  /** The beat the room is up for; null while it is down */
  up: null,
  /** What the record is doing: "", "readying" or "on" */
  how: "",
  root: null,
  playKey: null,
  flipKey: null,
  /** What listeners say the beat has got: { offered, counts, mine }; null where there is nothing to offer */
  stickers: null,
  /** The record has been played since the room went up */
  played: false,
  /** A first sticker has just gone on: the room says where the beat was kept */
  kept: false,

  /**
   * @param {Object} room
   * @param {{id: string, title: string, bpm: number, tags: string[], by: {name: string, face: string}}} room.theirs
   * @param {Promise<{credit: string, store: string|null}|null>} [room.loopFrom] - The guest
   *   whose record its loop is from, as Records.guestCredit() gives it
   * @param {{name: string, did: string, id: string|null}[]} room.chain - Where the beat
   *   came from, as Flips.chainWords() words it; empty when it is nobody's flip
   * @param {number} room.flips - How many sent flips have been made from it
   * @param {() => Promise<boolean>} room.onPlay - Play it as made; false when there is nothing to hear
   * @param {() => void} room.onQuiet - Stop it
   * @param {() => Promise<void>} room.onFlip
   * @param {(details: Object) => Promise<*>} room.onReport - Send a report to the server
   * @param {() => Promise<{flips: Object[]}>} room.listFlips
   * @param {(kind: string) => Promise<Object>} [room.onStick] - Put a sticker on; resolves to
   *   the beat's stickers as they then are
   * @param {(kind: string) => Promise<Object>} [room.onPeel] - Take one's own back off
   */
  show({
    theirs,
    loopFrom,
    chain,
    flips,
    onPlay,
    onQuiet,
    onFlip,
    onReport,
    listFlips,
    onStick,
    onPeel,
  }) {
    // Already up for this beat: nothing is drawn again, and the record keeps turning
    if (this.up === theirs.id) return;
    this.hide();
    this.up = theirs.id;
    this.onQuiet = onQuiet;
    this.stickers = theirs.stickers ?? null;
    this.onStick = onStick;
    this.onPeel = onPeel;

    const root = el("div", "room");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", `${theirs.title}, a beat by ${theirs.by.name}`);

    const mark = el("div", "room-mark");
    const logo = el("img");
    logo.src = "./public/images/knockbox-logo.svg";
    logo.alt = "";
    const word = el("span", "", "Knock");
    word.append(el("em", "", "box"));
    mark.append(logo, word);

    const plant = el("img", "room-plant");
    plant.src = "./public/images/room-plant.svg";
    plant.alt = "";

    const sleeve = el("div", "room-sleeve");
    const who = el("div", "room-by");
    const face = el("img");
    face.src = faceUrl(theirs.by.face);
    face.alt = "";
    const by = el("span", "", "a beat by ");
    by.append(el("b", "", theirs.by.name));
    who.append(face, by);
    // A guest's loop is named under the maker, with the way to their shop (FR-OPEN-15)
    loopFrom
      ?.then((from) => {
        if (!from) return;
        const line = el("p", "room-loop", `loop from ${from.credit}`);
        if (from.store) {
          const shop = el("a", "", "their store ↗");
          shop.href = from.store;
          shop.target = "_blank";
          shop.rel = "noopener noreferrer";
          line.append(" · ", shop);
        }
        who.after(line);
      })
      .catch(() => {});
    const tags = el("div", "room-tags");
    for (const text of roomTags(theirs.tags)) tags.append(el("span", "", text));
    sleeve.append(el("h2", "", theirs.title), who);
    if (chain.length) {
      const came = el("p", "room-chain");
      chain.forEach((link, i) => {
        if (i) came.append(" › ");
        const name = link.id ? el("a", "", link.name) : el("b", "", link.name);
        if (link.id) name.href = `/b/${encodeURIComponent(link.id)}`;
        came.append(name, ` ${link.did}`);
      });
      sleeve.append(came);
    }
    sleeve.append(tags);

    const deck = el("div", "room-deck");
    const platter = el("div", "room-platter");
    const record = el("div", "room-record");
    const label = el("div", "room-label");
    label.append(el("b", "", theirs.title), el("span", "", roomLabel(theirs)));
    record.append(label);
    platter.append(record);
    this.playKey = key("room-key room-play", "", () => this.toggle(onPlay));
    deck.append(
      platter,
      el("i", "room-arm-base"),
      el("i", "room-arm"),
      el("i", "room-lamp"),
      this.playKey,
    );

    const side = el("div", "room-side");
    this.flipKey = key("room-key room-flip", "Flip it", async () => {
      this.flipKey.disabled = true;
      await onFlip();
      if (this.flipKey) this.flipKey.disabled = false;
    });
    side.append(this.flipKey, el("p", "room-flip-line", "its drums and feel, on pads of your own"));
    if (flips > 0) {
      const made = el("div", "room-flips");
      made.append(el("h3", "", flipsLine(flips)));
      side.append(made);
      listFlips()
        .then((reply) => {
          for (const flip of reply.flips) {
            const line = el("a");
            line.href = `/b/${encodeURIComponent(flip.id)}`;
            line.append(el("b", "", flip.title), el("span", "", flipCredit(flip)));
            made.append(line);
          }
        })
        // The count still stands without its list
        .catch(() => {});
    }

    // What listeners have put on the sleeve, the sheet theirs come from, and where a kept beat goes
    this.stuck = el("div", "room-stuck");
    this.sheet = el("div", "room-sheet");
    this.sheet.setAttribute("role", "group");
    this.sheet.setAttribute("aria-label", "Stickers: say what this beat has got");
    this.pile = el("p", "room-kept", "kept in your pile, in the crate");
    this.pile.setAttribute("role", "status");

    const stage = el("div", "room-stage");
    stage.append(sleeve, this.stuck, deck, this.sheet, this.pile, side);

    const blank = el("a", "room-quiet room-blank", "or start on a blank desk");
    blank.href = "/";
    const flag = key("room-quiet room-report", "report", async () => {
      const written = await askReport(root);
      if (!written) return;
      try {
        await onReport({ beatId: theirs.id, ...written });
        LcdMessage.show(["Reported", "Thank you. We'll look at it"], 4200);
        Toast.show("Reported. Thank you, we'll look at it.", "success");
      } catch (error) {
        Toast.show(
          error.code === "slow_down"
            ? "That's a lot of reports. Try again in a while."
            : "Couldn't send the report. Try again.",
          "warning",
        );
      }
    });

    root.append(mark, plant, stage, blank, flag);
    this.root = root;
    // Space is the record's while the room is up; the desk's own keys are held off by main.js
    this.onKey = (e) => {
      if (e.key !== " " || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target.closest?.("button, a, input, textarea")) return;
      e.preventDefault();
      this.toggle(onPlay);
    };
    document.addEventListener("keydown", this.onKey);
    // The desk is under the room and out of reach
    const desk = document.querySelector(".desk");
    if (desk) desk.inert = true;
    document.body.append(root);
    this.draw();
    this.drawStickers();
    this.playKey.focus({ preventScroll: true });
  },

  /** The sleeve's stickers, and the sheet: laid out once the record has played, or where one of theirs is on already */
  drawStickers() {
    if (!this.root) return;
    const { offered = [], counts = {}, mine = [] } = this.stickers ?? {};
    this.stuck.replaceChildren(
      ...STICKER_KINDS.filter((kind) => counts[kind] > 0).map((kind) =>
        sticker(kind, { count: counts[kind], mine: mine.includes(kind) }),
      ),
    );
    this.sheet.hidden = !offered.length || !(this.played || mine.length);
    this.sheet.replaceChildren(
      ...offered.map((kind) => {
        if (!mine.includes(kind)) {
          const fresh = sticker(kind, { tag: "button" });
          fresh.setAttribute("aria-label", `Stick: ${stickerName(kind)}`);
          fresh.addEventListener("click", () => this.press(kind, this.onStick));
          return fresh;
        }
        // Theirs is on the sleeve: its outline on the sheet takes it back
        const gone = key(`stk-gone stk-${kind}`, "", () => this.press(kind, this.onPeel));
        gone.setAttribute("aria-label", `Peel your ${stickerName(kind)} sticker back off`);
        return gone;
      }),
    );
    this.pile.hidden = !(this.kept && mine.length);
  },

  /** A sticker on the sheet, or the outline of one, was pressed */
  async press(kind, act) {
    if (this.pressing) return;
    this.pressing = true;
    const beat = this.up;
    const had = this.stickers.mine.length;
    try {
      const now = await act(kind);
      // Flipped, or left, while it was sent
      if (this.up !== beat) return;
      this.stickers = now;
      if (!had && now.mine.length) this.kept = true;
      if (!now.mine.length) this.kept = false;
      this.drawStickers();
      this.sheet.children[now.offered.indexOf(kind)]?.focus({ preventScroll: true });
    } catch (error) {
      Toast.show(
        error.code === "slow_down"
          ? "That's a lot of stickers. Try again in a while."
          : "Couldn't do that with the sticker. Try again.",
        "warning",
      );
    } finally {
      this.pressing = false;
    }
  },

  /** PLAY and STOP: one key */
  async toggle(onPlay) {
    if (this.how === "readying") return;
    if (this.how === "on") {
      this.onQuiet();
      return this.hush();
    }
    const beat = this.up;
    this.how = "readying";
    this.draw();
    try {
      const started = await onPlay();
      // Flipped, or left, while it was fetched
      if (this.up !== beat) return;
      this.how = started ? "on" : "";
      this.draw();
      if (started && !this.played) {
        this.played = true;
        this.drawStickers();
      }
    } catch {
      if (this.up === beat) this.hush();
      Toast.show("Couldn't fetch that beat. Try again.", "warning");
    }
  },

  draw() {
    if (!this.root) return;
    const { how } = this;
    this.root.classList.toggle("is-sounding", how === "on");
    this.playKey.textContent = ROOM_KEY[how];
    this.playKey.classList.toggle("is-readying", how === "readying");
    this.playKey.setAttribute("aria-busy", String(how === "readying"));
    this.playKey.setAttribute("aria-pressed", String(how === "on"));
    // One lit key: PLAY until the record is turning, then the way to the desk
    this.playKey.classList.toggle("is-hot", how !== "on");
    this.flipKey.classList.toggle("is-hot", how === "on");
  },

  /** The record has stopped, whoever stopped it */
  hush() {
    this.how = "";
    this.draw();
  },

  /** The room gives way to the desk */
  hide() {
    if (!this.root) return;
    if (this.how) this.onQuiet();
    document.removeEventListener("keydown", this.onKey);
    this.root.remove();
    const desk = document.querySelector(".desk");
    if (desk) desk.inert = false;
    this.root = null;
    this.playKey = null;
    this.flipKey = null;
    this.up = null;
    this.how = "";
    this.stickers = null;
    this.played = false;
    this.kept = false;
    this.pressing = false;
  },
};
