/**
 * KeepNote
 * The sticky note that asks before unsaved work is lost: "The beat on the
 * pads isn't saved. Keep it first?" Stuck to the desk by the disk box, never
 * a browser pop-up.
 */

const CHOICES = [
  ["save", "Save it"],
  ["drop", "Drop it"],
  ["cancel", "Cancel"],
];

export const KeepNote = {
  /**
   * Stick the note down and wait for an answer. Esc, or a click anywhere
   * else, is "cancel".
   * @returns {Promise<"save"|"drop"|"cancel">}
   */
  ask() {
    return new Promise((resolve) => {
      const note = document.createElement("div");
      note.className = "sticky keep-note";
      note.setAttribute("role", "alertdialog");
      note.setAttribute("aria-label", "Unsaved beat");
      const words = document.createElement("span");
      words.textContent = "The beat on the pads isn't saved. Keep it first?";
      const keys = document.createElement("div");
      keys.className = "keep-note-keys";
      note.append(words, keys);

      const answer = (choice) => {
        document.removeEventListener("keydown", onKey, true);
        document.removeEventListener("pointerdown", onPointer, true);
        note.remove();
        resolve(choice);
      };
      const onKey = (e) => {
        if (e.key !== "Escape") return;
        // The disk in the hand stays there: only the note goes
        e.stopPropagation();
        answer("cancel");
      };
      const onPointer = (e) => {
        if (!note.contains(e.target)) answer("cancel");
      };

      for (const [choice, text] of CHOICES) {
        const key = document.createElement("button");
        key.type = "button";
        key.className = choice === "save" ? "keep-note-key is-hot" : "keep-note-key";
        key.textContent = text;
        key.addEventListener("click", () => answer(choice));
        keys.append(key);
      }

      document.querySelector(".stage").append(note);
      document.addEventListener("keydown", onKey, true);
      // Not this click: the one that asked is still on its way up
      setTimeout(() => document.addEventListener("pointerdown", onPointer, true));
      keys.firstElementChild.focus();
    });
  },
};
