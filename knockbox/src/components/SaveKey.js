/**
 * SaveKey
 * The SAVE key on the transport strip. Unlit with nothing to keep, lit and
 * glowing with unsaved work, and settled to a tick and the disk count once
 * the beat is on a disk. The first press is also what makes a visitor
 * somebody: there is no sign-up button.
 *
 * The key stays off the desk until the API has answered, so a desk with no
 * server behind it looks as it always did.
 */

import { diskColour } from "./DiskBox.js";
import { chosenTitle, DiskNamer } from "./DiskNamer.js";
import { LcdMessage } from "./LcdMessage.js";
import { Toast } from "./Toast.js";

const WORDS = {
  empty: "Save",
  unsaved: "Save",
  saving: "Saving",
  saved: "Saved",
  full: "Save",
  visiting: "Save",
};

const REFUSALS = {
  offline: "Couldn't reach the server. Your beat is still on the desk.",
  audio_too_big: "This beat's audio is over 25 MB, too much for one disk.",
  // The same, with the row to cut down first (FR-AUDIO-28)
  audio_too_big_loop:
    "This beat's audio is over 25 MB, too much for one disk. The loop is the heaviest: trim it shorter.",
  audio_too_big_vocal:
    "This beat's audio is over 25 MB, too much for one disk. The vocal is the heaviest: trim it shorter.",
  audio_too_big_drum:
    "This beat's audio is over 25 MB, too much for one disk. A drum sound of your own is the heaviest.",
  box_full: "Your disk box is full.",
};

// How long the strip of tape by the key stays up
const HINT_MS = 4500;

/**
 * What a press of the key has to say when there is nothing for it to do.
 * @param {string} status - DiskDrive.status()
 * @param {string} [maker] - Whose beat is visiting the desk
 * @returns {string[]|null} The words, the second part in red; null when the press saves
 */
export function hintFor(status, maker) {
  // A copy would take its maker's loop and vocal with it; a flip leaves them behind
  if (status === "visiting") return [`this is ${maker}'s beat. `, "flip it to keep your version"];
  if (status === "empty") return ["nothing to keep yet. ", "change a pad first"];
  if (status === "saved") return ["already on the disk. ", "nothing new to keep"];
  return null;
}

export class SaveKey {
  /**
   * @param {Object} options
   * @param {DiskDrive} options.disks
   * @param {Function} options.onFull - There is no blank disk: resolves with the kept disk chosen to write over, or null
   * @param {Function} options.onSaved - The beat went onto a disk
   * @param {Function} options.onNamed - A new disk was named and saved: (namer, id, overId), for the box to take it in
   */
  constructor({ disks, onFull, onSaved, onNamed }) {
    this.disks = disks;
    this.onFull = onFull;
    this.onSaved = onSaved;
    this.onNamed = onNamed;
    this.key = document.querySelector("#save-btn");
    this.word = this.key.querySelector(".save-word");
    this.count = this.key.querySelector(".save-count");
    this.hint = document.querySelector("#save-hint");
    this.hintTimer = null;
    /** A new disk is in the middle of the desk, being named */
    this.naming = false;
    /** What was written on a disk that was then called off */
    this.draft = "";
  }

  init() {
    this.key.addEventListener("click", () => this.press());
    this.disks.onChange(() => this.render());
    this.render();
  }

  render() {
    const { disks } = this;
    const status = disks.status();
    this.key.hidden = !disks.ready;
    this.key.dataset.state = status;
    this.word.textContent = WORDS[status];
    // The count shows once there is something in the box to count
    const counted = status === "saved" || status === "full";
    this.count.hidden = !counted;
    this.count.textContent =
      disks.limit === null ? `${disks.count}` : `${disks.count}/${disks.limit}`;
  }

  /** Stick a strip of tape above the key for a moment: a press must never look like nothing happened */
  say([words, stressed]) {
    const strong = document.createElement("b");
    strong.textContent = stressed;
    this.hint.replaceChildren(words, strong);
    this.hint.style.left = `${this.key.offsetLeft + this.key.offsetWidth / 2}px`;
    // Taken off and put back, so a second press is seen to land
    this.hint.hidden = true;
    void this.hint.offsetWidth;
    this.hint.hidden = false;
    clearTimeout(this.hintTimer);
    this.hintTimer = setTimeout(() => this.hush(), HINT_MS);
  }

  hush() {
    clearTimeout(this.hintTimer);
    this.hint.hidden = true;
  }

  async press() {
    const { disks } = this;
    const status = disks.status();
    if (status === "saving" || this.naming) return;
    const hint = hintFor(status, disks.visiting?.by.name);
    if (hint) {
      this.say(hint);
      return;
    }
    this.hush();

    // Onto the disk in the drive: nothing to name, nothing to choose
    if (disks.disk) {
      try {
        if (!(await disks.save()).saved) return;
        LcdMessage.show([`Saved: disk ${disks.tally()}`]);
        this.onSaved();
      } catch (error) {
        this.refuse(error);
      }
      return;
    }

    // A beat that isn't on a disk yet is named first: a disk comes to the
    // middle of the desk, and committing the name is the save (ADR-0015)
    this.naming = true;
    const placeholder = `untitled ${disks.count + 1}`;
    const namer = DiskNamer.open({ from: this.key, placeholder, value: this.draft });
    // Called off: nothing is saved, the key is still lit, and the name is kept for next time
    const callOff = async () => {
      this.draft = namer.written();
      await namer.putBack();
    };
    try {
      if ((await namer.named) === null) return await callOff();
      const title = chosenTitle(namer.written()) ?? placeholder;

      // No blank disk: one of the kept ones is chosen to write over (ADR-0016).
      // Asked again if the box turns out to have filled from another tab.
      let over = null;
      let kept = null;
      while (!kept) {
        if (disks.isFull()) {
          namer.choosing(true);
          over = await this.onFull();
          namer.choosing(false);
          if (!over) return await callOff();
        }
        try {
          kept = await disks.save(over, title);
          if (!kept.saved) return await callOff();
        } catch (error) {
          if (error.code !== "box_full" || over) throw error;
        }
      }

      this.draft = "";
      const lines = over ? ["Saved over", over.title] : [`Saved: disk ${disks.tally()}`];
      // The first save is the moment the visitor gets a name
      if (kept.first) lines.push(`Hello, ${disks.user.name}`);
      LcdMessage.show(lines);
      namer.setColour(diskColour(disks.disk.id));
      await this.onNamed(namer, disks.disk.id, over?.id);
    } catch (error) {
      // Nothing was kept: the beat is still on the pads and the key still lit
      await callOff();
      this.refuse(error);
    } finally {
      this.naming = false;
    }
  }

  refuse(error) {
    Toast.show(
      REFUSALS[`${error.code}_${error.heaviest}`] ??
        REFUSALS[error.code] ??
        "Couldn't save that. Try again.",
      "warning",
    );
  }
}
