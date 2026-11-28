/**
 * Disks
 * A beat's journey to the server and back. A snapshot from Project holds its
 * audio as bytes; the server holds a beat's audio apart from it, one file
 * per hash, so on the way out each file is named by its hash and sent only
 * if the server lacks it, and on the way back each is fetched and put in
 * place again. No DOM.
 */

import { heaviestRow } from "./Caps.js";

/** @param {Uint8Array} bytes @returns {Promise<string>} SHA-256, as 64 hex characters */
export async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Save a snapshot as a new disk, or over an existing one.
 * @param {Api} api
 * @param {Object} snapshot - As Project.snapshot() made it
 * @param {string} [id] - The disk to write over; a new disk without it
 * @param {(file: Object) => Promise<Object>} [pack] - Packs a file down before
 *   it is sent (Packer.pack); without one every file goes as it is
 * @returns {Promise<Object>} The server's reply: { beat, upload, ... } and,
 *   for a new disk, { user, beats, limit }
 * @throws {ApiError} e.g. box_full, audio_too_big, offline
 */
export async function saveBeat(api, snapshot, id = null, pack = async (file) => file) {
  const files = new Map();
  const audio = [];
  for (const { role, ...file } of snapshot.audio) {
    const { name, type, bytes } = await pack(file);
    const sha256 = await sha256Hex(bytes);
    files.set(sha256, bytes);
    audio.push({ role, name, type, sha256, bytes: bytes.length });
  }

  const beat = { ...snapshot, audio };
  let saved = null;
  try {
    saved = id ? await api.updateBeat(id, beat) : await api.createBeat(beat);
  } catch (error) {
    // Too much audio for one disk: the maker is told which row to look at first
    if (error.code === "audio_too_big") error.heaviest = heaviestRow(audio);
    throw error;
  }
  for (const sha256 of saved.upload) await api.putAudio(sha256, files.get(sha256));
  return saved;
}

/**
 * Fetch a disk as a snapshot Project.restore() can take.
 * @param {Api} api
 * @param {string} id
 * @param {{listening?: boolean}} [how] - Only to be heard in the crate: not an open
 * @returns {Promise<Object>} The snapshot, with the beat's `id`, `by` and
 *   `mine` alongside. A file the server doesn't have is left out, and
 *   restore() reports it as missing.
 * @throws {ApiError} e.g. not_available, offline
 */
export async function loadBeat(api, id, how) {
  const beat = await api.getBeat(id, how);
  const audio = [];
  for (const { role, name, type, sha256 } of beat.audio) {
    try {
      audio.push({ role, name, type, bytes: await api.getAudio(sha256, beat.id) });
    } catch (error) {
      if (error.code !== "not_available") throw error;
    }
  }
  return { ...beat, audio };
}

/**
 * Put a beat's loop with it: what anyone but its maker hears of a beat sent
 * with its sounds (ADR-0042). The files it was made from stay its maker's.
 * @param {Api} api
 * @param {string} id
 * @param {Uint8Array} bytes - The loop, as a WAV
 */
export async function sendMix(api, id, bytes) {
  const sha256 = await sha256Hex(bytes);
  const { upload } = await api.putMix(id, { sha256, bytes: bytes.length });
  if (upload.includes(sha256)) await api.putAudio(sha256, bytes);
}

/**
 * Which of a box's disks are out with their sounds and have no loop to be heard by:
 * sent before loops were kept, or saved since on a desk that couldn't bounce one.
 * @param {Object[]} beats - As the box lists them
 */
export function mixesOwed(beats) {
  return beats.filter((beat) => beat.sentAt && beat.audioIncluded && !beat.mixed);
}

/**
 * A bounced loop as an Audition plays it.
 * @param {AudioBuffer} buffer
 * @param {number} bars - How many bars it holds
 */
export function loopOf(buffer, bars) {
  return {
    channels: Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c)),
    sampleRate: buffer.sampleRate,
    barSeconds: buffer.duration / bars,
  };
}
