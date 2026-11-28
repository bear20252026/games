/**
 * Handover
 * A sign-in link opens a new tab, and the beat that was being made is on the
 * desk in the old one. The new desk asks the browser's other desks for what
 * is on them, and the one with a beat hands it over (ADR-0040). The channel
 * is the browser's own, between tabs of this site: nothing leaves it. No DOM.
 */

export const HANDOVER_CHANNEL = "knockbox-desk";
// How long a new desk waits for another to answer (ms)
export const HANDOVER_WAIT_MS = 700;

export class Handover {
  /**
   * @param {Object} parts
   * @param {{postMessage: Function, onmessage: Function|null}} parts.channel - A BroadcastChannel
   * @param {() => ({snapshot: Object, disk: Object|null, dirty: boolean}|null)} parts.carry -
   *   What is on this desk that is worth carrying; null when there is nothing
   * @param {Function} [parts.onGiven] - This desk's beat was handed to another
   * @param {number} [parts.wait]
   */
  constructor({ channel, carry, onGiven = () => {}, wait = HANDOVER_WAIT_MS }) {
    this.channel = channel;
    this.carry = carry;
    this.onGiven = onGiven;
    this.wait = wait;
    /** The ask this desk is waiting on an answer to */
    this.asking = null;
    this.asked = 0;
    channel.onmessage = ({ data }) => this.hear(data);
  }

  hear(data) {
    if (data?.type === "ask") {
      const beat = this.carry();
      if (!beat) return;
      this.channel.postMessage({ type: "beat", to: data.id, beat });
      this.onGiven();
    } else if (data?.type === "beat" && this.asking?.id === data.to) {
      // The first desk to answer is the one whose beat comes over
      this.asking.resolve(data.beat);
    }
  }

  /**
   * Ask the other desks for the beat on them.
   * @returns {Promise<{snapshot: Object, disk: Object|null, dirty: boolean}|null>} Null when
   *   no desk had one
   */
  ask() {
    return new Promise((resolve) => {
      const id = `${Date.now()}-${++this.asked}`;
      const timer = setTimeout(() => done(null), this.wait);
      const done = (beat) => {
        clearTimeout(timer);
        this.asking = null;
        resolve(beat);
      };
      this.asking = { id, resolve: done };
      this.channel.postMessage({ type: "ask", id });
    });
  }
}
