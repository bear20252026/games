/**
 * VoxRecorder
 * Records the microphone against the AudioContext clock.
 *
 * The browser's voice processing (echo cancellation, noise suppression,
 * auto gain) is switched off: it is built for calls, and it smears the
 * consonants the slicer needs. That means the mic hears the speakers, so
 * this wants headphones.
 *
 * What you sing in time with the beat reaches the recording late, by the
 * output latency (context → your ears) plus the input latency (mic →
 * context). capture() shifts its window by that much so the take lines up
 * with the bar you heard. Audio never leaves the browser.
 */

import { peakLevel } from "./OnsetDetector.js";

// Stopping a take sooner than this after it began discards it
const MIN_TAKE_SECONDS = 0.4;

const WORKLET_URL = new URL("../workers/captureWorklet.js", import.meta.url);

export class VoxRecorder {
  constructor(audioCtx) {
    this.audioCtx = audioCtx;
    this.workletReady = null;
    this.stream = null;
    this.source = null;
    this.node = null;
    this.chunks = [];
    this.pending = null;
    /** Called with the peak level (0-1) of each chunk while the mic is open — drives the input meter */
    this.onLevel = null;

    // Which input to record: a device id (null is the system default) and,
    // on an interface with two inputs, which of them ("mix", 0 or 1)
    this.deviceId = null;
    this.channel = "mix";
    // Monitoring: the input is also played back, for headphones
    this.monitoring = false;
    /** Set when the chosen device was missing and the default was opened instead */
    this.fellBack = false;
  }

  /** Ask for the microphone and start listening. Rejects if permission is refused. */
  async arm() {
    await this.open();
  }

