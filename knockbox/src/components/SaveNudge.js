/**
 * SaveNudge
 * A strip of tape that points at the SAVE key, once: the first time a
 * visitor has a beat of their own playing ("keep this one? hit SAVE"). It is
 * never shown again on that browser, and never to someone who has saved.
 */

const SEEN_KEY = "knockbox.saveNudgeSeen";
const SHOW_MS = 9000;

/**
 * Is this the moment for it?
 * @param {Object} now
 * @param {boolean} now.seen - It has been shown on this browser before
 * @param {boolean} now.ready - The SAVE key is on the desk
 * @param {boolean} now.playing
 * @param {string} now.status - DiskDrive.status()
 * @param {Object|null} now.user - Somebody, once they have saved
 * @param {boolean} now.busy - Something else has the visitor's attention (the tour)
 */
export function wantsNudge({ seen, ready, playing, status, user, busy }) {
  return !seen && ready && playing && status === "unsaved" && !user && !busy;
}

export class SaveNudge {
  /**
   * @param {Object} options
   * @param {Store} options.store
   * @param {DiskDrive} options.disks
   * @param {() => boolean} options.isBusy
   */
  constructor({ store, disks, isBusy }) {
    this.store = store;
    this.disks = disks;
    this.isBusy = isBusy;
    this.key = document.querySelector("#save-btn");
    this.label = document.querySelector("#save-nudge");
    this.timer = null;
  }

  init() {
    this.store.subscribeToSelector(
      (state) => state.transport.isPlaying,
      () => this.check(),
    );
    this.disks.onChange(() => this.check());
    // Pressing the key is the answer to it
    this.key.addEventListener("click", () => this.hide());
  }

  hasSeen() {
    try {
      return localStorage.getItem(SEEN_KEY) === "1";
    } catch {
      return true; // storage is blocked: don't nag on every visit
    }
  }

  check() {
    const { disks } = this;
    const moment = wantsNudge({
      seen: this.hasSeen(),
      ready: disks.ready,
      playing: this.store.getState().transport.isPlaying,
      status: disks.status(),
      user: disks.user,
      busy: this.isBusy(),
    });
    if (moment) this.show();
  }

  show() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      return;
    }
    // Over the middle of the key, wherever the strip has put it
    this.label.style.left = `${this.key.offsetLeft + this.key.offsetWidth / 2}px`;
    this.label.hidden = false;
    this.timer = setTimeout(() => this.hide(), SHOW_MS);
  }

  hide() {
    clearTimeout(this.timer);
    this.label.hidden = true;
  }
}
