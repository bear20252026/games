/**
 * Player
 * A beat's link opened on a phone: a tape deck, not the desk (ADR-0012,
 * ADR-0032). The beat's cassette waits above the deck's door; the first tap
 * drops it in, and it plays. Needles and four small lamps follow the drums,
 * the reels turn, a counter keeps the beats. The desk is still there under
 * it and does the playing, so the feel is the real one. Flipping needs the
 * desk: one key passes the link on to a laptop.
 */

import {
  flipsLine,
  playerCount,
  playerHits,
  playerLabel,
  playerRows,
  tapePosition,
} from "../core/Player.js";
import { shareLinks } from "../core/Sending.js";
import { tapeGoingIn } from "../core/TapeSound.js";
import { faceUrl } from "./AccountMenu.js";

const SVG = "http://www.w3.org/2000/svg";
const ICONS = {
  play: "M7 4l14 8-14 8z",
  stop: "M6 5h12v14H6z",
  copy: "M9 3h9a2 2 0 0 1 2 2v11h-2V5H9zM6 7h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2zm0 2v10h8V9z",
  done: "M9.2 16.6 4.9 12.3l-1.6 1.6 5.9 5.9L21 8l-1.6-1.6z",
  email:
    "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zm0 2.4V17h16V7.4l-8 5.6zM5.6 7l6.4 4.5L18.4 7z",
  whatsapp:
    "M12 2a10 10 0 0 0-8.6 15.1L2 22l5.1-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 1 1-4.2 14.8l-.4-.2-2.6.7.7-2.5-.3-.4A8 8 0 0 1 12 4zM8.8 7.5c-.3 0-.6.1-.8.4-.3.4-.9 1-.9 2.3s.9 2.6 1.1 2.8c.1.2 1.9 3 4.7 4.1 2.3.9 2.8.7 3.3.7s1.6-.7 1.9-1.3c.2-.6.2-1.2.1-1.3-.1-.2-.3-.2-.6-.4l-1.9-.9c-.3-.1-.5-.1-.7.2l-.8 1c-.2.2-.3.2-.6.1-.9-.4-2.4-1.4-3.2-2.9-.2-.3 0-.5.1-.6l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.4 0-.6l-.9-2.1c-.2-.4-.4-.4-.6-.4z",
};
// From the first tap to the beat: the tape drops, seats, the door shuts
const DROP_SECONDS = 1.2;
// The tape sound begins a moment into its own lead-in (src/core/TapeSound.js)
const SOUND_HEAD = 0.3;
// How far each needle swings, in degrees: at rest, and on a full hit
const REST = -38;
const SWING = 62;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // Titles and names are typed by people: always text, never markup
  if (text !== undefined) node.textContent = text;
  return node;
}

function svg(tag, attributes = {}) {
  const node = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes)) node.setAttribute(name, value);
  return node;
}

function icon(name) {
  const drawing = svg("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" });
  drawing.append(svg("path", { d: ICONS[name] }));
  return drawing;
}

/** A VU meter: its dial, and a needle that is handed back to be swung */
function meter() {
  const dial = svg("svg", { class: "player-meter", viewBox: "0 0 350 176" });
  const needle = svg("line", {
    class: "player-needle",
    x1: 175,
    y1: 216,
    x2: 175,
    y2: 38,
  });
  dial.append(
    svg("rect", { class: "player-dial", width: 350, height: 176, rx: 6 }),
    svg("path", { class: "player-scale", d: "M59.1 91.7A170 170 0 0 1 244.6 60.9" }),
    svg("path", { class: "player-scale is-hot", d: "M244.6 60.9A170 170 0 0 1 290.9 91.7" }),
    needle,
  );
  return { dial, needle };
}

export class Player {
  /**
   * @param {Object} options
   * @param {Store} options.store
   * @param {AudioContext} options.context - Where the tape is heard going in
   * @param {Object} options.tape - The beat as one bounced loop (ADR-0036): `make()` has it
   *   ready, `play()` resolves with `{ startedAt, barSeconds }` once it sounds (null if it
   *   can't), `stop()` stops it
   */
  constructor({ store, context, tape }) {
    this.store = store;
    this.context = context;
    this.tape = tape;
    /** Is the beat wanted: playing, or being made ready to */
    this.playing = false;
    /** When the loop began on the context's clock, and its bar; null while nothing sounds */
    this.going = null;
    this.root = document.querySelector("#player");
    /** The beat on the card: { id, title, bpm, by, link, flips, listFlips } */
    this.beat = null;
    /** The step sounding now; -1 while stopped */
    this.step = -1;
    /** The drums hit on each step */
    this.hits = [];
    /** Beats since PLAY went down */
    this.beats = 0;
    /** Is the tape in the deck? It goes in on the first tap, once */
    this.loaded = false;
    this.loading = false;
  }

  init() {
    this.store.subscribeToSelector(
      (s) => s.steps,
      () => this.readPattern(),
    );
    return this;
  }

