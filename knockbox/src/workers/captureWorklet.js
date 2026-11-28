/**
 * Capture worklet
 * Collects raw microphone samples on the audio thread and posts them to the
 * main thread in chunks, each stamped with the AudioContext time of its
 * first sample so the take can be lined up with the bar it was sung over.
 */

const CHUNK_FRAMES = 2048;

class CaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.chunk = new Float32Array(CHUNK_FRAMES);
    this.filled = 0;
    this.chunkTime = 0;
  }

  process(inputs) {
    const input = inputs[0]?.[0];
    if (!input) return true;

    // currentTime is the context time of this block's first frame
    let blockOffset = 0;
    while (blockOffset < input.length) {
      if (this.filled === 0) this.chunkTime = currentTime + blockOffset / sampleRate;

      const count = Math.min(input.length - blockOffset, CHUNK_FRAMES - this.filled);
      this.chunk.set(input.subarray(blockOffset, blockOffset + count), this.filled);
      this.filled += count;
      blockOffset += count;

      if (this.filled === CHUNK_FRAMES) {
        this.port.postMessage({ time: this.chunkTime, samples: this.chunk });
        this.chunk = new Float32Array(CHUNK_FRAMES);
        this.filled = 0;
      }
    }
    return true;
  }
}

registerProcessor("capture-processor", CaptureProcessor);
