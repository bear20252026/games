/**
 * OggOpus
 * Wraps Opus packets in an Ogg file, the form every browser's decoder
 * reads. Pure bytes: no Web Audio, no encoder. The encoder's packets come
 * from OpusEncoder.js.
 *
 * An Ogg file is a run of pages. The first holds the OpusHead, the second
 * the OpusTags, the rest the audio. Each page says how many samples (at
 * 48 kHz, always) have been decoded by its end. The first `preSkip` of
 * those are the encoder's run-in and are thrown away; the last page's
 * count stops where the sound does, so what comes back is exactly as long
 * as what went in.
 */

// Opus is always counted at this rate, whatever went in
export const OPUS_RATE = 48000;
// What libopus needs to run in when the encoder doesn't say (6.5 ms)
export const DEFAULT_PRE_SKIP = 312;
// A page can list 255 lacing values; this many packets of 20 ms keeps well under
const PACKETS_PER_PAGE = 48;

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let r = i << 24;
  for (let bit = 0; bit < 8; bit++) r = r & 0x80000000 ? (r << 1) ^ 0x04c11db7 : r << 1;
  CRC_TABLE[i] = r >>> 0;
}

/** The checksum Ogg uses: CRC-32 with no reflection, starting from zero */
export function oggCrc(bytes) {
  let crc = 0;
  for (let i = 0; i < bytes.length; i++) {
    crc = ((crc << 8) ^ CRC_TABLE[((crc >>> 24) ^ bytes[i]) & 0xff]) >>> 0;
  }
  return crc;
}

const ascii = (text) => Uint8Array.from(text, (char) => char.charCodeAt(0));

/** The header packet: how many channels, and how much run-in to throw away */
export function opusHead(channels, preSkip, inputRate) {
  const head = new Uint8Array(19);
  const view = new DataView(head.buffer);
  head.set(ascii("OpusHead"));
  head[8] = 1;
  head[9] = channels;
  view.setUint16(10, preSkip, true);
  view.setUint32(12, inputRate, true);
  // No gain; mapping family 0 (mono or stereo)
  return head;
}

function opusTags() {
  const vendor = ascii("knockbox");
  const tags = new Uint8Array(8 + 4 + vendor.length + 4);
  const view = new DataView(tags.buffer);
  tags.set(ascii("OpusTags"));
  view.setUint32(8, vendor.length, true);
  tags.set(vendor, 12);
  return tags;
}

/** The run-in an encoder asks for, read from the OpusHead it hands over; the usual one without */
export function preSkipOf(description) {
  if (!description) return DEFAULT_PRE_SKIP;
  const bytes = ArrayBuffer.isView(description)
    ? new Uint8Array(description.buffer, description.byteOffset, description.byteLength)
    : new Uint8Array(description);
  if (bytes.length < 12 || String.fromCharCode(...bytes.subarray(0, 8)) !== "OpusHead") {
    return DEFAULT_PRE_SKIP;
  }
  return new DataView(bytes.buffer, bytes.byteOffset).getUint16(10, true);
}

/**
 * One page.
 * @param {Uint8Array[]} packets - Whole packets; none is carried over a page
 * @param {{serial: number, sequence: number, granule: number, first?: boolean, last?: boolean}} at
 */
export function oggPage(packets, { serial, sequence, granule, first = false, last = false }) {
  const lacing = [];
  for (const packet of packets) {
    let left = packet.length;
    while (left >= 255) {
      lacing.push(255);
      left -= 255;
    }
    lacing.push(left);
  }
  if (lacing.length > 255) throw new Error("Too many packets for one Ogg page");

  const size = packets.reduce((sum, packet) => sum + packet.length, 0);
  const page = new Uint8Array(27 + lacing.length + size);
  const view = new DataView(page.buffer);
  page.set(ascii("OggS"));
  page[5] = (first ? 0x02 : 0) | (last ? 0x04 : 0);
  // The count is 64 bits; a beat's audio never needs the top half
  view.setUint32(6, granule >>> 0, true);
  view.setUint32(10, Math.floor(granule / 2 ** 32), true);
  view.setUint32(14, serial, true);
  view.setUint32(18, sequence, true);
  page[26] = lacing.length;
  page.set(lacing, 27);
  let at = 27 + lacing.length;
  for (const packet of packets) {
    page.set(packet, at);
    at += packet.length;
  }
  view.setUint32(22, oggCrc(page), true);
  return page;
}

