/**
 * LoopTry
 * A loop off a record, heard over the beat before it is taken (ADR-0088). It
 * is made as long as its bars are at the desk's tempo, at the pitch it was
 * played, and comes in on the first step of the next bar, going round until
 * it is stopped. Nothing is put on the desk: the pads and the loop's row keep
 * what is on them. No DOM.
 */

// Loops made ready, so going back to one just heard doesn't make it again
const KEPT = 4;
// Long enough that coming in and going out don't click
const FADE_SECONDS = 0.03;

/**
 * How much longer a loop must be made to go round in time: new length over old.
 * @param {number} loopBpm - The tempo it was played at
 * @param {number} deskBpm
 */
export function tryRatio(loopBpm, deskBpm) {
  return loopBpm > 0 && deskBpm > 0 ? loopBpm / deskBpm : 1;
}

export class LoopTry {
  /**
   * @param {Object} parts
   * @param {BaseAudioContext} parts.context
   * @param {AudioNode} parts.dest - Where the desk's sound goes
   * @param {(ref: string) => Promise<AudioBuffer>} parts.fetchBuffer - A loop's audio, by its record and id
   * @param {(channels: Float32Array[], ratio: number, sampleRate: number) => Promise<Float32Array[]>} parts.stretch
   * @param {() => number} parts.getBpm - The desk's tempo
   */
  constructor({ context, dest, fetchBuffer, stretch, getBpm }) {
    this.context = context;
    this.dest = dest;
    this.fetchBuffer = fetchBuffer;
    this.stretch = stretch;
    this.getBpm = getBpm;
    /** The loop asked for last: { ref, loop }; null when none is */
    this.asked = null;
    /** That loop, made for a tempo and waiting for a bar or sounding: { ref, bpm, buffer } */
    this.ready = null;
    /** What is sounding: { source, gain }; null while nothing is */
    this.voice = null;
    this.kept = new Map();
  }

  /**
   * Hear a loop from the next bar on, in place of any being heard.
   * @param {string} ref - Its record and id, as it is kept with a beat
   * @param {{bpm?: number}} loop
   * @returns {Promise<boolean>} False where another was asked for, or it was stopped, in the meantime
   */
  async want(ref, loop) {
    this.silence();
    this.ready = null;
    const asked = { ref, loop };
    this.asked = asked;
    const bpm = this.getBpm();
    const buffer = await this.make(ref, loop, bpm);
    if (this.asked !== asked) return false;
    this.ready = { ref, bpm, buffer };
    return true;
  }

  /** The loop at a tempo: from what was kept, or fetched and made now */
  async make(ref, loop, bpm) {
    const id = `${ref}@${bpm}`;
    if (this.kept.has(id)) return this.kept.get(id);
    const raw = await this.fetchBuffer(ref);
    const ratio = tryRatio(loop.bpm, bpm);
    let buffer = raw;
    if (Math.abs(ratio - 1) > 0.001) {
      const channels = [];
      for (let c = 0; c < raw.numberOfChannels; c++) channels.push(raw.getChannelData(c).slice());
      const made = await this.stretch(channels, ratio, raw.sampleRate);
      buffer = this.context.createBuffer(made.length, made[0].length, raw.sampleRate);
      for (const [c, channel] of made.entries()) buffer.copyToChannel(channel, c);
    }
    this.kept.set(id, buffer);
    if (this.kept.size > KEPT) this.kept.delete(this.kept.keys().next().value);
    return buffer;
  }

  /**
   * The clock's tick. A loop that is ready comes in on a bar's first step; one made for
   * a tempo the desk has since left is made again.
   * @param {number} totalSteps - Steps since the beat started
   * @param {number} time - When that step sounds
   */
  handleTick(totalSteps, time) {
    if (!this.ready) return;
    if (this.ready.bpm !== this.getBpm()) {
      this.want(this.asked.ref, this.asked.loop).catch(() => this.stop());
      return;
    }
    if (this.voice || totalSteps % 16 !== 0) return;
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = this.ready.buffer;
    source.loop = true;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(1, time + FADE_SECONDS);
    source.connect(gain);
    gain.connect(this.dest);
    source.start(time);
    this.voice = { source, gain };
  }

  /** Stop what is sounding; a loop that is ready comes in again on the next bar */
  silence() {
    if (!this.voice) return;
    const { source, gain } = this.voice;
    const now = this.context.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(gain.gain.value, now);
    gain.gain.linearRampToValueAtTime(0, now + FADE_SECONDS);
    source.stop(now + FADE_SECONDS + 0.01);
    this.voice = null;
  }

  /** Nothing is being tried any more */
  stop() {
    this.silence();
    this.asked = null;
    this.ready = null;
  }
}
