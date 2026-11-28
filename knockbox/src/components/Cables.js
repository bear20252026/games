/**
 * Cables
 * Routes the desk cables to the sampler's jacks in real screen pixels, so
 * the plugs always meet the chassis and nothing stretches with the viewport.
 * Each cable is a stack of strokes sharing one path: two blurred shadows on
 * the desk, the rubber jacket, a shaded underside and a lamp highlight.
 * Everything is static between resizes — it rasterises once and is left alone.
 */

const SVG_NS = "http://www.w3.org/2000/svg";

// Stroke stack per cable, bottom to top. Widths and offsets are multiples of
// the cable diameter; offsets lean up-left toward the lamp.
const LAYERS = [
  { cls: "cable-shadow-soft", width: 1.5, dx: 0.35, dy: 1.0, color: "#000", opacity: 0.4 },
  { cls: "cable-shadow-contact", width: 1.0, dx: 0.1, dy: 0.35, color: "#000", opacity: 0.6 },
  { width: 1.0, dx: 0, dy: 0, color: "jacket", opacity: 1 },
  { width: 0.5, dx: 0.12, dy: 0.22, color: "#000", opacity: 0.38 },
  { width: 0.24, dx: -0.1, dy: -0.2, color: "sheen", opacity: 0.6 },
  { width: 0.07, dx: -0.13, dy: -0.27, color: "#fff", opacity: 0.3 },
];

const CABLES = [
  {
    id: "rca-l",
    diameter: 9,
    jacket: "#4a443b",
    sheen: "#a39a88",
    // Plug points right (+x) into the chassis' left wall
    anchor: (r) => ({ x: r.left, y: r.top + r.height * 0.36 }),
    plugTransform: (a, s) => `translate(${a.x - 30 * s} ${a.y}) scale(${s})`,
    route: (a, s, W, H) => {
      const x = a.x - 56 * s;
      const y = a.y;
      return `M ${x} ${y}
        C ${x - 0.05 * W} ${y}, ${x - 0.085 * W} ${y + 0.04 * H}, ${x - 0.075 * W} ${y + 0.17 * H}
        S ${x - 0.02 * W} ${y + 0.36 * H}, ${x - 0.07 * W} ${y + 0.47 * H}
        S ${0.02 * W} ${H * 0.985}, ${-0.04 * W} ${H * 1.02}`;
    },
  },
  {
    id: "rca-r",
    diameter: 9,
    jacket: "#5e1d0b",
    sheen: "#c8603a",
    anchor: (r) => ({ x: r.left, y: r.top + r.height * 0.52 }),
    plugTransform: (a, s) => `translate(${a.x - 30 * s} ${a.y}) scale(${s})`,
    route: (a, s, W, H) => {
      const x = a.x - 56 * s;
      const y = a.y;
      return `M ${x} ${y}
        C ${x - 0.035 * W} ${y}, ${x - 0.06 * W} ${y + 0.02 * H}, ${x - 0.055 * W} ${y + 0.1 * H}
        S ${x - 0.005 * W} ${y + 0.24 * H}, ${x - 0.05 * W} ${y + 0.33 * H}
        S ${0.04 * W} ${H * 0.97}, ${-0.03 * W} ${H * 1.04}`;
    },
  },
  {
    id: "power",
    diameter: 10,
    jacket: "#1d1915",
    sheen: "#6b6257",
    // Plug points down (+y) into the rear panel along the top edge
    anchor: (r) => ({ x: r.left + r.width * 0.8, y: r.top }),
    plugTransform: (a, s) => `translate(${a.x} ${a.y - 24 * s}) rotate(90) scale(${s})`,
    route: (a, s, W, H) => {
      const x = a.x;
      const y = a.y - 58 * s;
      return `M ${x} ${y}
        C ${x} ${y - 0.09 * H}, ${x + 0.04 * W} ${y - 0.17 * H}, ${x + 0.1 * W} ${y - 0.15 * H}
        S ${W * 0.93} ${H * 0.2}, ${W * 1.04} ${H * 0.03}`;
    },
  },
  {
    id: "mic",
    diameter: 8,
    jacket: "#1d1915",
    sheen: "#6b6257",
    // Runs to the tail of the desk microphone: `to` is the element, `toPoint`
    // where on it (as fractions of its box) the lead goes in
    to: ".mic-body",
    toPoint: [0.914, 0.31],
    // Plug points left (-x) into the chassis' right wall
    anchor: (r) => ({ x: r.right, y: r.top + r.height * 0.74 }),
    plugTransform: (a, s) => `translate(${a.x + 30 * s} ${a.y}) scale(${-s} ${s})`,
    // Out to the right, a lazy loop down across the desk, then back in along the mic's axis
    route: (a, s, W, H, tail) => {
      const x = a.x + 56 * s;
      const y = a.y;
      return `M ${x} ${y}
        C ${x + 0.05 * W} ${y}, ${x + 0.03 * W} ${tail.y + 0.05 * H}, ${x - 0.05 * W} ${tail.y + 0.045 * H}
        S ${tail.x + 0.068 * W} ${tail.y - 0.0145 * W}, ${tail.x} ${tail.y}`;
    },
  },
];

