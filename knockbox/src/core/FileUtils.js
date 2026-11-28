/**
 * FileUtils
 * Dependency-free encoders for the files the tape deck hands back:
 * 16-bit PCM WAV, and a store-only ZIP to bundle stems into one download.
 */

const ACID_CHUNK_BYTES = 24;

/**
 * Trigger a browser download for in-memory bytes.
 * @param {Uint8Array|ArrayBuffer} bytes
 * @param {string} filename
 * @param {string} mimeType
 */
export function downloadBytes(bytes, filename, mimeType) {
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * A copy of a loaded file to hold on to, so a saved beat can carry the
 * original. Take it before decoding: decodeAudioData empties its buffer.
 * @param {File} file
 * @param {ArrayBuffer} bytes - The file's contents
 * @returns {{name: string, type: string, bytes: Uint8Array}}
 */
export function keepFile(file, bytes) {
  return { name: file.name, type: file.type, bytes: new Uint8Array(bytes.slice(0)) };
}

/**
 * Encode planar float channels as a 16-bit PCM WAV file.
 * @param {Float32Array[]} channels - One array per channel, equal lengths
 * @param {number} sampleRate
 * @param {{bpm: number, beats: number}} [loop] - For a loop: its tempo and
 *   length are written into the file (an "acid" chunk), so a DAW that reads
 *   it can sync the loop without guessing
 * @returns {Uint8Array}
 */
export function encodeWav(channels, sampleRate, loop = null) {
  const numChannels = channels.length;
  const numFrames = channels[0].length;
  const bytesPerFrame = numChannels * 2;
  const dataSize = numFrames * bytesPerFrame;
  const loopSize = loop ? 8 + ACID_CHUNK_BYTES : 0;
  const view = new DataView(new ArrayBuffer(44 + dataSize + loopSize));

  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize + loopSize, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true); // fmt chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerFrame, true); // byte rate
  view.setUint16(32, bytesPerFrame, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeAscii(view, 36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let c = 0; c < numChannels; c++) {
      const s = Math.max(-1, Math.min(1, channels[c][i]));
      view.setInt16(offset, Math.round(s < 0 ? s * 0x8000 : s * 0x7fff), true);
      offset += 2;
    }
  }

  if (loop) {
    writeAscii(view, offset, "acid");
    view.setUint32(offset + 4, ACID_CHUNK_BYTES, true);
    view.setUint32(offset + 8, 0, true); // a loop, not a one-shot; no root note
    view.setUint16(offset + 12, 60, true); // root note (unused)
    view.setUint16(offset + 14, 0x8000, true);
    view.setFloat32(offset + 16, 0, true);
    view.setUint32(offset + 20, loop.beats, true);
    view.setUint16(offset + 24, 4, true); // 4/4
    view.setUint16(offset + 26, 4, true);
    view.setFloat32(offset + 28, loop.bpm, true);
  }
  return new Uint8Array(view.buffer);
}

/**
 * Bundle files into an uncompressed (store-only) ZIP archive.
 * @param {Array<{name: string, bytes: Uint8Array}>} files
 * @returns {Uint8Array}
 */
export function encodeZip(files) {
  const encoder = new TextEncoder();
  const entries = files.map((file) => ({
    name: encoder.encode(file.name),
    bytes: file.bytes,
    crc: crc32(file.bytes),
  }));

  const localSize = entries.reduce((sum, e) => sum + 30 + e.name.length + e.bytes.length, 0);
  const centralSize = entries.reduce((sum, e) => sum + 46 + e.name.length, 0);
  const out = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(out.buffer);

  // Local file headers, each followed by its data
  let offset = 0;
  for (const entry of entries) {
    entry.offset = offset;
    view.setUint32(offset, 0x04034b50, true);
    view.setUint16(offset + 4, 20, true); // version needed
    view.setUint16(offset + 6, 0x0800, true); // UTF-8 names
    view.setUint32(offset + 14, entry.crc, true);
    view.setUint32(offset + 18, entry.bytes.length, true); // compressed size
    view.setUint32(offset + 22, entry.bytes.length, true); // uncompressed size
    view.setUint16(offset + 26, entry.name.length, true);
    out.set(entry.name, offset + 30);
    out.set(entry.bytes, offset + 30 + entry.name.length);
    offset += 30 + entry.name.length + entry.bytes.length;
  }

  // Central directory
  const centralStart = offset;
  for (const entry of entries) {
    view.setUint32(offset, 0x02014b50, true);
    view.setUint16(offset + 4, 20, true); // version made by
    view.setUint16(offset + 6, 20, true); // version needed
    view.setUint16(offset + 8, 0x0800, true);
    view.setUint32(offset + 16, entry.crc, true);
    view.setUint32(offset + 20, entry.bytes.length, true);
    view.setUint32(offset + 24, entry.bytes.length, true);
    view.setUint16(offset + 28, entry.name.length, true);
    view.setUint32(offset + 42, entry.offset, true);
    out.set(entry.name, offset + 46);
    offset += 46 + entry.name.length;
  }

  // End of central directory
  view.setUint32(offset, 0x06054b50, true);
  view.setUint16(offset + 8, entries.length, true);
  view.setUint16(offset + 10, entries.length, true);
  view.setUint32(offset + 12, centralSize, true);
  view.setUint32(offset + 16, centralStart, true);
  return out;
}

function writeAscii(view, offset, text) {
  for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
}

let crcTable = null;

function crc32(bytes) {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
