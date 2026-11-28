import { NUM_STEPS } from "../constants/drums.js";
import { barsSeconds, loopScreenSleeps, putLoopScreenAway } from "../core/LoopScreen.js";
import { loopCredit, loopOf, records, storeOf } from "../core/Records.js";
import { takeLabel } from "../core/Sounds.js";
import { isSecondTap } from "../core/Turn.js";
import {
  CHOP_MODES,
  fitLoop,
  MIN_TRIM_SECONDS,
  stretchRatio,
  VOX_RESOLUTIONS,
} from "../core/VoxEngine.js";
import { HEARD_KEYS, showHeard } from "./HeardKeys.js";
import { MiniDial } from "./MiniDial.js";
import { plateList } from "./PlateList.js";
import { Toast } from "./Toast.js";

const VOX_COLOR = "#e85a2a";
// Bars the beat goes round before a sleeping loop screen wakes
const WAKE_BARS = 4;
// Least gap (px) kept between the sampler and the top of the desk
const STAGE_TOP_MARGIN = 10;
// Room (px) kept between the header and the sampler, for the tag on its lip
const TAG_ROOM = 30;
const FOLLOW_ORDER = ["kick", "snare", "hat"];
const FOLLOW_LABELS = { kick: "K", snare: "S", hat: "H" };
const FOLLOW_NAMES = { kick: "kick (lazy)", snare: "snare (pushed)", hat: "hi-hat" };
const RESOLUTION_ORDER = ["16", "8", "trip"];
const RESOLUTION_LABELS = { 16: "1/16", 8: "1/8", trip: "TRIP" };
const CHOP_LABELS = { auto: "AUTO", beats: "BEATS", bars: "BARS", whole: "WHOLE" };
// What dragging on the screen does is picked on the soft keys: slide, swap or copy
const TOOL_HINTS = {
  swap: "DRAG A CHOP ONTO ANOTHER TO SWAP THEM",
  copy: "DRAG A CHOP ONTO ANOTHER TO REPEAT IT THERE · SHIFT PAINTS",
};
const SCREEN_TOOLTIPS = {
  slide:
    "Drag a marker to move that hit: the audio goes with it and snaps to the grid (hold Shift to place it freely), and the chops either side stretch to fit without changing pitch. Hold Alt while dragging to move only the cut and leave the audio where it is. Double-click to add a marker, or to remove the one under the pointer (Delete does that too); Alt + double-click a moved hit to put it back. Drag the waveform to slide the whole take against the beat (Shift for fine moves). Click a chop to mute it. To rearrange chops, pick SWAP or COPY below.",
  swap: "Swap: drag a chop and drop it on another; the two trade places. Click a chop to mute it.",
  copy: "Copy: drag a chop and drop it on any other zone; it repeats there, and the zones in between are left alone. Hold Shift while dragging to paint it into every zone you pass over. Click a chop to mute it.",
};

// LCD ink, as on the main display
const INK = "31, 41, 19";
// How close (CSS px) the pointer must be to a marker to grab it
const GRAB_PX = 7;
// Height (CSS px) of the strip of numbered chop tabs along the top
const TAB_BAND_PX = 13;
// Pointer travel (CSS px) before a press on a marker counts as a drag
const DRAG_THRESHOLD_PX = 3;
// How close (CSS px) a dragged hit must come to a grid line to jump onto it
const SNAP_PX = 8;
// Trim screen: how close (CSS px) the pointer must be to an end to grab it,
// the least of the file it will zoom in to (seconds), and how much a press
// of a zoom key changes the view
const TRIM_GRAB_PX = 10;
const TRIM_MIN_VIEW_SECONDS = 0.5;
const TRIM_ZOOM_STEP = 2;
const TRIM_TOOLTIP =
  "Trim: the bright part between L and R becomes the loop. Drag either end (they jump to the nearest hit; hold Shift to place them freely), or drag the middle to move both. The lines inside show where the beats will fall. Scroll to move along the file, − and + to zoom. CUT (Enter) keeps it, CANCEL (Esc) leaves the loop as it was.";

/**
 * VoxLane Component
 * A fifth row on the sampler for the voice take, shown once there is one.
 * Instead of pads it has a chop screen, like a sampler's trim page: the
 * take's waveform across the whole loop, with a marker at the start of
 * every slice. A slice plays from its marker to the next one, so two
 * markers close together are a one-hit chop and a long gap is a phrase.
 *
 * The soft keys under the screen pick what dragging on it does:
 *
 *   SLIDE  drag a marker to move that hit: its audio goes with it, snapping
 *          to the grid (Shift = anywhere), and the chops either side stretch
 *          to fit; Alt-drag moves only the cut, over audio that stays put;
 *          double-click to add a marker, or remove the one under the pointer
 *          (Alt: put a moved hit back); drag the waveform to slide the whole
 *          take against the beat (Shift = fine)
 *   SWAP   drag a chop onto another: the two trade places
 *   COPY   drag a chop onto another zone: it repeats there
 *          (Shift = paint it into every zone passed over)
 *
 * Clicking a chop mutes it, whichever key is lit. Dragging a numbered tab
 * swaps (Alt: copies) without changing key.
 *
 * Markers divide the loop into zones, and rearranging leaves the zones
 * alone: that is the rhythm. It only changes which chop is heard in each
 * zone. Chops are numbered in sung order, so a zone playing somebody
 * else's chop shows that chop's number, in red. SUNG puts them all back.
 *
 * TRIM (a loaded file only) turns the screen over to the whole file, with an
 * L and an R end to drag round the part that should be the loop. CUT reads
 * that part as a fresh loop: a whole number of bars, at whatever tempo that
 * makes it, chopped and landed on the session's grid.
 *
 * While a file is being read the row is already up, with its screen saying so.
 *
 * The little flags along the bottom show where each slice actually lands
 * once it has been pulled into the pocket. CHOP re-cuts the take (AUTO at
 * its transients, on every beat, every bar, or left WHOLE); GRID is the note
 * value slices snap to, FOLLOW whose pocket they lean on, TIGHT how hard.
 */
export class VoxLane {
  constructor(store, voxEngine, targetDOMElem) {
    this.store = store;
    this.voxEngine = voxEngine;
    this.rootElem = document.querySelector(targetDOMElem);
    this.hoverMarker = -1;
    this.tool = "slide";
    this.drag = null;
    // Trim screen, while it is up: the ends of the loop, and the part of
    // the file in view (all in seconds into the file)
    this.trim = null;
    this.rafPending = false;
    // The mic, once there is one: a take row's list sends for it (set by main.js)
    this.mic = null;
    // The records built-in loops are kept on, once there are any (set by main.js)
    this.records = null;
    // The loop's screen before there is a loop: asleep, put away, and the wait before it wakes
    this.asleep = false;
    this.putAway = false;
    this.wakeTimer = null;
    this.draw = this.draw.bind(this);
  }