// Where a point on a desk prop sits on screen. Uses layout offsets rather than
// getBoundingClientRect so a prop caught mid entrance-animation still measures true.
function deskPoint(el, [fx, fy]) {
  let x = el.offsetWidth * fx;
  let y = el.offsetHeight * fy;
  for (let node = el; node; node = node.offsetParent) {
    x += node.offsetLeft;
    y += node.offsetTop;
  }
  return { x, y };
}

export class Cables {
  constructor(svgSelector, chassisSelector) {
    this.svg = document.querySelector(svgSelector);
    this.chassis = document.querySelector(chassisSelector);
    this.rafPending = false;
    this.layout = this.layout.bind(this);
    this.scheduleLayout = this.scheduleLayout.bind(this);
  }

  init() {
    if (!this.svg || !this.chassis) return;

    const shadows = this.svg.querySelector(".cable-shadows");
    const runs = this.svg.querySelector(".cable-runs");

    // Shadows for every cable go in one group below all jackets, so a cable
    // crossing another never has its shadow drawn on top of its neighbour.
    for (const cable of CABLES) {
      cable.paths = LAYERS.map((layer) => {
        const path = document.createElementNS(SVG_NS, "path");
        path.setAttribute("fill", "none");
        path.setAttribute("stroke-linecap", "round");
        path.setAttribute("stroke", cable[layer.color] || layer.color);
        path.setAttribute("opacity", layer.opacity);
        if (layer.cls) path.setAttribute("class", layer.cls);
        (layer.cls ? shadows : runs).appendChild(path);
        return path;
      });
      cable.plug = this.svg.querySelector(`[data-plug="${cable.id}"]`);
      cable.target = cable.to ? document.querySelector(cable.to) : null;
    }

    this.layout();
    window.addEventListener("resize", this.scheduleLayout);
    // The chassis also changes size without a window resize (fonts landing)
    new ResizeObserver(this.scheduleLayout).observe(this.chassis);
  }

  scheduleLayout() {
    if (this.rafPending) return;
    this.rafPending = true;
    requestAnimationFrame(() => {
      this.rafPending = false;
      this.layout();
    });
  }

  layout() {
    const rect = this.chassis.getBoundingClientRect();
    const W = window.innerWidth;
    const H = window.innerHeight;
    // Plugs and cable gauge scale with the sampler so proportions hold
    const scale = Math.max(0.8, Math.min(1.3, rect.width / 1000));

    for (const cable of CABLES) {
      const anchor = cable.anchor(rect);
      const tail = cable.target ? deskPoint(cable.target, cable.toPoint) : null;
      const d = cable.route(anchor, scale, W, H, tail);
      const gauge = cable.diameter * scale;

      cable.paths.forEach((path, i) => {
        const layer = LAYERS[i];
        path.setAttribute("d", d);
        path.setAttribute("stroke-width", gauge * layer.width);
        path.setAttribute("transform", `translate(${gauge * layer.dx} ${gauge * layer.dy})`);
      });
      cable.plug?.setAttribute("transform", cable.plugTransform(anchor, scale));
    }
  }
}
