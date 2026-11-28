/**
 * OpusEncoder
 * Turns a recording into an Ogg Opus file with the browser's own encoder
 * (WebCodecs). Runs in the audio worker: nothing here touches the page.
 * Where the browser has no such encoder, canEncodeOpus() says so and the
 * recording is kept as it was.
 */

import { OPUS_RATE, oggOpus, preSkipOf } from "./OggOpus.js";

// Bits a second for each channel: clear of what a phone speaker or earbuds can tell apart
export const OPUS_BITRATE_PER_CHANNEL = 64000;
// How much is handed to the encoder at a time (a second)
const BLOCK = OPUS_RATE;
// Silence after the end, so the encoder's last real samples come out the far side
const TAIL = 2880;

const config = (channels) => ({
  codec: "opus",
  sampleRate: OPUS_RATE,
  numberOfChannels: channels,
  bitrate: OPUS_BITRATE_PER_CHANNEL * channels,
});

/** Can this browser make Opus for this many channels? */
export async function canEncodeOpus(channels) {
  if (typeof AudioEncoder === "undefined" || channels < 1 || channels > 2) return false;
  try {
    return (await AudioEncoder.isConfigSupported(config(channels))).supported === true;
  } catch {
    return false;
  }
}

/**
 * @param {Float32Array[]} channels - One or two channels at 48 kHz
 * @param {number} [inputRate] - The rate of the recording it came from, for the file's header
 * @returns {Promise<Uint8Array>} An .ogg file that decodes to exactly as many samples as went in
 */
export async function encodeOpus(channels, inputRate = OPUS_RATE) {
  const samples = channels[0].length;
  const packets = [];
  const frames = [];
  let preSkip;
  let failed = null;
  const encoder = new AudioEncoder({
    output: (chunk, metadata) => {
      preSkip ??= preSkipOf(metadata?.decoderConfig?.description);
      const packet = new Uint8Array(chunk.byteLength);
      chunk.copyTo(packet);
      packets.push(packet);
      // Microseconds to samples; a packet with no length given is the usual 20 ms
      frames.push(chunk.duration ? Math.round((chunk.duration * OPUS_RATE) / 1e6) : 960);
    },
    error: (error) => {
      failed = error;
    },
  });
  encoder.configure(config(channels.length));

  const total = samples + TAIL;
  for (let at = 0; at < total && !failed; at += BLOCK) {
    const length = Math.min(BLOCK, total - at);
    // Planar: each channel's block one after the other
    const data = new Float32Array(length * channels.length);
    channels.forEach((channel, c) => {
      if (at < samples) data.set(channel.subarray(at, Math.min(samples, at + length)), c * length);
    });
    const block = new AudioData({
      format: "f32-planar",
      sampleRate: OPUS_RATE,
      numberOfFrames: length,
      numberOfChannels: channels.length,
      timestamp: Math.round((at / OPUS_RATE) * 1e6),
      data,
    });
    encoder.encode(block);
    block.close();
    // A long recording is fed no faster than it is encoded
    while (encoder.encodeQueueSize > 8 && !failed) await new Promise((r) => setTimeout(r, 0));
  }
  if (!failed) await encoder.flush();
  encoder.close();
  if (failed) throw failed;

  return oggOpus({ packets, frames, channels: channels.length, samples, preSkip, inputRate });
}
