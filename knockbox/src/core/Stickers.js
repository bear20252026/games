/**
 * Stickers
 * What a listener says a beat has got (ADR-0046): a drawn sticker for its
 * drums, its feel or its sample. Nobody types one. No DOM: the Worker uses
 * this too.
 */

/**
 * The stickers, in the order they lie on the sheet. `needs` is the tag a beat
 * must carry to be offered one (src/core/Tags.js); `said` is what people who
 * put it on are saying, for its maker's page.
 */
export const STICKERS = [
  { kind: "drums", words: ["Dirty", "drums"], said: "the drums are dirty" },
  { kind: "pocket", words: ["Pocket", "on point"], said: "the pocket's on point" },
  { kind: "chop", words: ["Nasty", "chop!"], needs: "LOOP", said: "the chop is nasty" },
];

export const STICKER_KINDS = STICKERS.map((sticker) => sticker.kind);

/** Where a sticker's drawing is kept, from any address on the site */
export const stickerArt = (kind) => `./public/stickers/${kind}.svg`;

/** A sticker's words as one line, for a screen reader: "Dirty drums" */
export function stickerName(kind) {
  return STICKERS.find((sticker) => sticker.kind === kind).words.join(" ");
}

/**
 * The stickers a beat is offered: one for each thing it has.
 * @param {string[]} [tags] - The beat's tags, as its sleeve shows them
 * @returns {string[]} Kinds, in the sheet's order
 */
export function stickersFor(tags = []) {
  return STICKERS.filter(({ needs }) => !needs || tags.includes(needs)).map(({ kind }) => kind);
}

/**
 * A beat's stickers as they are stacked on its sleeve: one of each kind it has,
 * the one most people put on last, so it lies on top. The sheet's order settles a tie.
 * @param {Object} [counts] - { drums: 7, pocket: 3 }
 * @returns {string[]} Kinds, bottom of the stack first
 */
export function stickerStack(counts = {}) {
  return STICKER_KINDS.filter((kind) => counts[kind] > 0)
    .map((kind, at) => ({ kind, at }))
    .sort((a, b) => counts[a.kind] - counts[b.kind] || b.at - a.at)
    .map(({ kind }) => kind);
}

/**
 * How many people put a sticker on, as its badge says it: whole up to 999,
 * then 1.2k, 34k, 1.5m. Never rounded up past what was counted.
 * @param {number} n
 * @returns {string}
 */
export function stickerCount(n) {
  if (n < 1000) return String(n);
  const [size, letter] = n < 1_000_000 ? [1000, "k"] : [1_000_000, "m"];
  const short = n / size < 100 ? Math.floor((n / size) * 10) / 10 : Math.floor(n / size);
  return `${short}${letter}`;
}

const SMALL = [
  "no",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
];

/** A count as a person would say it, to start a sentence: words up to twelve, figures after */
function spoken(n) {
  const word = SMALL[n] ?? String(n);
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * What a beat's stickers say, in plain words, for its maker's page.
 * @param {Object} [counts] - { drums: 7, pocket: 3 }
 * @returns {string[]} A line for each sticker it has, most first; none if it has none
 */
export function saidOf(counts = {}) {
  return STICKERS.filter(({ kind }) => counts[kind] > 0)
    .sort((a, b) => counts[b.kind] - counts[a.kind])
    .map(({ kind, said }, i) => {
      const n = counts[kind];
      // The first says it whole; the rest lean on it
      if (i > 0) return `${spoken(n)}, that ${said}.`;
      return `${spoken(n)} ${n === 1 ? "person says" : "people say"} ${said}.`;
    });
}
