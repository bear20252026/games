/**
 * Audition
 * Plays a beat from the crate where it sits, whole (ADR-0033): its drums
 * with their feel, and its maker's loop, vocal and own drum sounds where
 * they were shared with it. The beat is bounced out of sight, as the WAV
 * bounce would make it, and the bounce goes round until it is stopped. The
 * pads keep what is on them. No DOM.
 */

// Bounces kept, so going back to a beat just heard doesn't make it again
const KEPT = 6;

export class Audition {
  /**
   * @param {Object} parts
   * @param {AudioContext} parts.context
   * @param {(id: string) => Promise<{channels: Float32Array[], sampleRate: number, barSeconds?: number}|null>} parts.bounce -
   *   The beat's loop, or null when there is nothing in it to hear
   */
  constructor({ context, bounce }) {
    this.context = context;
    this.bounce = bounce;
    /** The id of the beat that is playing, or being made ready; else null */
    this.playing = null;
    this.source = null;
    this.kept = new Map();
    // One beat is made at a time: they share the desk they are made on
    this.making = Promise.resolve();
    /** Bounces on their way, by beat */
    this.going = new Map();
    /** What is heard now: { startedAt, barSeconds }; null while nothing is */
    this.sounding = null;
  }

  /**
   * Have a beat's loop ready without playing it: from what was kept, or bounced now.
   * @param {string} id
   * @param {number|string} [saved] - When the beat was last saved: one changed since is made again
   * @param {() => boolean} [wanted] - Asked when its turn comes; false calls the bounce off
   * @returns {Promise<Object|null>} The loop, or null when there is nothing in it to hear
   */
  make(id, saved = "", wanted = () => true) {
    const kept = this.kept.get(id);
    // Its maker has saved it since: what was kept is the old beat
    if (kept && kept.saved === saved) return Promise.resolve(kept);
    // Already on its way: asked for twice, it is still made once
    const going = this.going.get(id);
    if (going && going.saved === saved) return going.loop;

    const loop = this.alone(() => (wanted() ? this.bounce(id) : null))
      .then((made) => {
        if (!made) return null;
        const ready = { ...made, saved };
        // Put at the back, so the oldest kept is the first to go
        this.kept.delete(id);
        this.kept.set(id, ready);
        if (this.kept.size > KEPT) this.kept.delete(this.kept.keys().next().value);
        return ready;
      })
      .finally(() => {
        if (this.going.get(id)?.loop === loop) this.going.delete(id);
      });
    this.going.set(id, { saved, loop });
    return loop;
  }

  /**
   * Take a turn on the desk beats are made on, after whatever is being made.
   * @param {() => Promise<*>} job
   */
  alone(job) {
    const turn = this.making.then(job);
    this.making = turn.catch(() => {});
    return turn;
  }

  /**
   * Start a beat from its top, in place of whatever was playing.
   * @param {string} id
   * @param {number|string} [saved] - When the beat was last saved: one changed since is made again
   * @returns {Promise<boolean>} False when it was stopped before it could start, or has nothing to hear
   * @throws What `bounce` throws: the beat couldn't be fetched
   */
  async play(id, saved = "") {
    this.stop();
    this.playing = id;
    this.context.resume?.();
    let loop;
    try {
      loop = await this.make(id, saved, () => this.playing === id);
    } catch (error) {
      if (this.playing === id) this.playing = null;
      throw error;
    }
    // Stopped, or another beat pulled, while this one was being made
    if (this.playing !== id) return false;
    if (!loop) {
      this.playing = null;
      return false;
    }
    const { channels, sampleRate } = loop;
    const buffer = this.context.createBuffer(channels.length, channels[0].length, sampleRate);
    for (const [c, channel] of channels.entries()) buffer.copyToChannel(channel, c);
    this.source = this.context.createBufferSource();
    this.source.buffer = buffer;
    // The bounce is cut to whole bars, so it goes round without a seam
    this.source.loop = true;
    this.source.connect(this.context.destination);
    this.source.start();
    // For whoever lights lamps to it: when it began, on the context's clock, and how long a bar is
    this.sounding = { startedAt: this.context.currentTime, barSeconds: loop.barSeconds };
    return true;
  }

  /** Stop what is playing, or call off what is being made ready */
  stop() {
    if (this.playing === null) return;
    this.playing = null;
    this.sounding = null;
    this.source?.stop();
    this.source?.disconnect();
    this.source = null;
  }
}
