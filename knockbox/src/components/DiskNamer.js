/**
 * DiskNamer
 * A new disk's moment in the middle of the desk. When SAVE is pressed for a
 * beat that isn't on a disk yet, a floppy comes up from the key to the centre
 * of the page, its label blank, and the beat's name is scribbled straight
 * onto it. Enter commits: that is the save, and the disk goes over to the box.
 * Esc puts the disk back and saves nothing (ADR-0015).
 */

import { floppy } from "./DiskBox.js";

export const TITLE_LENGTH = 40;

// Up from the key, and over to the box (ms)
const RISE_MS = 420;
const CARRY_MS = 480;

// Where the disk rests in the middle of the desk (as .disk-namer in main.css)
const HOME = "translate(-50%, -50%) rotate(-3deg) scale(1)";

/**
 * The name to put on the disk, from what was scribbled.
 * @param {string|null} typed
 * @returns {string|null} null when nothing usable was written: the disk takes its default name
 */
export function chosenTitle(typed) {
  const title = (typed ?? "").trim().slice(0, TITLE_LENGTH).trim();
  return title || null;
}

const middleOf = (element) => {
  const { left, top, width, height } = element.getBoundingClientRect();
  return { x: left + width / 2, y: top + height / 2, width };
};

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Slide a disk between where it is and another element, shrinking onto it (or growing from it) */
function fly(disk, other, { arriving, ms }) {
  if (reducedMotion()) return Promise.resolve();
  const here = middleOf(disk);
  const there = middleOf(other);
  const away = {
    transform: `translate(calc(-50% + ${there.x - here.x}px), calc(-50% + ${there.y - here.y}px)) rotate(-12deg) scale(${Math.min(1, (there.width / here.width) * 0.5)})`,
    opacity: 0.2,
  };
  const home = { transform: HOME, opacity: 1 };
  const easing = "cubic-bezier(0.3, 1.2, 0.5, 1)";
  return disk.animate(arriving ? [away, home] : [home, away], { duration: ms, easing }).finished;
}

export const DiskNamer = {
  /**
   * Bring a blank disk to the middle of the desk to be named.
   * @param {Object} options
   * @param {Element} options.from - Where it comes up from (the SAVE key)
   * @param {string} options.placeholder - The name it has if nothing is written
   * @param {string} [options.value] - What was written last time, if it was called off
   * @returns {{named: Promise<string|null>, written: Function, choosing: Function, setColour: Function, carryTo: Function, remove: Function, putBack: Function}}
   *   `named` resolves with what was written when Enter commits it, or null
   *   when Esc called it off; `written()` is what is on the label either way.
   *   `choosing(on)` moves it up out of the way while a disk is chosen to
   *   write over. `carryTo(place)` takes the saved disk over to
   *   the box and holds it there until `remove()`; `putBack()` sends it back
   *   where it came from, unsaved.
   */
  open({ from, placeholder, value = "" }) {
    const namer = document.createElement("div");
    namer.className = "disk-namer";
    const disk = floppy("floppy-big", "", "#ff7a2b");
    const input = document.createElement("input");
    input.className = "disk-namer-input";
    input.type = "text";
    input.maxLength = TITLE_LENGTH;
    input.placeholder = placeholder;
    input.value = value;
    input.spellcheck = false;
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Name this beat");
    // The line the name is written on, drawn by hand
    const line = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    line.setAttribute("class", "disk-namer-line");
    line.setAttribute("viewBox", "0 0 100 8");
    line.setAttribute("preserveAspectRatio", "none");
    line.setAttribute("aria-hidden", "true");
    const stroke = document.createElementNS("http://www.w3.org/2000/svg", "path");
    stroke.setAttribute("d", "M2 5 C 14 1, 22 8, 36 4 S 60 1, 72 5 S 90 7, 98 3");
    line.append(stroke);
    disk.querySelector(".floppy-label").append(input, line);
    const hint = document.createElement("span");
    hint.className = "disk-namer-hint";
    const key = document.createElement("b");
    key.textContent = "enter";
    const esc = document.createElement("b");
    esc.textContent = "esc";
    hint.append("name it, then ", key, " to save it · ", esc, " to cancel");
    namer.append(disk, hint);
    document.body.append(namer);

    let penDown;
    const named = new Promise((resolve) => {
      penDown = resolve;
    });
    const finish = (value) => {
      document.removeEventListener("keydown", onKey, true);
      input.readOnly = true;
      namer.classList.add("is-named");
      penDown(value);
    };
    // Heard anywhere on the page, so a click on the desk can't strand the disk
    // (a click doesn't dismiss it: only Enter saves, only Esc calls it off)
    const onKey = (e) => {
      if (e.key !== "Enter" && e.key !== "Escape") {
        // Letters typed on the label are not the desk's shortcuts
        if (e.target === input) e.stopPropagation();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      finish(e.key === "Enter" ? input.value : null);
    };
    document.addEventListener("keydown", onKey, true);

    fly(namer, from, { arriving: true, ms: RISE_MS });
    input.focus({ preventScroll: true });

    return {
      named,
      written: () => input.value,
      choosing: (on) => namer.classList.toggle("is-choosing", on),
      setColour: (colour) => disk.style.setProperty("--label", colour),
      /**
       * Carry the disk across the desk, shrinking to the size it has in the box.
       * @param {{x: number, y: number, width: number}} place - Where its middle ends up, and how wide
       */
      async carryTo(place) {
        if (reducedMotion()) return;
        const here = middleOf(namer);
        const at = middleOf(disk);
        const scale = place.width / disk.offsetWidth;
        // The disk isn't the middle of what moves: the tape hangs below it
        const x = place.x - here.x - (at.x - here.x) * scale;
        const y = place.y - here.y - (at.y - here.y) * scale;
        const there = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(0deg) scale(${scale})`;
        const carried = namer.animate([{ transform: HOME }, { transform: there }], {
          duration: CARRY_MS,
          easing: "cubic-bezier(0.5, 0, 0.2, 1)",
          fill: "forwards",
        }).finished;
        // Turned end over end on the way: it goes into the box shutter first
        const half = { duration: CARRY_MS / 2 };
        const edgeOn = { transform: "rotateX(90deg)" };
        await disk.animate([{ transform: "none" }, edgeOn], { ...half, easing: "ease-in" })
          .finished;
        disk.classList.add("floppy-standing");
        await disk.animate([edgeOn, { transform: "none" }], { ...half, easing: "ease-out" })
          .finished;
        await carried;
      },
      remove: () => namer.remove(),
      async putBack() {
        await fly(namer, from, { arriving: false, ms: RISE_MS });
        namer.remove();
      },
    };
  },
};