  init() {
    this.render();
    this.setupPointer();
    this.update();

    // The row lives inside the grid's root; keep its taps away from the drum grid
    this.row.addEventListener("click", (e) => {
      e.stopPropagation();
      if (e.target.closest(".vox-sleep")) return void this.mic?.pickFile();
      if (e.target.closest(".vox-sleep-pick")) return void this.records?.open();
      if (e.target.closest(".vox-sleep-off")) {
        putLoopScreenAway();
        this.putAway = true;
        this.update();
        return;
      }
      const tool = e.target.closest("[data-tool]")?.dataset.tool;
      if (tool) {
        // SLIDE pressed while already lit puts the take back to zero
        if (tool === "slide" && this.tool === "slide") this.voxEngine.setOffset(0);
        this.tool = tool;
        this.update();
      } else if (e.target.closest(".vox-follow-btn")) this.cycleSetting("follow", FOLLOW_ORDER);
      else if (e.target.closest('[data-key="shuffle"]')) this.voxEngine.shuffleChops();
      else if (e.target.closest('[data-ms="mute"]')) this.voxEngine.toggleMute();
      else if (e.target.closest('[data-ms="solo"]')) {
        this.store.dispatch({ type: "TOGGLE_SOLO", payload: this.voxEngine.laneKey });
      } else if (e.target.closest('[data-key="bars"]')) this.voxEngine.cycleLoopBars();
      else if (e.target.closest('[data-key="tune"]')) this.voxEngine.toggleTune();
      else if (e.target.closest('[data-key="sung"]')) this.voxEngine.resetOrder();
      else if (e.target.closest('[data-key="trim"]')) this.openTrim();
      else if (e.target.closest('[data-key="trim-cancel"]')) this.closeTrim();
      else if (e.target.closest('[data-key="trim-apply"]')) this.applyTrim();
      else if (e.target.closest('[data-key="zoom-out"]')) this.zoomTrim(TRIM_ZOOM_STEP);
      else if (e.target.closest('[data-key="zoom-in"]')) this.zoomTrim(1 / TRIM_ZOOM_STEP);
      else if (e.target.closest('[data-key="grid"]'))
        this.cycleSetting("resolution", RESOLUTION_ORDER);
      else if (e.target.closest('[data-key="chop"]')) {
        const current = this.voxEngine.lane().chop;
        this.voxEngine.setChop(CHOP_MODES[(CHOP_MODES.indexOf(current) + 1) % CHOP_MODES.length]);
      }
    });

    // Redraw whenever the take, its settings, or the pocket itself changes
    for (const selector of [
      (s) => s[this.voxEngine.laneKey],
      (s) => s.transport.isPlaying,
      // The lane this one is tuned to: its key shows on this row
      (s) => (this.voxEngine.tuneTo ? s[this.voxEngine.tuneTo.laneKey] : null),
      (s) => s.humanizeValue,
      (s) => s.transport.bpm,
      (s) => s.grooveSettings?.hihatMode,
      (s) => s.trackSettings,
      // Another row's solo leaves this one out
      (s) => s.solo,
    ]) {
      this.store.subscribeToSelector(selector, () => this.update());
    }
    new ResizeObserver(() => {
      updateStageLift(this.row.closest(".sampler-stage"));
      this.scheduleDraw();
    }).observe(this.screen);
  }