  /**
   * Put a beat on the card.
   * @param {Object} beat
   * @param {string} beat.title
   * @param {number} beat.bpm
   * @param {{name: string, face: string}} beat.by
   * @param {string} beat.link - The beat's own address, to pass on
   * @param {number} beat.flips - How many sent flips it has
   * @param {() => Promise<{flips: Object[]}>} beat.listFlips
   */
  show(beat) {
    this.beat = beat;
    const { root } = this;
    const state = this.store.getState();

    const mark = el("p", "player-mark");
    const logo = el("img");
    logo.src = "./public/images/knockbox-logo.svg";
    logo.alt = "";
    const name = el("span", "", "Knock");
    name.append(el("em", "", "box"));
    mark.append(logo, name);

    const meters = el("div", "player-meters");
    meters.setAttribute("aria-hidden", "true");
    const [low, high] = [meter(), meter()];
    this.needles = [low.needle, high.needle];
    meters.append(low.dial, high.dial);

    // The cassette: the beat's title on its label, its tempo and feel beside it
    const label = el("div", "player-label");
    const top = el("div", "player-label-top");
    top.append(
      el("h2", "player-title", beat.title),
      el(
        "small",
        "",
        playerLabel({ bpm: state.transport.bpm, feel: state.grooveSettings?.hihatMode }),
      ),
    );
    const reels = el("div", "player-reels");
    reels.setAttribute("aria-hidden", "true");
    reels.append(el("i", "player-reel"), el("i", "player-reel"));
    label.append(top, reels);
    const tape = el("div", "player-tape");
    tape.append(label);
    const door = el("div", "player-door");
    door.append(tape);
    // Until it is in, the tape is the thing to tap
    door.addEventListener("click", () => !this.loaded && this.press());

    const row = el("div", "player-row");
    row.setAttribute("aria-hidden", "true");
    this.counter = el("div", "player-counter");
    for (const digit of playerCount(0)) this.counter.append(el("b", "", digit));
    const lamps = el("div", "player-lamps");
    this.lamps = Array.from({ length: 4 }, () => el("i", "player-lamp"));
    lamps.append(...this.lamps);
    row.append(this.counter, lamps);

    this.key = el("button", "player-key");
    this.key.type = "button";
    this.key.addEventListener("click", () => this.press());
    const well = el("div", "player-well");
    well.append(this.key);

    const deck = el("section", "player-deck");
    deck.append(mark, meters, door, row, well);

    // Whose it is, in one quiet line: the deck is the picture
    const who = el("p", "player-credit", "produced by ");
    const face = el("img", "player-face");
    face.src = faceUrl(beat.by.face);
    face.alt = "";
    who.prepend(face);
    who.append(el("b", "", beat.by.name));

    root.replaceChildren(deck, who, this.renderWays(beat));
    if (beat.flips > 0) root.append(this.renderFlips(beat));
    root.classList.toggle("is-loaded", this.loaded);
    root.hidden = false;
    this.readPattern();
    this.drawState();
  }

  /** The link led nowhere: the card says so */
  gone() {
    this.beat = null;
    const home = el("a", "player-way is-hot", "Open Knockbox");
    home.href = "/";
    this.root.replaceChildren(
      el("h2", "player-title", "Not available"),
      el("p", "player-by", "That beat was taken back by its maker."),
      home,
    );
    this.root.hidden = false;
  }

