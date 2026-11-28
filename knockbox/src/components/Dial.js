import { turnable } from "./Turnable.js";

// The scale runs clockwise from 7:30 round the top to 4:30, the same sweep
// the pointer turns through. Path angles are measured from 3 o'clock, so
// 7:30 is 135° and 4:30 is 405°.
const SWEEP_START = 135;
const SWEEP_END = 405;

export class Dial {
  constructor(store, containerSelector, label = "Humanize") {
    this.store = store;
    this.container = document.querySelector(containerSelector);
    this.label = label;

    // Get the initial value from the store
    this.state = this.store.getState();
    this.value = this.state.humanizeValue || 0;

    this.size = 100;
    this.center = this.size / 2;
    this.radius = 38;

    this.sensitivity = 0.5; // Value change per pixel dragged

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
    this.knobEls = this.container.querySelectorAll(".knob-group");
    this.glowEl = this.container.querySelector(".dial-glow");
    this.valueEl = this.container.querySelector(".dial-value");
    this.rafPending = false;
  }

  render() {
    const html = `
      <div class="dial-wrapper" data-tooltip="Humanize: drag up or down to set the amount. Tap twice to reset to 0.">
        <label class="dial-label">${this.label}</label>
        <div class="dial-container">
          <svg viewBox="0 0 ${this.size} ${this.size}" class="dial-svg">
            <defs>
              <!-- Chrome knob: bright top → mid → darker bottom (vertical metal sheen) -->
              <linearGradient id="potChrome${this.size}" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#efefef"/>
                <stop offset="22%" stop-color="#d4d4d4"/>
                <stop offset="45%" stop-color="#9a9a9a"/>
                <stop offset="60%" stop-color="#787878"/>
                <stop offset="100%" stop-color="#3a3a3a"/>
              </linearGradient>

              <!-- Brushed-metal vertical striations -->
              <pattern id="brushed${this.size}" x="0" y="0" width="2" height="60" patternUnits="userSpaceOnUse">
                <line x1="0.5" y1="0" x2="0.5" y2="60" stroke="rgba(0,0,0,0.12)" stroke-width="0.4"/>
                <line x1="1.5" y1="0" x2="1.5" y2="60" stroke="rgba(255,255,255,0.08)" stroke-width="0.4"/>
              </pattern>

              <!-- Cross-shape polished highlight (top-left arm) -->
              <radialGradient id="xLeft${this.size}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="rgba(255,255,255,0.55)"/>
                <stop offset="40%" stop-color="rgba(255,255,255,0.18)"/>
                <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
              </radialGradient>

              <!-- Cross-shape polished highlight (top-right arm, slightly softer) -->
              <radialGradient id="xRight${this.size}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="rgba(255,255,255,0.4)"/>
                <stop offset="50%" stop-color="rgba(255,255,255,0.12)"/>
                <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
              </radialGradient>

              <!-- Glow filter for active LED ring -->
              <filter id="tr909Glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              <!-- Drop shadow under the chrome cap -->
              <filter id="tr909Shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="#000" flood-opacity="0.55"/>
              </filter>
            </defs>

            <!-- Outer bezel ring — color via CSS variable so chassis context can repaint it -->
            <circle cx="${this.center}" cy="${this.center}" r="46" fill="var(--dial-bezel, #888)" stroke="var(--dial-bezel-stroke, #666)" stroke-width="1"/>
            <circle cx="${this.center}" cy="${this.center}" r="44" fill="var(--dial-bezel-inner, #777)" stroke="var(--dial-bezel-inner-stroke, #555)" stroke-width="1"/>

            <!-- Track background (notched area) -->
            <path
              d="${this.getArcPath(38, SWEEP_START, SWEEP_END)}"
              fill="none"
              stroke="var(--dial-track-bg, #333)"
              stroke-width="6"
              stroke-linecap="round"
            />

            <!-- Value track (inactive) -->
            <path
              d="${this.getArcPath(38, SWEEP_START, SWEEP_END)}"
              fill="none"
              stroke="var(--dial-track-inactive, #444)"
              stroke-width="4"
              stroke-linecap="round"
            />

            <!-- Value track (active glow) — accent color via CSS variable -->
            <path
              class="dial-glow"
              d="${this.getArcPath(38, SWEEP_START, SWEEP_END)}"
              fill="none"
              stroke="var(--dial-accent, #ff6a00)"
              stroke-width="4"
              stroke-linecap="round"
              stroke-dasharray="180"
              stroke-dashoffset="180"
              filter="url(#tr909Glow)"
            />

            <!-- Tick marks -->
            ${this.renderTickMarks()}

            <!-- Analog potentiometer. Only the parts that physically turn live in
                 .knob-group (knurled skirt, indicator notch). The chrome body,
                 reflections and cast shadow are lit by the room, so they stay
                 put while the knob rotates underneath them. -->

            <!-- Cast shadow + dark skirt/collar under the chrome cap -->
            <circle cx="${this.center}" cy="${this.center}" r="32" fill="#0a0a0a" filter="url(#tr909Shadow)"/>

            <!-- Knurled grip ring on the skirt (turns with the knob) -->
            <g class="knob-group">
              <circle cx="${this.center}" cy="${this.center}" r="30.6" fill="none" stroke="#34302b" stroke-width="2.6" stroke-dasharray="1.3 1.9"/>
            </g>

            <!-- Main chrome body -->
            <circle cx="${this.center}" cy="${this.center}" r="29" fill="url(#potChrome${this.size})"/>

            <!-- Vertical brushed-metal striations -->
            <circle cx="${this.center}" cy="${this.center}" r="29" fill="url(#brushed${this.size})" opacity="0.85"/>

            <!-- Cross-shape polished highlight: two diagonal elliptical reflections forming an X -->
            <ellipse cx="${this.center}" cy="${this.center - 4}" rx="6" ry="20"
                     fill="url(#xLeft${this.size})"
                     transform="rotate(-32 ${this.center} ${this.center})"/>
            <ellipse cx="${this.center}" cy="${this.center - 4}" rx="5" ry="18"
                     fill="url(#xRight${this.size})"
                     transform="rotate(32 ${this.center} ${this.center})"/>

            <!-- Top edge bright lip (the chamfer catching light from above) -->
            <ellipse cx="${this.center}" cy="${this.center - 22}" rx="18" ry="3" fill="rgba(255,255,255,0.35)"/>

            <!-- Bottom edge shadow (the chamfer in shadow) -->
            <ellipse cx="${this.center}" cy="${this.center + 22}" rx="18" ry="3" fill="rgba(0,0,0,0.35)"/>

            <!-- Subtle outer chrome ring border -->
            <circle cx="${this.center}" cy="${this.center}" r="29" fill="none" stroke="rgba(0,0,0,0.4)" stroke-width="0.7"/>

            <g class="knob-group">
              <!-- Indicator notch: dark line cut into the chrome at the top edge -->
              <line
                class="dial-pointer"
                x1="${this.center}" y1="${this.center - 27}"
                x2="${this.center}" y2="${this.center - 19}"
                stroke="rgba(15,15,15,0.95)"
                stroke-width="2.5"
                stroke-linecap="round"
              />
              <!-- Highlight just below the notch (chamfered edge of the cut) -->
              <line
                x1="${this.center + 1.5}" y1="${this.center - 26}"
                x2="${this.center + 1.5}" y2="${this.center - 20}"
                stroke="rgba(255,255,255,0.4)"
                stroke-width="0.6"
                stroke-linecap="round"
              />
            </g>
          </svg>
          <div class="dial-value">${this.value}%</div>
        </div>
      </div>
      <style>
        .dial-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 4px 6px 22px;
          user-select: none;
        }
        .dial-label {
          color: #2a2a2a;
          font-family: 'Arial', sans-serif;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 2px;
          font-weight: bold;
        }
        .dial-container {
          position: relative;
          width: 100px;
          height: 100px;
        }
        .dial-svg {
          cursor: ns-resize;
          width: 100%;
          height: 100%;
        }
        .dial-svg:active {
          cursor: grabbing;
        }
        .knob-group {
          transform-origin: ${this.center}px ${this.center}px;
          transition: transform 0.05s ease-out;
        }
        .dial-value {
          position: absolute;
          bottom: -18px;
          left: 50%;
          transform: translateX(-50%);
          color: #2a2a2a;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        .dial-glow {
          transition: stroke-dashoffset 0.05s ease-out;
        }
      </style>
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

  renderTickMarks() {
    const ticks = [];
    const numTicks = 11; // 0, 10, 20, ... 100
    const startAngle = SWEEP_START;
    const endAngle = SWEEP_END;
    const angleRange = endAngle - startAngle;

    for (let i = 0; i < numTicks; i++) {
      const angle = startAngle + (i / (numTicks - 1)) * angleRange;
      const radian = (angle * Math.PI) / 180;

      const innerRadius = 40;
      const outerRadius = i % 5 === 0 ? 46 : 43; // Longer ticks at 0, 50, 100

      const x1 = this.center + innerRadius * Math.cos(radian);
      const y1 = this.center + innerRadius * Math.sin(radian);
      const x2 = this.center + outerRadius * Math.cos(radian);
      const y2 = this.center + outerRadius * Math.sin(radian);

      const strokeWidth = i % 5 === 0 ? 2 : 1;
      // Major ticks (0, 50, 100) brighter; minor ticks softer. White on dark skirt.
      const color =
        i % 5 === 0
          ? "var(--dial-tick-major, rgba(240,240,240,0.85))"
          : "var(--dial-tick-minor, rgba(220,220,220,0.45))";

      ticks.push(
        `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${strokeWidth}"/>`,
      );
    }

    return ticks.join("");
  }

  setupListeners() {
    this.dial = turnable(this.container.querySelector(".dial-container"), {
      label: this.label,
      perPx: this.sensitivity,
      get: () => this.value,
      // Each step of a turn goes straight to whoever draws with it; the store hears where it stops
      onTurn: (value) => {
        this.value = value;
        this.updateVisuals();
        window.dispatchEvent(new CustomEvent("dial-update", { detail: { intensity: value } }));
      },
      onSet: (value) => this.store.dispatch({ type: "SET_HUMANIZE", payload: value }),
    });
  }

  updateVisuals() {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      const value = this.value;
      const rotation = -135 + (value / 100) * 270;
      for (const el of this.knobEls) {
        el.style.transform = `rotate(${rotation}deg)`;
      }
      if (this.glowEl) {
        const totalLength = 180;
        this.glowEl.style.strokeDashoffset = totalLength - (value / 100) * totalLength;
      }
      if (this.valueEl) {
        this.valueEl.textContent = `${value}%`;
      }
      this.dial?.sync();
    });
  }

  subscribe() {
    this.store.subscribeToSelector(
      (state) => state.humanizeValue,
      (newValue) => {
        this.value = newValue;
        this.updateVisuals();
      },
    );
  }
}
