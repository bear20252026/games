/**
 * Caps
 * How much audio a row takes (ADR-0082): what is refused, in the words it is refused
 * with, and what is kept of what is taken. No DOM.
 */

import { OWN_VOICE_SECONDS } from "./AudioEngine.js";

/** A file heavier than this is not read at all */
export const FILE_REFUSE_BYTES = 150 * 1024 * 1024;
/** A drum row is for a hit, not a piece: longer than this belongs on the loop row */
export const DRUM_REFUSE_SECONDS = 30;
/** What a drum row keeps of a file: as long as a pad can sound */
export const DRUM_KEEP_SECONDS = OWN_VOICE_SECONDS;
/** The loop and vocal rows take a whole song to dig through, and no more */
export const TAKE_REFUSE_SECONDS = 10 * 60;

/** What a saved beat carries of a loop or vocal beside the part that is heard, either side */
export const KEEP_EITHER_SIDE_SECONDS = 4;
/** And the most it carries, unless the part heard is itself longer */
export const KEEP_AT_MOST_SECONDS = 2 * 60;
// Less than this cut away is not worth writing the file again for
const WORTH_CUTTING_SECONDS = 1;

/** Seconds as a clock reads them: 134 is 2:14 */
export function clock(seconds) {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}

function megabytes(bytes) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

function tooHeavy(bytes) {
  return bytes > FILE_REFUSE_BYTES
    ? `That file is ${megabytes(bytes)}. A row takes up to 150 MB.`
    : null;
}

/**
 * Why a drum row will not take a file, if it will not.
 * @param {Object} file
 * @param {number} [file.bytes] - Its size
 * @param {number|null} [file.seconds] - Its length, where it is known yet
 * @returns {string|null} The words for the maker; null when the row takes it
 */
export function drumRefusal({ bytes = 0, seconds = null }) {
  if (tooHeavy(bytes)) return tooHeavy(bytes);
  if (seconds === null || !(seconds > DRUM_REFUSE_SECONDS)) return null;
  return `That's ${clock(seconds)} long. A drum row takes up to 30 seconds: drop it on the loop row to chop it.`;
}

/**
 * Why the loop or vocal row will not take a file, if it will not.
 * @param {Object} file - As drumRefusal's
 * @returns {string|null}
 */
export function takeRefusal({ bytes = 0, seconds = null }) {
  if (tooHeavy(bytes)) return tooHeavy(bytes);
  if (seconds === null || !(seconds > TAKE_REFUSE_SECONDS)) return null;
  return `That's ${clock(seconds)} long. This row takes up to 10 minutes: cut it down first.`;
}

/**
 * The start of some audio, as audio of its own.
 * @param {AudioBuffer} buffer
 * @param {number} seconds
 * @param {(shape: {length: number, numberOfChannels: number, sampleRate: number}) => AudioBuffer} make
 * @returns {AudioBuffer} The buffer itself when it is no longer than that
 */
export function firstSeconds(buffer, seconds, make) {
  const length = Math.round(seconds * buffer.sampleRate);
  if (buffer.length <= length) return buffer;
  const { numberOfChannels, sampleRate } = buffer;
  const cut = make({ length, numberOfChannels, sampleRate });
  for (let c = 0; c < numberOfChannels; c++) {
    cut.copyToChannel(buffer.getChannelData(c).subarray(0, length), c);
  }
  return cut;
}

/**
 * The part of a loop's or vocal's file a saved beat carries: what is heard, with a few
 * seconds either side to trim into again.
 * @param {{start: number, end: number}} heard - The part of the file on the row, in seconds
 * @param {number} duration - The file's length
 * @returns {{from: number, to: number}|null} Null when the whole file goes
 */
export function keptSpan(heard, duration) {
  let from = Math.max(0, heard.start - KEEP_EITHER_SIDE_SECONDS);
  let to = Math.min(duration, heard.end + KEEP_EITHER_SIDE_SECONDS);
  if (to - from > KEEP_AT_MOST_SECONDS) {
    // What is heard always goes; what is left of the two minutes is shared either side
    const spare = Math.max(0, KEEP_AT_MOST_SECONDS - (heard.end - heard.start)) / 2;
    from = Math.max(0, heard.start - spare);
    to = Math.min(duration, heard.end + spare);
  }
  return duration - (to - from) < WORTH_CUTTING_SECONDS ? null : { from, to };
}

/**
 * Which of a beat's files is the heaviest.
 * @param {Array<{role: string, bytes: number}>} audio - As a save sends it: bytes is a count
 * @returns {"loop"|"vocal"|"drum"|null} Null for a beat with no audio
 */
export function heaviestRow(audio = []) {
  const most = audio.reduce((top, file) => (file.bytes > (top?.bytes ?? 0) ? file : top), null);
  if (!most) return null;
  return most.role.startsWith("drum:") ? "drum" : most.role;
}