  render() {
    this.row = document.createElement("div");
    this.row.className = "track-row vox-row";
    this.row.hidden = true;
    this.row.dataset.lane = this.voxEngine.laneKey;
    this.row.style.setProperty("--track-color", VOX_COLOR);
    this.row.innerHTML = `
      <div class="track-info">
        <div class="track-name-container sound-plate">
          <span class="track-name">VOX</span>
          <div class="sound-pick">
            <button class="swing-lock-btn vox-follow-btn" type="button"></button>
            <button class="sound-readout is-own" type="button"><span class="sound-file"></span></button>
          </div>
        </div>
        <div class="sound-menu is-up"></div>
        <div class="vox-fx-keys">
          <label class="vox-dream" data-tooltip="Sauce: slide right to send more of this take into a wide chorus, an echo in time with the beat and a long hall. Tap twice for dry. It is in the bounce too.">
            <span class="vox-dream-label"><svg class="vox-dream-bottle" viewBox="0 0 10 16" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M5 .4 4.1 3.4h1.8zM3 3.6h4v1.7H3zM2.7 5.6h4.6c.9.6 1.3 1.5 1.3 2.7v5.6c0 .9-.7 1.6-1.6 1.6H3c-.9 0-1.6-.7-1.6-1.6V8.3c0-1.2.4-2.1 1.3-2.7zM2.6 9.2v2.7h4.8V9.2z"/></svg>Sauce</span>
            <span class="vox-dream-fill" aria-hidden="true"><span class="vox-dream-label"><svg class="vox-dream-bottle" viewBox="0 0 10 16" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M5 .4 4.1 3.4h1.8zM3 3.6h4v1.7H3zM2.7 5.6h4.6c.9.6 1.3 1.5 1.3 2.7v5.6c0 .9-.7 1.6-1.6 1.6H3c-.9 0-1.6-.7-1.6-1.6V8.3c0-1.2.4-2.1 1.3-2.7zM2.6 9.2v2.7h4.8V9.2z"/></svg>Sauce</span></span>
            <span class="vox-dream-cap" aria-hidden="true"></span>
            <input class="vox-dream-input" type="range" min="0" max="100" step="1" value="0" aria-label="Sauce send">
          </label>
          ${this.voxEngine.tuneTo ? '<button class="vox-tune-btn" type="button" data-key="tune" aria-label="Tune"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M5.2 1.8v5.4a2.8 2.8 0 0 0 5.6 0V1.8M8 10v4.2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>' : ""}
        </div>
      </div>
      ${HEARD_KEYS}
      <div class="track-dial-container"></div>
      <div class="vox-lcd">
        <div class="vox-screen">
          <canvas></canvas>
          <div class="vox-playhead"></div>
          <div class="vox-loading" hidden>
            <span class="vox-loading-text"></span>
            <span class="vox-loading-bar" aria-hidden="true"><i></i></span>
          </div>
        </div>
        <div class="vox-softkeys">
          <span class="vox-readout"></span>
          <div class="vox-tools" role="group" aria-label="What dragging on the screen does">
            <button class="vox-soft" type="button" data-tool="slide" data-tooltip="Slide: drag a marker to move that hit onto the grid, audio and all; the chops either side stretch to fit. Dragging the waveform moves the whole take against the beat (hold Shift for fine moves). Shows how far the take has been slid; press again to put it back to zero."></button>
            <button class="vox-soft" type="button" data-tool="swap" data-tooltip="Swap: drag a chop onto another and the two trade places">SWAP</button>
            <button class="vox-soft" type="button" data-tool="copy" data-tooltip="Copy: drag a chop onto any other zone to repeat it there. Hold Shift to paint it into every zone you drag across.">COPY</button>
          </div>
          <button class="vox-soft" type="button" data-key="sung" data-tooltip="Put the chops back in the order they were sung">SUNG</button>
          <button class="vox-soft" type="button" data-key="shuffle" data-tooltip="Shuffle: deal the chops out across the zones again, one each. The rhythm stays as sung; chops only trade with others of about their own length.">SHUFFLE</button>
          <button class="vox-soft" type="button" data-key="trim" data-tooltip="Trim: pick which part of the file is the loop. Handy for a long file, or one that doesn't start on the one.">TRIM</button>
          <button class="vox-soft vox-trim-only" type="button" data-key="zoom-out" data-tooltip="Zoom out: see more of the file" aria-label="Zoom out">−</button>
          <button class="vox-soft vox-trim-only" type="button" data-key="zoom-in" data-tooltip="Zoom in on the part being trimmed" aria-label="Zoom in">+</button>
          <button class="vox-soft vox-trim-only" type="button" data-key="trim-cancel" data-tooltip="Leave the loop as it was">CANCEL</button>
          <button class="vox-soft vox-trim-only vox-trim-apply" type="button" data-key="trim-apply" data-tooltip="Make the part between L and R the loop">CUT</button>
          <button class="vox-soft" type="button" data-key="bars"></button>
          <button class="vox-soft" type="button" data-key="chop"></button>
          <button class="vox-soft" type="button" data-key="grid"></button>
        </div>
        <button class="vox-sleep" type="button">DROP A LOOP</button>
        <button class="vox-sleep-pick" type="button">PICK A RECORD</button>
        <button class="vox-sleep-off" type="button" aria-label="Put the loop screen away" data-tooltip="Put the loop screen away. The mic's Load key still brings a loop in">×</button>
      </div>
    `;
    this.rootElem.appendChild(this.row);

    this.screen = this.row.querySelector(".vox-screen");
    this.canvas = this.row.querySelector("canvas");
    this.ctx = this.canvas.getContext("2d");
    this.playhead = this.row.querySelector(".vox-playhead");
    this.readout = this.row.querySelector(".vox-readout");
    this.slideKey = this.row.querySelector('[data-tool="slide"]');
    this.toolKeys = [...this.row.querySelectorAll("[data-tool]")];
    this.dreamSlot = this.row.querySelector(".vox-dream");
    this.dreamInput = this.row.querySelector(".vox-dream-input");
    this.dreamInput.addEventListener("input", () =>
      this.voxEngine.setFx(Number(this.dreamInput.value)),
    );
    // Two taps put it back to dry, under a finger as under a mouse (ADR-0050)
    let lastDreamTap = null;
    this.dreamSlot.addEventListener("pointerup", (e) => {
      const tap = { at: e.timeStamp, x: e.clientX, y: e.clientY };
      if (isSecondTap(lastDreamTap, tap)) {
        lastDreamTap = null;
        this.voxEngine.setFx(0);
      } else lastDreamTap = tap;
    });
    this.tuneKey = this.row.querySelector('[data-key="tune"]');
    this.sungKey = this.row.querySelector('[data-key="sung"]');
    this.barsKey = this.row.querySelector('[data-key="bars"]');
    this.trimKey = this.row.querySelector('[data-key="trim"]');
    this.loadingEl = this.row.querySelector(".vox-loading");
    this.loadingText = this.row.querySelector(".vox-loading-text");
    this.nameEl = this.row.querySelector(".track-name");
    // The take's name on a readout, as a drum row names its sound (ADR-0051). Its list
    // holds what the mic would otherwise be gone back to for
    this.takeReadout = this.row.querySelector(".sound-readout");
    this.takeName = this.row.querySelector(".sound-file");
    const isVoice = this.voxEngine.laneKey === "vox";
    this.takeReadout.dataset.tooltip = isVoice
      ? "Your voice take. Press to record it again or erase it."
      : "Your loop. Press to replace it with another file or take it off.";
    plateList({
      row: this.row,
      readout: this.takeReadout,
      menu: this.row.querySelector(".sound-menu"),
      lines: () =>
        isVoice
          ? [
              { text: "Record again", act: () => this.mic?.retake() },
              { text: "Erase take", className: "is-off", act: () => this.erase() },
            ]
          : [
              ...this.fromRecord(),
              { text: "Replace loop\u2026", act: () => this.mic?.pickFile() },
              // A record's loop in its place, where there are records (ADR-0089)
              ...(records().length > 0
                ? [{ text: "Pick a record\u2026", act: () => this.records?.open() }]
                : []),
              { text: "Take it off", className: "is-off", act: () => this.erase() },
            ],
    });
    this.chopKey = this.row.querySelector('[data-key="chop"]');
    this.gridKey = this.row.querySelector('[data-key="grid"]');
    this.followBtn = this.row.querySelector(".vox-follow-btn");

    new MiniDial({
      store: this.store,
      id: `Vox-${this.voxEngine.laneKey}`,
      container: this.row.querySelector(".track-dial-container"),
      label: "Tight",
      tooltip:
        "Tight: 0 keeps your timing as performed, 100 locks every slice into the pocket. Drag up or down; tap twice for 100.",
      resetValue: 100,
      getValue: (state) => state[this.voxEngine.laneKey].tightness,
      onCommit: (value) =>
        this.store.dispatch({
          lane: this.voxEngine.laneKey,
          type: "SET_VOX_SETTING",
          payload: { key: "tightness", value },
        }),
    });
  }

  /** The lines of the loop's list that say which record a built-in loop is from, and whose */
  fromRecord() {
    const found = loopOf(this.voxEngine.file?.record);
    if (!found) return [];
    const store = storeOf(found.record);
    const lines = [{ text: `From ${loopCredit(this.voxEngine.file.record)}` }];
    if (store) {
      lines.push({
        text: `More from ${found.record.by} \u2197`,
        act: () => window.open(store, "_blank", "noopener"),
      });
    }
    return lines;
  }

  cycleSetting(key, order) {
    const current = this.voxEngine.lane()[key];
    const value = order[(order.indexOf(current) + 1) % order.length];
    this.store.dispatch({
      lane: this.voxEngine.laneKey,
      type: "SET_VOX_SETTING",
      payload: { key, value },
    });
  }

  // ---- Pointer: markers, zones and chops ----

