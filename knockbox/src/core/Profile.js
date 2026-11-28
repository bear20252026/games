/**
 * Profile
 * The words on a person's page, /u/<name> (ADR-0009): worked out here from
 * what the server hands over, so the page itself only has to draw them.
 * No DOM.
 */

import { FACES } from "./Faces.js";

const DAY = 24 * 60 * 60 * 1000;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// What the page says when the server refuses something
export const PAGE_REFUSALS = {
  offline: "Couldn't reach the server. Nothing was changed.",
  no_session: "You're signed out. Sign in at the desk, then come back.",
  not_found: "That disk isn't there any more.",
  bad_title: "A label needs 1 to 40 characters.",
  sending_blocked: "This account can't send beats any more.",
  rules_required: "Tick the house rules first.",
  slow_down: "That's a lot at once. Try again in a while.",
};

/** What to say about a refusal; anything unforeseen gets the plain line */
export function refusal(error) {
  return PAGE_REFUSALS[error?.code] ?? "That didn't work. Nothing was changed.";
}

/**
 * Whose page an address is.
 * @param {string} pathname - e.g. "/u/dusty_fingers"
 * @returns {string|null} The name, or null where the address is not a person's page
 */
export function profileNameFrom(pathname) {
  const found = /^\/u\/([^/]+)\/?$/.exec(pathname);
  if (!found) return null;
  try {
    return decodeURIComponent(found[1]);
  } catch {
    return null;
  }
}

/** @returns {string} A person's page, as a path on this site */
export function profilePath(name) {
  return `/u/${encodeURIComponent(name)}`;
}

/** @returns {string} Where a face's picture is, from any page; a name not among the sixteen gets the first */
export function facePath(face) {
  return `./public/faces/${FACES.includes(face) ? face : FACES[0]}.svg`;
}

/**
 * How long ago something happened, in a few words.
 * @param {number} then - ms
 * @param {number} [now]
 */
export function ago(then, now = Date.now()) {
  const days = Math.floor((now - then) / DAY);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 14) return "last week";
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

const flipsWords = (flips) => (flips === 1 ? "1 flip" : `${flips} flips`);
const playsWords = (plays) => (plays === 1 ? "1 play" : `${plays} plays`);

/**
 * The line under a beat's title.
 * @param {Object} beat - As the profile lists it
 * @param {Object} [options]
 * @param {boolean} [options.mine] - The owner is told when it was saved; anyone else when it went out
 * @param {number} [options.now]
 */
export function beatLine(beat, { mine = false, now = Date.now() } = {}) {
  const parts = [`${beat.bpm} bpm`];
  parts.push(mine ? `saved ${ago(beat.updatedAt ?? beat.createdAt, now)}` : ago(beat.sentAt, now));
  if (beat.flippedFrom) parts.push(`flipped from ${beat.flippedFrom}`);
  // What a beat that is out has done: how many heard it, how many made something of it
  if (beat.plays > 0) parts.push(playsWords(beat.plays));
  if (beat.flips > 0) parts.push(flipsWords(beat.flips));
  return parts.join(" · ");
}

/** "making beats since Nov 2026" */
export function sinceLine(since) {
  const date = new Date(since);
  return `making beats since ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

/** How many of a person's beats are out, for a visitor */
export function outLine(count) {
  if (count === 0) return "no beats out yet";
  return count === 1 ? "1 beat out" : `${count} beats out`;
}

/** The heading over the owner's disks */
export function boxLine(count, limit) {
  // A box with no limit (ADR-0039) has no "of"
  if (limit === null) return `My beats · ${count} disks`;
  return `My beats · ${count} of ${limit} disks`;
}

/** What is left in the box, on the dashed slot under the disks */
export function blankLine(count, limit) {
  if (limit === null) return "room for more";
  const blank = Math.max(0, limit - count);
  if (blank === 0) return "the box is full";
  return blank === 1 ? "1 blank disk left" : `${blank} blank disks left`;
}
