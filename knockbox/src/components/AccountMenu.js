/**
 * AccountMenu
 * Who this browser is, in the top right corner of the desk: a SIGN IN key for
 * nobody; a face and a made-up name with a GUEST stamp after a first save; the
 * stamp gone once the account is real. Pressed, it opens a menu as any site's
 * does: your page, your name, your face, and the way out (ADR-0080).
 */

import { FACES } from "../core/Faces.js";
import { nameAdvice } from "../core/Names.js";
import { profilePath } from "../core/Profile.js";
import { nextItem } from "./BounceMenu.js";
import { LcdMessage } from "./LcdMessage.js";
import { Toast } from "./Toast.js";

export { FACES };

const PEEL_MS = 460;
const PRESS_MS = 320;

const still = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** @returns {string} Where a face's picture is; a name not among the sixteen gets the first */
export function faceUrl(face) {
  return `./public/faces/${FACES.includes(face) ? face : FACES[0]}.svg`;
}

const CHECK_MS = 300;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // Names are typed by people: always text, never markup
  if (text !== undefined) node.textContent = text;
  return node;
}

export class AccountMenu {
  /**
   * @param {Object} options
   * @param {Account} options.account
   * @param {DiskDrive} options.disks
   * @param {Function} options.onSignIn - A press of the SIGN IN key, or of the lit key in a guest's menu
   * @param {() => Promise<void>} options.onLeaving - The desk starts to empty (the face is lifting off)
   * @param {() => Promise<void>} options.onSignedOut - The desk is nobody's now; also called if signing out failed
   */
  constructor({ account, disks, onSignIn, onLeaving, onSignedOut }) {
    this.account = account;
    this.disks = disks;
    this.onSignIn = onSignIn;
    this.onLeaving = onLeaving;
    this.onSignedOut = onSignedOut;
    this.root = document.querySelector("#account");
    /** The menu is down */
    this.open = false;
    /** What is being done in the menu: null, "rename" or "faces" */
    this.doing = null;
    /** The inbox a sign-in link was last sent to, until it is opened */
    this.sentTo = null;
    /** A sign-out is under way */
    this.leaving = false;
  }

  init() {
    this.disks.onChange(() => {
      // A name being written is left alone
      if (this.doing !== "rename") this.render();
    });
    // Reaching for anything else on the desk puts the menu away
    document.addEventListener("pointerdown", (e) => {
      if (this.open && !this.root.contains(e.target)) this.shut();
    });
    this.root.addEventListener("keydown", (e) => this.keyed(e));
    this.render();
  }

  /** The menu comes down, or goes up, with the key it hangs from keeping the focus it had */
  toggle() {
    this.open = !this.open;
    this.doing = null;
    this.render();
    if (this.open) this.items()[0]?.focus({ preventScroll: true });
  }

  shut({ focus = false } = {}) {
    this.open = false;
    this.doing = null;
    this.render();
    if (focus) this.root.querySelector(".acct-btn")?.focus({ preventScroll: true });
  }

  act(doing) {
    this.doing = doing;
    this.render();
    if (!doing) this.items()[0]?.focus({ preventScroll: true });
  }

  items() {
    return [...this.root.querySelectorAll(".acct-item")];
  }

  /** The menu's own keys: the arrows move between its lines and Esc puts it away */
  keyed(e) {
    if (!this.open) return;
    // An arrow here is not the desk's tempo
    e.stopPropagation();
    if (e.key === "Escape") {
      if (this.doing) this.act(null);
      else this.shut({ focus: true });
      return;
    }
    if (this.doing) return;
    const items = this.items();
    const next = nextItem(e.key, items.indexOf(document.activeElement), items.length);
    if (next === null) return;
    e.preventDefault();
    items[next]?.focus({ preventScroll: true });
  }

  /** A link went to an inbox: the corner says so until it is opened */
  linkSent(email) {
    this.sentTo = email;
    this.render();
  }

