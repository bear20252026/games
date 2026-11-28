/**
 * Clip worker
 * Makes CLIP's video off the page's thread (ADR-0030): draws every frame of
 * the scene, encodes picture and sound with WebCodecs, and writes the MP4.
 *
 * In:  { shape: [width, height], beat, hits, barSeconds, bars, logo, face, channels, sampleRate }
 * Out: { bytes } with the file, or { error } with why not
 */

import { CLIP_FPS, CLIP_PICTURE, CLIP_SOUND, clipLength } from "../core/Clip.js";
import { createScene } from "../core/ClipScene.js";
import { muxMp4 } from "../core/Mp4.js";

// The desk's own lettering; a worker has to fetch its own copy
const FONTS =
  "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@700&family=Permanent+Marker&display=swap";
// AAC is cut into frames of this many samples
const AAC_FRAME = 1024;

let lettering = null;
function letter(text) {
  lettering ??= (async () => {
    const css = await (await fetch(FONTS)).text();
    for (const block of css.match(/@font-face\s*{[^}]*}/g) ?? []) {
      const said = (name) => block.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1];
      const range = said("unicode-range");
      self.fonts.add(
        new FontFace(
          said("font-family").replace(/['"]/g, ""),
          said("src").match(/url\([^)]+\)/)[0],
          {
            weight: said("font-weight"),
            ...(range ? { unicodeRange: range } : {}),
          },
        ),
      );
    }
  })();
  return lettering.then(() =>
    Promise.all([
      self.fonts.load('400 40px "Permanent Marker"', text),
      self.fonts.load('700 20px "JetBrains Mono"', text),
    ]),
  );
}

const bytesOf = (chunk) => {
  const data = new Uint8Array(chunk.byteLength);
  chunk.copyTo(data);
  return data;
};
const described = (meta) => {
  const record = meta?.decoderConfig?.description;
  if (!record) return null;
  return record instanceof ArrayBuffer
    ? new Uint8Array(record)
    : new Uint8Array(record.buffer, record.byteOffset, record.byteLength).slice();
};
/** Wait while an encoder has more than it can take */
const room = (encoder, most) =>
  encoder.encodeQueueSize > most
    ? new Promise((done) => encoder.addEventListener("dequeue", done, { once: true }))
    : null;

async function picture({ shape: [width, height], beat, hits, barSeconds, bars, logo, face }) {
  const canvas = new OffscreenCanvas(width, height);
  const frame = createScene({ canvas, beat, hits, barSeconds, bars, logo, face });
  const samples = [];
  let description = null;
  let failed = null;
  let last = -1;
  const encoder = new VideoEncoder({
    output(chunk, meta) {
      description ??= described(meta);
      // The file has no way to say pictures are out of order; they never should be
      if (chunk.timestamp <= last) failed ??= new Error("pictures out of order");
      last = chunk.timestamp;
      samples.push({ data: bytesOf(chunk), key: chunk.type === "key" });
    },
    error(error) {
      failed ??= error;
    },
  });
  encoder.configure({
    ...CLIP_PICTURE,
    width,
    height,
    framerate: CLIP_FPS,
    avc: { format: "avc" },
  });
  const frames = Math.round(clipLength(barSeconds, bars) * CLIP_FPS);
  for (let f = 0; f < frames && !failed; f++) {
    frame(f / CLIP_FPS);
    const shot = new VideoFrame(canvas, {
      timestamp: Math.round((f * 1e6) / CLIP_FPS),
      duration: Math.round(1e6 / CLIP_FPS),
    });
    // A picture that stands alone every second, so the clip can be scrubbed and cut
    encoder.encode(shot, { keyFrame: f % CLIP_FPS === 0 });
    shot.close();
    await room(encoder, 6);
  }
  await encoder.flush();
  encoder.close();
  if (failed) throw failed;
  return { width, height, fps: CLIP_FPS, description, samples };
}

/**
 * How many samples an encoder runs in before the first real sound. It isn't
 * the same everywhere and nothing says, so a click is put through it and
 * back, and found again.
 */
async function runIn(config) {
  try {
    const at = AAC_FRAME * 4;
    const length = AAC_FRAME * 12;
    const pieces = [];
    let description = null;
    const encoder = new AudioEncoder({
      output(chunk, meta) {
        description ??= described(meta);
        pieces.push(chunk);
      },
      error() {},
    });
    encoder.configure(config);
    const data = new Float32Array(length * config.numberOfChannels);
    for (let c = 0; c < config.numberOfChannels; c++) data[c * length + at] = 0.9;
    const click = new AudioData({
      format: "f32-planar",
      sampleRate: config.sampleRate,
      numberOfFrames: length,
      numberOfChannels: config.numberOfChannels,
      timestamp: 0,
      data,
    });
    encoder.encode(click);
    click.close();
    await encoder.flush();
    encoder.close();

    let heard = 0;
    let peak = 0;
    let found = -1;
    const decoder = new AudioDecoder({
      output(piece) {
        const plane = new Float32Array(piece.numberOfFrames);
        piece.copyTo(plane, { planeIndex: 0, format: "f32-planar" });
        for (let i = 0; i < plane.length; i++) {
          if (Math.abs(plane[i]) > peak) {
            peak = Math.abs(plane[i]);
            found = heard + i;
          }
        }
        heard += piece.numberOfFrames;
        piece.close();
      },
      error() {},
    });
    decoder.configure({
      codec: config.codec,
      sampleRate: config.sampleRate,
      numberOfChannels: config.numberOfChannels,
      description,
    });
    for (const chunk of pieces) decoder.decode(chunk);
    await decoder.flush();
    decoder.close();
    const late = found - at;
    return peak > 0.1 && late >= 0 && late <= AAC_FRAME * 3 ? late : 0;
  } catch {
    return 0;
  }
}

async function sound({ channels, sampleRate }) {
  const samples = [];
  let description = null;
  let failed = null;
  let first = null;
  const encoder = new AudioEncoder({
    output(chunk, meta) {
      description ??= described(meta);
      first ??= chunk.timestamp;
      samples.push({ data: bytesOf(chunk) });
    },
    error(error) {
      failed ??= error;
    },
  });
  const config = { ...CLIP_SOUND, sampleRate, numberOfChannels: channels.length };
  encoder.configure(config);
  const length = channels[0].length;
  const block = AAC_FRAME * 8;
  for (let at = 0; at < length && !failed; at += block) {
    const count = Math.min(block, length - at);
    const data = new Float32Array(count * channels.length);
    for (const [c, channel] of channels.entries())
      data.set(channel.subarray(at, at + count), c * count);
    const piece = new AudioData({
      format: "f32-planar",
      sampleRate,
      numberOfFrames: count,
      numberOfChannels: channels.length,
      timestamp: Math.round((at / sampleRate) * 1e6),
      data,
    });
    encoder.encode(piece);
    piece.close();
    await room(encoder, 16);
  }
  await encoder.flush();
  encoder.close();
  if (failed) throw failed;
  // Some encoders say how far they ran in, by starting before zero; the rest are measured
  const priming = first < 0 ? Math.round((-first / 1e6) * sampleRate) : await runIn(config);
  return { sampleRate, channels: channels.length, description, samples, priming, frames: length };
}

self.onmessage = async ({ data: job }) => {
  try {
    await letter(`${job.beat.title}${job.beat.by}${job.beat.link}`);
    const video = await picture(job);
    const audio = await sound(job);
    const bytes = muxMp4({ video, audio });
    self.postMessage({ bytes }, [bytes.buffer]);
  } catch (error) {
    self.postMessage({ error: String(error?.message ?? error) });
  }
};