  setupPointer() {
    const screen = this.screen;

    screen.addEventListener("pointerdown", (e) => {
      screen.setPointerCapture(e.pointerId);
      if (this.trim) {
        this.startTrimDrag(e);
        return;
      }
      // SWAP / COPY (or a press on a numbered tab): pick up the chop in that
      // zone. Otherwise, on a marker: move it. Anywhere else: slide the take.
      const tab = this.tabAt(e);
      const carry = tab !== -1 ? tab : this.tool === "slide" ? -1 : this.zoneAt(this.timeAt(e));
      this.drag = {
        carry,
        copy: this.tool === "copy" || (this.tool === "slide" && e.altKey),
        targets: [],
        x: 0,
        index: carry === -1 && this.tool === "slide" ? this.markerAt(e) : -1,
        startX: e.clientX,
        startOffset: this.voxEngine.lane().offset,
        moved: false,
        marker: null,
        snapped: false,
        offset: null,
      };
    });

    screen.addEventListener("pointermove", (e) => {
      if (this.trim) {
        this.moveTrimDrag(e);
        return;
      }
      const drag = this.drag;
      if (!drag) {
        const pickUp = this.tool !== "slide" || this.tabAt(e) !== -1;
        const marker = pickUp ? -1 : this.markerAt(e);
        screen.style.cursor = pickUp
          ? this.tool === "copy"
            ? "copy"
            : "move"
          : marker === -1
            ? "grab"
            : "col-resize";
        if (marker !== this.hoverMarker) {
          this.hoverMarker = marker;
          this.scheduleDraw();
        }
        return;
      }

      if (Math.abs(e.clientX - drag.startX) > DRAG_THRESHOLD_PX) drag.moved = true;
      if (!drag.moved) return;

      if (drag.carry !== -1) {
        // Carrying a chop: it lands in the zone under the pointer, wherever
        // that is. Copying with Shift held paints it into every zone passed.
        const zone = this.zoneAt(this.timeAt(e));
        const over = zone === drag.carry ? -1 : zone;
        if (!(drag.copy && e.shiftKey)) drag.targets = over === -1 ? [] : [over];
        else if (over !== -1 && !drag.targets.includes(over)) drag.targets.push(over);
        drag.x = e.clientX - screen.getBoundingClientRect().left;
        this.updateReadout();
      } else if (drag.index !== -1) {
        // The hit goes with its marker, unless Alt is held: then only the cut moves
        const time = this.timeAt(e);
        const snapped = e.altKey || e.shiftKey ? null : this.snapTime(time);
        drag.recut = e.altKey;
        drag.marker = e.altKey
          ? this.voxEngine.recutTarget(drag.index, time)
          : this.voxEngine.warpTarget(drag.index, snapped ?? time);
        drag.snapped = snapped !== null && drag.marker.at === snapped;
        this.updateReadout();
      } else {
        // Shift held: a tenth of the travel, for lining up a transient exactly
        const travel = (e.clientX - drag.startX) * (e.shiftKey ? 0.1 : 1);
        const loopSeconds = this.voxEngine.getTakeLoopSeconds();
        drag.offset = drag.startOffset + (travel / screen.clientWidth) * loopSeconds;
        screen.style.cursor = "grabbing";
        this.updateSlideKey(drag.offset);
      }
      this.scheduleDraw();
    });

    const endDrag = (e) => {
      if (this.trim) {
        // A press on the trim screen is never a click on a chop
        this.suppressClick = this.trim.drag !== null;
        this.trim.drag = null;
        return;
      }
      const drag = this.drag;
      if (!drag) return;
      this.drag = null;

      if (e.type === "pointerup" && drag.moved && drag.targets.length > 0) {
        if (drag.copy) this.voxEngine.copyChop(drag.carry, drag.targets);
        else this.voxEngine.swapChops(drag.carry, drag.targets[0]);
      }
      if (drag.moved && drag.marker) this.voxEngine.moveMarker(drag.index, drag.marker);
      if (drag.moved && drag.offset !== null) this.voxEngine.setOffset(drag.offset);
      // Only a press on a chop that never moved counts as a click on it
      this.suppressClick = drag.moved || drag.index !== -1;
      this.update();
    };
    screen.addEventListener("pointerup", endDrag);
    screen.addEventListener("pointercancel", endDrag);

    // Trim screen: scrolling moves along the file, pinching zooms
    screen.addEventListener(
      "wheel",
      (e) => {
        if (!this.trim) return;
        e.preventDefault();
        if (e.ctrlKey) this.zoomTrim(2 ** (e.deltaY / 100));
        else this.panTrim((e.deltaX || e.deltaY) / screen.clientWidth);
      },
      { passive: false },
    );

    screen.addEventListener("pointerleave", () => {
      if (this.drag || this.hoverMarker === -1) return;
      this.hoverMarker = -1;
      this.scheduleDraw();
    });

    // Click a chop: mute / unmute what plays in that zone
    screen.addEventListener("click", (e) => {
      if (this.suppressClick) {
        this.suppressClick = false;
        return;
      }
      const zone = this.zoneAt(this.timeAt(e));
      if (zone !== -1)
        this.store.dispatch({
          lane: this.voxEngine.laneKey,
          type: "TOGGLE_VOX_SLICES",
          payload: [zone],
        });
    });

    // Double-click: remove the marker under the pointer, or add one here
    screen.addEventListener("dblclick", (e) => {
      if (this.trim || this.tool !== "slide" || this.tabAt(e) !== -1) return;
      const marker = this.markerAt(e);
      if (marker !== -1 && e.altKey) this.voxEngine.resetMarker(marker);
      else if (marker !== -1) this.voxEngine.removeMarker(marker);
      else this.voxEngine.addMarker(this.timeAt(e));
    });
  }

  /**
   * Keys the chop screen answers to: Delete removes the marker under the
   * pointer; on the trim screen, Enter cuts and Esc cancels.
   * @returns {boolean} Whether the key was used
   */
  handleKey(e) {
    if (this.row.hidden || this.asleep || e.repeat) return false;
    if (this.trim) {
      if (e.key === "Enter") this.applyTrim();
      else if (e.key === "Escape") this.closeTrim();
      else return false;
      return true;
    }
    if ((e.key !== "Delete" && e.key !== "Backspace") || this.drag || this.hoverMarker === -1) {
      return false;
    }
    this.voxEngine.removeMarker(this.hoverMarker);
    this.hoverMarker = -1;
    return true;
  }

  // ---- Trim screen: which part of the file is the loop ----

  openTrim() {
    if (!this.voxEngine.canTrim()) return;
    const { start, end } = this.voxEngine.getTrim();
    const total = this.voxEngine.source.duration;
    // Open on the loop with as much again either side of it
    const from = Math.max(0, start - (end - start));
    this.trim = { start, end, from, to: Math.min(total, end + (end - start)), drag: null };
    this.trim.source = this.voxEngine.source;
    this.update();
  }

  closeTrim() {
    this.trim = null;
    this.update();
  }

  async applyTrim() {
    const count = await this.voxEngine.trimHeard(this.trim.start, this.trim.end);
    if (count === 0) {
      Toast.show("Couldn't find any hits in that part of the file", "warning");
      return;
    }
    const { bars, takeBpm } = this.voxEngine.lane();
    const length = `${bars} bar${bars > 1 ? "s" : ""}`;
    Toast.show(
      this.voxEngine.fitted
        ? `Trimmed: ${length} at ${Math.round(takeBpm)} BPM, ${count} chops`
        : `Trimmed, but not loop-length: its first ${length} are read at the session tempo`,
      "success",
    );
    this.closeTrim();
  }