  render() {
    const { root, disks } = this;
    const user = this.account.user;
    root.hidden = !disks.ready;
    if (user && !user.guest) this.sentTo = null;
    if (!user) this.open = false;

    if (!user) {
      // The same key lays the sheet out again, to type the code or send another
      const key = el("button", "desk-key acct-key", this.sentTo ? "Check your inbox" : "Sign in");
      key.type = "button";
      key.classList.toggle("is-hot", !this.sentTo);
      if (this.sentTo)
        key.setAttribute("aria-label", "Code sent. Check your inbox, then type it here");
      key.addEventListener("click", () => this.onSignIn());
      root.replaceChildren(key);
      return;
    }

    const button = el("button", "acct-btn");
    button.type = "button";
    button.setAttribute("aria-haspopup", "menu");
    button.setAttribute("aria-expanded", String(this.open));
    button.setAttribute("aria-label", `Your account, ${user.name}`);
    const picture = el("img", "acct-face");
    picture.src = faceUrl(user.face);
    picture.alt = "";
    button.append(picture, el("span", "acct-name", user.name));
    if (user.guest) button.append(el("span", "acct-stamp", "GUEST"));
    button.append(el("span", "acct-caret", "▾"));
    button.addEventListener("click", () => this.toggle());
    if (!this.open) {
      root.replaceChildren(button);
      return;
    }

    const menu = el("div", "acct-menu");
    menu.setAttribute("role", "menu");
    const under = el("div", "acct-under");
    const me = el("div", "acct-me");
    const mine = el("img", "acct-face");
    mine.src = faceUrl(user.face);
    mine.alt = "";
    me.append(mine, this.renderName(user, under));
    const parts = [me, under];
    if (this.doing === "faces") parts.push(this.renderFaces(user));

    // The menu's lines give way while a name is being written or the faces are out
    if (!this.doing) {
      if (this.sentTo) {
        const sent = el("span", "acct-note");
        sent.append("code sent. ", el("b", "", "check your inbox"));
        parts.push(
          sent,
          this.line("Type the code", () => this.onSignIn()),
        );
      }
      if (user?.guest && !this.sentTo) {
        const key = el(
          "button",
          "desk-key is-hot acct-item acct-hot",
          "Sign in to keep your beats",
        );
        key.type = "button";
        key.setAttribute("role", "menuitem");
        key.addEventListener("click", () => {
          this.shut();
          this.onSignIn();
        });
        parts.push(key);
      }
      if (user && !user.guest) {
        // Their page: every disk, the account and the plan, away from the desk (ADR-0009)
        const page = el("a", "acct-item acct-line", "My page");
        page.href = profilePath(user.name);
        page.setAttribute("role", "menuitem");
        parts.push(page);
      }
      parts.push(
        this.line("Change name", () => this.act("rename")),
        this.line("Change face", () => this.act("faces")),
      );
      if (!user.guest) {
        const out = this.line("Sign out", () => this.signOut());
        out.classList.add("acct-out");
        parts.push(out);
      }
    }
    menu.append(...parts);
    root.replaceChildren(button, menu);
    // Never select(): it scrolls the desk sideways to bring the line "into view"
    const line = root.querySelector(".acct-input");
    line?.focus({ preventScroll: true });
    line?.setSelectionRange(0, line.value.length);
  }

  /** One line of the menu */
  line(words, onPress) {
    const line = el("button", "acct-item acct-line", words);
    line.type = "button";
    line.setAttribute("role", "menuitem");
    line.addEventListener("click", onPress);
    return line;
  }

