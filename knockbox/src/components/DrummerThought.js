/**
 * The drummer's thought bubble (ADR-0058). The character under the sampler
 * thinks in words: of a loop on a desk with none, of drums once a loop has
 * gone round, and, with a take up, three keys to go through his takes and
 * keep one. In a window too small for the character he speaks from the logo's
 * head, and the wordmark beside it steps aside while he does (ADR-0060).
 */

import { takeArts, takePads } from "../core/Drummer.js";
import { isHeard } from "../core/Heard.js";
import {
  feelRows,
  followsOn,
  ideasFor,
  questionOf,
  repliesFor,
  rowsOf,
  soundRows,
} from "../core/Ideas.js";
import { heardAsPlayed } from "../core/Listen.js";
import { barsSeconds, loopScreenSleeps } from "../core/LoopScreen.js";
import { hasPencil } from "../core/Pencil.js";
import { soundId, soundsFor, TRACK_KEYS } from "../core/Sounds.js";
import {
  HINT_BARS,
  IDEAS_TO_REST,
  ideaDue,
  LOOP_THOUGHT_BARS,
  OFFER_BARS,
  REST_BARS,
  STILL_BARS,
  takeAt,
  UP_BARS,
  whatHeThinks,
} from "../core/Thought.js";
import { partOf, partOfRow, Watch } from "../core/Watch.js";

const LOOP_THOUGHT_SEEN = "knockbox.loopThoughtSeen";
const TAPPED_HIM = "knockbox.tappedHim";
const WORDS = {
  loop: "got a loop? throw it on",
  offer: "need drums?",
  // With drums on the pads already, the offer is of drums that go with the loop
  offerFit: "drums to fit this loop?",
  listening: "lemme hear it…",
  kept: "yeah, that one knocks. tap me to switch it out",
  none: "nah, it knocks",
  hint: "tap me for ideas",
};
// How many of his takes he goes through for one that shows on a desk full of the maker's pads
const TAKES_TO_FIND_ROOM = 8;
// How long he answers a keep, a no, or a tap he has nothing for
const WORD_SECONDS = 3;
// How long he says he can be tapped
const HINT_SECONDS = 6;
// How long he says so after a take is kept
const KEPT_SECONDS = 4;
const SHUFFLE =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 18h1.4c1.3 0 2.5-.6 3.3-1.7l6.1-8.6c.7-1.1 2-1.7 3.3-1.7H22"/><path d="m18 2 4 4-4 4"/><path d="M2 6h1.9c1.5 0 2.9.9 3.6 2.2"/><path d="M22 18h-5.9c-1.3 0-2.6-.7-3.3-1.8l-.5-.8"/><path d="m18 14 4 4-4 4"/></svg>';
const BACK =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg>';

/** Whether an idea changes that part of the desk: the pads, the feel's dials, the loop's row or the voice's */
function touches(idea, part) {
  if (part === "steps") return Boolean(idea.on || idea.off);
  if (part === "feel") return feelRows(idea).length > 0;
  return (part === "smp" && Boolean(idea.shuffle)) || (idea.set ?? []).some((s) => s.lane === part);
}

/** Whether any pad is lit */
const hasLit = (steps) => Object.values(steps).some((step) => step.active);

/** Which way a setting went, as Watch.note takes it: a number up or down, a switch (null), anything else dragged (0) */
function wayOf(now, was) {
  if (typeof now === "number" && typeof was === "number") return Math.sign(now - was);
  return typeof now === "object" && now !== null ? 0 : null;
}

/** Whether trying an idea would be heard: not where every row it changes is muted, or left out by a solo */
const canBeHeard = (idea, state) => rowsOf(idea).some((row) => isHeard(state, row));

/** How an idea's pencil turns to ink: the maker's, since they chose it, or still his where the idea is a whole beat of his */
const keepAs = (idea) => (idea.his ? "KEEP_TAKE" : "KEEP_IDEA");

export class DrummerThought {
  /**
   * @param {Object} options
   * @param {Store} options.store
   * @param {VoxEngine} options.loopEngine - The loop's row
   * @param {AudioJobs} options.jobs - Where the loop is listened to
   * @param {VoxEngine} [options.voxEngine] - The voice's row
   * @param {string} [options.avatar] - The character
   * @param {(track: number) => boolean} [options.ownSound] - Whether a drum row is on a sound of the maker's own
   * @param {(what: string) => void} [options.onDid] - Told of an idea raised ("idea"), tried
   *   ("idea_tried") and kept ("idea_kept"), and of a take kept ("take_kept"), to be counted
   */
  constructor({
    store,
    loopEngine,
    jobs,
    voxEngine = null,
    avatar = "#avatar-canvas",
    ownSound = () => false,
    onDid = () => {},
  }) {
    this.ownSound = ownSound;
    this.onDid = onDid;
    this.store = store;
    this.loopEngine = loopEngine;
    this.jobs = jobs;
    this.voxEngine = voxEngine;
    // Where the voice on the desk sounds in the bar, and the take that was heard for it
    this.sounding = null;
    this.soundingIn = null;
    this.avatar = document.querySelector(avatar);
    // The same character, in the logo: where he speaks from when the other is put away
    this.title = document.querySelector(".brand");
    this.logo = this.title?.querySelector(".logo-mark") ?? null;
    // What was heard in the loop on the desk, and which of his takes is up
    this.heard = null;
    this.heardIn = null;
    this.index = 0;
    this.listening = false;
    // A run of his takes on the desk, or null. One thing, so that a run is either up with all
    // that is needed to put it back, or it is not up:
    // { stood, makers, from, bpm, heard, startedPlay } (startRun)
    this.run = null;
    // The loop a take was kept for: he doesn't offer again until another lands
    this.doneFor = null;
    // Until when he says a take was kept
    this.keptUntil = 0;
    // When the beat started, or the loop landed, whichever was later
    this.since = null;
    this.timer = null;
    this.said = null;
    // His idea for the desk: { idea, stage: "idea" | "trying", before } while one is up or on trial
    this.idea = null;
    // How many of his own ideas were answered since he last sat back, and when he sat back
    this.answered = 0;
    this.restFrom = null;
    // A word in answer ("cool", "bet", "none"), and until when
    this.word = null;
    this.wordUntil = 0;
    // Ideas waved off, so they are not raised again, and how many in a row
    // The ideas waved off for this loop, each with what it asked (questionOf)
    this.declined = new Map();
    // He has said he can be tapped, or been tapped, this visit
    this.hintOver = false;
    this.hintTimer = null;
    this.nahs = 0;
    // The ideas that go with the one last kept: the next of them is raised sooner, once
    this.follows = [];
    // The desk is as it was opened, or was cleared at a stroke: blank, he speaks of it at once
    this.opened = true;
    // When the maker last touched the pads or the loop; his own changes don't count
    this.touched = performance.now();
    // Whether they have touched it at all this visit, or since a beat was opened on it: one who
    // has not is not spoken to of a stopped desk
    this.worked = false;
    // Stopped, the stillness he counts from: null once an idea was waved off, until the next touch
    this.still = null;
    // Where the maker's hands are, a part of the desk at a time (ADR-0071)
    this.watch = new Watch();
    // When the last idea he raised unasked came down, and those that went unanswered, each with its part
    this.spokeAt = Number.NEGATIVE_INFINITY;
    this.passed = new Map();
    this.acting = false;
    this.onPressElsewhere = this.onPressElsewhere.bind(this);
  }

