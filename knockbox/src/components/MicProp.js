import { NUM_STEPS } from "../constants/drums.js";
import { mapBeatbox, VOICE_TRACK } from "../core/BeatboxMapper.js";
import { takeRefusal } from "../core/Caps.js";
import { keepFile } from "../core/FileUtils.js";
import { detectOnsets, peakLevel, SILENCE_PEAK } from "../core/OnsetDetector.js";
import { mixToMono } from "../core/VoxEngine.js";
import { mediaSeconds } from "./DrumFile.js";
import { Toast } from "./Toast.js";

// Bars recorded per take in each mode; dropped vocals set their own length
const RECORD_BARS = { vocal: 2, beatbox: 1 };

// What went wrong opening the mic, by getUserMedia error name
const MIC_ERRORS = {
  NotAllowedError: "Mic blocked — allow it from the address bar, then tap again",
  NotFoundError: "No microphone found — plug one in, or drop a file on the mic",
  NotReadableError: "Another app is using the microphone",
};

// Some systems hand over audio files with no MIME type
const AUDIO_FILE_NAME = /\.(wav|mp3|m4a|aac|ogg|flac|aiff?)$/i;

// A beatboxed hit cut out as a pad sample: its level, and the fade at its end
const HIT_PEAK = 0.9;
const HIT_FADE_SECONDS = 0.01;
const VOICE_NAMES = { kick: "kick", snare: "snare", hat: "hat", openhat: "open hat" };

// A file that decodes in an instant still shows its row reading for this long (ms)
const MIN_LOADING_MS = 500;
// Where the chosen input is remembered between visits
const INPUT_PREFS_KEY = "knockbox-mic-input";
const INPUT_NAME_MAX = 16;
const CHANNEL_CHOICES = [
  { value: "mix", label: "1+2" },
  { value: 0, label: "1" },
  { value: 1, label: "2" },
];

const IDLE_TAG = "● TAP TO RECORD";
const IDLE_HINTS = {
  vocal: "or load / drop a loop",
  beatbox: "mouth, claps, taps → drums",
};

/**
 * MicProp Component
 * The desk microphone is the way in for voice. Tap it to record over the
 * loop (after a one-bar count-in), or drop an audio file on it. The label
 * beside it picks what happens to the take:
 *   VOCAL   – the VoxEngine slices it and drops it into the pocket
 *   BEATBOX – each hit goes on the kick, snare or hat row by how it sounds,
 *             on the step it was performed, and the pads play your sounds
 *
 * States: idle → arming (waiting for mic permission) → waiting (for the
 * loop to come round) → countin → recording → idle.
 */
export class MicProp {
  /**
   * @param {Object} options
   * @param {Store} options.store
   * @param {AudioContext} options.audioCtx
   * @param {VoxEngine} options.voxEngine - The VOX lane: takes recorded on the mic
   * @param {VoxEngine} options.loopEngine - The SMP lane: loops loaded or dropped as files
   * @param {VoxRecorder} options.recorder
   * @param {string} options.selector - The mic prop element
   * @param {Function} options.startPlayback - Starts the transport if it is stopped
   * @param {Function} options.setDrumSample - `(track, AudioBuffer)`: put a sound on a drum row
   * @param {Function} options.setPadsMuted - `(muted)`: silence the drum pattern while a beatbox take is made
   * @param {Function} options.playClick - `(time, accent)`: metronome click
   * @param {Function} options.onStatus - `(text|null)`: status for the LCD, null when done
   */
  constructor({
    store,
    audioCtx,
    voxEngine,
    loopEngine,
    recorder,
    selector,
    startPlayback,
    setDrumSample,
    setPadsMuted,
    playClick,
    onStatus,
  }) {
    this.store = store;
    this.audioCtx = audioCtx;
    this.voxEngine = voxEngine;
    this.loopEngine = loopEngine;
    this.recorder = recorder;
    this.root = document.querySelector(selector);
    this.startPlayback = startPlayback;
    this.setDrumSample = setDrumSample;
    this.setPadsMuted = setPadsMuted;
    this.playClick = playClick;
    this.onStatus = onStatus;

    this.state = "idle";
    this.recordBars = RECORD_BARS.vocal;
    this.recordStartStep = -1;
    this.hasWarnedHeadphones = false;
    this.menuOpen = false;
  }

