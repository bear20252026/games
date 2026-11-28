/**
 * MiniDial Component
 * Compact dial for a 0-100 value (~40px). By default it is a track's ghost
 * quantity; pass getValue/onCommit to point it at something else.
 * TR-909 inspired styling, vertical drag interaction
 */

// The value arc runs clockwise from 7:30 round the top to 4:30, the same
// sweep the pointer turns through. Path angles are measured from 3 o'clock,
// so 7:30 is 135° and 4:30 is 405°.
import { turnable } from "./Turnable.js";

const SWEEP_START = 135;
const SWEEP_END = 405;
const ARC_RADIUS = 14;
const ARC_LENGTH = ARC_RADIUS * (((SWEEP_END - SWEEP_START) * Math.PI) / 180);

export class MiniDial {
  constructor(options) {
    this.store = options.store;
    this.track = options.track;
    this.container = options.container;
    this.label = options.label || "Ghost";
    // Unique suffix for this dial's SVG gradient/filter ids
    this.uid = options.id ?? this.track;
    this.tooltip =
      options.tooltip || "Ghost notes: drag up or down to set how many. Tap twice to reset.";
    this.resetValue = options.resetValue ?? 0;
    this.getValue =
      options.getValue || ((state) => state.trackSettings[this.track]?.ghostQuantity || 0);
    this.onCommit =
      options.onCommit ||
      ((value) =>
        this.store.dispatch({
          type: "SET_TRACK_GHOST_QUANTITY",
          payload: { track: this.track, value },
        }));

    // Get initial value from store
    this.value = this.getValue(this.store.getState());

    this.size = 36;
    this.center = this.size / 2;

    // Value per px of drag
    this.sensitivity = 0.8;

    this.init();
  }

  init() {
    this.render();
    this.cacheDomRefs();
    this.updateVisuals();
    this.setupListeners();
    this.subscribe();
  }

  cacheDomRefs() {
    this.knobEl = this.container.querySelector(".mini-knob-group");
    this.labelEl = this.container.querySelector(".mini-dial-label");
    this.arcEl = this.container.querySelector(".mini-dial-arc");
    this.rafPending = false;
  }

  render() {
    const html = `
      <div class="mini-dial-wrapper" data-track="${this.uid}" data-tooltip="${this.tooltip}">
        <svg viewBox="0 0 ${this.size} ${this.size}" class="mini-dial-svg">
          <defs>
            <linearGradient id="miniKnobGradient${this.uid}" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#6a635a"/>
              <stop offset="45%" style="stop-color:#3b3630"/>
              <stop offset="100%" style="stop-color:#1c1915"/>
            </linearGradient>
            <radialGradient id="miniKnobSheen${this.uid}" cx="50%" cy="18%" r="55%">
              <stop offset="0%" style="stop-color:rgba(255,240,215,0.38)"/>
              <stop offset="100%" style="stop-color:rgba(255,240,215,0)"/>
            </radialGradient>
            <filter id="miniGlow${this.uid}" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Recessed well the pot sits in: dark seat with a lit lower lip -->
          <circle cx="${this.center}" cy="${this.center + 0.6}" r="17.2" fill="rgba(255,240,215,0.09)"/>
          <circle cx="${this.center}" cy="${this.center}" r="17" fill="#0d0b09"/>

          <!-- Track arc (background) -->
          <path
            d="${this.getArcPath(ARC_RADIUS, SWEEP_START, SWEEP_END)}"
            fill="none"
            stroke="#231e19"
            stroke-width="3"
            stroke-linecap="round"
          />

          <!-- Value arc (active) -->
          <path
            class="mini-dial-arc"
            d="${this.getArcPath(ARC_RADIUS, SWEEP_START, SWEEP_END)}"
            fill="none"
            stroke="#ff6a00"
            stroke-width="3"
            stroke-linecap="round"
            stroke-dasharray="${ARC_LENGTH}"
            stroke-dashoffset="${ARC_LENGTH}"
            filter="url(#miniGlow${this.uid})"
          />

          <!-- Knob body. Shadow, gradient and sheen are lit by the room and stay
               fixed; only the grip ridges and pointer turn. -->
          <circle cx="${this.center}" cy="${this.center + 1.6}" r="12" fill="rgba(0,0,0,0.6)"/>
          <circle cx="${this.center}" cy="${this.center}" r="12" fill="url(#miniKnobGradient${this.uid})"/>
          <circle cx="${this.center}" cy="${this.center}" r="12" fill="url(#miniKnobSheen${this.uid})"/>
          <circle cx="${this.center}" cy="${this.center}" r="9" fill="none" stroke="rgba(0,0,0,0.35)" stroke-width="0.6"/>

          <g class="mini-knob-group">
            <circle cx="${this.center}" cy="${this.center}" r="11.2" fill="none" stroke="rgba(0,0,0,0.45)" stroke-width="1.6" stroke-dasharray="0.9 1.45"/>

            <!-- Pointer -->
            <line
              class="mini-dial-pointer"
              x1="${this.center}" y1="${this.center - 9}"
              x2="${this.center}" y2="${this.center - 5}"
              stroke="#ff6a00"
              stroke-width="2"
              stroke-linecap="round"
            />
          </g>
        </svg>
        <span class="mini-dial-label" data-label="${this.label}"></span>
      </div>
    `;
    this.container.innerHTML = html;
  }

  getArcPath(radius, startAngle, endAngle) {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = this.center + radius * Math.cos(startRad);
    const y1 = this.center + radius * Math.sin(startRad);
    const x2 = this.center + radius * Math.cos(endRad);
    const y2 = this.center + radius * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  setupListeners() {
    // Pressed anywhere on the pot or its label; the label reads the value while it is held
    this.dial = turnable(this.container.querySelector(".mini-dial-wrapper"), {
      label: this.label,
      perPx: this.sensitivity,
      resetTo: this.resetValue,
      get: () => this.value,
      onTurn: (value) => {
        this.value = value;
        this.updateVisuals();
      },
      onSet: () => this.dispatchChange(),
    });
  }

  dispatchChange() {
    this.onCommit(this.value);
  }

  updateVisuals() {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      const value = this.value;
      if (this.knobEl) {
        const rotation = -135 + (value / 100) * 270;
        this.knobEl.style.transform = `rotate(${rotation}deg)`;
      }
      if (this.arcEl) {
        const totalLength = ARC_LENGTH;
        this.arcEl.style.strokeDashoffset = totalLength - (value / 100) * totalLength;
      }
      // What the label reads while the pot is held: a finger covers the pot itself
      if (this.labelEl) this.labelEl.dataset.value = String(value);
      this.dial?.sync();
    });
  }

  subscribe() {
    this.store.subscribeToSelector(
      (state) => this.getValue(state),
      (newValue) => {
        this.value = newValue;
        this.updateVisuals();
      },
    );
  }
}
