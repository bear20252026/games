/**
 * AudioJobs
 * The heavy listening and cutting a take needs (finding its hits and its
 * key, the note each chop is sung at, stretching a chop, packing a
 * recording down for upload), kept off the page's own thread so the desk
 * never stalls on it. No DOM.
 *
 * `runJob` is the work itself and runs anywhere: the audio worker calls
 * it, and so does anything with no worker to call (tests, a browser that
 * can't start one). `AudioJobs` is the desk's end of the worker.
 */

import { listenToLoop, soundingSteps } from "./Listen.js";
import { detectOnsets } from "./OnsetDetector.js";
import { canEncodeOpus, encodeOpus } from "./OpusEncoder.js";
import { stretchChannels } from "./Stretcher.js";
import { analyseKey, detectPitch } from "./Tuner.js";

/**
 * Do one job.
 * @param {string} job
 * @param {Object} work - What the job needs; see each case
 * @returns {Promise<{result: *, transfer?: ArrayBuffer[]}>} `transfer` names
 *   what can be handed over rather than copied
 */
export async function runJob(job, work) {
  switch (job) {
    // { mono, sampleRate, key: boolean } -> { onsets, key }
    case "listen": {
      const onsets = detectOnsets(work.mono, work.sampleRate);
      const key = work.key ? analyseKey(work.mono, work.sampleRate) : null;
      return { result: { onsets, key } };
    }
    // { mono, sampleRate, bars } -> what the drummer hears in a loop, or null
    case "hear":
      return { result: listenToLoop(work.mono, work.sampleRate, work.bars) };
    // { mono, sampleRate, bars } -> where a take sounds in the bar, or null
    case "sounding":
      return { result: soundingSteps(work.mono, work.sampleRate, work.bars) };
    // { chops: Float32Array[], sampleRate } -> (Hz | null)[], the note of each chop
    case "pitches": {
      const result = work.chops.map((chop) =>
        detectPitch(chop, work.sampleRate, 0, chop.length / work.sampleRate),
      );
      return { result };
    }
    // { channels, ratio, sampleRate } -> Float32Array[]
    case "stretch": {
      const result = stretchChannels(work.channels, work.ratio, work.sampleRate);
      return { result, transfer: result.map((channel) => channel.buffer) };
    }
    // { channels: number } -> boolean
    case "can-pack":
      return { result: await canEncodeOpus(work.channels) };
    // { channels: Float32Array[] at 48 kHz, inputRate } -> Uint8Array, an .ogg file
    case "pack": {
      const result = await encodeOpus(work.channels, work.inputRate);
      return { result, transfer: [result.buffer] };
    }
    default:
      throw new Error(`No such audio job: ${job}`);
  }
}

export class AudioJobs {
  /**
   * @param {() => Worker} [start] - Starts the audio worker. Without one, or
   *   if it can't be started, every job is done here on the caller's thread.
   */
  constructor(start = null) {
    this.start = start;
    this.worker = null;
    this.waiting = new Map();
    this.nextId = 1;
    /** Set once the worker has failed: from then on the work is done here */
    this.broken = start === null;
  }

  /**
   * @param {string} job
   * @param {Object} work
   * @returns {Promise<*>} The job's result
   */
  async run(job, work) {
    if (this.broken) return (await runJob(job, work)).result;
    try {
      this.worker ??= this.open();
    } catch {
      this.broken = true;
      return this.run(job, work);
    }
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.waiting.set(id, { resolve, reject, job, work });
      this.worker.postMessage({ id, job, work });
    });
  }

  open() {
    const worker = this.start();
    worker.onmessage = ({ data }) => {
      const asked = this.waiting.get(data.id);
      if (!asked) return;
      this.waiting.delete(data.id);
      if (data.error) asked.reject(new Error(data.error));
      else asked.resolve(data.result);
    };
    // The worker itself fell over (it couldn't be loaded): whatever was
    // asked of it is done here instead, and so is everything after
    worker.onerror = () => {
      this.broken = true;
      this.worker = null;
      const asked = [...this.waiting.values()];
      this.waiting.clear();
      for (const { resolve, reject, job, work } of asked) {
        runJob(job, work).then(({ result }) => resolve(result), reject);
      }
    };
    return worker;
  }
}
