/**
 * PlateList
 * The paper list that hangs off a row's readout: opened by the readout, put
 * away by Esc, Tab or a press anywhere else, and walked with the arrow keys.
 */

import { nextItem } from "./BounceMenu.js";

/**
 * @param {Object} parts
 * @param {HTMLElement} parts.row - Marked `is-choosing` while the list is out
 * @param {HTMLButtonElement} parts.readout
 * @param {HTMLElement} parts.menu
 * @param {() => Array<{text: string, className?: string, act?: Function}>} parts.lines - The list as it
 *   stands; a line with nothing to do is only read
 * @returns {{setOpen: (open: boolean) => void}}
 */
export function plateList({ row, readout, menu, lines }) {
  const setOpen = (open) => {
    if (open) {
      menu.replaceChildren(
        ...lines().map(({ text, className = "", act }) => {
          if (!act) {
            const said = document.createElement("span");
            said.className = "sound-said";
            said.textContent = text;
            return said;
          }
          const made = document.createElement("button");
          made.type = "button";
          made.className = `sound-line ${className}`.trim();
          made.setAttribute("role", "menuitem");
          // A file's name is somebody's typing: never read as markup
          made.textContent = text;
          made.addEventListener("click", (e) => {
            e.stopPropagation();
            setOpen(false);
            readout.focus({ preventScroll: true });
            act();
          });
          return made;
        }),
      );
    }
    menu.hidden = !open;
    readout.setAttribute("aria-expanded", String(open));
    row.classList.toggle("is-choosing", open);
    if (open) menu.querySelector("button")?.focus({ preventScroll: true });
  };

  readout.setAttribute("aria-haspopup", "menu");
  readout.setAttribute("aria-expanded", "false");
  menu.setAttribute("role", "menu");
  menu.hidden = true;
  readout.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(menu.hidden);
  });
  document.addEventListener("pointerdown", (e) => {
    if (!menu.hidden && !menu.contains(e.target) && !readout.contains(e.target)) setOpen(false);
  });
  menu.addEventListener("keydown", (e) => {
    const all = [...menu.querySelectorAll("button")];
    const to = nextItem(e.key, all.indexOf(document.activeElement), all.length);
    if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
      readout.focus({ preventScroll: true });
    } else if (to !== null) all[to].focus({ preventScroll: true });
    else return;
    e.preventDefault();
    // Not one of the desk's own keys while the list is out
    e.stopPropagation();
  });
  return { setOpen };
}
