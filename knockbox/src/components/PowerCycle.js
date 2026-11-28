/**
 * PowerCycle
 * The sampler switched off and on again, for when the desk changes hands.
 * Off: the pads go out a row at a time, from the bottom, and then the
 * display and every other light on the machine. On: the display wakes with
 * its boot words and the pads run their self-test, as at first power-on.
 */

const ROW_OUT_MS = 70;
const DARK_MS = 600;
const WORD_MS = 330;
const ROW_TEST_MS = 90;
const SETTLE_MS = 160;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const rows = () => [...document.querySelectorAll(".track-row")];

// Which switching, off or on, was asked for last: one overtaken by another stops where it is
let asked = 0;

export const PowerCycle = {
  /** Lights out. Resolves once the machine has sat dark for a moment. */
  async down() {
    if (still()) return;
    const mine = ++asked;
    for (const row of rows().reverse()) {
      // Switched on again meanwhile: it must not be left dark behind that (FR-ACC-07)
      if (asked !== mine) return;
      row.classList.add("is-dark");
      await sleep(ROW_OUT_MS);
    }
    if (asked !== mine) return;
    document.body.classList.add("is-off");
    await sleep(DARK_MS);
  },

  /**
   * Back on. Safe to call when the machine never went off.
   * @param {string[]} [words] - What the display says as it wakes
   */
  async up(words = ["KB-3000", "Ready"]) {
    asked++;
    const { body } = document;
    const dark = rows().filter((row) => row.classList.contains("is-dark"));
    if (!body.classList.contains("is-off") && !dark.length) return;

    const lcd = document.querySelector(".lcd");
    const boot = lcd.querySelector(".lcd-boot");
    lcd.classList.add("is-rebooting");
    body.classList.remove("is-off");
    for (const word of words) {
      boot.textContent = word;
      await sleep(WORD_MS);
    }
    for (const row of rows()) {
      row.classList.remove("is-dark");
      row.classList.add("self-test");
      await sleep(ROW_TEST_MS);
    }
    await sleep(SETTLE_MS);
    for (const row of rows()) row.classList.remove("self-test");
    lcd.classList.remove("is-rebooting");
  },
};
