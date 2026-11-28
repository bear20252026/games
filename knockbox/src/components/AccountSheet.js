/**
 * AccountSheet
 * The one sheet of paper that deals with email: sign in (ADR-0037). An
 * email, and a code and a link are sent to it. The code is typed here, on
 * the same sheet, so nobody has to leave the desk (ADR-0081); the link does
 * the same from the inbox. It is the way back in for whoever has that email
 * and the start of an account for whoever doesn't; a guest's name, face and
 * disks come along either way. No password, ever. It lies in the middle of
 * the desk with the lamp turned down, and goes with Esc or "not now" with
 * nothing lost.
 */

import { sheetWords } from "../core/Gate.js";

const BOT_SCRIPT = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// What a refusal says on the sheet
const REFUSALS = {
  bad_email: "that email doesn't look right",
  slow_down: "too many tries. give it an hour",
  bot_check_failed: "the robot check didn't pass. try again",
  mail_failed: "couldn't send the email. try again",
  offline: "can't reach the server. try again",
  bad_code: "six digits, from the email",
  code_wrong: "not that one. look again",
  code_dead: "that code is used up. send another",
};

// As long as the code in the email lasts
const CODE_MS = 15 * 60 * 1000;

/** Only the digits of what was typed or pasted, six at most */
export function codeFrom(typed) {
  return String(typed ?? "")
    .replace(/\D/g, "")
    .slice(0, 6);
}

// The email a code went to from this desk, so the sheet can be put away and come back to
let sentTo = null;
// The sheet that is out, to be put away from elsewhere
let putAway = null;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  // Names are typed by people: always text, never markup
  if (text !== undefined) node.textContent = text;
  return node;
}

function field(label, input) {
  const wrap = el("label", "account-field");
  wrap.append(el("span", "account-label", label), input);
  return wrap;
}

let botScript = null;

/** The bot check's own script, fetched the first time a sheet needs it */
function loadBotCheck() {
  botScript ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = BOT_SCRIPT;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
  return botScript;
}

/**
 * Lay the sheet on the desk and wait for it to be done with.
 * @param {Account} account
 * @param {{what?: string, saved?: boolean}} [why] - What was reached for, and whether
 *   the beat on the pads was saved first (FR-ACC-13)
 * @returns {Promise<{email: string, signedIn: boolean, left?: number}|{elsewhere: true}|null>}
 *   Signed in by the code; or an email sent and the sheet put away; or the browser signed in
 *   from another tab; or null, put away with nothing sent
 */