  /** Show more (factor > 1) or less of the file, keeping the loop in the middle */
  zoomTrim(factor) {
    const trim = this.trim;
    const total = trim.source.duration;
    const least = Math.min(total, TRIM_MIN_VIEW_SECONDS);
    const span = Math.max(least, Math.min(total, (trim.to - trim.from) * factor));
    const middle = (trim.start + trim.end) / 2;
    trim.from = Math.max(0, Math.min(total - span, middle - span / 2));
    trim.to = trim.from + span;
    this.scheduleDraw();
  }

  /** Move along the file by a fraction of what is in view */
  panTrim(fraction) {
    const trim = this.trim;
    const span = trim.to - trim.from;
    trim.from = Math.max(0, Math.min(trim.source.duration - span, trim.from + fraction * span));
    trim.to = trim.from + span;
    this.scheduleDraw();
  }

  /** Seconds into the file under a pointer event on the trim screen */
  trimTimeAt(e) {
    const rect = this.screen.getBoundingClientRect();
    const fraction = (e.clientX - rect.left) / rect.width;
    return this.trim.from + fraction * (this.trim.to - this.trim.from);
  }

  /** How many seconds of the file a number of screen pixels covers */
  trimReach(px) {
    return (px / this.screen.clientWidth) * (this.trim.to - this.trim.from);
  }

  /** Which end of the loop a pointer event would take hold of: "start", "end", or "both" */
  trimHandleAt(e) {
    const { start, end } = this.trim;
    const time = this.trimTimeAt(e);
    const reach = this.trimReach(TRIM_GRAB_PX);
    const nearer = Math.abs(time - start) <= Math.abs(time - end) ? "start" : "end";
    if (Math.abs(time - this.trim[nearer]) <= reach) return nearer;
    return time > start && time < end ? "both" : nearer;
  }

  startTrimDrag(e) {
    const handle = this.trimHandleAt(e);
    this.trim.drag = { handle, grab: this.trimTimeAt(e) - this.trim.start };
    // A press away from the loop brings the nearer end to it
    if (handle !== "both") this.moveTrimDrag(e);
  }

  moveTrimDrag(e) {
    const trim = this.trim;
    if (!trim.drag) {
      this.screen.style.cursor = this.trimHandleAt(e) === "both" ? "grab" : "ew-resize";
      return;
    }
    const total = trim.source.duration;
    const length = trim.end - trim.start;
    // Ends jump onto the nearest hit, unless Shift is held
    const snap = (time) => {
      if (e.shiftKey) return time;
      const reach = this.trimReach(SNAP_PX);
      const nearest = this.voxEngine.sourceOnsets.reduce(
        (best, onset) => (Math.abs(onset - time) < Math.abs(best - time) ? onset : best),
        Number.POSITIVE_INFINITY,
      );
      return Math.abs(nearest - time) <= reach ? nearest : time;
    };
    const time = this.trimTimeAt(e);
    if (trim.drag.handle === "start") {
      trim.start = Math.max(0, Math.min(trim.end - MIN_TRIM_SECONDS, snap(time)));
    } else if (trim.drag.handle === "end") {
      trim.end = Math.min(total, Math.max(trim.start + MIN_TRIM_SECONDS, snap(time)));
    } else {
      trim.start = Math.max(0, Math.min(total - length, snap(time - trim.drag.grab)));
      trim.end = trim.start + length;
      this.screen.style.cursor = "grabbing";
    }
    this.updateReadout();
    this.scheduleDraw();
  }

  /** The trim screen: the file, the loop picked out of it, and where its beats would fall */
  drawTrim(ctx, width, height, dpr) {
    const { start, end, from, to } = this.trim;
    const span = to - from;
    const xAt = (time) => Math.round(((time - from) / span) * width);
    const tabBand = TAB_BAND_PX * dpr;
    const mid = tabBand + (height - tabBand) / 2;
    const amp = (height - tabBand) / 2 - dpr;

    // What is left out is washed grey and drawn faint
    ctx.fillStyle = `rgba(${INK}, 0.14)`;
    ctx.fillRect(0, 0, Math.max(0, xAt(start)), height);
    ctx.fillRect(xAt(end), 0, Math.max(0, width - xAt(end)), height);

    const { min, max } = this.voxEngine.getSourcePeaks(from, to, width);
    for (let x = 0; x < width; x++) {
      const time = from + (x / width) * span;
      ctx.fillStyle = `rgba(${INK}, ${time >= start && time < end ? 0.88 : 0.3})`;
      ctx.fillRect(x, mid - max[x] * amp, 1, Math.max(dpr * 0.75, (max[x] - min[x]) * amp));
    }

    // Where the beats would fall if this were cut now: bars heavy, beats light
    const fit = fitLoop(end - start, this.store.getState().transport.bpm);
    if (fit) {
      const beats = fit.bars * 4;
      for (let beat = 1; beat < beats; beat++) {
        ctx.fillStyle = `rgba(${INK}, ${beat % 4 === 0 ? 0.6 : 0.3})`;
        const x = xAt(start + ((end - start) * beat) / beats);
        ctx.fillRect(x, tabBand, Math.max(1, dpr * 0.75), height - tabBand);
      }
    }

    // The two ends, as lettered flags that point into the loop
    ctx.font = `${10 * dpr}px "JetBrains Mono", monospace`;
    ctx.textBaseline = "middle";
    const flag = 11 * dpr;
    for (const [time, letter, side] of [
      [start, "L", 0],
      [end, "R", -1],
    ]) {
      const x = xAt(time);
      ctx.fillStyle = "#b3200a";
      ctx.fillRect(x - dpr, 0, 2 * dpr, height);
      ctx.fillRect(x + side * flag, 0, flag, tabBand - dpr);
      ctx.fillStyle = "#c9e3a8";
      ctx.fillText(letter, x + side * flag + 2.5 * dpr, (tabBand - dpr) / 2 + dpr * 0.5);
    }
  }

  /** The slide in force right now: the one being dragged, else the stored one */
  getOffset() {
    return this.drag?.offset ?? this.voxEngine.lane().offset;
  }

  /** Seconds into the take under a pointer event (the take is slid, and wraps round the loop) */
  timeAt(e) {
    const rect = this.screen.getBoundingClientRect();
    const loopSeconds = this.voxEngine.getTakeLoopSeconds();
    const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    return wrap(fraction * loopSeconds - this.getOffset(), loopSeconds);
  }

  /**
   * The grid line a dragged hit is close enough to jump onto, as seconds
   * into the take, or null. The grid is the one picked on the GRID key.
   */
  snapTime(time) {
    const vox = this.voxEngine.lane();
    const loopSeconds = this.voxEngine.getTakeLoopSeconds();
    const gridSeconds = (60 / vox.takeBpm / 4) * (VOX_RESOLUTIONS[vox.resolution] || 1);
    // Grid lines are fixed to the loop; the take may have been slid under them
    const inLoop = time + this.getOffset();
    const line = Math.round(inLoop / gridSeconds) * gridSeconds;
    const reach = (SNAP_PX / this.screen.clientWidth) * loopSeconds;
    return Math.abs(line - inLoop) <= reach ? line - this.getOffset() : null;
  }

