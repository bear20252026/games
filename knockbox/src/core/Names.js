/**
 * Names
 * The rules for the name on a person's sticker (FR-ACC-02): 3 to 20
 * characters of a-z, 0-9 and underscore, in either case. Two names that
 * differ only in case are the same name. The desk and the server both
 * read the rules from here. No DOM.
 */

export const NAME_MIN = 3;
export const NAME_MAX = 20;

/**
 * What is wrong with a name, if anything.
 * @param {*} name
 * @returns {null|"too_short"|"too_long"|"bad_letters"}
 */
export function nameProblem(name) {
  if (typeof name !== "string" || name.length < NAME_MIN) return "too_short";
  if (name.length > NAME_MAX) return "too_long";
  return /^[A-Za-z0-9_]+$/.test(name) ? null : "bad_letters";
}

/** What makes a name taken: the name with its case flattened */
export function nameKey(name) {
  return name.toLowerCase();
}

/**
 * Names to offer in place of one that is taken, likeliest first: the same
 * name with a number on the end, cut to fit.
 * @param {string} name - Within the rules
 * @param {number[]} numbers - What to try on the end
 * @returns {string[]}
 */
export function alternatives(name, numbers) {
  return numbers.map((number) => {
    const end = `_${number}`;
    return name.slice(0, NAME_MAX - end.length) + end;
  });
}

/**
 * What to say about a name as it is typed, from the server's answer.
 * @param {{free: boolean, problem?: string, suggestion?: string|null}} check
 * @returns {{ok: boolean, words: string, suggestion: string|null}}
 */
export function nameAdvice({ free, problem, suggestion = null }) {
  if (free) return { ok: true, words: "free", suggestion: null };
  const words = {
    too_short: `${NAME_MIN} letters at least`,
    too_long: `${NAME_MAX} letters at most`,
    bad_letters: "letters, numbers and _ only",
    taken: suggestion ? "taken. try " : "taken",
  }[problem];
  return { ok: false, words: words ?? "can't use that one", suggestion };
}
