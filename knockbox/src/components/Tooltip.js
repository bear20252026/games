import { HINT_HOLD_MS, HINT_LINGER_MS, isDrag, isTouchEcho } from "../core/Turn.js";

const SHOW_DELAY = 200;
const EDGE_PADDING = 8;
const GAP = 8;

export const Tooltip = {
  el: null,
  showTimer: null,
  lingerTimer: null,
  currentTarget: null,
  cachedText: null,
  cachedTipWidth: 0,
  cachedTipHeight: 0,

  init() {
    if (this.el) return;

    const style = document.createElement("style");
    style.textContent = `
      .tooltip {
        position: fixed;
        z-index: 1000;
        padding: 6px 10px;
        background: var(--tr909-panel-dark, #3d3d3d);
        color: #e0e0e0;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        border: 1px solid #555;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        max-width: 260px;
        text-align: center;
        line-height: 1.4;
        opacity: 0;
        pointer-events: none;
        transition: opacity 120ms ease;
      }
      .tooltip.visible {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);

    this.el = document.createElement("div");
    this.el.className = "tooltip";
    this.el.setAttribute("role", "tooltip");
    document.body.appendChild(this.el);

    // After a touch a browser makes up mouse and focus events for it. Those are not a
    // pointer resting on a thing, so they neither show a tip nor put one away (ADR-0050)
    let lastTouch = Number.NEGATIVE_INFINITY;
    const echo = (e) => isTouchEcho(lastTouch, e.timeStamp);

    document.body.addEventListener("mouseover", (e) => {
      if (echo(e)) return;
      const target = e.target.closest("[data-tooltip]");
      if (!target || target === this.currentTarget) return;
      this.scheduleShow(target);
    });

    document.body.addEventListener("mouseout", (e) => {
      if (echo(e)) return;
      const target = e.target.closest("[data-tooltip]");
      if (!target || target !== this.currentTarget) return;
      if (e.relatedTarget && target.contains(e.relatedTarget)) return;
      this.cancel();
    });

    document.body.addEventListener("focusin", (e) => {
      // A key that took focus from a tap would keep its tip up until something else was tapped
      if (echo(e)) return;
      const target = e.target.closest?.("[data-tooltip]");
      if (target) this.scheduleShow(target, 0);
    });

    document.body.addEventListener("focusout", (e) => {
      if (echo(e)) return;
      const target = e.target.closest?.("[data-tooltip]");
      if (target && target === this.currentTarget) this.cancel();
    });

    // Under a finger there is no hover: a press held still on a thing shows its tip, which
    // stays a moment after the finger is off. A hold that showed a tip is not also a press.
    let hold = null;
    const swallow = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    document.body.addEventListener(
      "pointerdown",
      (e) => {
        if (e.pointerType === "mouse") return;
        lastTouch = e.timeStamp;
        clearTimeout(this.lingerTimer);
        this.cancel();
        const target = e.target.closest?.("[data-tooltip]");
        if (!target?.dataset.tooltip) return;
        hold = { id: e.pointerId, x: e.clientX, y: e.clientY, shown: false };
        this.currentTarget = target;
        this.showTimer = setTimeout(() => {
          hold.shown = true;
          this.show(target, target.dataset.tooltip);
        }, HINT_HOLD_MS);
      },
      true,
    );
    document.body.addEventListener(
      "pointermove",
      (e) => {
        if (!hold || e.pointerId !== hold.id) return;
        // The finger is doing something with it: turning a dial, dragging a fader
        if (isDrag(e.clientX - hold.x, e.clientY - hold.y, e.pointerType)) {
          hold = null;
          this.cancel();
        }
      },
      true,
    );
    const lift = (e) => {
      if (!hold || e.pointerId !== hold.id) return;
      lastTouch = e.timeStamp;
      if (hold.shown) {
        window.addEventListener("click", swallow, { capture: true, once: true });
        setTimeout(() => window.removeEventListener("click", swallow, { capture: true }), 400);
        this.lingerTimer = setTimeout(() => this.cancel(), HINT_LINGER_MS);
      } else this.cancel();
      hold = null;
    };
    document.body.addEventListener("pointerup", lift, true);
    document.body.addEventListener("pointercancel", lift, true);

    // Hide on any interaction or layout shift so it doesn't get stuck mid-drag/scroll.
    document.body.addEventListener("mousedown", (e) => !echo(e) && this.cancel(), true);
    window.addEventListener("scroll", () => this.cancel(), true);
    window.addEventListener("resize", () => this.cancel());
  },

  scheduleShow(target, delay = SHOW_DELAY) {
    this.currentTarget = target;
    clearTimeout(this.showTimer);
    const text = target.dataset.tooltip;
    if (!text) return;
    this.showTimer = setTimeout(() => this.show(target, text), delay);
  },

  cancel() {
    clearTimeout(this.showTimer);
    this.currentTarget = null;
    this.hide();
  },

  show(target, text) {
    if (text !== this.cachedText) {
      this.el.textContent = text;
      // Only re-measure when the text actually changed (otherwise the
      // tip box is the same size and getBoundingClientRect is a wasted
      // forced layout on every hover).
      const tipRect = this.el.getBoundingClientRect();
      this.cachedTipWidth = tipRect.width;
      this.cachedTipHeight = tipRect.height;
      this.cachedText = text;
    }
    this.position(target);
    this.el.classList.add("visible");
  },

  position(target) {
    const rect = target.getBoundingClientRect();
    const tipW = this.cachedTipWidth;
    const tipH = this.cachedTipHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let top = rect.top - tipH - GAP;
    if (top < EDGE_PADDING) {
      top = rect.bottom + GAP;
    }
    if (top + tipH > vh - EDGE_PADDING) {
      top = vh - tipH - EDGE_PADDING;
    }

    let left = rect.left + rect.width / 2 - tipW / 2;
    if (left < EDGE_PADDING) left = EDGE_PADDING;
    if (left + tipW > vw - EDGE_PADDING) {
      left = vw - tipW - EDGE_PADDING;
    }

    this.el.style.top = `${Math.max(0, Math.round(top))}px`;
    this.el.style.left = `${Math.round(left)}px`;
  },

  hide() {
    this.el?.classList.remove("visible");
  },
};
