/**
 * DiskChooser
 * A full box, and a new beat to keep. The kept disks come out of the box and
 * line up in the middle of the desk under the new one, each with what is
 * known about it taped to its label, so one can be chosen to write over.
 * None is picked for you, and the one picked is asked about once, by name.
 */

import { diskColour, floppy } from "./DiskBox.js";

const DAY = 86_400_000;

// Out of the box, one after another (ms)
const RISE_MS = 380;
const RISE_GAP_MS = 70;

/**
 * How long ago a disk was last saved, as taped to its label.
 * @param {number} then - When it was saved (ms)
 * @param {number} [now]
 */
export function savedAgo(then, now = Date.now()) {
  const days = Math.floor((now - then) / DAY);
  if (days < 1) return "saved today";
  if (days === 1) return "saved yesterday";
  if (days < 14) return `saved ${days} days ago`;
  if (days < 60) return `saved ${Math.floor(days / 7)} weeks ago`;
  return `saved ${Math.floor(days / 30)} months ago`;
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // Titles are typed by people: always text, never markup
  if (text !== undefined) node.textContent = text;
  return node;
}

export const DiskChooser = {
  /**
   * Lay the kept disks out and wait for one to be chosen.
   * @param {Object} options
   * @param {Object[]} options.beats - The kept disks, newest first (as DiskDrive.list())
   * @param {Element} options.from - Where they come out of (the disk box)
   * @param {string} [options.title] - The disk that needs the place, when it isn't in the hand
   * @returns {Promise<Object|null>} The disk to write over; null when called off
   */
  ask({ beats, from, title }) {
    return new Promise((resolve) => {
      const chooser = el("div", "disk-chooser");
      chooser.setAttribute("role", "dialog");
      chooser.setAttribute("aria-label", "Choose a disk to write over");
      const ask = el("span", "disk-chooser-ask");
      const asks = title ? `which one does "${title}" replace?` : "which one does this replace?";
      ask.append("box is full. ", el("b", "", asks));
      const row = el("div", "disk-chooser-row");
      const confirm = el("div", "disk-chooser-confirm");
      confirm.hidden = true;
      chooser.append(ask, row, confirm);

      let picked = null;
      const choices = new Map();
      const show = () => {
        chooser.classList.toggle("is-asking", picked !== null);
        for (const [id, choice] of choices) {
          choice.classList.toggle("is-picked", id === picked?.id);
          choice.setAttribute("aria-pressed", String(id === picked?.id));
        }
        confirm.hidden = picked === null;
        if (!picked) return;
        const words = el("span", "disk-chooser-words");
        words.append("write over ", el("b", "", `"${picked.title}"`), "? it's gone for good");
        const yes = el("button", "disk-tab is-hot", "Write over");
        yes.type = "button";
        yes.addEventListener("click", () => answer(picked));
        const no = el("button", "disk-tab", "Keep it");
        no.type = "button";
        no.addEventListener("click", () => pick(null));
        confirm.replaceChildren(words, yes, no);
      };
      const pick = (beat) => {
        picked = beat;
        show();
      };

      // Oldest on the left, as they stand in the box
      for (const beat of [...beats].reverse()) {
        const choice = el("button", "disk-choice");
        choice.type = "button";
        choice.setAttribute("aria-label", `Write over the disk "${beat.title}"`);
        const disk = floppy("floppy-big", "", diskColour(beat.id));
        const tapes = el("span", "disk-tapes");
        tapes.append(
          el("span", "disk-tape", `${beat.bpm} bpm`),
          el("span", "disk-tape", savedAgo(beat.updatedAt)),
        );
        disk.querySelector(".floppy-label").append(el("span", "floppy-title", beat.title), tapes);
        choice.append(disk);
        choice.addEventListener("click", () => pick(beat.id === picked?.id ? null : beat));
        choices.set(beat.id, choice);
        row.append(choice);
      }

      const answer = (beat) => {
        document.removeEventListener("keydown", onKey, true);
        from.classList.remove("is-emptied");
        chooser.remove();
        resolve(beat);
      };
      const onKey = (e) => {
        // Nothing typed here is one of the desk's shortcuts
        e.stopPropagation();
        if (e.key !== "Escape") return;
        // Esc lets go of a picked disk first, then calls the whole thing off
        if (picked) pick(null);
        else answer(null);
      };
      document.addEventListener("keydown", onKey, true);

      document.body.append(chooser);
      from.classList.add("is-emptied");
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const box = from.getBoundingClientRect();
      [...choices.values()].forEach((choice, i) => {
        const at = choice.getBoundingClientRect();
        const x = box.left + box.width / 2 - (at.left + at.width / 2);
        const y = box.top + box.height / 3 - (at.top + at.height / 2);
        choice.animate(
          [
            { transform: `translate(${x}px, ${y}px) scale(0.35) rotate(-14deg)`, opacity: 0.4 },
            { transform: "none", opacity: 1 },
          ],
          {
            duration: RISE_MS,
            delay: i * RISE_GAP_MS,
            easing: "cubic-bezier(0.3, 1.2, 0.5, 1)",
            fill: "backwards",
          },
        );
      });
    });
  },
};