  /** The key, or the waiting tape, was tapped */
  press() {
    if (this.loading) return;
    if (this.loaded) {
      this.toggle();
      return;
    }
    this.loaded = true;
    // The beat is bounced while the tape goes in
    this.tape.make();
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this.root.classList.add("is-loaded");
      this.toggle();
      return;
    }
    // The first tap puts the tape in: heard and seen once, then the beat
    this.loading = true;
    this.root.classList.add("is-loading");
    this.drawState();
    try {
      this.context.resume?.();
      tapeGoingIn(
        this.context,
        this.context.destination,
        this.context.currentTime - SOUND_HEAD,
        DROP_SECONDS + SOUND_HEAD,
      );
    } catch {
      // It goes in silently
    }
    setTimeout(() => {
      this.loading = false;
      this.root.classList.replace("is-loading", "is-loaded");
      this.toggle();
    }, DROP_SECONDS * 1000);
  }

  /** Start the loop, or stop it */
  async toggle() {
    if (this.playing) {
      this.playing = false;
      this.going = null;
      cancelAnimationFrame(this.frame);
      this.tape.stop();
      this.onStep(-1);
      this.drawState();
      return;
    }
    this.playing = true;
    this.drawState();
    const going = await this.tape.play();
    // Stopped while it was being made ready
    if (!this.playing) return;
    if (!going) {
      this.playing = false;
      this.drawState();
      return;
    }
    this.going = going;
    this.drawState();
    this.follow();
  }

  /** Light the deck from where the loop has got to: the sound runs by itself, on the audio clock */
  follow() {
    if (!this.going) return;
    const { startedAt, barSeconds } = this.going;
    const heard = this.context.currentTime - (this.context.outputLatency || 0) - startedAt;
    const { step, beats } = tapePosition(heard, barSeconds);
    if (step >= 0) this.onStep(step, beats);
    this.frame = requestAnimationFrame(() => this.follow());
  }

  /** The step that is sounding, and the beats begun so far; -1 when it stops */
  onStep(step, beats = 0) {
    const before = this.step;
    this.step = step;
    if (!this.beat || step === before) return;
    if (step < 0) {
      this.beats = 0;
      this.count();
      return;
    }
    // Sixteen times a bar on a phone: a lamp and a needle for what was hit, each
    // moved by the compositor, and one digit on the beat
    const hit = this.hits[step] ?? [];
    for (const track of hit) {
      this.lamps[track]?.animate([{ opacity: 1 }, { opacity: 0.22 }], { duration: 260 });
    }
    if (hit.includes(0)) this.swing(0, 1, 420);
    if (hit.includes(1)) this.swing(1, 0.9, 340);
    else if (hit.includes(2) || hit.includes(3)) this.swing(1, 0.45, 180);
    if (beats !== this.beats) {
      this.beats = beats;
      this.count();
    }
  }

  /** Kick a needle over and let it fall back */
  swing(which, how, ms) {
    this.needles[which].animate(
      [{ transform: `rotate(${REST + SWING * how}deg)` }, { transform: `rotate(${REST}deg)` }],
      { duration: ms, easing: "cubic-bezier(0.2, 0.6, 0.3, 1)" },
    );
  }

  count() {
    [...playerCount(Math.max(0, this.beats - 1))].forEach((digit, i) => {
      const wheel = this.counter.children[i];
      if (wheel.textContent !== digit) wheel.textContent = digit;
    });
  }

  /**
   * One key says what the link is for and hands it to the phone's share
   * sheet; beside it, the link by copy, email and WhatsApp, each by its sign.
   */
  renderWays({ link, title, by }) {
    const ways = el("div", "player-ways");
    const flip = el("button", "player-way is-hot", "Flip it on a laptop");
    flip.type = "button";
    flip.addEventListener("click", async () => {
      try {
        if (navigator.share) await navigator.share({ title, url: link });
        else {
          await navigator.clipboard.writeText(link);
          flip.textContent = "Link copied";
        }
      } catch {
        // Closed without sending: nothing to say
      }
    });

    const copy = el("button", "player-way");
    copy.type = "button";
    copy.setAttribute("aria-label", "Copy the link");
    copy.append(icon("copy"));
    copy.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(link);
        copy.replaceChildren(icon("done"));
        copy.setAttribute("aria-label", "Link copied");
      } catch {
        copy.setAttribute("aria-label", "Couldn't copy the link");
      }
    });
    ways.append(flip, copy);
    // Whoever is holding the phone may not be its maker: the words name them
    const { email, whatsapp } = shareLinks(link, title, by.name);
    for (const [sign, text, href] of [
      ["email", "Email the link", email],
      ["whatsapp", "Send the link on WhatsApp", whatsapp],
    ]) {
      const way = el("a", `player-way is-${sign}`);
      way.href = href;
      way.target = "_blank";
      way.rel = "noopener";
      way.setAttribute("aria-label", text);
      way.append(icon(sign));
      ways.append(way);
    }
    return ways;
  }

  /** The sent flips made from it: a count that opens into a list, each a link to play */
  renderFlips({ flips, listFlips }) {
    const wrap = el("div", "player-flips");
    const open = el("button", "player-strip player-flips-open", flipsLine(flips));
    open.type = "button";
    open.setAttribute("aria-expanded", "false");
    const list = el("div", "player-flips-list");
    list.hidden = true;
    open.addEventListener("click", async () => {
      if (!list.hidden) {
        list.hidden = true;
        open.setAttribute("aria-expanded", "false");
        return;
      }
      try {
        const { flips: made } = await listFlips();
        list.replaceChildren(
          ...made.map((flip) => {
            const link = el("a", "player-flip");
            link.href = `/b/${encodeURIComponent(flip.id)}`;
            link.append(el("b", "", flip.title), ` by ${flip.by.name}`);
            return link;
          }),
        );
      } catch {
        list.replaceChildren(el("span", "player-flip", "Couldn't fetch the flips. Try again."));
      }
      list.hidden = false;
      open.setAttribute("aria-expanded", "true");
    });
    wrap.append(open, list);
    return wrap;
  }

  /** Which drums each step hits, for the lamps and needles */
  readPattern() {
    if (!this.beat) return;
    this.hits = playerHits(playerRows(this.store.getState().steps));
  }

  /** The key and the reels, when the beat starts or stops */
  drawState() {
    if (!this.beat) return;
    const { playing } = this;
    // The reels turn once there is sound, not while it is being made ready
    this.root.classList.toggle("is-playing", Boolean(this.going));
    this.key.setAttribute("aria-label", playing ? "Stop" : "Play");
    this.key.setAttribute("aria-pressed", String(playing));
    // Before the tape is in, the key says what to do; after, its sign is enough
    this.key.replaceChildren(icon(playing ? "stop" : "play"));
    if (!this.loaded) this.key.append(el("span", "", "TAP TO PLAY"));
  }
}