  init() {
    if (!this.avatar) return;
    this.box = document.createElement("div");
    this.box.className = "drummer-thought";
    this.box.setAttribute("role", "group");
    this.box.setAttribute("aria-label", "The drummer");
    this.box.hidden = true;
    document.body.appendChild(this.box);

    this.box.addEventListener("click", (e) => {
      const key = e.target.closest("button")?.dataset.key;
      // The second press of a double press lands where the first did, on whatever key the
      // first brought up there (KEEP IT, where TRY IT was): it answers nothing
      if (e.detail > 1 && key !== this.pressedKey) return;
      this.pressedKey = key;
      if (key === "ask") this.listen();
      else if (key === "next") this.step(1);
      else if (key === "back") this.step(-1);
      else if (key === "keep") this.keep();
      else if (key === "try") this.tryIdea();
      else if (key === "another") this.tryIdea();
      else if (key === "nah") this.answerIdea("cool");
      else if (key === "ideakeep") this.answerIdea("bet");
      else if (key === "putback") {
        if (this.said === "takes") this.putBackTakes();
        else this.answerIdea("cool");
      }
    });
    // A press on him is "switch it up", and brings his takes back after one was kept
    this.avatar.addEventListener("click", () => this.pressed());
    this.logo?.addEventListener("click", () => this.pressed());
    document.addEventListener("keydown", (e) => {
      if (this.said !== "takes" || e.metaKey || e.ctrlKey || e.altKey) return;
      // The arrows belong to a dial or a field while one has them
      if (e.target.closest?.('input, textarea, select, [role="slider"], [contenteditable]')) return;
      if (e.key === "ArrowRight") this.step(1);
      else if (e.key === "ArrowLeft") this.step(-1);
      else return;
      e.preventDefault();
    });
    // The crate comes to the desk once it is known what is in it: a bubble already up makes room
    const crate = document.querySelector("#crate");
    if (crate && typeof MutationObserver !== "undefined") {
      new MutationObserver(() => this.place()).observe(crate, {
        attributes: true,
        attributeFilter: ["hidden"],
      });
    }
    // A window made larger or smaller may move him between the two
    window.addEventListener("resize", () => {
      const said = this.said;
      this.said = undefined;
      this.say(said);
    });

    this.store.subscribeToSelector(
      (s) => s.transport.isPlaying,
      () => {
        // PLAY and STOP are the maker at work, where it was not he who pressed
        if (!this.acting) this.touch();
        this.check();
      },
    );
    // The feel's dials turned by the maker under a feel of his on trial: it is theirs, as pads are
    const ghost = (track) => (s) => s.trackSettings[track]?.ghostQuantity;
    for (const [key, selector] of [
      ["swing", (s) => s.humanizeValue],
      ["mode", (s) => s.grooveSettings.hihatMode],
      ["ghost1", ghost(1)],
      ["ghost2", ghost(2)],
    ]) {
      this.store.subscribeToSelector(selector, (now, was) => {
        this.noted("feel", key, wayOf(now, was));
        this.changed("feel");
      });
    }
    // A row's sound stepped or picked by the maker: the sounds are a part of their own. It is
    // never back and forth, however many they go through to find one
    this.store.subscribeToSelector(
      (s) => [0, 1, 2, 3].map((track) => s.trackSettings[track]?.sound ?? "").join(),
      (now, was) => this.soundsChanged(now.split(","), was.split(",")),
    );
    // The tempo is every part's: each starts over
    this.store.subscribeToSelector(
      (s) => s.transport.bpm,
      () => {
        if (!this.acting && !this.store.opening) this.watch.noteAll(performance.now());
      },
    );
    // What the maker sets on the dials and the row keys while something of his is on the desk
    for (const key of ["humanizeValue", "grooveSettings", "trackSettings"]) {
      this.store.subscribeToSelector(
        (s) => s[key],
        (now, was) => this.carry(key, now, was),
      );
    }
    // The tempo and the feel's dials are the maker at work too: the quiet starts over
    for (const selector of [
      (s) => s.transport.bpm,
      (s) => s.humanizeValue,
      (s) => s.grooveSettings,
      (s) => s.trackSettings,
      (s) => s.solo,
    ]) {
      this.store.subscribeToSelector(selector, () => {
        if (!this.acting) this.touch();
        this.check();
      });
    }
    // The tempo the drums on the pads were last changed at, by him or by the maker
    this.drumsBpm = this.store.getState().transport.bpm;
    this.store.subscribeToSelector(
      (s) => s.steps,
      () => {
        this.drumsBpm = this.store.getState().transport.bpm;
      },
    );
    for (const part of ["smp", "vox", "steps"]) {
      this.store.subscribeToSelector(
        (s) => s[part],
        (now, was) => {
          // The pads the maker changes while his takes are up, each kept as they left it for a put-back
          if (part === "steps" && !this.acting && this.run) {
            for (const id of Object.keys(now)) {
              if (now[id].active !== was[id].active) this.run.makers.set(id, now[id]);
            }
          }
          if (part === "steps") {
            const lit = Object.values(now).some((step) => step.active);
            // Pads lit since he was waved off a blank desk: cleared again, it is another desk to start
            if (lit && this.declined.get("start") === "start") this.declined.delete("start");
            // Cleared at a stroke the desk is opened afresh; one pad put out by hand is the maker at work
            const moved = Object.keys(now).filter((id) => now[id] !== was[id]).length;
            const cleared = !lit && moved > 1;
            this.opened = cleared || (!lit && moved === 0 && this.opened);
            // Pads cleared off a desk is another desk: what was waved off on the last is his to ask again
            const hadPads = Object.values(was).some((step) => step.active);
            this.notedPads(now, was);
            if (cleared && hadPads && !this.acting) {
              // And a run of his takes is over: the drums that stood before it were cleared with
              // it. An idea on trial is dealt with as any change of the pads is (changed)
              this.run = null;
              this.forget();
            }
          }
          if (part !== "steps") {
            const key = Object.keys(now).find((name) => now[name] !== was[name]);
            if (key) this.noted(part === "smp" ? "loop" : "voice", key, wayOf(now[key], was[key]));
          }
          this.changed(part);
        },
      );
    }
    this.check();
  }