  /** Index of the marker within reach of a pointer event, or -1 */
  markerAt(e) {
    const rect = this.screen.getBoundingClientRect();
    const loopSeconds = this.voxEngine.getTakeLoopSeconds();
    const offset = this.getOffset();
    const slices = this.voxEngine.lane().slices;
    let best = -1;
    let bestDistance = GRAB_PX;
    slices.forEach((slice, i) => {
      const x = rect.left + (wrap(slice.at + offset, loopSeconds) / loopSeconds) * rect.width;
      const distance = Math.abs(e.clientX - x);
      if (distance <= bestDistance) {
        best = i;
        bestDistance = distance;
      }
    });
    return best;
  }

  /** Index of the zone a moment of the take falls in (-1 before the first marker) */
  zoneAt(time) {
    const slices = this.voxEngine.lane().slices;
    for (let i = slices.length - 1; i >= 0; i--) {
      if (time >= slices[i].at) return i;
    }
    return -1;
  }

  /** Zone whose numbered tab is under a pointer event, or -1 */
  tabAt(e) {
    const rect = this.screen.getBoundingClientRect();
    if (e.clientY - rect.top > TAB_BAND_PX) return -1;

    const loopSeconds = this.voxEngine.getTakeLoopSeconds();
    const offset = this.getOffset();
    for (const zone of this.voxEngine.lane().slices) {
      const x = rect.left + (wrap(zone.at + offset, loopSeconds) / loopSeconds) * rect.width;
      if (e.clientX >= x && e.clientX <= x + tabWidth(zone.source)) return zone.id;
    }
    return -1;
  }

  updateSlideKey(offset) {
    const ms = Math.round(offset * 1000);
    this.slideKey.textContent = `SLIDE ${ms > 0 ? "+" : ""}${ms}MS`;
  }

  /** The line of text on the left of the soft keys: what is going on right now */
  updateReadout() {
    const vox = this.voxEngine.lane();
    const drag = this.drag;
    let text;
    const isLoop = vox.origin === "file";
    if (this.trim) {
      const seconds = this.trim.end - this.trim.start;
      const bpm = this.store.getState().transport.bpm;
      const fit = fitLoop(seconds, bpm);
      text = fit
        ? `TRIM ${seconds.toFixed(2)}S → ${fit.bars} BAR${fit.bars > 1 ? "S" : ""} AT ${Math.round(fit.bpm)} BPM`
        : `TRIM ${seconds.toFixed(2)}S · NOT LOOP-LENGTH AT ${Math.round(bpm)} BPM`;
    } else if (vox.muted) text = `${isLoop ? "LOOP" : "VOX"} MUTED · NOT ON THE TAPE`;
    else if (drag?.moved && drag.carry !== -1) {
      const number = (zone) => vox.slices[zone].source + 1;
      const carried = number(drag.carry);
      if (drag.targets.length === 0)
        text = `${drag.copy ? "COPY" : "SWAP"} ${carried} · DROP ON A CHOP`;
      else if (!drag.copy) text = `SWAP ${carried} ↔ ${number(drag.targets[0])}`;
      else if (drag.targets.length === 1)
        text = `COPY ${carried} → OVER ${number(drag.targets[0])}`;
      else text = `COPY ${carried} → ${drag.targets.length} ZONES`;
    } else if (drag?.moved && drag.marker) {
      const hit = vox.slices[drag.index];
      const number = hit.source + 1;
      if (drag.recut) text = `CUT ${number} · AUDIO STAYS PUT`;
      else if (drag.snapped) text = `HIT ${number} → ${this.gridName(drag.marker.at)}`;
      else {
        const ms = Math.round((drag.marker.at - hit.onset) * 1000);
        text = `HIT ${number} · ${ms > 0 ? "+" : ""}${ms}MS FROM WHERE IT WAS`;
      }
    } else if (TOOL_HINTS[this.tool]) text = TOOL_HINTS[this.tool];
    else {
      const muted = vox.slices.filter((slice) => slice.muted).length;
      // A loaded loop shows the tempo its length works out to
      const length = isLoop
        ? `LOOP ${Math.round(vox.takeBpm)} BPM`
        : `${vox.bars} BAR${vox.bars > 1 ? "S" : ""}`;
      // Tuned: say what to, so a wrong guess at the loop's key can be seen
      const tuned = vox.tune
        ? ` · TUNED ${this.voxEngine.getTuneKey()?.name ?? "TO NEAREST NOTE"}`
        : "";
      text = `${length} · ${vox.slices.length} CHOPS${muted ? ` · ${muted} MUTED` : ""}${tuned}`;
    }
    this.readout.textContent = text;
  }

  /** Bar.beat.sixteenth of a moment of the take, as counted on the grid */
  gridName(time) {
    const vox = this.voxEngine.lane();
    const loopSeconds = this.voxEngine.getTakeLoopSeconds();
    const steps = wrap(time + this.getOffset(), loopSeconds) / (60 / vox.takeBpm / 4);
    const step = Math.floor(steps + 1e-6);
    const name = `${Math.floor(step / NUM_STEPS) + 1}.${Math.floor((step % NUM_STEPS) / 4) + 1}.${(step % 4) + 1}`;
    // Triplet lines fall between sixteenths
    return steps - step > 1e-3 ? `${name}+` : name;
  }

  /** Take the row's take off the desk, and say how to get it back */
  erase() {
    this.voxEngine.clear();
    Toast.show(
      this.voxEngine.laneKey === "vox"
        ? "Voice take erased — the mic's label brings it back"
        : "Loop taken off — load or drop it again to bring it back",
      "info",
    );
  }

  // ---- Display ----