/**
 * @param {Object} audio
 * @param {Uint8Array[]} audio.packets - Opus packets, in order
 * @param {number[]} audio.frames - Samples (at 48 kHz) each packet decodes to
 * @param {number} audio.channels - 1 or 2
 * @param {number} audio.samples - How many samples (at 48 kHz) went in: where the sound stops
 * @param {number} [audio.preSkip]
 * @param {number} [audio.inputRate] - The rate of the recording it was made from, for the record
 * @param {number} [audio.serial]
 * @returns {Uint8Array} An .ogg file
 */
export function oggOpus({
  packets,
  frames,
  channels,
  samples,
  preSkip = DEFAULT_PRE_SKIP,
  inputRate = OPUS_RATE,
  serial = 0x6b6e6f63,
}) {
  const pages = [
    oggPage([opusHead(channels, preSkip, inputRate)], {
      serial,
      sequence: 0,
      granule: 0,
      first: true,
    }),
    oggPage([opusTags()], { serial, sequence: 1, granule: 0 }),
  ];
  const end = preSkip + samples;
  let decoded = 0;
  for (let i = 0; i < packets.length; i += PACKETS_PER_PAGE) {
    const group = packets.slice(i, i + PACKETS_PER_PAGE);
    for (let p = i; p < i + group.length; p++) decoded += frames[p];
    const last = i + PACKETS_PER_PAGE >= packets.length;
    pages.push(
      oggPage(group, {
        serial,
        sequence: pages.length,
        // The last page stops where the sound does, not where the last packet does
        granule: last ? Math.min(decoded, end) : decoded,
        last,
      }),
    );
  }

  const file = new Uint8Array(pages.reduce((sum, page) => sum + page.length, 0));
  let at = 0;
  for (const page of pages) {
    file.set(page, at);
    at += page.length;
  }
  return file;
}

/** Does this file start like an Ogg file? */
export function isOgg(bytes) {
  return bytes.length > 27 && String.fromCharCode(...bytes.subarray(0, 4)) === "OggS";
}

/**
 * Take an Ogg Opus file apart again, for a browser whose own decoder
 * won't read the wrapping but will read the packets.
 * @param {Uint8Array} bytes
 * @returns {{channels: number, preSkip: number, head: Uint8Array, packets: Uint8Array[], samples: number}}
 *   `samples` is how many (at 48 kHz) the sound runs to, run-in not counted
 * @throws {Error} When it isn't an Ogg Opus file
 */
export function readOggOpus(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const packets = [];
  let pending = [];
  let granule = 0;
  let at = 0;
  while (at + 27 <= bytes.length) {
    if (String.fromCharCode(...bytes.subarray(at, at + 4)) !== "OggS") throw new Error("Not Ogg");
    const count = bytes[at + 26];
    const lacing = bytes.subarray(at + 27, at + 27 + count);
    const high = view.getUint32(at + 10, true);
    // A page that finishes no packet says so with all ones
    if (!(high === 0xffffffff && view.getUint32(at + 6, true) === 0xffffffff)) {
      granule = high * 2 ** 32 + view.getUint32(at + 6, true);
    }
    let data = at + 27 + count;
    for (const length of lacing) {
      pending.push(bytes.subarray(data, data + length));
      data += length;
      // A piece shorter than 255 ends its packet; a full one carries on
      if (length === 255) continue;
      const size = pending.reduce((sum, piece) => sum + piece.length, 0);
      const packet = new Uint8Array(size);
      let offset = 0;
      for (const piece of pending) {
        packet.set(piece, offset);
        offset += piece.length;
      }
      packets.push(packet);
      pending = [];
    }
    at = data;
  }

  const [head, tags, ...audio] = packets;
  const named = (packet, name) =>
    packet?.length >= 8 && String.fromCharCode(...packet.subarray(0, 8)) === name;
  if (!named(head, "OpusHead") || !named(tags, "OpusTags")) throw new Error("Not Ogg Opus");
  const preSkip = preSkipOf(head);
  return {
    channels: head[9],
    preSkip,
    head,
    packets: audio,
    samples: Math.max(0, granule - preSkip),
  };
}