  /**
   * The maker changed a part of the desk: its clock starts over. An idea of his not yet tried,
   * for that part, comes down (they are on it themselves), and one that went unanswered may be
   * asked again.
   * @param {string} part - One of Watch's PARTS
   * @param {string} key - What they changed
   * @param {boolean|number|null} way - As Watch.note
   * @param {{row: number, step: number}} [pad]
   */
  noted(part, key, way, pad = null) {
    if (this.acting || this.store.opening) return;
    this.watch.note(part, key, way, performance.now(), pad);
    for (const [id, its] of this.passed) if (its === part) this.passed.delete(id);
    // Not one he raised because they cannot settle that part: it is about the very thing they are doing
    const theirs = this.idea?.stage === "idea" && !this.idea.settling;
    if (theirs && partOf(this.idea.idea) === part) this.comeDown();
  }

  /** The maker put another sound on a row: an idea for the sounds not yet tried comes down, and under one on trial that row is theirs */
  soundsChanged(now, was) {
    if (this.acting || this.store.opening) return;
    this.watch.touch("sounds", performance.now());
    for (const [id, its] of this.passed) if (its === "sounds") this.passed.delete(id);
    if (this.idea?.stage === "trying") {
      this.idea.theirs ??= new Set();
      now.forEach((sound, track) => {
        if (sound !== was[track]) this.idea.theirs.add(track);
      });
    } else if (this.idea?.stage === "idea" && partOf(this.idea.idea) === "sounds") {
      this.comeDown();
    }
  }

  /** A pad lit, put out or given another key by hand is that drum's; more than one at a stroke is every part's */
  notedPads(now, was) {
    if (this.acting || this.store.opening) return;
    const moved = Object.keys(now).filter(
      (id) => now[id].active !== was[id].active || now[id].art !== was[id].art,
    );
    if (moved.length > 1) return this.watch.noteAll(performance.now());
    for (const id of moved) {
      const row = Number(id.slice(id.indexOf("-") + 1, id.indexOf("_")));
      const step = Number(id.slice(id.indexOf("_") + 1));
      const way = now[id].active !== was[id].active ? now[id].active : null;
      this.noted(partOfRow(row), id, way, { row, step });
    }
  }

  /** An idea not answered comes down. It is not a no; the next he raises unasked waits its turn */
  comeDown() {
    if (this.idea?.unasked) this.spokeAt = performance.now();
    this.idea = null;
  }

  /**
   * A part of the desk changed. If the maker did it and an idea of his is on trial there, the
   * trial is theirs: it stays as it is, and its keys go. An idea not yet tried is looked at
   * again in check(), and stays up while it still stands.
   * @param {"smp"|"vox"|"steps"|"feel"} part
   */
  changed(part) {
    // A saved beat arriving: his is left where it is, nothing put back over the beat
    if (this.store.opening) this.startOver();
    if (!this.acting) {
      this.touch();
      const trial = this.idea?.stage === "trying" ? this.idea : null;
      if (trial && touches(trial.idea, part)) {
        this.idea = null;
        this.act(() => this.store.dispatch({ type: keepAs(trial.idea) }));
      } else if (trial && part !== "feel") {
        // A trial of something else goes on, its keys still his to answer: the change is the
        // maker's, and stays whether the idea is kept or put back
        trial.before = { ...trial.before, [part]: this.store.getState()[part] };
      }
    }
    this.check();
  }

  /**
   * What the maker sets on the swing, the hi-hat mode, a row's dials or its keys while an idea
   * of his is on trial, or his takes are up, is theirs: it is carried into the desk as it stood,
   * so that putting his back leaves it as they set it.
   * @param {"humanizeValue"|"grooveSettings"|"trackSettings"} key
   */
  carry(key, now, was) {
    if (this.acting || this.store.opening) return;
    const held = this.idea?.stage === "trying" ? this.idea.before : (this.run?.stood ?? null);
    if (!held) return;
    // Only what they changed: the rest stays as it stood before him
    const changedIn = (to, from) =>
      Object.fromEntries(Object.entries(to).filter(([name, value]) => value !== from?.[name]));
    if (key === "humanizeValue") {
      held.humanizeValue = now;
    } else if (key === "grooveSettings") {
      held.grooveSettings = { ...held.grooveSettings, ...changedIn(now, was) };
    } else {
      const tracks = { ...held.trackSettings };
      for (const track of Object.keys(now)) {
        tracks[track] = { ...tracks[track], ...changedIn(now[track], was[track]) };
      }
      held.trackSettings = tracks;
    }
  }

  /** What was waved off, and what was to follow, belong to the desk as it was: on a new one he starts over */
  forget() {
    this.passed.clear();
    this.declined.clear();
    this.nahs = 0;
    this.follows = [];
    this.answered = 0;
    this.restFrom = null;
  }