  init() {
    this.button = this.root.querySelector(".mic-btn");
    this.tagEl = this.root.querySelector(".mic-tag-text");
    this.hintEl = this.root.querySelector(".mic-tag-hint");
    this.eraseBtn = this.root.querySelector(".mic-erase");
    this.meterEl = this.root.querySelector(".mic-meter-fill");
    this.recorder.onLevel = (peak) => this.setLevel(peak);
    this.initInputs();

    this.button.addEventListener("click", () => {
      // Tapping again while it records finishes the take; before that it backs out
      if (this.state === "idle") this.record();
      else if (this.state === "recording") this.stop();
      else if (this.state !== "thinking") this.cancel();
    });

    // VOCAL / BEATBOX label
    const modeKeys = [...this.root.querySelectorAll(".mic-mode-btn")];
    for (const key of modeKeys) {
      key.addEventListener("click", () => {
        if (this.state !== "idle") return;
        this.store.dispatch({
          type: "SET_VOX_SETTING",
          payload: { key: "mode", value: key.dataset.mode },
        });
      });
    }
    this.store.subscribeToSelector(
      (s) => s.vox.mode,
      (mode) => {
        for (const key of modeKeys) key.classList.toggle("active", key.dataset.mode === mode);
        if (this.state === "idle") this.setState("idle");
      },
    );
    this.eraseBtn.addEventListener("click", () => {
      if (this.voxEngine.hasTake()) {
        this.voxEngine.clear();
        Toast.show("Voice take erased", "info");
      } else if (this.voxEngine.restore()) Toast.show("Voice take is back", "success");
    });

    this.root.querySelector(".mic-load-btn").addEventListener("click", () => this.pickFile());

    // Dropping a file on the mic loads it as the take
    this.root.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.root.classList.add("drag-over");
    });
    this.root.addEventListener("dragleave", () => this.root.classList.remove("drag-over"));
    this.root.addEventListener("drop", (e) => {
      e.preventDefault();
      this.root.classList.remove("drag-over");
      const file = e.dataTransfer?.files?.[0];
      if (file) this.loadFile(file);
    });

    this.store.subscribeToSelector(
      (s) => s.vox.slices.length > 0,
      (hasTake) => this.root.classList.toggle("has-take", hasTake),
    );
    // After an erase the same label offers the take back
    this.store.subscribeToSelector(
      (s) => s.vox.erased,
      (erased) => {
        this.root.classList.toggle("can-restore", erased);
        this.eraseBtn.textContent = erased ? "↺ bring take back" : "✕ erase take";
        this.eraseBtn.dataset.tooltip = erased
          ? "Undo: put the erased voice take back on the loop"
          : "Erase the voice take";
      },
    );
    this.setState("idle");
  }

  getMode() {
    return this.store.getState().vox.mode;
  }

  setState(state, tag = IDLE_TAG, hint = IDLE_HINTS[this.getMode()]) {
    this.state = state;
    this.root.dataset.state = state;
    this.tagEl.textContent = tag;
    this.hintEl.textContent = hint;
  }

  async record() {
    // The mic API only exists on https or localhost; say which one is the problem
    if (!window.isSecureContext) {
      Toast.show("The mic needs https or localhost — this page is on plain http", "error");
      this.setState("idle", "MIC NEEDS HTTPS", "dropping a file still works");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || !this.audioCtx.audioWorklet) {
      Toast.show("This browser can't record — drop an audio file on the mic", "error");
      return;
    }

    this.hideInputMenu();
    // Start the loop now, while this is still the user's tap: the audio
    // context can only be woken from a gesture, and the permission prompt
    // that follows may outlast it
    this.startPlayback();
    this.setState("arming", "ALLOW THE MIC…", "check the browser prompt");
    try {
      await this.recorder.arm();
    } catch (error) {
      console.error("Couldn't open the microphone:", error);
      this.recorder.release();
      this.setState("idle");
      Toast.show(MIC_ERRORS[error?.name] || "Couldn't start the microphone", "error");
      return;
    }
    // Cancelled while the permission prompt was up
    if (this.state !== "arming") {
      this.recorder.release();
      return;
    }
    this.noteInput();

    if (!this.hasWarnedHeadphones) {
      this.hasWarnedHeadphones = true;
      Toast.show("Headphones on — the mic hears the speakers too", "info");
    }
    this.recordBars = RECORD_BARS[this.getMode()];
    if (this.getMode() === "beatbox") {
      // A beatbox take replaces the pattern, so the old one is not played
      // under it: from here on there is only the click to keep time by
      this.setPadsMuted(true);
      this.voxEngine.suspended = true;
      this.loopEngine.suspended = true;
    } else if (this.loopEngine.hasTake()) {
      // Singing over a loaded loop: the take runs as long as the loop does
      this.recordBars = Math.max(this.recordBars, this.loopEngine.lane().bars);
    }
    this.setState("waiting", "GET READY…", "count-in on the next bar");
    this.onStatus("VOX ARMED");
  }

  // ---- Inputs: which mic or interface, which of its inputs, and monitoring ----

  initInputs() {
    this.inputBtn = this.root.querySelector(".mic-input-btn");
    this.monBtn = this.root.querySelector(".mic-mon-btn");
    this.menuEl = this.root.querySelector(".mic-input-menu");

    try {
      const saved = JSON.parse(localStorage.getItem(INPUT_PREFS_KEY));
      if (saved) {
        this.recorder.deviceId = saved.deviceId ?? null;
        this.recorder.channel = saved.channel ?? "mix";
        this.inputName = saved.name;
      }
    } catch {
      // nothing saved, or storage is blocked: the system default is used
    }
    this.updateInputKey();

    this.inputBtn.addEventListener("click", () => {
      if (this.menuOpen) this.closeInputMenu();
      else this.openInputMenu();
    });
    this.monBtn.addEventListener("click", () => this.toggleMonitor());
    this.menuEl.addEventListener("click", (e) => {
      const item = e.target.closest("[data-device]");
      const channel = e.target.closest("[data-channel]");
      if (item) this.chooseInput(item.dataset.device);
      else if (channel) this.chooseChannel(channel.dataset.channel);
    });
    document.addEventListener("pointerdown", (e) => {
      if (this.menuOpen && !e.target.closest(".mic-io")) this.closeInputMenu();
    });
    document.addEventListener("keydown", (e) => {
      if (this.menuOpen && e.key === "Escape") this.closeInputMenu();
    });
    // An interface plugged in or pulled out while the list is up
    navigator.mediaDevices?.addEventListener?.("devicechange", () => {
      if (this.menuOpen) this.renderInputMenu();
    });
  }

  /** Open the mic (the browser only names the inputs once it is allowed) and list them */
  async openInputMenu() {
    if (this.state !== "idle") return;
    if (!(await this.openMic())) return;
    this.menuOpen = true;
    this.root.classList.add("is-listening");
    await this.renderInputMenu();
    this.menuEl.hidden = false;
    this.inputBtn.setAttribute("aria-expanded", "true");
  }

  closeInputMenu() {
    this.hideInputMenu();
    this.settleMic();
  }

  hideInputMenu() {
    this.menuOpen = false;
    this.root.classList.toggle("is-listening", this.recorder.monitoring);
    this.menuEl.hidden = true;
    this.inputBtn.setAttribute("aria-expanded", "false");
  }

  /** @returns {Promise<boolean>} False if the mic could not be opened */
  async openMic() {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      Toast.show("The mic needs https or localhost, and a browser that can record", "error");
      return false;
    }
    try {
      await this.audioCtx.resume();
      await this.recorder.open();
    } catch (error) {
      console.error("Couldn't open the microphone:", error);
      Toast.show(MIC_ERRORS[error?.name] || "Couldn't start the microphone", "error");
      return false;
    }
    this.noteInput();
    return true;
  }

  /** Say so if the chosen input was missing, and name the one that is open */
  async noteInput() {
    const fellBack = this.recorder.fellBack;
    this.recorder.fellBack = false;
    if (fellBack) Toast.show("That input isn't connected — using the default mic", "warning");
    const inputs = await this.recorder.listInputs();
    const openId = this.recorder.getOpenDeviceId();
    const open = inputs.find((input) => input.deviceId === (this.recorder.deviceId ?? openId));
    if (open) this.inputName = shortInputName(open.label);
    this.updateInputKey();
    if (fellBack) this.saveInput(null);
  }

  /** Hand the mic back if nothing is listening to it any more */
  settleMic() {
    const listening = this.menuOpen || this.recorder.monitoring;
    this.root.classList.toggle("is-listening", listening);
    if (listening || this.state !== "idle") return;
    this.recorder.close();
    this.setLevel(0);
  }

  async renderInputMenu() {
    const inputs = await this.recorder.listInputs();
    const chosen = this.recorder.deviceId ?? this.recorder.getOpenDeviceId();
    this.menuEl.replaceChildren();

    const head = document.createElement("p");
    head.className = "mic-menu-head";
    head.textContent = "Input select";
    this.menuEl.append(head);

    for (const input of inputs) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "mic-menu-item";
      item.dataset.device = input.deviceId;
      item.setAttribute("aria-pressed", String(input.deviceId === chosen));
      // The system's pick is listed again under its own name
      item.textContent =
        input.deviceId === "default" ? "System default" : cleanInputName(input.label);
      this.menuEl.append(item);
    }

    // An interface with two inputs: record one of them, or both together
    if (this.recorder.getChannelCount() >= 2) {
      const row = document.createElement("div");
      row.className = "mic-menu-channels";
      row.append("Ch");
      for (const choice of CHANNEL_CHOICES) {
        const key = document.createElement("button");
        key.type = "button";
        key.dataset.channel = choice.value;
        key.setAttribute("aria-pressed", String(choice.value === this.recorder.channel));
        key.textContent = choice.label;
        row.append(key);
      }
      this.menuEl.append(row);
    }
  }

  async chooseInput(deviceId) {
    try {
      await this.recorder.setInput(deviceId);
    } catch (error) {
      console.error("Couldn't switch input:", error);
      Toast.show(MIC_ERRORS[error?.name] || "Couldn't open that input", "error");
      return;
    }
    // Another device may not have a second input
    if (this.recorder.getChannelCount() < 2) this.recorder.setChannel("mix");
    await this.noteInput();
    this.saveInput(deviceId);
    await this.renderInputMenu();
  }

  chooseChannel(value) {
    this.recorder.setChannel(value === "mix" ? "mix" : Number(value));
    this.saveInput(this.recorder.deviceId);
    this.renderInputMenu();
  }

  saveInput(deviceId) {
    try {
      localStorage.setItem(
        INPUT_PREFS_KEY,
        JSON.stringify({ deviceId, channel: this.recorder.channel, name: this.inputName }),
      );
    } catch {
      // storage is blocked: the choice lasts for this visit only
    }
  }

  updateInputKey() {
    this.inputBtn.textContent = this.inputName ? `In: ${this.inputName} ▾` : "Input ▾";
  }

  async toggleMonitor() {
    const on = !this.recorder.monitoring;
    if (on) {
      if (!(await this.openMic())) return;
      if (!this.hasWarnedHeadphones) {
        this.hasWarnedHeadphones = true;
        Toast.show("Monitoring on — headphones, or the mic hears the speakers", "info");
      }
    }
    this.recorder.setMonitor(on);
    this.monBtn.setAttribute("aria-pressed", String(on));
    this.settleMic();
  }

  /**
   * Called on every clock tick; drives the count-in and the take.
   * @param {number} step - Step in the bar (0-15)
   * @param {number} time - AudioContext time of that step
   * @param {number} totalSteps - Steps since the clock started
   */
  onTick(step, time, totalSteps) {
    const loopSteps = this.recordBars * NUM_STEPS;

    if (this.state === "waiting") {
      // Count in on the last bar of the loop, so the take starts on its first
      if (step !== 0 || (totalSteps + NUM_STEPS) % loopSteps !== 0) return;

      this.recordBpm = this.store.getState().transport.bpm;
      const stepDuration = 60 / this.recordBpm / 4;
      const barSeconds = stepDuration * NUM_STEPS;
      this.recordStartStep = totalSteps + NUM_STEPS;
      this.voxEngine.suspended = true;
      this.recorder
        .capture(time + barSeconds, this.recordBars * barSeconds)
        .then(
          (buffer) => this.finish(buffer),
          () => {}, // cancelled
        )
        .catch((error) => {
          console.error("Couldn't process the take:", error);
          this.setState("idle");
          this.onStatus(null);
          Toast.show("Something went wrong with that take — see the console", "error");
        });
      this.state = "countin";
    }

    // The take is cut to the bar lengths of the tempo it was counted in at;
    // at another tempo it would no longer line up with the loop
    const taking = this.state === "countin" || this.state === "recording";
    if (taking && this.store.getState().transport.bpm !== this.recordBpm) {
      this.cancel();
      Toast.show("Tempo changed mid-take — tap the mic to go again", "info");
      return;
    }

    if (this.state === "countin" && totalSteps >= this.recordStartStep) this.state = "recording";

    if (step % 4 !== 0) return;
    const bar = Math.floor((totalSteps - this.recordStartStep) / NUM_STEPS) + 1;
    // Click on every beat of the count-in. A vocal take then has the beat
    // itself to sing over; a beatbox take has nothing else, so its click
    // runs from the moment the mic is ready to the end of the take.
    const clicking =
      this.state === "countin" ||
      (this.getMode() === "beatbox" &&
        (this.state === "waiting" || (this.state === "recording" && bar <= this.recordBars)));
    if (clicking) this.playClick(time, step === 0);

    if (this.state === "countin") {
      const beat = 4 - step / 4;
      this.setState("countin", `COUNT-IN · ${beat}`, "come in on the one");
      this.onStatus(`COUNT ${beat}`);
    } else if (this.state === "recording") {
      if (bar > this.recordBars) return; // capture is finishing up
      this.setState("recording", `● REC · BAR ${bar}/${this.recordBars}`, "tap to finish early");
      this.onStatus(`REC ${bar}/${this.recordBars}`);
    }
  }

  async finish(buffer) {
    const device = this.recorder.getDeviceLabel();
    const latencyMs = Math.round(this.recorder.getRoundTripLatency() * 1000);
    this.recorder.release();
    this.voxEngine.suspended = false;
    this.loopEngine.suspended = false;
    this.setPadsMuted(false);
    this.setLevel(0);
    this.setState("idle");
    this.onStatus(null);

    const peak = peakLevel(mixToMono(buffer));
    const peakDb = peak > 0 ? Math.round(20 * Math.log10(peak)) : -Infinity;
    console.info(
      `[vox] take: ${buffer.duration.toFixed(2)} s from "${device}", peak ${peakDb} dBFS, latency compensated ${latencyMs} ms`,
    );

    // The browser can hand over a stream that is pure silence: the wrong
    // input chosen, a muted interface, or the OS withholding the mic
    if (peak < SILENCE_PEAK) {
      this.setState("idle", "NO SIGNAL", "check which mic is selected");
      Toast.show(
        `No sound came from "${device}". Pick the right input from the mic icon in the address bar, and check it isn't muted in System Settings › Sound.`,
        "error",
      );
      return;
    }

    if (this.getMode() === "beatbox") {
      await this.beatbox(buffer);
      return;
    }

    const sliceCount = await this.voxEngine.loadTake(buffer, this.recordBars);
    if (sliceCount === 0) {
      this.setState("idle", "TOO QUIET", `peaked at ${peakDb} dB — get closer`);
      Toast.show(
        `That take peaked at ${peakDb} dB, too quiet to use. Get closer to the mic or raise its input level.`,
        "warning",
      );
    } else {
      Toast.show(`Take sliced into ${sliceCount} hits and dropped in the pocket`, "success");
    }
  }

  /** Input meter on the tape label: shows the mic is really being heard */
  setLevel(peak) {
    // -60 dBFS .. 0 dBFS across the width of the bar
    const db = peak > 0 ? 20 * Math.log10(peak) : -60;
    this.meterEl.style.transform = `scaleX(${Math.max(0, Math.min(1, (db + 60) / 60))})`;
  }

  /**
   * Wrap up now (a second tap on the mic, or the transport stopping). If it
   * is recording, what was performed so far is kept as the take; if it
   * hasn't started yet, there is nothing to keep.
   */
  stop() {
    if (this.state === "recording" && this.recorder.stopCapture()) return;
    this.cancel();
  }

  /** Abandon a take in progress and discard it */
  cancel() {
    if (this.state === "idle") return;
    this.recorder.release();
    this.voxEngine.suspended = false;
    this.loopEngine.suspended = false;
    this.setPadsMuted(false);
    this.setLevel(0);
    this.setState("idle");
    this.onStatus(null);
  }

  /** Record the voice take again, asked for from its row: a vocal, whatever the mic was last set to */
  retake() {
    if (this.state !== "idle") return;
    this.store.dispatch({ type: "SET_VOX_SETTING", payload: { key: "mode", value: "vocal" } });
    this.record();
  }

  /** Open the file picker for a loop to put on the sample row */
  pickFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*,.wav,.mp3,.m4a,.aac,.ogg,.flac,.aif,.aiff";
    input.addEventListener("change", () => {
      if (input.files[0]) this.loadFile(input.files[0], { asLoop: true });
    });
    input.click();
  }

  /**
   * Load an audio file as the take.
   * @param {File} file - Anything the browser can decode (WAV, MP3, AAC, ...)
   * @param {Object} [options]
   * @param {boolean} [options.asLoop] - Put it on the sample row whatever the
   *   mic's mode (otherwise BEATBOX mode turns it into a drum pattern)
   * @param {string} [options.from] - The record and loop it is, where it is a built-in one (ADR-0088)
   */
  async loadFile(file, { asLoop = false, from = null } = {}) {
    if (!file.type.startsWith("audio") && !AUDIO_FILE_NAME.test(file.name)) {
      Toast.show("Please drop an audio file", "error");
      return;
    }
    // Too long or too heavy is said before the file is read, not after it has filled the tab
    const early = takeRefusal({ bytes: file.size, seconds: await mediaSeconds(file) });
    if (early) {
      Toast.show(early, "warning");
      return;
    }
    this.cancel();

    // The sample row comes up at once, reading, so the wait is not a blank one
    const toRow = asLoop || this.getMode() !== "beatbox";
    const setLoading = (value) =>
      this.store.dispatch({
        lane: this.loopEngine.laneKey,
        type: "SET_VOX_SETTING",
        payload: { key: "loading", value },
      });
    if (toRow) setLoading(file.name);
    this.setState("idle", "READING…", file.name);

    try {
      let kept = null;
      const [buffer] = await Promise.all([
        file.arrayBuffer().then((bytes) => {
          kept = keepFile(file, bytes);
          return this.audioCtx.decodeAudioData(bytes);
        }),
        new Promise((resolve) => setTimeout(resolve, MIN_LOADING_MS)),
      ]);
      // Where the browser couldn't say how long it was until it was read
      const late = takeRefusal({ seconds: buffer.duration });
      if (late) {
        Toast.show(late, "warning");
        return;
      }
      if (this.getMode() === "beatbox" && !asLoop) {
        await this.beatbox(buffer);
        return;
      }

      const sliceCount = await this.loopEngine.loadTake(buffer);
      if (sliceCount === 0) {
        Toast.show("Couldn't find any hits in that file", "warning");
        return;
      }
      this.loopEngine.file = from ? { ...kept, record: from } : kept;
      const { bars, takeBpm } = this.loopEngine.lane();
      const length = `${bars} bar${bars > 1 ? "s" : ""}`;
      Toast.show(
        this.loopEngine.fitted
          ? `${file.name}: ${length} at ${Math.round(takeBpm)} BPM, ${sliceCount} chops`
          : `${file.name}: not loop-length, so its first ${length} are read at the session tempo`,
        "success",
      );
    } catch (error) {
      console.error("Failed to load voice take:", error);
      Toast.show("Couldn't read that audio file", "error");
    } finally {
      if (toRow) setLoading(null);
      if (this.state === "idle") this.setState("idle");
    }
  }

  /**
   * Beatbox mode: write a take (its first bar) onto the pads. Every hit goes
   * to the row its sound belongs to, on the step it was performed, and the
   * loudest hit of each kind becomes that row's sample — so the pattern
   * plays back in your own sounds, in the pocket like any other pad.
   */
  async beatbox(buffer) {
    const stepDuration = 60 / this.store.getState().transport.bpm / 4;
    const mono = mixToMono(buffer);
    // The hits are found off the page's thread where there is a worker for it
    const heard = await this.voxEngine.hear(buffer, 1);
    const onsets = heard?.onsets ?? detectOnsets(mono, buffer.sampleRate);
    const hits = mapBeatbox(mono, buffer.sampleRate, onsets).filter(
      (hit) => hit.time / stepDuration < NUM_STEPS - 0.5,
    );
    if (hits.length === 0) {
      Toast.show("Didn't hear a rhythm in that — try again a bit louder", "warning");
      return;
    }

    const pads = new Set(
      hits.map((hit) => {
        const step = Math.round(hit.time / stepDuration) % NUM_STEPS;
        return `track-${VOICE_TRACK[hit.voice]}_${step}`;
      }),
    );
    this.store.dispatch({ type: "SET_PATTERN", payload: [...pads] });

    const counts = [];
    for (const [voice, track] of Object.entries(VOICE_TRACK)) {
      const ofVoice = hits.filter((hit) => hit.voice === voice);
      if (ofVoice.length === 0) continue;
      const loudest = ofVoice.reduce((best, hit) => (hit.peak > best.peak ? hit : best));
      this.setDrumSample(track, this.cutHit(mono, buffer.sampleRate, loudest));
      counts.push(`${ofVoice.length} ${VOICE_NAMES[voice]}${ofVoice.length > 1 ? "s" : ""}`);
    }
    Toast.show(
      `${counts.join(", ")} — on the pads in your own sounds. The switch on each row flips it back to the kit sound.`,
      "success",
    );
  }

  /** One hit of a take as a sample of its own: brought up to level, faded at the end */
  cutHit(mono, sampleRate, hit) {
    const from = Math.round(hit.start * sampleRate);
    const length = Math.max(1, Math.round(hit.end * sampleRate) - from);
    const fade = Math.min(length, Math.round(HIT_FADE_SECONDS * sampleRate));
    const sample = this.audioCtx.createBuffer(1, length, sampleRate);
    const data = sample.getChannelData(0);
    const gain = hit.peak > 0 ? HIT_PEAK / hit.peak : 1;
    for (let i = 0; i < length; i++) {
      data[i] = mono[from + i] * gain * Math.min(1, (length - i) / fade);
    }
    return sample;
  }
}

/** A device name without the system's prefixes and hardware ids */
function cleanInputName(label) {
  return label
    .replace(/^Default - /, "")
    .replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)/i, "")
    .trim();
}

/** The same, cut down to fit on the INPUT key */
function shortInputName(label) {
  const name = cleanInputName(label).replace(/\s*\((Built-in|Virtual)\)/i, "");
  return name.length > INPUT_NAME_MAX ? `${name.slice(0, INPUT_NAME_MAX - 1)}…` : name;
}
