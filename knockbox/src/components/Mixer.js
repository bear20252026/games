import { levelToDb, MAX_LEVEL, UNITY_LEVEL } from "../core/MixLevels.js";
import { isSecondTap } from "../core/Turn.js";

/**
 * Mixer Component
 * The MIXER key flips the front panel over: every row's pads (or chop
 * screen) give way to one long fader for that row's level, and flip back
 * when the key is released. Nothing else about the row changes, so mute,
 * SAUCE and the sample keys stay where they were.
 *
 *   drag anywhere on a fader   set the level
 *   double-click               back to unity
 *   arrow keys (when focused)  nudge
 */
export class Mixer {
  /**
   * @param {Store} store
   * @param {string} toggleSelector - The MIXER key
   */
  constructor(store, toggleSelector) {
    this.store = store;
    this.toggle = document.querySelector(toggleSelector);
    this.strips = [];
  }

  init() {
    // Drum rows are keyed by track number, take rows by lane ("smp", "vox")
    for (const row of document.querySelectorAll(".track-row")) {
      const key = row.dataset.track ?? row.dataset.lane;
      const panel = row.querySelector(".track-steps, .vox-lcd");
      if (key !== undefined && panel) this.strips.push(this.createStrip(key, panel));
    }

    this.toggle.addEventListener("click", () => {
      const open = !document.body.classList.contains("mixer-open");
      document.body.classList.toggle("mixer-open", open);
      this.toggle.setAttribute("aria-pressed", String(open));
    });

    this.store.subscribeToSelector(
      (s) => s.mix,
      () => this.update(),
    );
    this.update();
  }

  createStrip(key, panel) {
    const strip = document.createElement("div");
    strip.className = "mix-strip";
    strip.innerHTML = `
      <div class="mix-slot" role="slider" tabindex="0" aria-label="Level" aria-valuemin="0" aria-valuemax="${MAX_LEVEL}" data-tooltip="Level: drag to set, tap twice for unity (0 dB)">
        <div class="mix-fill"></div>
        <div class="mix-unity"></div>
        <div class="mix-cap"></div>
      </div>
      <span class="mix-value"></span>
    `;
    panel.appendChild(strip);
    // The fader sits over the pads: keep its presses from reaching them
    for (const type of ["click", "dblclick", "pointerdown"]) {
      strip.addEventListener(type, (e) => e.stopPropagation());
    }

    const slot = strip.querySelector(".mix-slot");
    const setFromPointer = (e) => {
      const rect = slot.getBoundingClientRect();
      const fraction = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this.setLevel(key, Math.round(fraction * MAX_LEVEL));
    };
    slot.addEventListener("pointerdown", (e) => {
      slot.setPointerCapture(e.pointerId);
      setFromPointer(e);
    });
    slot.addEventListener("pointermove", (e) => {
      if (slot.hasPointerCapture(e.pointerId)) setFromPointer(e);
    });
    // Two taps put it at unity, under a finger as under a mouse (ADR-0050)
    let lastTap = null;
    slot.addEventListener("pointerup", (e) => {
      const tap = { at: e.timeStamp, x: e.clientX, y: e.clientY };
      if (isSecondTap(lastTap, tap)) {
        lastTap = null;
        this.setLevel(key, UNITY_LEVEL);
      } else lastTap = tap;
    });
    slot.addEventListener("keydown", (e) => {
      const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (!step) return;
      e.preventDefault();
      this.setLevel(key, this.store.getState().mix[key] + step * (e.shiftKey ? 10 : 2));
    });

    return { key, slot, value: strip.querySelector(".mix-value") };
  }

  setLevel(key, level) {
    const value = Math.max(0, Math.min(MAX_LEVEL, level));
    this.store.dispatch({ type: "SET_MIX_LEVEL", payload: { key, value } });
  }

  update() {
    const { mix } = this.store.getState();
    for (const { key, slot, value } of this.strips) {
      slot.style.setProperty("--level", `${mix[key]}%`);
      slot.setAttribute("aria-valuenow", mix[key]);
      value.textContent = levelToDb(mix[key]);
    }
  }
}
