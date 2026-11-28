/**
 * The records
 * Built-in loops are kept on records (ADR-0088): one of Knockbox's own, the
 * others guests'. Every loop is a file Knockbox may hand out (ADR-0043,
 * public/loops/SOURCES.md). A loop goes with a beat by its record and its own
 * id, as a built-in drum goes by its id (ADR-0049). The list is a file of the
 * site's, public/loops/records.json; with no such file, or nothing in it, the
 * desk shows nothing of this. No DOM.
 */

/** Whose record it is where it is not a guest's */
export const HOUSE = "Knockbox";

/**
 * Each: { id, title, by, store, cover, loops: [{ id, name, key, bpm }] }.
 * `store` is a guest's own shop and `cover` their own art, a file beside the
 * loops; either may be left out. A record is added only with its row in SOURCES.md.
 */
let RECORDS = [];

const ID = /^[a-z0-9-]+$/;

function wellMade(record) {
  return (
    ID.test(record?.id) &&
    typeof record.title === "string" &&
    typeof record.by === "string" &&
    Array.isArray(record.loops) &&
    record.loops.every((loop) => ID.test(loop?.id) && typeof loop.name === "string")
  );
}

/**
 * Take the list the site serves. A list that can't be fetched or read is no list.
 * @param {() => Promise<Array>} fetchList
 * @returns {Promise<Array>} The records there now are
 */
export async function loadRecords(fetchList) {
  try {
    const list = await fetchList();
    RECORDS = Array.isArray(list) ? list.filter(wellMade) : [];
  } catch {
    RECORDS = [];
  }
  return records();
}

/** The records there are, in the order they stand on the desk */
export function records(list = RECORDS) {
  return list.filter((record) => record.loops?.length > 0);
}

/** A record by its id, or null */
export function recordOf(id, list = RECORDS) {
  return records(list).find((record) => record.id === id) ?? null;
}

/** A guest's record carries their name; Knockbox's own does not */
export function isGuest(record) {
  return record.by !== HOUSE;
}

/** How a loop is kept with a beat: "<record>/<loop>" */
export function loopRef(recordId, loopId) {
  return `${recordId}/${loopId}`;
}

/**
 * The record and loop a beat's note of one stands for.
 * @param {string} ref - As loopRef makes it
 * @returns {{record: Object, loop: Object}|null} Null where there is no such loop (any more)
 */
export function loopOf(ref, list = RECORDS) {
  const [recordId, loopId] = String(ref ?? "").split("/");
  const record = recordOf(recordId, list);
  const loop = record?.loops.find((one) => one.id === loopId);
  return loop ? { record, loop } : null;
}

const REF = /^[a-z0-9-]+\/[a-z0-9-]+$/;
const isTime = (value) => value === undefined || value === null || Number.isFinite(value);

/**
 * Of a beat's takes, those that are built-in loops: what anyone but its maker is given, and
 * what a flip keeps (FR-OPEN-15). A built-in loop is named, never carried, so it can go where
 * the maker's own audio cannot. Only what a take is made of is let through. The Worker uses
 * this too.
 * @param {Object} [takes] - Per lane, as a snapshot has them
 * @returns {Object} Per lane: { record, trim, takeSeconds, fitted }
 */
export function builtInTakes(takes = {}) {
  const kept = {};
  for (const [lane, take] of Object.entries(takes ?? {})) {
    if (typeof take?.record !== "string" || !REF.test(take.record)) continue;
    const { record, trim, takeSeconds, fitted } = take;
    const whole = !trim || (Number.isFinite(trim.start) && Number.isFinite(trim.end));
    if (!whole || !isTime(takeSeconds)) continue;
    kept[lane] = {
      record,
      trim: trim ? { start: trim.start, end: trim.end } : trim,
      takeSeconds,
      fitted: typeof fitted === "boolean" ? fitted : undefined,
    };
  }
  return kept;
}

/** The file a loop is, in public/loops/ */
export function loopFile(recordId, loopId) {
  return `${recordId}/${loopId}.wav`;
}

/** A guest's own cover, in public/loops/, or null where the desk prints the sleeve */
export function coverFile(record) {
  return /^[a-z0-9-]+\.(jpg|png|webp)$/.test(record.cover ?? "")
    ? `${record.id}/${record.cover}`
    : null;
}

/** Where a built-in loop is from, as the loop's list and a sent beat say it */
export function loopCredit(ref, list = RECORDS) {
  const found = loopOf(ref, list);
  if (!found) return "";
  const { record } = found;
  return isGuest(record) ? `${record.title}, by ${record.by}` : record.title;
}

/**
 * What a listener is told of a sent beat's loop: a guest's record and name, and their shop.
 * @returns {{credit: string, store: string|null}|null} Null for Knockbox's own, or no such loop
 */
export function guestCredit(ref, list = RECORDS) {
  const found = loopOf(ref, list);
  if (!found || !isGuest(found.record)) return null;
  return { credit: loopCredit(ref, list), store: storeOf(found.record) };
}

/** A guest's shop, where they gave one that is a web address; else null */
export function storeOf(record) {
  if (!isGuest(record) || !record.store) return null;
  try {
    const url = new URL(record.store);
    return url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}