  /**
   * A new moment on the desk (another loop, a saved beat opened): he starts over, with nothing
   * of his up and nothing waved off. What was on the desk of his is the caller's to take off
   * first, or to leave where it is.
   */
  startOver() {
    this.idea = null;
    this.run = null;
    this.forget();
  }

  /** The maker is at work: the quiet starts over, and so does the stillness of a stopped desk */
  touch() {
    this.touched = performance.now();
    // A beat being opened is not its maker at work: it stands untouched until they are
    this.worked = !this.store.opening;
    this.still = this.worked ? this.touched : null;
  }

  /** A beat he started to be heard is stopped again, and not spoken of until the desk is touched */
  stopAgain(started) {
    if (started && this.store.getState().transport.isPlaying) {
      this.act(() => document.querySelector("#play-btn")?.click());
    }
    this.still = null;
  }

  /** Change the desk as him, so the change is not taken for the maker's */
  act(change) {
    this.acting = true;
    try {
      change();
    } finally {
      this.acting = false;
    }
  }

  /** Work out what he thinks now, and when to look again */
  check() {
    // A saved beat arriving, whichever part of it he is told of first
    if (this.store.opening) this.startOver();
    const state = this.store.getState();
    const loop = this.loopEngine.buffer;
    const hasLoop = Boolean(loop) && state.smp.slices.length > 0;
    // Another loop is another question
    if (loop !== this.heardIn) {
      // Whatever of his was on the desk unanswered was for the loop that has gone: it comes off
      const trial = this.idea?.stage === "trying" ? this.idea : null;
      const run = this.run;
      this.heard = null;
      this.heardIn = loop;
      this.since = null;
      this.startOver();
      if (trial) this.takeOff(trial);
      else if (run) this.standAgain(run);
    }
    // The same loop said to be another number of bars, or cut to another length, is heard again:
    // its sounds fall on other steps. Not under his takes, which are of what he heard.
    if (hasLoop && this.heard && this.heardAs !== this.span() && !this.run && !this.listening) {
      this.heard = null;
      this.triedFor = null;
    }
    // He hears a loop for himself, quietly, so his ideas can go by it
    if (hasLoop && !this.heard && !this.listening && !this.hearing && this.triedFor !== loop) {
      this.hearQuietly();
    }
    // And the voice, for where it leaves room
    const voice = this.voxEngine?.buffer ?? null;
    if (voice !== this.soundingIn) {
      this.sounding = null;
      this.soundingIn = voice;
      if (voice && this.voxEngine.mono) this.hearVoice(voice);
    }
    const { isPlaying, bpm } = state.transport;
    if (!isPlaying) this.since = null;
    else this.since ??= performance.now();
    const barSeconds = barsSeconds(1, bpm);
    const heardBars =
      this.since === null ? 0 : (performance.now() - this.since) / 1000 / barSeconds;

    // Bars the beat has gone round with the desk left alone
    const quietFrom = Math.max(this.since ?? 0, this.touched);
    // Stopped, no bar goes round: the stillness since the last touch is counted as bars would be
    const stopped = !isPlaying && this.worked;
    const stillBars =
      stopped && this.still !== null ? (performance.now() - this.still) / 1000 / barSeconds : 0;
    const quietBars = isPlaying ? (performance.now() - quietFrom) / 1000 / barSeconds : stillBars;
    // A run is his takes on the pads: with none of his left there (the maker pressed each one
    // off) it is over, as it is when the pads are cleared
    if (this.run && !this.acting && !hasPencil(state.steps)) this.run = null;
    const busy = this.listening || Boolean(this.run);
    // An idea not yet tried stays up only while it still stands: the desk changed under it (a pad,
    // a dial, the tempo, a row muted), he would no longer ask it, and it comes down
    if (this.idea?.stage === "idea") {
      const stands = this.asStands(this.idea.idea, state);
      // As he would ask it now: the same question may be of other pads, or for another tempo
      if (stands) this.idea.idea = stands;
      else this.comeDown();
    }
    const at = performance.now();
    const barMs = barSeconds * 1000;
    // One he raised unasked and was not answered goes after a while, and waits for its part to be touched
    if (this.idea?.stage === "idea" && this.idea.unasked && isPlaying) {
      // Bars it has been up with the beat going round: one raised on a stopped desk waits there
      if (at - Math.max(this.idea.at, this.since ?? at) >= UP_BARS * barMs) {
        this.passed.set(this.idea.idea.id, partOf(this.idea.idea));
        this.comeDown();
      }
    }
    // His offer of drums for a loop comes first: until it is answered he raises nothing else unasked
    const offering = hasLoop && this.doneFor !== loop;
    if (!this.idea && !busy && !offering && !this.wordNow()) {
      const unsettled = isPlaying ? this.watch.unsettled(at, barMs) : null;
      const idea = ideaDue(this.ideas(state), {
        quietBars,
        // Each idea by its own part of the desk, from when the beat started or the loop landed
        alone: (idea) => this.watch.alone(partOf(idea), at, this.since ?? at) / barMs,
        gapBars: (at - this.spokeAt) / barMs,
        unsettled,
        passed: [...this.passed.keys()],
        nahs: this.nahs,
        opened: this.opened,
        follows: this.follows,
        stopped: !isPlaying,
        resting: this.restFrom !== null && (at - this.restFrom) / barMs < REST_BARS,
      });
      if (idea) {
        const settling = Boolean(unsettled) && partOf(idea) === unsettled;
        this.raise(idea, !idea.opens, settling);
        if (settling) this.watch.spokeOf(unsettled);
      }
    }

    const said = whatHeThinks({
      idea: this.idea?.stage ?? this.wordNow(),
      hasLoop,
      heardBars,
      pencil: hasPencil(state.steps),
      takesUp: Boolean(this.run),
      listening: this.listening,
      done: this.doneFor === loop,
      kept: this.doneFor === loop && performance.now() < this.keptUntil,
      loopAsleep: loopScreenSleeps("smp") && !hasLoop,
      loopThoughtSeen: this.loopThoughtSeen(),
      // Stopped, to one with a pad lit: there is something for his ideas to be about
      hint:
        (isPlaying || (stopped && hasLit(state.steps))) && !this.hintOver && !this.tappedBefore(),
      stopped,
      stillBars,
    });
    this.say(said);
    this.showTrial();
    // Said once a visit, for a few seconds, and never again once he has been tapped
    if (said === "hint" && !this.hintTimer) {
      this.hintTimer = setTimeout(() => {
        this.hintOver = true;
        this.check();
      }, HINT_SECONDS * 1000);
    }

    // Nothing to say yet, but the beat is going round: look again when he would
    clearTimeout(this.timer);
    const hinting = !this.hintOver && heardBars < HINT_BARS && !this.tappedBefore();
    const wait = hasLoop ? OFFER_BARS : hinting ? HINT_BARS : LOOP_THOUGHT_BARS;
    if (said === null && isPlaying && heardBars < wait) {
      this.timer = setTimeout(() => this.check(), (wait - heardBars) * barSeconds * 1000 + 30);
    } else if (isPlaying && !busy && (!this.idea || this.idea.unasked)) {
      // He looks again each bar: a part may have been left long enough, or an idea of his been up too long
      this.timer = setTimeout(() => this.check(), barMs + 30);
    } else if (!this.idea && !busy && stopped && this.still !== null && stillBars < STILL_BARS) {
      // Stopped: when it has stood still long enough for him to say he can be tapped, or for an idea
      const next = said === null && stillBars < HINT_BARS ? HINT_BARS : STILL_BARS;
      this.timer = setTimeout(() => this.check(), (next - stillBars) * barSeconds * 1000 + 30);
    }
  }