  update() {
    const vox = this.voxEngine.lane();
    const hasTake = vox.slices.length > 0;
    // A file being read brings the row up before there is anything on it
    const loading = Boolean(vox.loading);
    const asleep = !hasTake && !loading && this.sleeps();
    const shown = hasTake || loading || asleep;
    if (this.row.hidden === shown) this.setVisible(shown);
    this.asleep = asleep;
    this.row.classList.toggle("is-asleep", asleep);
    this.row.classList.toggle("has-records", records().length > 0);
    this.waitToWake();
    this.row.classList.toggle("is-loading", loading);
    this.row.classList.toggle("is-empty", !hasTake);
    this.loadingEl.hidden = !loading;
    if (loading) this.loadingText.textContent = `READING ${vox.loading}`;
    this.nameEl.textContent = this.voxEngine.laneKey.toUpperCase();
    // A file's name is somebody's typing: set as text. While it is read, the one being read
    const said = vox.loading || takeLabel(this.voxEngine.laneKey, this.voxEngine.file?.name);
    if (said !== this.takeName.textContent) {
      this.takeName.textContent = said;
      this.takeReadout.setAttribute("aria-label", `${said}. What to do with it`);
    }
    // The trim screen goes with the file it was opened on
    if (this.trim && this.trim.source !== this.voxEngine.source) this.trim = null;
    this.row.classList.toggle("is-trimming", this.trim !== null);
    if (!hasTake) return;

    this.row.classList.toggle("is-muted", vox.muted);
    showHeard(this.row, this.store.getState(), this.voxEngine.laneKey);
    this.updateReadout();
    for (const key of this.toolKeys) {
      key.setAttribute("aria-pressed", String(key.dataset.tool === this.tool));
    }
    this.screen.dataset.tooltip = this.trim ? TRIM_TOOLTIP : SCREEN_TOOLTIPS[this.tool];
    this.screen.style.cursor =
      this.trim || this.tool === "slide" ? "grab" : this.tool === "copy" ? "copy" : "move";
    this.trimKey.hidden = !this.voxEngine.canTrim();
    // Greyed out rather than hidden, so the keys never shift under the pointer
    this.sungKey.disabled = !this.voxEngine.isReordered();
    this.updateSlideKey(vox.offset);
    this.dreamSlot.style.setProperty("--dream", vox.fx / 100);
    this.dreamInput.value = vox.fx;
    if (this.tuneKey) {
      const key = this.voxEngine.getTuneKey();
      this.tuneKey.setAttribute("aria-pressed", String(vox.tune));
      this.tuneKey.dataset.tooltip = key
        ? `Tune: nudges each sung chop onto the nearest note of the loop's key (${key.name}). The loop itself is never changed.`
        : "Tune: nudges each sung chop onto the nearest note. Load a loop with a clear key and it tunes to that instead.";
    }
    // Only a loaded loop's length is a guess; a mic take was recorded to the bar
    this.barsKey.hidden = vox.origin !== "file";
    this.barsKey.textContent = `BARS ${vox.bars}`;
    this.barsKey.dataset.tooltip = `Bars: how long this loop is taken to be, which sets its tempo (now ${Math.round(vox.takeBpm)} BPM). Click if the guess is wrong — twice the bars is twice the tempo.`;
    this.chopKey.textContent = `CHOP ${CHOP_LABELS[vox.chop] || "EDIT"}`;
    this.chopKey.dataset.tooltip =
      "Chop: re-cut the take — AUTO at its transients, on every beat, every bar, or WHOLE. Your own marker edits are replaced.";
    this.gridKey.textContent = `GRID ${RESOLUTION_LABELS[vox.resolution]}`;
    this.gridKey.dataset.tooltip = "Grid: the note value slices snap to — click to change";
    this.followBtn.textContent = FOLLOW_LABELS[vox.follow];
    this.followBtn.dataset.tooltip = `Follow: the voice leans on the ${FOLLOW_NAMES[vox.follow]} pocket — click to change`;

    this.scheduleDraw();
  }

  /** Whether this row, with nothing on it, shows its screen asleep */
  sleeps() {
    return !this.putAway && loopScreenSleeps(this.voxEngine.laneKey);
  }

  /** A sleeping screen wakes once the beat has gone round a few bars, and stays awake */
  waitToWake() {
    const { transport } = this.store.getState();
    const waiting = this.asleep && transport.isPlaying && !this.row.classList.contains("is-awake");
    if (!waiting) {
      clearTimeout(this.wakeTimer);
      this.wakeTimer = null;
    } else if (!this.wakeTimer) {
      const { bpm } = transport;
      this.wakeTimer = setTimeout(() => this.wake(), barsSeconds(WAKE_BARS, bpm) * 1000);
    }
  }

  wake() {
    this.wakeTimer = null;
    if (this.asleep) this.row.classList.add("is-awake");
  }

  /** Show or hide the row, and make room for it on the desk */
  setVisible(visible) {
    this.row.hidden = !visible;
    updateStageLift(this.row.closest(".sampler-stage"));
  }

  scheduleDraw() {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(this.draw);
  }

  draw() {
    this.rafPending = false;
    if (this.row.hidden) return;

    const vox = this.voxEngine.lane();
    const cssWidth = this.screen.clientWidth;
    const cssHeight = this.screen.clientHeight;
    if (cssWidth === 0 || cssHeight === 0) return;

    const dpr = window.devicePixelRatio || 1;
    const width = Math.round(cssWidth * dpr);
    const height = Math.round(cssHeight * dpr);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }

    const ctx = this.ctx;
    if (this.trim || vox.slices.length === 0) {
      ctx.clearRect(0, 0, width, height);
      if (this.trim) this.drawTrim(ctx, width, height, dpr);
      return;
    }
    const loopSeconds = this.voxEngine.getTakeLoopSeconds();
    const loopSteps = vox.bars * NUM_STEPS;
    const offset = this.getOffset();
    ctx.clearRect(0, 0, width, height);

    // Where each marker is heard in the loop and where it cuts the take,
    // with the one being dragged shown where the pointer has it
    const held = (i) => (this.drag?.index === i ? this.drag.marker : null);
    const markers = vox.slices.map((slice, i) => held(i)?.at ?? slice.at);
    const cuts = vox.slices.map((slice, i) => held(i)?.onset ?? slice.onset);
    const takeSeconds = this.voxEngine.takeSeconds;
    const stretches = cuts.map((_, i) => stretchRatio(cuts, markers, i, takeSeconds));

    // Step grid: bars heaviest, then beats, then 16ths. The grid stays put;
    // the take slides underneath it.
    for (let step = 0; step <= loopSteps; step++) {
      const weight = step % NUM_STEPS === 0 ? 0.5 : step % 4 === 0 ? 0.26 : 0.1;
      ctx.fillStyle = `rgba(${INK}, ${weight})`;
      ctx.fillRect(Math.round((step / loopSteps) * width), 0, Math.max(1, dpr * 0.75), height);
    }

    // Waveform, one screen column at a time, as it will be heard. Each column
    // is a moment of the loop (after the slide); the position it falls in
    // says which chop is playing there, and how far into that chop we are.
    // Anything that will not sound — muted, or ahead of the first marker —
    // is drawn faint, and muted chops get a grey wash behind them.
    const { min, max } = this.voxEngine.getPeaks(width);
    const tabBand = TAB_BAND_PX * dpr;
    const flagBand = 5 * dpr;
    const mid = tabBand + (height - tabBand - flagBand) / 2;
    const amp = (height - tabBand - flagBand) / 2 - dpr;
    const offsetColumns = Math.round((offset / loopSeconds) * width);
    const chopEnd = (chop) => (chop.id + 1 < cuts.length ? cuts[chop.id + 1] : takeSeconds);

