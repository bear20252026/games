/**
 * Account
 * Who this browser is, and how that changes: a guest's name and face, the
 * emailed link or code that signs a browser in (and makes a guest a real
 * account), and signing out. The person themselves is kept by the disk
 * drive (`disks.user`), which is told of every change. No DOM.
 */

/**
 * The key an emailed sign-in link carries, from the page's address.
 * @param {string} hash - `location.hash`
 * @returns {string|null}
 */
export function keyFrom(hash) {
  const key = /^#key=([\w-]+)$/.exec(hash ?? "")?.[1];
  return key ?? null;
}

export class Account {
  /**
   * @param {Object} parts
   * @param {Api} parts.api
   * @param {DiskDrive} parts.disks
   */
  constructor({ api, disks }) {
    this.api = api;
    this.disks = disks;
  }

  /** @returns {{name: string, face: string, guest: boolean}|null} */
  get user() {
    return this.disks.user;
  }

  /** The site key of the bot check the email forms must pass; null where there is none */
  get botKey() {
    return this.disks.botKey;
  }

  became(reply) {
    this.disks.took(reply);
    this.disks.changed();
  }

  /** Is a name free: { free, problem?, suggestion? } */
  checkName(name) {
    return this.api.checkName(name);
  }

  async rename(name) {
    this.became(await this.api.updateMe({ name }));
  }

  async setFace(face) {
    this.became(await this.api.updateMe({ face }));
  }

  /**
   * Ask for a sign-in email: back into the account that has the email, or the
   * start of one. Says nothing about which.
   * @returns {Promise<string>} The ticket the email's code is good with, in this browser
   */
  async askForLink({ email, botToken }) {
    return (await this.api.signIn({ email, botToken })).ticket;
  }

  /**
   * Hand over the code typed from the email: this browser becomes that person,
   * without leaving the desk (FR-ACC-12).
   * @returns {Promise<{left: number}>} `left`: beats of a guest there was no room for
   */
  async redeemCode(ticket, code) {
    const reply = await this.api.redeemCode(ticket, code);
    await this.settle(reply);
    return { left: reply.left };
  }

  /**
   * Hand over the key from an emailed link: this browser becomes that person.
   * @returns {Promise<{left: number}>} `left`: beats of a guest there was no room for
   */
  async redeem(key) {
    const reply = await this.api.redeem(key);
    await this.settle(reply);
    return { left: reply.left };
  }

  /**
   * This browser was signed in from another of its tabs: find out who it is
   * now (ADR-0040).
   */
  async catchUp() {
    await this.settle(await this.api.me());
  }

  async settle(reply) {
    this.disks.took(reply);
    // The beat on the pads may have come from a disk that isn't in this box
    if (this.disks.disk) {
      const kept = await this.disks.list().catch(() => []);
      if (!kept.some((beat) => beat.id === this.disks.disk.id)) this.disks.disk = null;
    }
    this.disks.changed();
  }

  /** This browser is nobody again; the beat on the pads stays where it is */
  async signOut() {
    await this.api.signOut();
    this.disks.disk = null;
    this.became({ user: null, beats: 0 });
  }
}
