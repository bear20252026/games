/**
 * ClipExporter
 * CLIP: the loop as a video to post (FR-REACH-01, ADR-0030). The sound is
 * the same offline render the WAV bounce uses, behind the tape going in;
 * the picture is ClipScene's. A worker draws and encodes it with WebCodecs
 * and writes an ordinary MP4, tall and square. Where a browser can't encode
 * both picture and sound that way, the tall clip is recorded as it plays
 * instead; where it can't make an MP4 at all, CLIP is not offered.
 */

import { Toast } from "../components/Toast.js";
import {
  CLIP_FPS,
  CLIP_LEAD,
  CLIP_PICTURE,
  CLIP_SHAPES,
  CLIP_SOUND,
  clipHits,
  clipLength,
  clipSound,
} from "./Clip.js";
import { createScene } from "./ClipScene.js";
import { downloadBytes } from "./FileUtils.js";
import { tapeGoingIn } from "./TapeSound.js";

const LOGO = "./public/images/knockbox-logo.svg";
const RECORDED = 'video/mp4;codecs="avc1.640028,mp4a.40.2"';

/**
 * How this browser can make the video.
 * @returns {Promise<"render"|"record"|null>}
 */
export async function clipRoute() {
  try {
    const [width, height] = CLIP_SHAPES.tall;
    const [picture, sound] = await Promise.all([
      VideoEncoder.isConfigSupported({ ...CLIP_PICTURE, width, height, framerate: CLIP_FPS }),
      AudioEncoder.isConfigSupported({ ...CLIP_SOUND, sampleRate: 44100, numberOfChannels: 2 }),
    ]);
    if (picture.supported && sound.supported && typeof OffscreenCanvas === "function")
      return "render";
  } catch {
    // No WebCodecs here
  }
  try {
    if (MediaRecorder.isTypeSupported(RECORDED) && HTMLCanvasElement.prototype.captureStream)
      return "record";
  } catch {
    // Nor a recorder
  }
  return null;
}

/** A drawing as pixels a worker can be handed */
async function bitmap(url, size) {
  const image = new Image();
  image.src = url;
  await image.decode();
  const canvas = new OffscreenCanvas(size, size);
  canvas.getContext("2d").drawImage(image, 0, 0, size, size);
  return canvas.transferToImageBitmap();
}

/**
 * The tape going in, ahead of the loop.
 * @returns {Promise<Float32Array[]>} CLIP_LEAD seconds, a channel each
 */
async function leadIn(sampleRate) {
  const ctx = new OfflineAudioContext(2, Math.round(CLIP_LEAD * sampleRate), sampleRate);
  tapeGoingIn(ctx, ctx.destination, 0, CLIP_LEAD);
  const made = await ctx.startRendering();
  return [made.getChannelData(0), made.getChannelData(1)];
}

export class ClipExporter {
  /**
   * @param {Object} parts
   * @param {AudioExporter} parts.audioExporter
   * @param {() => Promise<{title: string, by: string, face: string|null, link: string, out: boolean}>} parts.describe -
   *   What the clip says about the beat on the pads; `face` is a picture's address
   */
  constructor({ audioExporter, describe }) {
    this.audioExporter = audioExporter;
    this.describe = describe;
    this.busy = false;
  }

  /**
   * Bounce the loop to video and hand the tall one over to be saved.
   * @returns {Promise<{filename: string, files: Array}|null>} What was made, or null
   */
  async export() {
    if (this.busy) return null;
    this.busy = true;
    try {
      const route = await clipRoute();
      if (!route) {
        Toast.show("This browser can't make the video. Try Chrome or Safari.", "warning");
        return null;
      }
      const loop = await this.audioExporter.bounceLoop();
      if (!loop) return null;
      const { title, by, face, link, out } = await this.describe();
      const job = {
        beat: { title, by, link, out, bpm: loop.bpm },
        hits: clipHits(loop.events, loop.barSeconds, loop.bars),
        barSeconds: loop.barSeconds,
        bars: loop.bars,
        channels: clipSound(await leadIn(loop.sampleRate), loop.channels, loop.sampleRate),
        sampleRate: loop.sampleRate,
        logo: await bitmap(LOGO, 256).catch(() => null),
        face: face ? await bitmap(face, 184).catch(() => null) : null,
      };
      // Recording takes as long as the clip, so only the tall one is made that way
      const shapes = route === "render" ? Object.keys(CLIP_SHAPES) : ["tall"];
      const files = [];
      for (const shape of shapes) {
        const bytes = await (route === "render" ? this.render : this.record)({
          ...job,
          shape: CLIP_SHAPES[shape],
        });
        files.push({
          name: this.audioExporter.makeFilename(`clip-${shape}`, "mp4", shape === "tall"),
          label: shape,
          mime: "video/mp4",
          bytes,
        });
      }
      downloadBytes(files[0].bytes, files[0].name, "video/mp4");
      Toast.show("Clip bounced — ready to post", "success");
      return { filename: files[0].name, files };
    } catch (error) {
      console.error("Clip bounce failed:", error);
      Toast.show("Couldn't make the clip", "error");
      return null;
    } finally {
      this.busy = false;
    }
  }

  /** Drawn and encoded in a worker, faster than it plays */
  render(job) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(new URL("../workers/clipWorker.js", import.meta.url), {
        type: "module",
      });
      const done = (settle, value) => {
        worker.terminate();
        settle(value);
      };
      worker.onmessage = ({ data }) =>
        data.error ? done(reject, new Error(data.error)) : done(resolve, data.bytes);
      worker.onerror = (event) =>
        done(reject, new Error(event.message || "the clip worker failed"));
      worker.postMessage(job);
    });
  }

  /** Recorded as it plays, silently, where the browser can't encode it directly */
  async record({ shape: [width, height], channels, sampleRate, ...scene }) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    await Promise.all([
      document.fonts.load('400 40px "Permanent Marker"'),
      document.fonts.load('700 20px "JetBrains Mono"'),
    ]);
    const frame = createScene({ canvas, ...scene });
    frame(0);
    const ctx = new AudioContext({ sampleRate });
    const buffer = ctx.createBuffer(channels.length, channels[0].length, sampleRate);
    for (const [c, channel] of channels.entries()) buffer.copyToChannel(channel, c);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    // Into the recording only: nothing is heard while it is made
    const tap = ctx.createMediaStreamDestination();
    source.connect(tap);
    const recorder = new MediaRecorder(
      new MediaStream([...canvas.captureStream(CLIP_FPS).getTracks(), ...tap.stream.getTracks()]),
      {
        mimeType: RECORDED,
        videoBitsPerSecond: CLIP_PICTURE.bitrate,
        audioBitsPerSecond: CLIP_SOUND.bitrate,
      },
    );
    const pieces = [];
    recorder.ondataavailable = (event) => pieces.push(event.data);
    const stopped = new Promise((done) => {
      recorder.onstop = done;
    });
    const length = clipLength(scene.barSeconds, scene.bars);
    recorder.start();
    const from = ctx.currentTime + 0.05;
    source.start(from);
    await new Promise((done) => {
      const draw = () => {
        const t = ctx.currentTime - from;
        if (t >= length) return done();
        frame(Math.max(0, t));
        requestAnimationFrame(draw);
      };
      draw();
    });
    recorder.stop();
    await stopped;
    ctx.close();
    return new Uint8Array(await new Blob(pieces).arrayBuffer());
  }
}