  /** The name at the head of the menu, or a line to write a new one on */
  renderName(user, under) {
    if (this.doing !== "rename") return el("b", "acct-mine", user.name);

    const input = el("input", "acct-mine acct-input");
    input.type = "text";
    input.value = user.name;
    input.maxLength = 20;
    input.spellcheck = false;
    input.autocomplete = "off";
    input.setAttribute("aria-label", "Your name");
    // A name to go by, not a login: password managers can leave it be
    input.setAttribute("data-1p-ignore", "");
    input.setAttribute("data-lpignore", "true");
    const advice = el("span", "acct-note");
    advice.append("enter to keep it");
    under.append(advice);

    const advise = ({ ok, words, suggestion }) => {
      advice.classList.toggle("is-ok", ok);
      advice.replaceChildren(words);
      if (!suggestion) return;
      const use = el("button", "acct-try", suggestion);
      use.type = "button";
      use.addEventListener("click", () => {
        input.value = suggestion;
        input.focus();
        check();
      });
      advice.append(use);
    };
    let asked = 0;
    let timer = null;
    const check = async () => {
      const mine = ++asked;
      try {
        const answer = await this.account.checkName(input.value);
        if (mine === asked) advise(nameAdvice(answer));
      } catch {
        // Keeping the name will say what is wrong
      }
    };
    input.addEventListener("input", () => {
      clearTimeout(timer);
      timer = setTimeout(check, CHECK_MS);
    });
    input.addEventListener("keydown", async (e) => {
      // Letters written here are not the desk's shortcuts
      e.stopPropagation();
      if (e.key === "Escape") this.act(null);
      if (e.key !== "Enter") return;
      clearTimeout(timer);
      asked++;
      if (input.value === user.name) return this.act(null);
      try {
        await this.account.rename(input.value);
        this.act(null);
      } catch (error) {
        if (error.code === "name_taken" || error.code === "bad_name") {
          advise(nameAdvice({ free: false, problem: "taken", ...error.details }));
        } else {
          this.act(null);
          Toast.show("Couldn't change your name. Try again.", "warning");
        }
      }
    });
    return input;
  }

  /** The sheet of sixteen faces, one of them yours */
  renderFaces(user) {
    const sheet = el("div", "acct-faces");
    sheet.setAttribute("role", "radiogroup");
    sheet.setAttribute("aria-label", "Face");
    for (const face of FACES) {
      const button = el("button", "acct-pick");
      button.type = "button";
      button.setAttribute("role", "radio");
      button.setAttribute("aria-label", face);
      button.setAttribute("aria-checked", String(face === user.face));
      const picture = el("img");
      picture.src = faceUrl(face);
      picture.alt = "";
      button.append(picture);
      button.addEventListener("click", () => this.pickFace(face));
      sheet.append(button);
    }
    return sheet;
  }

  async pickFace(face) {
    this.doing = null;
    try {
      await this.account.setFace(face);
    } catch {
      this.render();
      Toast.show("Couldn't change your face. Try again.", "warning");
    }
  }

  /**
   * The face lifts off the corner of the desk and is gone. The corner stays bare until
   * the next render() puts something back.
   */
  async peel() {
    const stuck = this.root.querySelector(".acct-btn");
    if (!stuck || still()) return;
    await stuck.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: "rotate(-5deg) translateY(-0.3em)", opacity: 1, offset: 0.35 },
        { transform: "rotate(-14deg) translate(1.2em, -2.6em) scale(0.92)", opacity: 0 },
      ],
      { duration: PEEL_MS, easing: "cubic-bezier(0.5, 0, 0.8, 0.4)", fill: "forwards" },
    ).finished;
  }

  /** Whoever is at the desk now is set down in the corner: a little big, and it lands */
  async press() {
    if (still()) return;
    // The corner moves, not what is drawn in it: that is redrawn as the desk settles
    await this.root.animate(
      [
        { transform: "translateY(-0.4em) scale(1.22)", opacity: 0 },
        { transform: "scale(0.97)", opacity: 1, offset: 0.7 },
        { transform: "none", opacity: 1 },
      ],
      { duration: PRESS_MS, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
    ).finished;
  }

  /**
   * Leaving is seen to happen: the menu goes up, the face lifts off, the disks leave the
   * box and the machine goes dark; then it comes back on as nobody's.
   */
  async signOut() {
    // A second press while the first is leaving would switch the machine off behind it
    if (this.leaving || !this.account.user) return;
    this.leaving = true;
    const { name } = this.account.user;
    this.open = false;
    this.doing = null;
    this.render();
    try {
      try {
        await Promise.all([this.peel(), this.onLeaving()]);
        await this.account.signOut();
      } catch {
        // Still signed in: everything goes back where it was
        if (this.account.user) Toast.show("Couldn't sign out. Try again.", "warning");
        this.render();
        return;
      }
      // Set as text on the display, never as HTML; it is read once the machine is back on
      LcdMessage.show(["Signed out", `See you, ${name}`], 5600);
      this.press().catch(() => {});
    } finally {
      this.leaving = false;
      // Whatever went wrong on the way, the machine is never left switched off (FR-ACC-07)
      await this.onSignedOut();
    }
  }
}