    for (let x = 0; x < width; x++) {
      const time = (wrap(x - offsetColumns, width) / width) * loopSeconds;
      let position = -1;
      while (position + 1 < markers.length && time >= markers[position + 1]) position++;
      const zone = position >= 0 ? vox.slices[position] : null;
      const chop = zone ? vox.slices[zone.source] : null;

      // Which moment of the take is heard here (none once the chop has run
      // out). A stretched chop gets through its audio that much more slowly.
      let sourceTime = cuts[0] - (markers[0] - time);
      if (chop) {
        sourceTime = cuts[chop.id] + (time - markers[position]) / stretches[chop.id];
        if (sourceTime >= chopEnd(chop)) continue;
      } else if (sourceTime < 0) continue;
      const column = Math.min(width - 1, Math.round((sourceTime / loopSeconds) * width));

      if (zone?.muted) {
        ctx.fillStyle = `rgba(${INK}, 0.1)`;
        ctx.fillRect(x, tabBand, 1, height - tabBand - flagBand);
      }
      ctx.fillStyle = `rgba(${INK}, ${zone && !zone.muted ? 0.88 : 0.28})`;
      const top = mid - max[column] * amp;
      ctx.fillRect(x, top, 1, Math.max(dpr * 0.75, (max[column] - min[column]) * amp));
    }

    // Zones: a marker line, and the numbered tab of the chop heard there (red
    // once it is not the zone's own). While a chop is being carried, its
    // zone and the ones it will land in are washed red.
    const carrying = this.drag?.moved && this.drag.carry !== -1 ? this.drag : null;
    ctx.font = `${10 * dpr}px "JetBrains Mono", monospace`;
    ctx.textBaseline = "middle";
    const drawTab = (x, label, red) => {
      ctx.fillStyle = red ? "#b3200a" : `rgba(${INK}, 0.95)`;
      ctx.fillRect(x, 0, tabWidth(label) * dpr, tabBand - dpr);
      ctx.fillStyle = "#c9e3a8";
      ctx.fillText(String(label + 1), x + 3 * dpr, (tabBand - dpr) / 2 + dpr * 0.5);
    };

    markers.forEach((time, position) => {
      const x = Math.round((wrap(time + offset, loopSeconds) / loopSeconds) * width);
      const source = vox.slices[position].source;
      const markerActive = position === this.hoverMarker || position === this.drag?.index;
      const picked = carrying?.carry === position;
      const landing = carrying?.targets.includes(position);

      const lineWidth = (markerActive ? 2 : 1) * dpr;
      ctx.fillStyle = markerActive ? "#b3200a" : `rgba(${INK}, 0.95)`;
      ctx.fillRect(x - lineWidth / 2, 0, lineWidth, height - flagBand);
      drawTab(x, source, picked || landing || source !== position);

      // A hit that has been moved from where it was performed wears a pin
      if (Math.abs(time - cuts[position]) > 1e-4) {
        const pin = 3.5 * dpr;
        ctx.fillStyle = "#b3200a";
        ctx.beginPath();
        ctx.moveTo(x, tabBand);
        ctx.lineTo(x + pin, tabBand + pin);
        ctx.lineTo(x, tabBand + pin * 2);
        ctx.lineTo(x - pin, tabBand + pin);
        ctx.closePath();
        ctx.fill();
      }

      if (picked || landing) {
        const next = position + 1 < markers.length ? markers[position + 1] : loopSeconds;
        ctx.fillStyle = `rgba(179, 32, 10, ${landing ? 0.3 : 0.14})`;
        ctx.fillRect(
          x,
          tabBand,
          ((next - time) / loopSeconds) * width,
          height - tabBand - flagBand,
        );
      }
    });

    // The carried chop's tab rides along with the pointer
    if (carrying) {
      const label = vox.slices[carrying.carry].source;
      drawTab(carrying.x * dpr - (tabWidth(label) * dpr) / 2, label, true);
    }

    // Landing flags along the bottom: where each slice sits once pocketed.
    // (Not while sliding: they follow when the take is let go.)
    if (this.drag?.offset != null) return;
    const stepDuration = 60 / this.store.getState().transport.bpm / 4;
    const loopNow = loopSteps * stepDuration;
    ctx.fillStyle = "#b3200a";
    for (const slice of this.voxEngine.getPlacements()) {
      if (slice.muted) continue;
      const x = wrap(slice.time / loopNow, 1) * width;
      ctx.beginPath();
      ctx.moveTo(x, height - flagBand);
      ctx.lineTo(x + flagBand * 0.6, height);
      ctx.lineTo(x - flagBand * 0.6, height);
      ctx.closePath();
      ctx.fill();
    }
  }

  /**
   * Move the playhead across the screen.
   * @param {number} absStep - Steps since the clock started, or -1 to hide it
   */
  updatePlayhead(absStep) {
    if (absStep < 0 || this.row.hidden) {
      this.playhead.style.opacity = "0";
      return;
    }
    const loopSteps = this.voxEngine.lane().bars * NUM_STEPS;
    this.playhead.style.opacity = "1";
    this.playhead.style.left = `${((absStep % loopSteps) / loopSteps) * 100}%`;
    this.playhead.style.width = `${100 / loopSteps}%`;
  }
}

const watchedStages = new WeakSet();

/**
 * The sampler hangs from its front edge, so extra rows make it grow upward.
 * With both take rows showing, their screens are made shallower; if the
 * title would still leave the top of the desk, the whole unit is let down
 * by that much.
 */
function updateStageLift(stage) {
  if (!stage) return;
  // Measured again whenever the stage or the window changes size: the first
  // measure can come before the stylesheet has, and a window gets resized
  if (!watchedStages.has(stage)) {
    watchedStages.add(stage);
    new ResizeObserver(() => updateStageLift(stage)).observe(stage);
    window.addEventListener("resize", () => updateStageLift(stage));
  }
  const takeRows = [...stage.querySelectorAll(".vox-row:not([hidden])")];
  stage.classList.toggle("two-takes", takeRows.length > 1);
  // The rest of the desk makes room too (the desk sizes in main.css)
  document.body.classList.toggle("has-takes", takeRows.length > 0);

  // The sampler stays under the header, which on an upright window is not at the window's top;
  // the room over it is for the tag on its lip
  const header = document.querySelector(".desk-top");
  const deskTop = header ? header.offsetTop + header.offsetHeight + TAG_ROOM : 0;
  const drop = Number.parseFloat(stage.style.getPropertyValue("--stage-drop")) || 0;
  const top = stage.getBoundingClientRect().top - drop;
  const highest = Math.max(STAGE_TOP_MARGIN, deskTop);
  stage.style.setProperty("--stage-drop", `${Math.max(0, highest - top)}px`);
}

/** Wrap a value into [0, size) */
function wrap(value, size) {
  return ((value % size) + size) % size;
}

/** Width (CSS px) of the numbered tab for a chop */
function tabWidth(id) {
  return 7 + String(id + 1).length * 6;
}