  /** The same idea as he would ask it of the desk as it stands now, or null where he no longer would */
  asStands(idea, state) {
    const asks = questionOf(idea);
    return this.ideas(state).find((now) => now.id === idea.id && questionOf(now) === asks) ?? null;
  }

  /** A feel on trial is his until it is kept: the lit pads of the rows it is heard on are shown in pencil */
  showTrial() {
    const { idea } = this.idea ?? {};
    const rows = this.idea?.stage === "trying" ? [...feelRows(idea), ...soundRows(idea)] : [];
    for (const row of document.querySelectorAll?.(".track-row[data-track]") ?? []) {
      row.classList.toggle("is-on-trial", rows.includes(Number(row.dataset.track)));
    }
  }

  /** An idea goes up in his bubble. Whatever was to follow the last one kept has had its turn */
  /**
   * @param {Object} idea
   * @param {boolean} [unasked] - He raised it himself, while the maker was at work
   * @param {boolean} [settling] - And for a part they keep going back and forth over
   */
  raise(idea, unasked = false, settling = false) {
    const at = performance.now();
    this.idea = { idea, stage: "idea", before: null, round: 0, unasked, settling, at };
    this.follows = [];
    this.onDid("idea");
  }

  /** His ideas for the desk as it stands, less those already waved off */
  ideas(state) {
    const loop = this.loopEngine.buffer;
    return ideasFor({
      steps: state.steps,
      smp: state.smp,
      hasLoop: Boolean(loop) && state.smp.slices.length > 0,
      // As the loop is played now: slid, or its chops dealt again, it is not as he heard it
      heard: this.heardIn === loop ? heardAsPlayed(this.heard, state.smp) : null,
      vox: this.voxEngine?.hasTake() ? state.vox : null,
      sounding: this.sounding,
      bpm: state.transport.bpm,
      drumsBpm: this.drumsBpm,
      swing: state.humanizeValue,
      mode: state.grooveSettings.hihatMode,
      switchUp: Boolean(state.grooveSettings.switchUp),
      sounds: TRACK_KEYS.map((key, track) => soundId(key, state.trackSettings[track]?.sound)),
      own: [0, 1, 2, 3].filter((track) => this.ownSound(track)),
      ghosts: Object.fromEntries(
        [1, 2].map((track) => [track, state.trackSettings[track]?.ghostQuantity ?? 0]),
      ),
    })
      .filter((idea) => this.declined.get(idea.id) !== questionOf(idea))
      .filter((idea) => canBeHeard(idea, state));
  }

  /** The word he is answering with, while it lasts */
  wordNow() {
    return this.word && performance.now() < this.wordUntil ? this.word : null;
  }

  /** @param {string} word - "cool", "bet" or "none"; @param {string} [says] - His words, where they are the idea's own */
  answer(word, says = null) {
    this.word = word;
    this.wordSays = says;
    this.wordUntil = performance.now() + WORD_SECONDS * 1000;
    clearTimeout(this.wordTimer);
    this.wordTimer = setTimeout(() => this.check(), WORD_SECONDS * 1000 + 30);
  }

  /** Hear the loop without saying so */
  async hearQuietly() {
    const loop = this.loopEngine.buffer;
    this.hearing = true;
    // Once for a loop, heard or not
    this.triedFor = loop;
    const as = this.span();
    try {
      const heard = await this.jobs.run("hear", this.whatToHear());
      if (loop === this.loopEngine.buffer && !this.heard) {
        this.heard = heard;
        this.heardAs = as;
      }
    } catch {
      // Nothing heard: his ideas go by the pads alone
    }
    this.hearing = false;
    // His ideas may go by the loop now
    this.check();
  }

  /** Hear where the voice sounds in the bar, off the page's thread */
  async hearVoice(voice) {
    try {
      const sounding = await this.jobs.run("sounding", {
        mono: this.voxEngine.mono,
        sampleRate: voice.sampleRate,
        bars: this.store.getState().vox.bars,
      });
      if (voice === this.voxEngine.buffer) this.sounding = sounding;
    } catch {
      // Not heard: his ideas for the voice go by its timing alone
    }
    this.check();
  }

