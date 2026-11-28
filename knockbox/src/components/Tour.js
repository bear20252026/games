/**
 * The tour: a sticky note that hops around the desk, with the lamp turned
 * down on everything except the thing it is talking about. Shown once to a
 * new visitor (and again from How it works); every step can be skipped,
 * and so can the whole thing.
 */

const SEEN_KEY = "knockbox-tour-seen";

// Breathing room around the lit area, and between it and the note (px)
const SPOT_PADDING = 10;
const NOTE_GAP = 18;
const EDGE_MARGIN = 12;

const all = (selector) => [...document.querySelectorAll(selector)];

/**
 * `target` returns the elements to light up; no target means the whole desk stays dim.
 * An `optional` stop is left out when what it points at isn't on the desk (the server
 * hasn't answered, or the crate is empty).
 */
export const STEPS = [
  {
    title: "Yo. Welcome to Knockbox.",
    text: "This desk makes beats that lean, keeps them, and passes them on. Want the quick tour?",
    next: "Show me around",
  },
  {
    target: () => all(".track-row.sample-drop-zone .track-steps"),
    title: "Tap out a beat",
    text: "Each row is a drum, each pad is a 16th note. Tap a pad to light it up, tap again to kill it.",
  },
  {
    target: () => all("#play-btn, .tempo-display"),
    title: "Hit play",
    text: "Start the loop and set your tempo. Somewhere around 85 to 95 is where the head nod lives.",
  },
  {
    target: () => all("#humanize-container"),
    title: "Make it drunk",
    text: "Turn this up and the kick drags while the snare rushes. Zero is a robot. A hundred is 3am.",
  },
  {
    target: () => all("#hihat-mode-toggle"),
    title: "Pick a hat feel",
    text: "Friction keeps the hats stiff against the lazy kick. Limp lets them drag too. Live rushes them like a drummer.",
  },
  {
    target: () => all("#note-repeat"),
    title: "Flams, drags, rolls",
    text: "Pick one, then tap a pad to stamp it on that hit. Step takes you back to plain hits.",
  },
  {
    target: () => {
      const row = document.querySelector(".track-row.sample-drop-zone");
      return row ? [...row.children].filter((el) => !el.classList.contains("track-steps")) : [];
    },
    title: "Your sounds, your rules",
    text: "The lit name is the sound a row plays. Step through the built-in ones with the arrows, or press the name for the list and to upload your own (or just drop a file on the row). M mutes a row and S solos it. The little dial sprinkles ghost notes.",
  },
  {
    // The mic's keys and tag hang outside its own box
    target: () => all(".prop-mic, .prop-mic *"),
    title: "Sing it, beatbox it, loop it",
    text: "Vocal records you over the beat and chops the take. Beatbox turns your mouth into the drum pattern. Load brings in a loop to chop — or drag any audio file onto the desk. Input picks your mic or interface.",
  },
  {
    // Wherever he is on this desk: the character under the sampler, or the head in the logo
    optional: true,
    target: () => {
      const him = all("#avatar-canvas, .brand .logo-mark").find(
        (el) => el.getBoundingClientRect().width > 0,
      );
      return him ? [him, ...all(".drummer-thought")] : [];
    },
    title: "Meet the drummer",
    text: "He watches you work and speaks up when he has something: a beat to start from, a snare you're missing, more groove, drums to fit your loop. Tap him for an idea any time. Try it, then keep it or put it back. Nothing of his stays unless you say so.",
  },
  {
    target: () => all("#mixer-btn"),
    title: "Balance it",
    text: "Mixer flips every row into a fader, so nothing drowns out anything else.",
  },
  {
    target: () => all(".prop-cassette"),
    title: "Take it with you",
    text: "Export as opens the list: MIDI for the notes, WAV for the sound, stems to mix in your DAW, or just the groove to lay over your own drums. What you export lands on a card underneath, ready to drag out. Share gives the beat a link anyone can play, or makes a video of the loop for your feed.",
  },
  {
    optional: true,
    target: () => all("#disk-box"),
    title: "Keep it, send it",
    text: "Save (or S) puts the beat on a floppy in this box, with its sounds. Pick a disk up to load it, rename it or bin it. Send gives it a link that plays on any phone and opens on any desk.",
  },
  {
    optional: true,
    target: () => all("#account"),
    title: "Put your name on it",
    text: "Until you sign in, your disks are only held by this browser. Sign in with an email, no password, and they are kept and follow you to any desk. The name and the face are yours to change, and your page lists everything you've made.",
  },
  {
    optional: true,
    target: () => all("#crate"),
    title: "Dig the crate",
    text: "Beats from other desks. Unlock it, play one where it sits, and flip the one you like: its pattern and feel land on a disk of your own, never its maker's samples, and the credit stays on it.",
  },
  {
    title: "That's the desk.",
    text: "Now make it knock. Space plays, 1 to 4 hit the drums, and ? lists the rest of the keys. The tour is under How it works, top right, if you want it again.",
    next: "Let's go",
  },
];

/**
 * The stops a tour makes on this desk: every step but the optional ones that have
 * nothing to point at.
 * @param {Object[]} steps
 * @param {(step: Object) => boolean} onDesk - Is what the step points at there to be lit?
 */
export function tourStops(steps, onDesk) {
  return steps.filter((step) => !step.optional || onDesk(step));
}

export class Tour {
  constructor() {
    this.index = 0;
    this.steps = STEPS;
    this.root = null;
    this.onKey = (e) => this.handleKey(e);
    this.onResize = () => this.place();
  }

  /** Run the tour for someone who hasn't seen it */
  startIfNew() {
    if (!this.hasSeen()) this.start();
  }

