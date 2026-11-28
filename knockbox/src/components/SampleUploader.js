import { swingLock } from "../core/Locks.js";
import { soundId, soundLabel, soundPrefix, soundsFor, stepSound } from "../core/Sounds.js";
import { nextItem } from "./BounceMenu.js";
import { readDrumFile } from "./DrumFile.js";
import { Toast } from "./Toast.js";

export const TRACK_TO_SAMPLE_KEY = {
  0: "kick",
  1: "snare",
  2: "hihat-closed",
  3: "hihat-open",
};

const TRACK_LABELS = {
  0: "KICK",
  1: "SNARE",
  2: "HI-HAT",
  3: "OPEN HH",
};

// Track if styles have been injected (shared across instances)
let stylesInjected = false;

/** What the readout says for a sound that never was a file: a beatboxed hit */
const MIC_SOUND = "mic.wav";

/**
 * SampleUploader
 * What a drum row plays, and the ways to change it (ADR-0049). On the row's
 * name plate a lit readout names the sound as a sampler names a file, with a
 * pair of keys beside it to step to the next built-in sound or the last, each
 * step heard. Pressing the readout slides out the list: the row's built-in
 * sounds, the maker's own if there is one, and a line to upload another. A
 * file dropped on the row does the same as that line.
 */
export class SampleUploader {
  /**
   * @param {AudioContext} audioCtx
   * @param {AudioEngine} audioEngine
   * @param {number} track
   * @param {string} domElement - Selector of the row
   * @param {Object} [parts]
   * @param {Store} [parts.store] - Where each row's built-in sound is kept
   * @param {(track: number) => void} [parts.onHear] - Sound the row once, as its key does
   */
  constructor(audioCtx, audioEngine, track, domElement, { store = null, onHear = () => {} } = {}) {
    this.audioCtx = audioCtx;
    this.audioEngine = audioEngine;
    this.store = store;
    this.onHear = onHear;
    this.containerElement = document.querySelector(domElement);
    this.track = track;
    this.sampleKey = TRACK_TO_SAMPLE_KEY[track];
    this.trackLabel = TRACK_LABELS[track];
    this.init();
  }

  init() {
    this.injectStyles();
    this.createOverlay();
    this.createFileInput();
    this.createPicker();
    this.setupDropZone();
    this.render();
  }

  injectStyles() {
    if (stylesInjected) return;
    stylesInjected = true;

    const style = document.createElement("style");
    style.textContent = `
      .sample-drop-zone {
        position: relative;
      }

      .sample-drop-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(30, 30, 35, 0.92);
        border: 2px solid #ff6a00;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.15s ease;
        z-index: 10;
        backdrop-filter: blur(2px);
      }

      .sample-drop-zone.drag-over .sample-drop-overlay {
        opacity: 1;
      }

      .sample-drop-overlay-text {
        color: #ffffff;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
      }

      .sample-drop-overlay-track {
        color: #ff6a00;
        font-size: 11px;
        font-weight: 700;
        margin-top: 6px;
      }

      /* Progressive disclosure - hide controls during drag */
      .sample-drop-zone.drag-over .ms-keys,
      .sample-drop-zone.drag-over .track-dial-container,
      .sample-drop-zone.drag-over .mini-dial-wrapper {
        opacity: 0;
        transition: opacity 0.15s ease;
      }

      /* Subtle border animation on drag-over */
      .sample-drop-zone.drag-over .sample-drop-overlay {
        animation: dropzone-glow 1.2s ease-in-out infinite;
      }

      @keyframes dropzone-glow {
        0%, 100% {
          border-color: #ff6a00;
          box-shadow: 0 0 12px rgba(255, 106, 0, 0.3);
        }
        50% {
          border-color: #ff8533;
          box-shadow: 0 0 20px rgba(255, 106, 0, 0.5);
        }
      }

      /* Success flash animation */
      .sample-drop-zone.drop-success {
        animation: drop-success-flash 0.4s ease-out;
      }

      @keyframes drop-success-flash {
        0% { box-shadow: inset 0 0 0 3px #22c55e; }
        100% { box-shadow: inset 0 0 0 0px transparent; }
      }
    `;
    document.head.appendChild(style);
  }

  createOverlay() {
    const overlay = document.createElement("div");
    overlay.className = "sample-drop-overlay";
    overlay.innerHTML = `
      <span class="sample-drop-overlay-text">Drop to replace</span>
      <span class="sample-drop-overlay-track">${this.trackLabel}</span>
    `;
    this.containerElement.appendChild(overlay);
  }

