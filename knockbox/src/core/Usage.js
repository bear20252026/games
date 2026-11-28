/**
 * Usage
 * Tells the server that something happened on the desk, so it can be counted
 * (ADR-0019). Only the thing's name is sent, and each thing at most once a
 * visit: a count is the number of visits in which it happened. No DOM.
 */

/** How long the desk is in view before a visit is one that stayed */
export const STAY_SECONDS = 300;

export class Usage {
  /**
   * @param {Object} parts
   * @param {(name: string) => Promise<*>} parts.send
   */
  constructor({ send }) {
    this.send = send;
    this.counted = new Set();
    /** Seconds the desk has been in view this visit */
    this.inView = 0;
  }

  /**
   * More time has gone by with the desk in view: at five minutes the visit is one that stayed.
   * @param {number} seconds
   */
  passed(seconds) {
    this.inView += seconds;
    if (this.inView >= STAY_SECONDS) this.count("stayed");
  }

  /**
   * Someone else's beat started playing here: its maker's play count, once
   * a visit for each beat (the server keeps it to once a day for each listener).
   * @param {string} id
   * @param {(id: string) => Promise<*>} tell
   */
  heard(id, tell) {
    const key = `beat:${id}`;
    if (this.counted.has(key)) return;
    this.counted.add(key);
    Promise.resolve()
      .then(() => tell(id))
      .catch(() => {});
  }

  /** @param {string} name - One of the server's DESK_EVENTS */
  count(name) {
    if (this.counted.has(name)) return;
    this.counted.add(name);
    // Counting is never in the desk's way: a count that can't be sent is let go
    Promise.resolve()
      .then(() => this.send(name))
      .catch(() => {});
  }
}
