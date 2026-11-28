import { NUM_STEPS, NUM_TRACKS } from "../constants/drums.js";
import { HEARD_KEYS, showHeard } from "./HeardKeys.js";
import { MiniDial } from "./MiniDial.js";

const TRACK_NAMES = ["KICK", "SNARE", "HI-HAT", "OPEN HH"];
const TRACK_COLORS = ["#ff7a2b", "#ffb46e", "#fef3e2", "#fde047"];

export class Grid {
  constructor(store, targetDOMElem) {
    this.store = store;
    this.state = store.getState();
    this.rootElem = targetDOMElem;
    this.previousSteps = null;
    this.stepElements = {};
    this.miniDials = [];
    this.lastPlayheadStep = -1;
  }

  init() {
    const htmlRootElem = document.querySelector(this.rootElem);
    this.rootElem = htmlRootElem;

    this.rootElem.addEventListener("click", (e) => {
      // Handle step toggle
      // With a NOTE REPEAT key armed, a tap paints that articulation instead
      if (e.target.classList.contains("step")) {
        const armedArt = this.store.getState().armedArt;
        this.store.dispatch(
          armedArt
            ? { type: "PAINT_ART", payload: { id: e.target.id, art: armedArt } }
            : { type: "TOGGLE", payload: e.target.id },
        );
        return;
      }

      // Mute and solo, where the row lock was (ADR-0053)
      const heardKey = e.target.closest(".ms-key");
      if (heardKey) {
        const track = Number(heardKey.closest(".track-row").dataset.track);
        this.store.dispatch(
          heardKey.dataset.ms === "mute"
            ? { type: "TOGGLE_TRACK_MUTE", payload: track }
            : { type: "TOGGLE_SOLO", payload: track },
        );
      }
    });

    this.initialRender(this.state);
    this.subscribe();
  }

  subscribe() {
    this.store.subscribeToSelector(
      (state) => state.steps,
      (newSteps) => this.updateSteps(newSteps),
    );

    // A mute is in a row's settings, a solo beside them: either changes which rows are heard
    this.store.subscribeToSelector(
      (state) => state.trackSettings,
      () => this.updateHeard(),
    );
    this.store.subscribeToSelector(
      (state) => state.solo,
      () => this.updateHeard(),
    );
  }

  /** Light each row's mute and solo keys, and grey the rows that are not heard */
  updateHeard() {
    const state = this.store.getState();
    for (const row of this.rootElem.querySelectorAll(".track-row[data-track]")) {
      showHeard(row, state, Number(row.dataset.track));
    }
  }

  updatePlayhead(currentStepIndex) {
    if (currentStepIndex === this.lastPlayheadStep) return;

    if (this.lastPlayheadStep !== -1) {
      for (let i = 0; i < NUM_TRACKS; i++) {
        const elem = this.stepElements[`track-${i}_${this.lastPlayheadStep}`];
        if (elem) elem.classList.remove("playing");
      }
    }

    for (let i = 0; i < NUM_TRACKS; i++) {
      const elem = this.stepElements[`track-${i}_${currentStepIndex}`];
      if (elem) elem.classList.add("playing");
    }

    this.lastPlayheadStep = currentStepIndex;
  }

  /**
   * Show the pads the drummer is adding notes on in the bar being played (ADR-0079):
   * faint, in his pencil, and gone when the bar is. They are not pads of the pattern.
   * @param {string[]} ids - Pad ids; none to clear them
   */
  showTurn(ids) {
    const next = ids.join(" ");
    if (next === this.turnShown) return;
    for (const id of (this.turnShown ?? "").split(" ")) {
      this.stepElements[id]?.classList.remove("is-turn-note");
    }
    for (const id of ids) this.stepElements[id]?.classList.add("is-turn-note");
    this.turnShown = next;
  }

  /**
   * Initial render - creates track rows with controls and steps
   */
  initialRender(state) {
    let rowsHtml = "";

    for (let track = 0; track < NUM_TRACKS; track++) {
      // Generate step buttons for this track
      let stepsHtml = "";
      for (let step = 0; step < NUM_STEPS; step++) {
        const stepId = `track-${track}_${step}`;
        const isActive = state.steps[stepId]?.active ? "active" : "";
        // Beat marker on every 4th step (downbeats) — CSS renders a small dot
        const beatClass = step % 4 === 0 ? "beat" : "";
        // data-art drives the moulded notches that show a flam, drag or roll
        const art = state.steps[stepId]?.art || "";
        stepsHtml += `<div class="step ${isActive} ${beatClass}" id="${stepId}" data-art="${art}" data-tooltip="Toggle this step on or off"></div>`;
      }

      rowsHtml += `
        <div class="track-row sample-drop-zone" data-track="${track}" style="--track-color: ${TRACK_COLORS[track]}">
          <div class="track-info">
            <span class="track-name">${TRACK_NAMES[track]}</span>
          </div>
          ${HEARD_KEYS}
          <div class="track-dial-container" data-track="${track}"></div>
          <div class="track-steps">
            ${stepsHtml}
          </div>
        </div>
      `;
    }

    this.rootElem.innerHTML = rowsHtml;
    this.updateHeard();

    // Cache step element references
    for (let track = 0; track < NUM_TRACKS; track++) {
      for (let step = 0; step < NUM_STEPS; step++) {
        const stepId = `track-${track}_${step}`;
        this.stepElements[stepId] = document.getElementById(stepId);
      }
    }

    // Initialize mini dials for each track
    this.miniDials = [];
    for (let track = 0; track < NUM_TRACKS; track++) {
      const dialContainer = this.rootElem.querySelector(
        `.track-dial-container[data-track="${track}"]`,
      );
      if (dialContainer) {
        const miniDial = new MiniDial({
          store: this.store,
          track: track,
          container: dialContainer,
          label: "Ghost",
        });
        this.miniDials.push(miniDial);
      }
    }

    this.previousSteps = state.steps;
  }

  /**
   * Diff-based update - only updates changed steps
   */
  updateSteps(newSteps) {
    if (!this.previousSteps) {
      return;
    }

    Object.keys(newSteps).forEach((stepId) => {
      const newStep = newSteps[stepId];
      const oldStep = this.previousSteps[stepId];

      if (
        oldStep &&
        (newStep.active !== oldStep.active ||
          newStep.art !== oldStep.art ||
          newStep.pencil !== oldStep.pencil)
      ) {
        const elem = this.stepElements[stepId];
        if (elem) {
          elem.classList.toggle("active", newStep.active);
          // The drummer's pads are in pencil until they are kept or their row is touched
          elem.classList.toggle("is-pencil", Boolean(newStep.active && newStep.pencil));
          elem.dataset.art = newStep.art || "";
        }
      }
    });

    this.previousSteps = newSteps;
  }
}