function open(account, why = {}) {
  return new Promise((resolve) => {
    const guest = account.user?.guest === true;
    const sheet = el("form", "account-sheet");
    sheet.noValidate = true;
    sheet.setAttribute("aria-label", "Sign in");
    const says = el("span", "account-says");
    says.setAttribute("role", "status");
    const say = (words) => {
      says.textContent = words;
    };
    // What was reached for, and that the beat is safe, where it is
    const reasons = sheetWords(why).map((line) => el("span", "account-why", line));
    let onSubmit = () => {};

    const close = (result) => {
      document.removeEventListener("keydown", onKey, true);
      putAway = null;
      veil.remove();
      resolve(result);
    };
    // Put away with an email out: the code can still be typed when the sheet is next laid down
    const leave = () => close(sentTo ? { email: sentTo.email, signedIn: false } : null);
    const onKey = (e) => {
      // Nothing typed here is one of the desk's shortcuts
      e.stopPropagation();
      if (e.key === "Escape") leave();
    };
    const laterKey = () => {
      const later = el("button", "account-later", guest ? "Not now" : "Never mind");
      later.type = "button";
      later.addEventListener("click", leave);
      return later;
    };

    /** The first step: where the code and the link are to go */
    const askEmail = (typed = "") => {
      sentTo = null;
      const email = el("input", "account-input");
      email.type = "email";
      email.autocomplete = "email";
      email.placeholder = "you@example.com";
      email.value = typed;

      // The bot check, where the server asks for one
      let botToken = null;
      const bot = el("div", "account-bot");
      if (account.botKey) {
        loadBotCheck()
          .then(() =>
            window.turnstile.render(bot, {
              sitekey: account.botKey,
              theme: "light",
              callback: (token) => {
                botToken = token;
              },
              "expired-callback": () => {
                botToken = null;
              },
            }),
          )
          .catch(() => say("the robot check didn't load. try again"));
      }

      const send = el("button", "desk-key is-hot", "Send my code");
      send.type = "submit";
      // One sheet for both: nobody has to know which of the two they are
      const small = el("span", "account-small", "No password. New or back again, it's the same. ");
      small.append(laterKey(), guest ? " keeps you a guest." : "");
      say("");
      sheet.replaceChildren(
        el("span", "account-title", "sign in"),
        ...reasons,
        field("Email", email),
        ...(account.botKey ? [bot] : []),
        send,
        says,
        small,
      );
      email.focus({ preventScroll: true });

      onSubmit = async () => {
        if (send.disabled) return;
        const to = email.value.trim();
        if (!to) return say("where should the code go?");
        if (account.botKey && !botToken) return say("tick the robot check first");
        send.disabled = true;
        say("sending...");
        try {
          const ticket = await account.askForLink({ email: to, botToken });
          sentTo = { email: to, ticket, at: Date.now() };
          askCode();
        } catch (error) {
          send.disabled = false;
          // A token is good once: the next try needs a new one
          if (account.botKey) {
            botToken = null;
            window.turnstile?.reset(bot);
          }
          say(REFUSALS[error.code] ?? "that didn't work. try again");
        }
      };
    };

    /** The second step: the code from the email, typed here */
    const askCode = () => {
      const code = el("input", "account-input account-code");
      code.type = "text";
      code.inputMode = "numeric";
      code.autocomplete = "one-time-code";
      code.maxLength = 6;
      code.setAttribute("aria-label", "The 6-digit code from the email");

      const go = el("button", "desk-key is-hot", "Sign in");
      go.type = "submit";
      const small = el("span", "account-small");
      const again = el("button", "account-later", "Send it again");
      again.type = "button";
      again.addEventListener("click", () => askEmail(sentTo?.email ?? ""));
      small.append(again, " or ", laterKey(), ". The link in the email works too.");
      // The address is theirs: shown as text
      const to = el("span", "account-why", `A code went to ${sentTo.email}.`);
      say("");
      sheet.replaceChildren(
        el("span", "account-title", "check your inbox"),
        ...reasons,
        to,
        code,
        go,
        says,
        small,
      );
      code.focus({ preventScroll: true });

      onSubmit = async () => {
        if (go.disabled) return;
        const typed = codeFrom(code.value);
        if (typed.length < 6) return say(REFUSALS.bad_code);
        go.disabled = true;
        say("signing in...");
        try {
          const { email, ticket } = sentTo;
          const { left } = await account.redeemCode(ticket, typed);
          sentTo = null;
          close({ email, signedIn: true, left });
        } catch (error) {
          go.disabled = false;
          say(REFUSALS[error.code] ?? "that didn't work. try again");
          if (error.code === "code_dead") sentTo = null;
          code.select();
        }
      };
      // The sixth digit is the last thing to type: no key to press after it
      code.addEventListener("input", () => {
        code.value = codeFrom(code.value);
        if (code.value.length === 6) onSubmit();
      });
    };

    sheet.addEventListener("submit", (e) => {
      e.preventDefault();
      onSubmit();
    });

    // The lamp turned down on the rest of the desk; a click on it changes nothing
    const veil = el("div", "account-veil");
    veil.append(sheet);
    document.body.append(veil);
    document.addEventListener("keydown", onKey, true);
    // Not the same as being put away by hand: what was reached for is still to be done, elsewhere
    putAway = () => close({ elsewhere: true });
    // A code already out from this desk and still good: straight to typing it
    if (sentTo && Date.now() - sentTo.at < CODE_MS) askCode();
    else askEmail();
  });
}

export const AccountSheet = {
  /** Resolves with how it ended: signed in by the code, an email out, or null when put away */
  signIn: open,
  /** The browser was signed in from elsewhere (the emailed link, in another tab): the sheet goes */
  putAway() {
    sentTo = null;
    putAway?.();
  },
};
