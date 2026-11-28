/**
 * Packing
 * A take on its way to the server is packed down first: a WAV (a mic take,
 * a loaded loop) becomes an Ogg Opus file about a twelfth the size, so a
 * save uploads less and a phone opening the beat fetches less. What comes
 * back is exactly as long as what went in, so every chop stays where it
 * was cut. The desk keeps playing the recording it has; only what is sent
 * is packed. No DOM.
 *
 * A file that can't be packed, or doesn't come back the same length, is
 * sent as it is: packing never stops a save.
 */

// Smaller than this (a drum hit) there is nothing worth saving
export const PACK_OVER_BYTES = 256 * 1024;
// How far the packed take's length may be from the original's (samples at 48 kHz)
const LENGTH_SLACK = 2;

const RAW_TYPES = new Set([
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/vnd.wave",
  "audio/aiff",
  "audio/x-aiff",
]);

/** Is this a recording stored sample by sample (WAV, AIFF), with everything to gain from packing? */
export function isRaw({ name = "", type = "" }) {
  return RAW_TYPES.has(type.toLowerCase()) || /\.(wav|aiff?)$/i.test(name);
}

/** The name a packed file goes by: the same, as .ogg */
export function packedName(name) {
  return `${name.replace(/\.[^./]+$/, "")}.ogg`;
}

export class Packer {
  /**
   * @param {Object} parts
   * @param {{run: (job: string, work: Object) => Promise<*>}} parts.jobs - AudioJobs
   * @param {(bytes: Uint8Array) => Promise<{length: number, numberOfChannels: number,
   *   getChannelData: (c: number) => Float32Array}>} parts.decode - A file as audio at 48 kHz
   */
  constructor({ jobs, decode }) {
    this.jobs = jobs;
    this.decode = decode;
    // By the bytes themselves: a take that hasn't changed is packed once,
    // and goes up under the same name every save
    this.packed = new WeakMap();
  }

  /**
   * @param {{name: string, type: string, bytes: Uint8Array}} file
   * @returns {Promise<{name: string, type: string, bytes: Uint8Array}>} The
   *   file packed, or the file itself where packing isn't worth it or can't be done
   */
  async pack(file) {
    if (!isRaw(file) || file.bytes.length < PACK_OVER_BYTES) return file;
    if (!this.packed.has(file.bytes)) this.packed.set(file.bytes, this.tryPack(file));
    return (await this.packed.get(file.bytes)) ?? file;
  }

  /** @returns {Promise<Object|null>} null when it is to be sent as it is */
  async tryPack(file) {
    try {
      const audio = await this.decode(file.bytes);
      const count = audio.numberOfChannels;
      if (!(await this.jobs.run("can-pack", { channels: count }))) return null;
      const channels = [];
      // Copies: the worker is handed its own
      for (let c = 0; c < count; c++) channels.push(audio.getChannelData(c).slice());
      const bytes = await this.jobs.run("pack", { channels });
      if (bytes.length >= file.bytes.length) return null;

      // Heard back before it is trusted: the same channels, the same length
      const back = await this.decode(bytes);
      const same =
        back.numberOfChannels === count && Math.abs(back.length - audio.length) <= LENGTH_SLACK;
      return same ? { name: packedName(file.name), type: "audio/ogg", bytes } : null;
    } catch {
      return null;
    }
  }
}