  /** Open the chosen input, if it isn't open already */
  async open() {
    if (this.stream) return;
    const audio = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
      // Both inputs of an interface, where it has two
      channelCount: { ideal: 2 },
    };
    this.fellBack = false;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: this.deviceId ? { ...audio, deviceId: { exact: this.deviceId } } : audio,
      });
    } catch (error) {
      // The interface that was chosen has been unplugged: use what is there
      const missing = error?.name === "OverconstrainedError" || error?.name === "NotFoundError";
      if (!this.deviceId || !missing) throw error;
      this.deviceId = null;
      this.fellBack = true;
      this.stream = await navigator.mediaDevices.getUserMedia({ audio });
    }
    this.workletReady ??= this.audioCtx.audioWorklet.addModule(WORKLET_URL);
    await this.workletReady;

    this.chunks = [];
    this.source = this.audioCtx.createMediaStreamSource(this.stream);
    this.splitter = this.audioCtx.createChannelSplitter(2);
    this.source.connect(this.splitter);
    // One mono feed, whichever input it comes from, for the take and the monitor
    this.feed = new GainNode(this.audioCtx, { channelCount: 1, channelCountMode: "explicit" });
    this.node = new AudioWorkletNode(this.audioCtx, "capture-processor", {
      channelCount: 1,
      channelCountMode: "explicit",
    });
    this.node.port.onmessage = (e) => this.onChunk(e.data);
    // The node writes nothing to its output, but it has to reach the
    // destination for the graph to keep running it
    this.silence = this.audioCtx.createGain();
    this.silence.gain.value = 0;
    this.feed.connect(this.node).connect(this.silence).connect(this.audioCtx.destination);
    this.monitor = this.audioCtx.createGain();
    this.monitor.gain.value = this.monitoring ? 1 : 0;
    this.feed.connect(this.monitor).connect(this.audioCtx.destination);
    this.patch();
  }

  /** Route the chosen input of the device into the feed */
  patch() {
    if (!this.source) return;
    this.source.disconnect();
    this.splitter.disconnect();
    this.source.connect(this.splitter);
    // A device with one input only has "mix"
    if (this.channel === "mix" || this.getChannelCount() < 2) this.source.connect(this.feed);
    else this.splitter.connect(this.feed, this.channel);
  }

  /** How many inputs the open device has (1 for a plain microphone) */
  getChannelCount() {
    return this.stream?.getAudioTracks()[0]?.getSettings().channelCount ?? 1;
  }

  /** The id of the device that is open, as the browser reports it */
  getOpenDeviceId() {
    return this.stream?.getAudioTracks()[0]?.getSettings().deviceId ?? null;
  }

  /**
   * Every audio input the computer has. The names are only filled in once
   * the microphone has been allowed, so open() first.
   * @returns {Promise<Array<{deviceId: string, label: string}>>}
   */
  async listInputs() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((device) => device.kind === "audioinput" && device.deviceId !== "communications")
      .map(({ deviceId, label }) => ({ deviceId, label: label || "Microphone" }));
  }

  /**
   * Record from another device. If the mic is open it is reopened on that one.
   * @param {string|null} deviceId - null for the system default
   */
  async setInput(deviceId) {
    if (deviceId === this.deviceId) return;
    this.deviceId = deviceId;
    if (!this.stream) return;
    this.close();
    await this.open();
  }

  /** @param {"mix"|0|1} channel - Both inputs summed, or one of them */
  setChannel(channel) {
    this.channel = channel;
    this.patch();
  }

  /** Play the input back (or stop); the mic has to be open to hear it */
  setMonitor(on) {
    this.monitoring = on;
    this.monitor?.gain.setTargetAtTime(on ? 1 : 0, this.audioCtx.currentTime, 0.01);
  }

  /** Seconds between a beat leaving the context and your answer to it arriving back */
  getRoundTripLatency() {
    const inputLatency = this.stream?.getAudioTracks()[0]?.getSettings().latency ?? 0;
    return (
      (this.audioCtx.outputLatency || 0) + (this.audioCtx.baseLatency || 0) + (inputLatency || 0)
    );
  }

  /**
   * Resolve with the audio that was performed over a stretch of the loop.
   * @param {number} startTime - AudioContext time the stretch starts (e.g. a bar line)
   * @param {number} seconds - How long it is
   * @returns {Promise<AudioBuffer>}
   */
  capture(startTime, seconds) {
    const from = startTime + this.getRoundTripLatency();
    return new Promise((resolve, reject) => {
      this.pending = { from, to: from + seconds, seconds, resolve, reject };
    });
  }

  /** Name of the input device being recorded, as the browser reports it */
  getDeviceLabel() {
    return this.stream?.getAudioTracks()[0]?.label || "the microphone";
  }

  onChunk(chunk) {
    this.chunks.push(chunk);
    this.onLevel?.(peakLevel(chunk.samples));
    const pending = this.pending;
    if (!pending) {
      // Nothing asked for yet: keep only the last few seconds
      if (this.chunks.length > 200) this.chunks.shift();
      return;
    }

    const sampleRate = this.audioCtx.sampleRate;
    if (chunk.time + chunk.samples.length / sampleRate < pending.to) return;
    this.deliver();
  }

  /**
   * End the capture now and keep what has been performed so far; the rest
   * of the stretch is left silent.
   * @returns {boolean} False if there was nothing worth keeping yet
   */
  stopCapture() {
    const lastChunk = this.chunks[this.chunks.length - 1];
    if (!this.pending || !lastChunk) return false;

    const heardUntil = lastChunk.time + lastChunk.samples.length / this.audioCtx.sampleRate;
    if (heardUntil - this.pending.from < MIN_TAKE_SECONDS) return false;
    this.deliver();
    return true;
  }

  /** Cut the pending stretch out of the chunks heard so far and resolve with it */
  deliver() {
    const pending = this.pending;
    const sampleRate = this.audioCtx.sampleRate;

    // Chunks are contiguous, so one timestamp places every sample
    const firstTime = this.chunks[0].time;
    const length = Math.round(pending.seconds * sampleRate);
    const buffer = this.audioCtx.createBuffer(1, length, sampleRate);
    const out = buffer.getChannelData(0);
    const startIndex = Math.round((pending.from - firstTime) * sampleRate);

    let chunkStart = 0;
    for (const { samples } of this.chunks) {
      for (let i = 0; i < samples.length; i++) {
        const outIndex = chunkStart + i - startIndex;
        if (outIndex >= 0 && outIndex < length) out[outIndex] = samples[i];
      }
      chunkStart += samples.length;
    }

    this.pending = null;
    pending.resolve(buffer);
  }

  /** Drop any take in progress; the microphone is handed back unless it is being monitored */
  release() {
    this.pending?.reject(new Error("Recording cancelled"));
    this.pending = null;
    if (!this.monitoring) this.close();
  }

  /** Stop listening and hand the microphone back */
  close() {
    this.source?.disconnect();
    this.splitter?.disconnect();
    this.feed?.disconnect();
    this.monitor?.disconnect();
    this.node?.disconnect();
    this.silence?.disconnect();
    if (this.node) this.node.port.onmessage = null;
    for (const track of this.stream?.getTracks() ?? []) track.stop();
    this.stream = null;
    this.source = null;
    this.splitter = null;
    this.feed = null;
    this.monitor = null;
    this.node = null;
    this.silence = null;
    this.chunks = [];
  }
}
