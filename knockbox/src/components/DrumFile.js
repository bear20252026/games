/**
 * DrumFile
 * Reading a file for a drum row, however it got there (the row's own list, a drop on the
 * row, a folder dropped on the desk): what is refused and what is kept of it (ADR-0082).
 */

import { clock, DRUM_KEEP_SECONDS, drumRefusal, firstSeconds } from "../core/Caps.js";
import { encodeWav, keepFile } from "../core/FileUtils.js";

// How long a browser is given to say how long a file is before it is read anyway
const LENGTH_WAIT_MS = 1500;

/**
 * How long a file plays for, asked of the browser without reading the whole of it.
 * @param {File} file
 * @returns {Promise<number|null>} Seconds; null where the browser can't say
 */
export function mediaSeconds(file) {
  return new Promise((resolve) => {
    let url = null;
    const done = (seconds) => {
      if (url) URL.revokeObjectURL(url);
      resolve(Number.isFinite(seconds) && seconds > 0 ? seconds : null);
    };
    try {
      url = URL.createObjectURL(file);
      const media = new Audio();
      media.preload = "metadata";
      media.addEventListener("loadedmetadata", () => done(media.duration), { once: true });
      media.addEventListener("error", () => done(null), { once: true });
      setTimeout(() => done(null), LENGTH_WAIT_MS);
      media.src = url;
    } catch {
      done(null);
    }
  });
}

/**
 * @param {File} file
 * @param {BaseAudioContext} audioCtx
 * @returns {Promise<{refusal: string}|{audio: AudioBuffer, kept: Object, cut: string|null}>}
 *   The words of a refusal; or the sound, the file a saved beat carries, and, when only
 *   its start was kept, how long the file was
 * @throws When the file can't be read as audio
 */
export async function readDrumFile(file, audioCtx) {
  // Asked before it is read: a long piece is not decoded to be turned away
  const early = drumRefusal({ bytes: file.size, seconds: await mediaSeconds(file) });
  if (early) return { refusal: early };

  const bytes = await file.arrayBuffer();
  const whole = keepFile(file, bytes);
  const decoded = await audioCtx.decodeAudioData(bytes);
  const late = drumRefusal({ seconds: decoded.duration });
  if (late) return { refusal: late };

  const audio = firstSeconds(decoded, DRUM_KEEP_SECONDS, (shape) => new AudioBuffer(shape));
  if (audio === decoded) return { audio, kept: whole, cut: null };
  // Only what the pad can sound goes with a saved beat
  const channels = [];
  for (let c = 0; c < audio.numberOfChannels; c++) channels.push(audio.getChannelData(c));
  const kept = {
    name: `${file.name.replace(/\.[^.]*$/, "")}.wav`,
    type: "audio/wav",
    bytes: encodeWav(channels, audio.sampleRate),
  };
  return { audio, kept, cut: clock(decoded.duration) };
}