  /** TRY IT, or ANOTHER: his idea goes on the desk, with how it stood kept to put back */
  tryIdea() {
    if (!this.idea) return;
    // An idea is tried by ear: a stopped beat is started, and stopped again if the idea is not kept
    if (!this.store.getState().transport.isPlaying) {
      this.idea.startedPlay = true;
      this.act(() => document.querySelector("#play-btn")?.click());
      // Whatever starting the beat made of the desk, the idea is still the one being tried
      if (!this.idea) return;
    }
    const { idea } = this.idea;
    const state = this.store.getState();
    this.onDid("idea_tried");
    this.idea.before ??= {
      steps: state.steps,
      smp: state.smp,
      vox: state.vox,
      humanizeValue: state.humanizeValue,
      grooveSettings: state.grooveSettings,
      trackSettings: state.trackSettings,
    };
    this.idea.stage = "trying";
    // An idea with more than one go has the next each time it is tried
    const turn = idea.rounds ? idea.rounds[this.idea.round % idea.rounds.length] : idea;
    this.idea.round += 1;
    // What he says of this go, where it has words of its own
    this.idea.trying = turn.trying ?? null;
    // A go that is its own pads has them; one that is a feel only leaves the idea's pads as tried
    const pads = turn.on || turn.off ? turn : idea;
    this.act(() => {
      if (pads.on || pads.off) {
        // Another go's pads take the place of the last go's, on the desk as it stood
        if (pads === turn && this.idea.round > 1) {
          this.store.dispatch({
            type: "PUT_BACK",
            payload: { steps: this.idea.before.steps, smp: this.store.getState().smp },
          });
        }
        this.store.dispatch({
          type: "TRY_PADS",
          payload: { on: pads.on, off: pads.off, arts: pads.arts },
        });
      }
      if (turn.feel) {
        this.store.dispatch({ type: "SET_HUMANIZE", payload: turn.feel.swing });
        if (turn.feel.mode)
          this.store.dispatch({ type: "SET_HIHAT_MODE", payload: turn.feel.mode });
      }
      // His sounds go on the rows still on the desk's own: a sound the maker picked or loaded stays
      for (const [track, sound] of Object.entries(turn.sounds ?? {})) {
        if (!this.soundIsHis(Number(track))) continue;
        this.store.dispatch({
          type: "SET_TRACK_SOUND",
          payload: { track: Number(track), sound },
        });
      }
      if (turn.switchUp !== undefined) {
        this.store.dispatch({ type: "SET_SWITCH_UP", payload: turn.switchUp });
      }
      for (const [track, value] of Object.entries(turn.ghost ?? {})) {
        this.store.dispatch({
          type: "SET_TRACK_GHOST_QUANTITY",
          payload: { track: Number(track), value },
        });
      }
      for (const { lane, key, value } of idea.set ?? []) {
        this.store.dispatch({ lane, type: "SET_VOX_SETTING", payload: { key, value } });
      }
      if (idea.shuffle) this.loopEngine.shuffleChops();
    });
    this.check();
  }

  /**
   * Whether a row's sound is his to change: not on a file of the maker's, not one they put
   * another sound on while his are on trial, and on the desk's first sound as the idea found
   * it unless the idea is for the sounds themselves.
   */
  soundIsHis(track) {
    if (this.ownSound(track) || this.idea.theirs?.has(track)) return false;
    if (this.idea.idea.overPicks) return true;
    const key = TRACK_KEYS[track];
    const was = this.idea.before.trackSettings[track]?.sound;
    return soundId(key, was) === soundsFor(key)[0];
  }

  /** NAH and PUT IT BACK ("cool"), or KEEP IT ("bet") */
  answerIdea(word) {
    if (!this.idea) return;
    const { idea, stage, before, startedPlay, unasked } = this.idea;
    this.idea = null;
    // Two of his own answered, and he sits back so the beat can be heard (ADR-0086). One
    // the maker tapped him for is theirs, and counts for nothing
    if (unasked || idea.opens) {
      this.answered += 1;
      if (this.answered >= IDEAS_TO_REST) {
        this.answered = 0;
        this.restFrom = performance.now();
      }
    }
    // The quiet starts over, so the next idea waits its turn
    this.touched = performance.now();
    this.spokeAt = this.touched;
    // Not kept: a beat the try started stops again, and stopped he says no more until the desk is touched
    if (word !== "bet") this.stopAgain(startedPlay);
    // He answers the choice made about this idea: kept, put back after a try, or waved off unheard
    const replies = repliesFor(idea.id);
    this.answer(
      word,
      word === "bet" ? replies.kept : stage === "trying" ? replies.back : replies.nah,
    );
    if (word === "bet") {
      this.nahs = 0;
      this.follows = followsOn(idea.id);
      this.onDid("idea_kept");
      this.act(() => this.store.dispatch({ type: keepAs(idea) }));
    } else {
      this.declined.set(idea.id, questionOf(idea));
      this.nahs += 1;
      if (stage === "trying") {
        this.act(() => this.store.dispatch({ type: "PUT_BACK", payload: before }));
      }
    }
    this.check();
  }

  loopThoughtSeen() {
    try {
      return localStorage.getItem(LOOP_THOUGHT_SEEN) === "1";
    } catch {
      return true; // storage is blocked: don't say it on every visit
    }
  }

  /** The thought of a loop goes at the next press anywhere, and is not thought again */
  onPressElsewhere() {
    document.removeEventListener("pointerdown", this.onPressElsewhere, true);
    try {
      localStorage.setItem(LOOP_THOUGHT_SEEN, "1");
    } catch {
      // Nothing can be kept: it goes for this visit
    }
    this.check();
  }