  hasSeen() {
    try {
      return localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      return true; // storage is blocked: don't nag on every visit
    }
  }

  start() {
    if (this.root) return;
    this.root = document.createElement("div");
    this.root.className = "tour";
    this.root.innerHTML = `
      <div class="tour-spot"></div>
      <div class="tour-note" role="dialog" aria-modal="true" aria-labelledby="tour-title">
        <button type="button" class="tour-skip" data-tour="skip">skip the tour ✕</button>
        <h3 class="tour-title" id="tour-title"></h3>
        <p class="tour-text"></p>
        <div class="tour-actions">
          <button type="button" class="tour-back" data-tour="back">← back</button>
          <span class="tour-count" aria-hidden="true"></span>
          <button type="button" class="tour-next" data-tour="next"></button>
        </div>
      </div>`;
    this.spot = this.root.querySelector(".tour-spot");
    this.note = this.root.querySelector(".tour-note");
    this.root.addEventListener("click", (e) => {
      const action = e.target.closest("[data-tour]")?.dataset.tour;
      if (action === "next") this.go(this.index + 1);
      else if (action === "back") this.go(this.index - 1);
      else if (action === "skip") this.stop();
    });
    this.steps = tourStops(STEPS, (step) => unionRect(step.target()) !== null);
    document.body.append(this.root);
    document.addEventListener("keydown", this.onKey);
    window.addEventListener("resize", this.onResize);
    this.go(0);
  }

  stop() {
    if (!this.root) return;
    this.root.remove();
    this.root = null;
    document.removeEventListener("keydown", this.onKey);
    window.removeEventListener("resize", this.onResize);
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // storage is blocked: the tour will simply not offer itself again
    }
  }

  go(index) {
    if (index >= this.steps.length) {
      this.stop();
      return;
    }
    this.index = Math.max(0, index);
    const step = this.steps[this.index];
    const last = this.index === this.steps.length - 1;

    this.root.querySelector(".tour-title").textContent = step.title;
    this.root.querySelector(".tour-text").textContent = step.text;
    this.root.querySelector(".tour-next").textContent = step.next || "next →";
    this.root.querySelector(".tour-back").hidden = this.index === 0;
    this.root.querySelector(".tour-skip").hidden = last;
    // The hello and goodbye notes aren't stops on the tour
    const stops = this.steps.length - 2;
    this.root.querySelector(".tour-count").textContent =
      this.index === 0 || last ? "" : `${this.index} of ${stops}`;

    // Each note sits at its own slight angle, like it was slapped down
    this.note.style.setProperty("--tour-tilt", `${this.index % 2 === 0 ? -1.5 : 1.5}deg`);
    this.place();
    this.root.querySelector(".tour-next").focus({ preventScroll: true });
  }

  /** Light the current step's target and put the note beside it */
  place() {
    if (!this.root) return;
    const rect = unionRect(this.steps[this.index].target?.() ?? []);
    const { innerWidth: vw, innerHeight: vh } = window;
    const note = this.note.getBoundingClientRect();

    if (!rect) {
      // Nothing to point at: the whole desk dims and the note takes the middle
      Object.assign(this.spot.style, {
        left: `${vw / 2}px`,
        top: `${vh / 2}px`,
        width: "0px",
        height: "0px",
      });
      this.moveNote((vw - note.width) / 2, (vh - note.height) / 2);
      return;
    }

    const spot = {
      left: rect.left - SPOT_PADDING,
      top: rect.top - SPOT_PADDING,
      width: rect.width + SPOT_PADDING * 2,
      height: rect.height + SPOT_PADDING * 2,
    };
    for (const [key, value] of Object.entries(spot)) this.spot.style[key] = `${value}px`;

    // Below the target if there's room, else above, else wherever is widest
    const below = spot.top + spot.height + NOTE_GAP;
    const above = spot.top - NOTE_GAP - note.height;
    let top;
    let left = spot.left + spot.width / 2 - note.width / 2;
    if (below + note.height <= vh - EDGE_MARGIN) top = below;
    else if (above >= EDGE_MARGIN) top = above;
    else {
      top = spot.top + spot.height / 2 - note.height / 2;
      const roomRight = vw - (spot.left + spot.width);
      left =
        roomRight > spot.left
          ? spot.left + spot.width + NOTE_GAP
          : spot.left - NOTE_GAP - note.width;
    }
    this.moveNote(left, top);
  }

  moveNote(left, top) {
    const note = this.note.getBoundingClientRect();
    const clamp = (value, max) => Math.max(EDGE_MARGIN, Math.min(value, max - EDGE_MARGIN));
    this.note.style.left = `${clamp(left, window.innerWidth - note.width)}px`;
    this.note.style.top = `${clamp(top, window.innerHeight - note.height)}px`;
  }

  handleKey(e) {
    if (e.key === "Escape") this.stop();
    else if (e.key === "ArrowRight") this.go(this.index + 1);
    else if (e.key === "ArrowLeft") this.go(this.index - 1);
    else return;
    e.preventDefault();
  }
}

/** The box around every visible element in the list, or null if there is none */
function unionRect(elements) {
  const rects = elements.map((el) => el.getBoundingClientRect()).filter((r) => r.width && r.height);
  if (rects.length === 0) return null;
  const left = Math.min(...rects.map((r) => r.left));
  const top = Math.min(...rects.map((r) => r.top));
  const right = Math.max(...rects.map((r) => r.right));
  const bottom = Math.max(...rects.map((r) => r.bottom));
  return { left, top, width: right - left, height: bottom - top };
}
