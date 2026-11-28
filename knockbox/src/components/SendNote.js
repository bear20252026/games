/**
 * SendNote
 * The sticky notes that stand between a disk and its public link: what goes
 * out with it, and, at a first send, the house rules. This is the only place
 * Knockbox asks about rights (ADR-0007).
 */

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // Titles are typed by people: always text, never markup
  if (text !== undefined) node.textContent = text;
  return node;
}

/**
 * Stick a note to the desk and wait for an answer. Esc, or a click anywhere
 * else, is the answer `none`.
 * @param {string} label - What the note is, for a screen reader
 * @param {(note: HTMLElement, answer: (value: *) => void) => void} fill
 * @param {*} none
 * @param {{centred?: boolean}} [where] - Asked from the cassette, the note lies in the middle
 *   of the desk; asked of a disk in the hand, it is stuck above the disk
 */
function stick(label, fill, none, { centred = false } = {}) {
  return new Promise((resolve) => {
    const note = el("div", centred ? "sticky send-note is-centred" : "sticky send-note");
    note.setAttribute("role", "dialog");
    note.setAttribute("aria-label", label);

    const answer = (value) => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer, true);
      note.remove();
      resolve(value);
    };
    const onKey = (e) => {
      // The desk's own keys stay quiet while the note is up
      e.stopPropagation();
      if (e.key === "Escape") answer(none);
    };
    const onPointer = (e) => {
      if (!note.contains(e.target)) answer(none);
    };

    fill(note, answer);
    document.querySelector(".stage").append(note);
    document.addEventListener("keydown", onKey, true);
    // Not this click: the one that asked is still on its way up
    setTimeout(() => document.addEventListener("pointerdown", onPointer, true));
    note.querySelector("button")?.focus();
  });
}

function keys(note, choices, answer) {
  const row = el("div", "keep-note-keys");
  choices.forEach(([text, value], i) => {
    const key = el("button", i === 0 ? "keep-note-key is-hot" : "keep-note-key", text);
    key.type = "button";
    key.addEventListener("click", () => answer(value()));
    row.append(key);
  });
  note.append(row);
}

export const SendNote = {
  /**
   * What goes out with the link.
   * @param {{title: string}} beat
   * @param {{centred?: boolean}} [where]
   * @returns {Promise<{includeAudio: boolean, inCrate: boolean}|null>} null is "keep private"
   */
  ask(beat, where) {
    return stick(
      "Send this beat",
      (note, answer) => {
        const tick = el("input");
        tick.type = "checkbox";
        const own = el("label", "send-note-tick");
        own.append(
          tick,
          el(
            "span",
            "",
            "Play it with my own audio: loop, vocal, drum sounds. People hear the beat and are never given the files. I have the right to share it. Clearing samples is on me.",
          ),
        );
        // Unticked unless they say so: sending alone means "anyone with the link"
        const inCrate = el("input");
        inCrate.type = "checkbox";
        const crate = el("label", "send-note-tick send-note-crate");
        crate.append(
          inCrate,
          el(
            "span",
            "",
            "Put it in the crate too, where anyone at a desk can find it and flip it.",
          ),
        );
        note.append(
          el("span", "", `Send "${beat.title}"? Anyone with the link gets:`),
          el("span", "send-note-list", "· the pattern and the feel\n· your name and face"),
          own,
          el("span", "send-note-small", "Unticked, the link plays the pattern on the stock drums."),
          crate,
        );
        keys(
          note,
          [
            ["Send it", () => ({ includeAudio: tick.checked, inCrate: inCrate.checked })],
            ["Keep private", () => null],
          ],
          answer,
        );
      },
      null,
      where,
    );
  },

  /**
   * A beat that is out, asked for from the cassette: its link, and the ways to pass it on.
   * @param {{title: string, shown: string, email: string, whatsapp: string,
   *   copy: () => Promise<boolean>}} out - `copy` puts the link on the clipboard, if it can
   * @returns {Promise<null>} When it is put away
   */
  out({ title, shown, email, whatsapp, copy }) {
    return stick(
      "Your link",
      (note, answer) => {
        const row = el("div", "keep-note-keys");
        // Copied as the note goes down, and the key says so; pressed, it copies again
        const key = el("button", "keep-note-key is-hot", "Copy");
        key.type = "button";
        const take = async () => {
          if (await copy()) key.textContent = "Copied";
        };
        key.addEventListener("click", take);
        take();
        row.append(key);
        for (const [text, href] of [
          ["Email", email],
          ["WhatsApp", whatsapp],
        ]) {
          const way = el("a", "keep-note-key send-note-way", text);
          way.href = href;
          way.target = "_blank";
          way.rel = "noopener";
          // Gone to the other app: the note has done its work
          way.addEventListener("click", () => answer(null));
          row.append(way);
        }
        note.append(el("span", "", `"${title}" is out`), el("span", "send-note-link", shown), row);
      },
      null,
      { centred: true },
    );
  },

  /**
   * The house rules, at a first send.
   * @param {{centred?: boolean}} [where]
   * @returns {Promise<boolean>} Agreed?
   */
  askRules(where) {
    return stick(
      "The house rules",
      (note, answer) => {
        const read = el("span", "send-note-small");
        const link = (text, href) => {
          const a = el("a", "", text);
          a.href = href;
          a.target = "_blank";
          a.rel = "noopener";
          return a;
        };
        read.append(
          "The whole of it: ",
          link("house rules", "/rules.html"),
          ", ",
          link("terms", "/terms.html"),
          ", ",
          link("privacy", "/privacy.html"),
          ".",
        );
        note.append(
          el("span", "", "First send. The house rules:"),
          el(
            "span",
            "send-note-list",
            "· send only what is yours to share\n· nothing hateful, nothing illegal\n· a reported beat can be taken down",
          ),
          read,
        );
        keys(
          note,
          [
            ["I agree. Send it", () => true],
            ["Not now", () => false],
          ],
          answer,
        );
      },
      false,
      where,
    );
  },
};