  /** Put his thought in the bubble, or put the bubble away */
  say(said) {
    // He can be tapped at any time, from the first moment and whatever he is saying
    const him = this.him();
    for (const each of [this.avatar, this.logo]) {
      each?.classList.toggle("is-pressable", each === him);
    }
    // His takes, his ideas and his offer are drawn again each time: their words go by the desk
    const drawnOnce = !["takes", "idea", "trying", "offer"].includes(said);
    if (said === this.said && drawnOnce) return;
    this.said = said;
    this.avatar.classList.toggle("is-listening", said === "listening");
    this.box.hidden = said === null || !him;
    this.box.classList.toggle("is-from-logo", him !== null && him === this.logo);
    this.box.classList.toggle("is-trying", said === "trying");
    this.title?.classList.toggle("is-speaking", !this.box.hidden && him === this.logo);
    if (said === null) return;

    this.box.replaceChildren();
    if (said === "takes") {
      const which = document.createElement("span");
      which.className = "which";
      which.textContent = `take ${this.index + 1}`;
      // Back from his first take is back to the drums as they stood
      const back =
        this.index === this.run.from
          ? this.key("putback", "put it back", BACK)
          : this.key("back", "last one", BACK);
      this.box.append(
        which,
        back,
        this.key("next", "switch it up", SHUFFLE),
        this.key("keep", "keep it"),
      );
    } else if (said === "offer") {
      const drums = Object.values(this.store.getState().steps).some((step) => step.active);
      this.box.append(this.key("ask", drums ? WORDS.offerFit : WORDS.offer));
    } else if (said === "idea" || said === "trying") {
      const words = document.createElement("span");
      words.className = "words";
      words.textContent =
        said === "idea"
          ? this.idea.idea.says
          : (this.idea.trying ?? repliesFor(this.idea.idea.id).trying);
      this.box.append(words);
      if (said === "idea") {
        this.box.append(this.key("try", "try it"), this.key("nah", "nah"));
      } else {
        this.box.append(this.key("ideakeep", "keep it"));
        if (this.idea.idea.shuffle || this.idea.idea.rounds)
          this.box.append(this.key("another", "another", SHUFFLE));
        this.box.append(this.key("putback", "put it back", BACK));
      }
    } else {
      const words = document.createElement("span");
      words.className = "words";
      // An answer about an idea is in that idea's words; anything else is his usual line
      words.textContent = (said === this.word && this.wordSays) || WORDS[said];
      this.box.append(words);
    }
    if (said === "loop") document.addEventListener("pointerdown", this.onPressElsewhere, true);
    this.place();
  }

  key(name, words, icon = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.key = name;
    button.className = `is-${name}`;
    // The drawings are this file's own; the words are set as text
    button.innerHTML = icon;
    button.append(words);
    return button;
  }

  /** Whichever of him is on the desk: the character, or the head in the logo */
  him() {
    const shown = (each) => Boolean(each) && each.getBoundingClientRect().width > 0;
    return shown(this.avatar) ? this.avatar : shown(this.logo) ? this.logo : null;
  }

  /** The bubble sits beside his head, its trail rising from the crown */
  place() {
    if (this.box.hidden) return;
    if (this.him() === this.logo) {
      // From the logo he speaks to the right, where the wordmark was
      const head = this.logo.getBoundingClientRect();
      this.box.style.right = "";
      const left = head.right + 26;
      this.box.style.left = `${left}px`;
      // It ends short of whatever stands to the right of him, and wraps its keys under its words to do so
      const edge = [".prop-cassette", "#crate"]
        .map((prop) => document.querySelector(prop)?.getBoundingClientRect())
        .filter((prop) => prop && prop.width > 0 && prop.left > left && prop.top < head.bottom)
        .reduce((nearest, prop) => Math.min(nearest, prop.left), window.innerWidth);
      this.box.style.maxWidth = `${edge - left - 10}px`;
      // On his level, and never off the top of the window
      const middle = head.top + head.height / 2;
      this.box.style.top = `${middle}px`;
      this.box.style.top = `${Math.max(middle, this.box.offsetHeight / 2 + 4)}px`;
      return;
    }
    const him = this.avatar.getBoundingClientRect();
    this.box.style.left = "";
    this.box.style.maxWidth = "";
    this.box.style.right = `${window.innerWidth - (him.left + him.width / 2 - 64)}px`;
    this.box.style.top = `${him.top + him.height * 0.42}px`;
  }

  /** How much of the loop is the take, and how many bars it is said to be: what a hearing is of */
  span() {
    const seconds = this.loopEngine.takeSeconds ?? this.loopEngine.buffer?.duration ?? 0;
    return `${this.store.getState().smp.bars}:${seconds}`;
  }

  /** The take itself for the worker: no more of the file than is played */
  whatToHear() {
    const { buffer, mono, takeSeconds } = this.loopEngine;
    const end = Math.round((takeSeconds ?? buffer.duration) * buffer.sampleRate);
    return {
      mono: end > 0 && end < mono.length ? mono.subarray(0, end) : mono,
      sampleRate: buffer.sampleRate,
      bars: this.store.getState().smp.bars,
    };
  }

  /** He listens to the loop, once for each loop, and plays his first take */
  async listen() {
    if (this.listening) return;
    if (!this.heard) {
      this.listening = true;
      this.check();
      const loop = this.loopEngine.buffer;
      const as = this.span();
      try {
        this.heard = await this.jobs.run("hear", this.whatToHear());
        this.heardAs = as;
      } catch {
        this.heard = null;
      }
      this.listening = false;
      // The loop was changed while he listened, or there was nothing to hear
      if (loop !== this.loopEngine.buffer || !this.heard) return this.check();
    }
    this.index = 0;
    this.startRun();
    // His takes are tried by ear, as his ideas are: a stopped beat is started
    if (!this.store.getState().transport.isPlaying) {
      this.run.startedPlay = true;
      this.act(() => document.querySelector("#play-btn")?.click());
    }
    this.play();
  }

  /** A run of takes starts: the tempo it is brought at, and the desk as it stands, to put back */
  startRun() {
    const state = this.store.getState();
    this.run = {
      // The tempo it is brought at, and the take it starts from
      bpm: state.transport.bpm,
      from: this.index,
      // The loop as it was played then: a run stays the same run if the loop is slid under it
      heard: heardAsPlayed(this.heard, state.smp),
      // The drums and the feel as they stood, and each pad the maker changes while it is up
      stood: {
        steps: state.steps,
        humanizeValue: state.humanizeValue,
        grooveSettings: state.grooveSettings,
        trackSettings: state.trackSettings,
      },
      makers: new Map(),
      // His takes started the beat, to be heard: put back, it stops again
      startedPlay: false,
    };
    // His takes are whole beats: the maker's drums stand aside for the run, and come back if it is put back
    this.act(() => this.store.dispatch({ type: "STAND_ASIDE" }));
  }