  createFileInput() {
    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = "audio/*";
    this.fileInput.className = "sample-file-input";
    this.fileInput.hidden = true;
    this.fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleFile(file);
      }
      // Reset input so same file can be selected again
      this.fileInput.value = "";
    });
    this.containerElement.appendChild(this.fileInput);
  }

  /** Is the row on a sound of the maker's own (loaded, dropped or beatboxed)? */
  get own() {
    return this.audioEngine.hasCustomSample(this.sampleKey);
  }

  /** The built-in sound the row is on, or goes back to */
  get sound() {
    return soundId(this.sampleKey, this.store?.getState().trackSettings[this.track]?.sound);
  }

  /** The name of the maker's own sound, as its file had it */
  get ownName() {
    return this.audioEngine.customFiles[this.sampleKey]?.name ?? MIC_SOUND;
  }

  /**
   * The name plate: the row's name over a pair of step keys and the readout.
   * Below the largest desk the name is put away and the readout carries it.
   */
  createPicker() {
    const trackName = this.containerElement.querySelector(".track-name");
    if (!trackName) return;
    const make = (tag, className) => {
      const made = document.createElement(tag);
      made.className = className;
      if (tag === "button") made.type = "button";
      return made;
    };

    const container = make("div", "track-name-container sound-plate");
    container.dataset.tooltip = `Drop an audio file here to replace the ${this.trackLabel} sample`;

    const steps = make("span", "sound-steps");
    for (const [by, word] of [
      [-1, "Previous"],
      [1, "Next"],
    ]) {
      const key = make("button", by > 0 ? "sound-step is-next" : "sound-step");
      key.setAttribute("aria-label", `${word} ${this.trackLabel} sound`);
      key.dataset.tooltip = `${word} ${this.trackLabel} sound`;
      key.addEventListener("click", (e) => {
        e.stopPropagation();
        this.pick(stepSound(this.sampleKey, this.own ? null : this.sound, by));
      });
      steps.appendChild(key);
    }

    this.readout = make("button", "sound-readout");
    this.readout.setAttribute("aria-haspopup", "menu");
    this.readout.setAttribute("aria-expanded", "false");
    this.readout.dataset.tooltip = `Choose a ${this.trackLabel} sound, or upload your own`;
    const prefix = make("span", "sound-row");
    prefix.textContent = soundPrefix(this.sampleKey);
    this.fileName = make("span", "sound-file");
    this.readout.append(prefix, this.fileName);
    this.readout.addEventListener("click", (e) => {
      e.stopPropagation();
      this.setOpen(this.menu.hidden);
    });

    const pick = make("div", "sound-pick");
    pick.append(steps, this.readout);

    // The row lock is a line in the list now (ADR-0053): a padlock here says it is on
    this.lockMark = make("span", "plate-lock");
    this.lockMark.setAttribute("aria-hidden", "true");
    this.lockMark.innerHTML =
      '<svg viewBox="0 0 10 10"><path d="M2.5 4.5h5v4h-5zM3.6 4.5V3.2a1.4 1.4 0 0 1 2.8 0v1.3" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>';

    this.menu = make("div", this.track > 1 ? "sound-menu is-up" : "sound-menu");
    this.menu.setAttribute("role", "menu");
    this.menu.setAttribute("aria-label", `${this.trackLabel} sound`);
    this.menu.hidden = true;

    trackName.parentNode.insertBefore(container, trackName);
    container.append(trackName, pick, this.lockMark);
    container.parentNode.appendChild(this.menu);

    document.addEventListener("pointerdown", (e) => {
      if (!this.menu.hidden && !this.menu.contains(e.target) && !this.readout.contains(e.target)) {
        this.setOpen(false);
      }
    });
    this.menu.addEventListener("keydown", (e) => {
      const lines = [...this.menu.querySelectorAll("button")];
      const to = nextItem(e.key, lines.indexOf(document.activeElement), lines.length);
      if (e.key === "Escape" || e.key === "Tab") {
        this.setOpen(false);
        this.readout.focus({ preventScroll: true });
      } else if (to !== null) lines[to].focus({ preventScroll: true });
      else return;
      e.preventDefault();
      // Not one of the desk's own keys while the list is out
      e.stopPropagation();
    });

    // Anything that changes a row's sound says so: the store, or this event
    this.store?.subscribe(() => {
      this.updateReadout();
      this.updateLock();
    });
    window.addEventListener("sample-replaced", () => this.updateReadout());
    this.updateReadout();
    this.updateLock();
  }

  /** Whether the row is held on the grid, by the maker or by LIVE mode */
  get lock() {
    return this.store
      ? swingLock(this.store.getState(), this.track)
      : { locked: false, held: false };
  }

  updateLock() {
    this.lockMark.hidden = !this.lock.locked;
  }

  updateReadout() {
    const said = this.own ? this.ownName : soundLabel(this.sampleKey, this.sound);
    if (
      said === this.fileName.textContent &&
      this.readout.classList.contains("is-own") === this.own
    )
      return;
    this.fileName.textContent = said;
    this.readout.classList.toggle("is-own", this.own);
    this.readout.setAttribute("aria-label", `${this.trackLabel} sound: ${said}. Choose another`);
    if (!this.menu.hidden) this.fillMenu();
  }

  /** The list as it stands: the built-in sounds, the maker's own if any, and the way to add one */
  fillMenu() {
    const line = (className, role, text, checked, act) => {
      const made = document.createElement("button");
      made.type = "button";
      made.className = className;
      made.setAttribute("role", role);
      if (checked !== null) made.setAttribute("aria-checked", String(checked));
      made.textContent = text;
      made.addEventListener("click", (e) => {
        e.stopPropagation();
        this.setOpen(false);
        this.readout.focus({ preventScroll: true });
        act();
      });
      return made;
    };
    const lines = soundsFor(this.sampleKey).map((id) =>
      line(
        "sound-line",
        "menuitemradio",
        soundLabel(this.sampleKey, id),
        !this.own && id === this.sound,
        () => this.pick(id),
      ),
    );
    if (this.audioEngine.hasCustomBuffer(this.sampleKey)) {
      lines.push(
        line("sound-line is-own", "menuitemradio", this.ownName, this.own, () => this.useOwn()),
      );
    }
    lines.push(
      line("sound-line is-upload", "menuitem", "Upload sample\u2026", null, () =>
        this.fileInput.click(),
      ),
    );
    // Last, the row lock: ticked while the row is held on the grid. LIVE holds the kick itself
    const { locked, held } = this.lock;
    const lockLine = line(
      "sound-line is-lock",
      "menuitemcheckbox",
      held ? "Lock swing (held by LIVE)" : "Lock swing",
      locked,
      () => held || this.store?.dispatch({ type: "TOGGLE_TRACK_SWING_LOCK", payload: this.track }),
    );
    if (held) lockLine.setAttribute("aria-disabled", "true");
    lines.push(lockLine);
    this.menu.replaceChildren(...lines);
  }

  setOpen(open) {
    if (open) this.fillMenu();
    this.menu.hidden = !open;
    this.readout.setAttribute("aria-expanded", String(open));
    this.containerElement.classList.toggle("is-choosing", open);
    if (!open) return;
    const on = this.menu.querySelector('[aria-checked="true"]') ?? this.menu.firstElementChild;
    on.focus({ preventScroll: true });
  }

  /** Put a built-in sound on the row and sound it once */
  pick(id) {
    this.audioEngine.useCustomSample(this.sampleKey, false);
    this.store?.dispatch({ type: "SET_TRACK_SOUND", payload: { track: this.track, sound: id } });
    window.dispatchEvent(new CustomEvent("sample-replaced"));
    this.onHear(this.track);
  }

  /** Back to the maker's own sound, which was kept */
  useOwn() {
    this.audioEngine.useCustomSample(this.sampleKey, true);
    window.dispatchEvent(new CustomEvent("sample-replaced"));
    this.onHear(this.track);
  }

  async handleFile(file) {
    if (!file.type.startsWith("audio")) {
      Toast.show("Please select an audio file", "error");
      return;
    }

    try {
      // A long piece is turned away to the loop row; of a short one a pad's worth is kept
      const read = await readDrumFile(file, this.audioCtx);
      if (read.refusal) {
        Toast.show(read.refusal, "warning");
        return;
      }

      this.audioEngine.replaceSample(read.audio, this.sampleKey, read.kept);

      // Notify listeners that a sample was replaced
      window.dispatchEvent(
        new CustomEvent("sample-replaced", {
          detail: { sampleKey: this.sampleKey, filename: file.name },
        }),
      );

      // Success flash animation
      this.containerElement.classList.add("drop-success");
      setTimeout(() => this.containerElement.classList.remove("drop-success"), 400);

      Toast.show(
        read.cut ? "Loaded. Its first 4 seconds are kept: all a pad can sound" : "Loaded",
        "success",
      );
    } catch (error) {
      console.error("Failed to load sample:", error);
      Toast.show("Could not decode audio file", "error");
    }
  }

  render() {}

  setupDropZone() {
    const dropZone = this.containerElement;
    this.dragover(dropZone);
    this.dragleave(dropZone);
    this.drop(dropZone);
  }

  dragover(elem) {
    elem.addEventListener("dragover", (e) => {
      e.preventDefault();
      elem.classList.add("drag-over");
    });
  }

  dragleave(elem) {
    elem.addEventListener("dragleave", (e) => {
      // Only remove if we're actually leaving the element (not entering a child)
      if (!elem.contains(e.relatedTarget)) {
        elem.classList.remove("drag-over");
      }
    });
  }

  drop(elem) {
    elem.addEventListener("drop", async (e) => {
      e.preventDefault();
      elem.classList.remove("drag-over");

      const files = e.dataTransfer.files;
      if (files.length === 0) return;

      this.handleFile(files[0]);
    });
  }
}
