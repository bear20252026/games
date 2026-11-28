/**
 * Clip
 * What CLIP's video is made from (ADR-0030): how long it runs, when each
 * drum is hit in it, and its sound. No DOM; the picture is ClipScene's.
 */

import { NUM_TRACKS } from "../constants/drums.js";

export const CLIP_FPS = 30;
// The tape goes in, the door shuts and PLAY goes down before the beat starts
export const CLIP_LEAD = 1.7;
// Tall for a phone's feed, square for everywhere else
export const CLIP_SHAPES = { tall: [1080, 1920], square: [1080, 1080] };
// H.264 high profile, level 4, and AAC: what phones and the apps on them play
export const CLIP_PICTURE = { codec: "avc1.640028", bitrate: 8_000_000 };
export const CLIP_SOUND = { codec: "mp4a.40.2", bitrate: 192_000 };
// The sound eases out with the light at the end
const FADE = 0.3;

/** Seconds of video for a beat of so many bars */
export function clipLength(barSeconds, bars) {
  return CLIP_LEAD + barSeconds * bars;
}

/**
 * When each drum is hit in the bars that are kept, in seconds from their top.
 * @param {Array<{track: number|string, time: number}>} events - From AudioExporter.collectEvents: a lead-in bar, the kept bars, one more
 * @returns {number[][]} A sorted list for each drum
 */
export function clipHits(events, barSeconds, bars) {
  const hits = Array.from({ length: NUM_TRACKS }, () => []);
  for (const { track, time } of events) {
    const at = time - barSeconds;
    // A hit played ahead of the one still belongs to it
    if (hits[track] && at > -0.05 && at < barSeconds * bars) hits[track].push(Math.max(0, at));
  }
  return hits.map((times) => times.sort((a, b) => a - b));
}

/** How much of a drum's last hit is still ringing at a moment: 1 on the hit, fading at `rate` */
export function ringing(hits, at, rate) {
  let last = -1;
  for (const hit of hits) {
    if (hit > at) break;
    last = hit;
  }
  return last < 0 ? 0 : Math.exp(-(at - last) * rate);
}

/**
 * The clip's sound: the tape going in, then the loop, easing out at the end.
 * @param {Float32Array[]} lead - CLIP_LEAD seconds, a channel each
 * @param {Float32Array[]} loop - The kept bars, a channel each
 * @returns {Float32Array[]}
 */
export function clipSound(lead, loop, sampleRate) {
  const fade = Math.min(loop[0].length, Math.round(FADE * sampleRate));
  return loop.map((channel, c) => {
    const sound = new Float32Array(lead[c].length + channel.length);
    sound.set(lead[c]);
    sound.set(channel, lead[c].length);
    for (let i = 0; i < fade; i++) sound[sound.length - 1 - i] *= i / fade;
    return sound;
  });
}

/** What the stamp says to type: the beat's own link once it is out, else the desk's */
export function clipLink(id) {
  return id ? `knockbox.app/b/${id}` : "knockbox.app";
}