  /** His takes are taken off: the drums and the feel as they stood, with any pad the maker lit since */
  putBackTakes() {
    if (!this.run) return;
    const run = this.run;
    this.run = null;
    // He does not offer again for this loop; a tap on him brings his takes back
    this.doneFor = this.loopEngine.buffer;
    this.keptSteps = null;
    this.touched = performance.now();
    this.spokeAt = this.touched;
    this.stopAgain(run.startedPlay);
    this.answer("cool", "your drums are back.");
    this.standAgain(run);
    this.check();
  }

  /** The drums and the feel as they stood before his takes, with the pads the maker changed since */
  standAgain(run) {
    const payload = this.stoodWith(run, this.store.getState());
    this.act(() => this.store.dispatch({ type: "PUT_BACK", payload }));
  }

  stoodWith({ stood, makers }, state) {
    const steps = { ...stood.steps };
    // Each as the maker left it, whatever his later takes did with that pad
    for (const [id, step] of makers) steps[id] = step;
    return { ...stood, steps, smp: state.smp };
  }

  /**
   * The desk as PUT IT BACK would leave it (ADR-0073): what a saved beat is made of.
   * Nothing of his on trial goes into a save; kept, it is the maker's and does.
   * @param {Object} state - The store's
   * @returns {Object} The same, where nothing of his is on trial
   */
  standing(state) {
    const payload =
      this.idea?.stage === "trying"
        ? this.idea.before
        : this.run && hasPencil(state.steps)
          ? this.stoodWith(this.run, state)
          : null;
    return payload ? this.store.reducer(state, { type: "PUT_BACK", payload }) : state;
  }

  /** An idea on trial comes off a desk whose loop has changed under it: all but the loop's row as it stood */
  takeOff(trial) {
    const state = this.store.getState();
    this.act(() => {
      this.store.dispatch({
        type: "PUT_BACK",
        payload: { ...trial.before, smp: state.smp, vox: state.vox },
      });
      // The rows keep their settings from one take to the next: what he set on them goes back too
      for (const { lane, key } of trial.idea.set ?? []) {
        const value = trial.before[lane][key];
        this.store.dispatch({ lane, type: "SET_VOX_SETTING", payload: { key, value } });
      }
    });
  }

  /** Whether this maker has ever tapped him: one who has needs no telling */
  tappedBefore() {
    try {
      return localStorage.getItem(TAPPED_HIM) === "1";
    } catch {
      return false; // storage is blocked: he says it once a visit
    }
  }

  pressed() {
    this.hintOver = true;
    try {
      localStorage.setItem(TAPPED_HIM, "1");
    } catch {
      // storage is blocked: hintOver holds for this visit
    }
    if (this.said === "takes") return this.step(1);
    // Tapped over an idea not yet answered: his next one, where he has another. It is not a no
    if (this.idea?.stage === "idea" && !this.listening) {
      const ideas = this.ideas(this.store.getState());
      const at = ideas.findIndex((idea) => idea.id === this.idea.idea.id);
      if (ideas.length > 1) this.raise(ideas[(at + 1) % ideas.length]);
      return this.check();
    }
    if (this.idea || this.listening) return;
    const kept = this.heard && this.doneFor === this.loopEngine.buffer;
    // His kept take, untouched since: he said to tap him to switch it out, so he does
    if (kept && this.store.getState().steps === this.keptSteps) return this.switchOut();
    // Tapped while quiet: his best idea for the desk as it stands
    this.nahs = 0;
    // A beat to start from is his to offer whenever he is asked
    this.declined.delete("start");
    // And another kick, however often it was put back
    this.declined.delete("kick-switch");
    const idea = ideaDue(this.ideas(this.store.getState()), {
      quietBars: 0,
      nahs: 0,
      tapped: true,
    });
    if (idea) {
      this.raise(idea);
      return this.check();
    }
    // None: a take kept for this loop is switched out all the same
    if (kept) return this.switchOut();
    this.answer("none");
    this.check();
  }

  /** The kept take gives way to the next, and he picks up where he left off */
  switchOut() {
    this.doneFor = null;
    this.keptUntil = 0;
    this.index += 1;
    this.startRun();
    this.play();
  }

  /** Go to the next of his takes, or the one before */
  step(by) {
    if (this.said !== "takes") return;
    this.index = Math.max(this.run.from, this.index + by);
    this.play();
  }

  play() {
    // Going through his takes is the maker at work: the quiet starts over
    this.touched = performance.now();
    // A take that falls wholly on pads the maker has lit shows nothing: the next that shows is played
    for (let tries = 0; tries < TAKES_TO_FIND_ROOM; tries++) {
      // The tempo his takes were brought at: a run of takes stays the same run if the tempo is changed under it
      const take = takeAt(this.run.heard, this.run.bpm, this.index);
      this.act(() =>
        this.store.dispatch({
          type: "PLAY_ALONG",
          payload: {
            pads: takePads(take),
            arts: takeArts(take),
            mode: take.mode,
            swing: take.swing,
            ghost: take.ghost,
          },
        }),
      );
      if (hasPencil(this.store.getState().steps)) return this.check();
      // Passed over at the start of a run, the run starts at the next
      if (this.index === this.run.from) this.run.from += 1;
      this.index += 1;
    }
    // None does: the desk is full of the maker's own, and stands as it stood
    const run = this.run;
    this.run = null;
    this.doneFor = this.loopEngine.buffer;
    this.keptSteps = null;
    this.stopAgain(run.startedPlay);
    this.answer("none", "no room for me in there.");
    this.standAgain(run);
    this.check();
  }

  keep() {
    this.doneFor = this.loopEngine.buffer;
    this.run = null;
    this.keptUntil = performance.now() + KEPT_SECONDS * 1000;
    clearTimeout(this.keptTimer);
    this.keptTimer = setTimeout(() => this.check(), KEPT_SECONDS * 1000 + 30);
    this.touched = performance.now();
    this.spokeAt = this.touched;
    this.onDid("take_kept");
    this.act(() => this.store.dispatch({ type: "KEEP_TAKE" }));
    // The drums as he left them: while they stand, a press on him is the switch he promised
    this.keptSteps = this.store.getState().steps;
    this.check();
  }
}
