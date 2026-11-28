/**
 * Decode
 * A file's bytes as audio the desk can play. The browser's own decoder is
 * asked first. A packed take (Ogg Opus, see Packing.js) that it won't read
 * is taken apart and its packets decoded one by one instead (WebCodecs).
 */

import { isOgg, OPUS_RATE, readOggOpus } from "./OggOpus.js";

/**
 * @param {BaseAudioContext} context
 * @param {Uint8Array} bytes
 * @param {{native?: boolean}} [how] - native false skips the browser's own decoder (for checking the other way)
 * @returns {Promise<AudioBuffer>}
 * @throws When neither way can read it
 */
export async function decodeAudio(context, bytes, { native = true } = {}) {
  let refused = null;
  if (native) {
    try {
      // Decoding empties the buffer it is given, so it gets a copy
      return await context.decodeAudioData(bytes.slice().buffer);
    } catch (error) {
      refused = error;
    }
  }
  if (!isOgg(bytes) || typeof AudioDecoder === "undefined") {
    throw refused ?? new Error("No decoder for this audio");
  }
  return decodeOpusPackets(readOggOpus(bytes));
}

/** @returns {Promise<AudioBuffer>} At 48 kHz, exactly as long as the sound that was packed */
async function decodeOpusPackets({ channels, preSkip, head, packets, samples }) {
  const blocks = [];
  let failed = null;
  const decoder = new AudioDecoder({
    output: (data) => {
      const planes = [];
      for (let c = 0; c < channels; c++) {
        const plane = new Float32Array(data.numberOfFrames);
        data.copyTo(plane, { planeIndex: c, format: "f32-planar" });
        planes.push(plane);
      }
      blocks.push(planes);
      data.close();
    },
    error: (error) => {
      failed = error;
    },
  });
  decoder.configure({
    codec: "opus",
    sampleRate: OPUS_RATE,
    numberOfChannels: channels,
    description: head,
  });
  packets.forEach((packet, i) => {
    decoder.decode(
      new EncodedAudioChunk({ type: "key", timestamp: i * 20000, duration: 20000, data: packet }),
    );
  });
  await decoder.flush();
  decoder.close();
  if (failed) throw failed;

  const decoded = blocks.reduce((sum, planes) => sum + planes[0].length, 0);
  // Some decoders drop the run-in themselves: whatever is over the sound's
  // length and the tail the encoder padded with is still to be skipped
  const padded = packets.length * 960;
  const skip = Math.max(0, preSkip - (padded - decoded));
  const length = Math.min(samples, decoded - skip);
  if (length <= 0) throw new Error("Nothing decoded");
  const buffer = new AudioBuffer({ length, numberOfChannels: channels, sampleRate: OPUS_RATE });
  for (let c = 0; c < channels; c++) {
    const out = buffer.getChannelData(c);
    let at = -skip;
    for (const planes of blocks) {
      const plane = planes[c];
      const from = Math.max(0, -at);
      const to = Math.min(plane.length, length - at);
      if (to > from) out.set(plane.subarray(from, to), at + from);
      at += plane.length;
    }
  }
  return buffer;
}
