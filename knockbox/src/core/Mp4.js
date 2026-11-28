/**
 * Mp4
 * Writes an ordinary MP4 from encoded H.264 pictures and AAC sound: the
 * index (moov) first, then the samples, picture and sound taking turns, so
 * the file starts playing before it has all arrived and uploads as apps
 * expect (ADR-0030). No DOM, and nobody else's code.
 */

const text = (s) => Uint8Array.from(s, (c) => c.charCodeAt(0));
const u8 = (...n) => Uint8Array.from(n);
const u16 = (n) => u8(n >>> 8, n);
const u32 = (n) => u8(n >>> 24, n >>> 16, n >>> 8, n);

function join(parts) {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

/** A box: its length, its four-letter name, what is in it */
function box(name, ...parts) {
  const body = join(parts);
  return join([u32(body.length + 8), text(name), body]);
}

/** A box that starts with a version and flags */
const full = (name, version, flags, ...parts) =>
  box(name, u8(version), u8(flags >>> 16, flags >>> 8, flags), ...parts);

const MATRIX = join([0x10000, 0, 0, 0, 0x10000, 0, 0, 0, 0x40000000].map(u32));
// The film's own clock: milliseconds
const FILM = 1000;

// A descriptor in an esds box: its tag, its length, its bytes
const descriptor = (tag, ...parts) => {
  const body = join(parts);
  return join([u8(tag, body.length), body]);
};

/** How much of a track is played, on its own clock: not the encoder's run-in, nor its padding at the end */
const played = (track) => track.length ?? track.samples.length * track.delta - (track.priming ?? 0);

/** The sample table of one track: what each sample is, how long, how big, and where */
function table(entry, track) {
  const { samples, chunks } = track;
  // Runs of chunks holding the same number of samples
  const runs = [];
  chunks.forEach((chunk, i) => {
    if (!runs.length || runs[runs.length - 1][1] !== chunk.count) runs.push([i + 1, chunk.count]);
  });
  const keys = samples.flatMap((sample, i) => (sample.key ? [i + 1] : []));
  return box(
    "stbl",
    full("stsd", 0, 0, u32(1), entry),
    full("stts", 0, 0, u32(1), u32(samples.length), u32(track.delta)),
    // Every sound sample stands alone; only some pictures do
    ...(track.video ? [full("stss", 0, 0, u32(keys.length), ...keys.map(u32))] : []),
    full(
      "stsc",
      0,
      0,
      u32(runs.length),
      ...runs.flatMap(([first, count]) => [u32(first), u32(count), u32(1)]),
    ),
    full(
      "stsz",
      0,
      0,
      u32(0),
      u32(samples.length),
      ...samples.map((sample) => u32(sample.data.length)),
    ),
    full("stco", 0, 0, u32(chunks.length), ...chunks.map((chunk) => u32(chunk.offset))),
  );
}

function trak(id, track) {
  const { video } = track;
  const length = played(track);
  const film = Math.round((length / track.timescale) * FILM);
  const entry = video
    ? box(
        "avc1",
        new Uint8Array(6),
        u16(1),
        new Uint8Array(16),
        u16(video.width),
        u16(video.height),
        u32(0x480000),
        u32(0x480000),
        u32(0),
        u16(1),
        new Uint8Array(32),
        u16(0x18),
        u16(0xffff),
        box("avcC", track.description),
      )
    : box(
        "mp4a",
        new Uint8Array(6),
        u16(1),
        new Uint8Array(8),
        u16(track.channels),
        u16(16),
        u32(0),
        u16(track.timescale),
        u16(0),
        full(
          "esds",
          0,
          0,
          descriptor(
            0x03,
            u16(0),
            u8(0),
            descriptor(
              0x04,
              u8(0x40, 0x15),
              u8(0, 0, 0),
              u32(0),
              u32(0),
              descriptor(0x05, track.description),
            ),
            descriptor(0x06, u8(2)),
          ),
        ),
      );
  return box(
    "trak",
    full(
      "tkhd",
      0,
      3,
      u32(0),
      u32(0),
      u32(id),
      u32(0),
      u32(film),
      new Uint8Array(8),
      u16(0),
      u16(0),
      u16(video ? 0 : 0x100),
      u16(0),
      MATRIX,
      u32((video?.width ?? 0) << 16),
      u32((video?.height ?? 0) << 16),
    ),
    // The encoder's run-in before the first real sound is skipped, so sound and picture start together
    ...(track.priming
      ? [box("edts", full("elst", 0, 0, u32(1), u32(film), u32(track.priming), u16(1), u16(0)))]
      : []),
    box(
      "mdia",
      full(
        "mdhd",
        0,
        0,
        u32(0),
        u32(0),
        u32(track.timescale),
        u32(track.samples.length * track.delta),
        u16(0x55c4),
        u16(0),
      ),
      full(
        "hdlr",
        0,
        0,
        u32(0),
        text(video ? "vide" : "soun"),
        new Uint8Array(12),
        text(video ? "Picture\0" : "Sound\0"),
      ),
      box(
        "minf",
        video ? full("vmhd", 0, 1, new Uint8Array(8)) : full("smhd", 0, 0, new Uint8Array(4)),
        box("dinf", full("dref", 0, 0, u32(1), full("url ", 0, 1))),
        table(entry, track),
      ),
    ),
  );
}

/**
 * @param {Object} film
 * @param {Object} film.video
 * @param {number} film.video.width
 * @param {number} film.video.height
 * @param {number} film.video.fps
 * @param {Uint8Array} film.video.description - The encoder's avcC record
 * @param {Array<{data: Uint8Array, key: boolean}>} film.video.samples - In order, one a frame
 * @param {Object} film.audio
 * @param {number} film.audio.sampleRate
 * @param {number} film.audio.channels
 * @param {Uint8Array} film.audio.description - The encoder's AudioSpecificConfig
 * @param {Array<{data: Uint8Array}>} film.audio.samples - AAC frames of 1024 samples
 * @param {number} [film.audio.priming] - Samples of run-in before the first real sound
 * @param {number} [film.audio.frames] - Samples of real sound, when the encoder padded the end
 * @returns {Uint8Array} The file
 */
export function muxMp4({ video, audio }) {
  const tracks = [
    {
      video,
      timescale: video.fps * 1000,
      delta: 1000,
      description: video.description,
      samples: video.samples,
      chunks: [],
    },
    {
      timescale: audio.sampleRate,
      delta: 1024,
      channels: audio.channels,
      description: audio.description,
      samples: audio.samples,
      priming: audio.priming ?? 0,
      length: audio.frames,
      chunks: [],
    },
  ];
  // Half a second of picture, then the sound that goes with it, and so on
  const order = [];
  const taken = [0, 0];
  for (
    let until = 0.5;
    taken[0] < video.samples.length || taken[1] < audio.samples.length;
    until += 0.5
  ) {
    tracks.forEach((track, t) => {
      const upTo = Math.min(
        track.samples.length,
        Math.ceil((until * track.timescale) / track.delta),
      );
      if (upTo > taken[t]) order.push({ track, from: taken[t], count: upTo - taken[t] });
      taken[t] = Math.max(taken[t], upTo);
    });
  }

  const ftyp = box("ftyp", text("isom"), u32(0x200), text("isomiso2avc1mp41"));
  const head = (offsets) => {
    order.forEach((chunk, i) => {
      chunk.track.chunks[chunk.at] = { offset: offsets[i], count: chunk.count };
    });
    const seconds = Math.max(...tracks.map((track) => played(track) / track.timescale));
    return box(
      "moov",
      full(
        "mvhd",
        0,
        0,
        u32(0),
        u32(0),
        u32(FILM),
        u32(Math.round(seconds * FILM)),
        u32(0x10000),
        u16(0x100),
        new Uint8Array(10),
        MATRIX,
        new Uint8Array(24),
        u32(tracks.length + 1),
      ),
      ...tracks.map((track, i) => trak(i + 1, track)),
    );
  };
  const counts = new Map(tracks.map((track) => [track, 0]));
  for (const chunk of order) {
    chunk.at = counts.get(chunk.track);
    counts.set(chunk.track, chunk.at + 1);
  }
  // The index is the same size wherever the samples land, so it is written once to measure and once for real
  const measured = head(order.map(() => 0));
  let at = ftyp.length + measured.length + 8;
  const offsets = [];
  const body = [];
  for (const chunk of order) {
    offsets.push(at);
    for (const sample of chunk.track.samples.slice(chunk.from, chunk.from + chunk.count)) {
      body.push(sample.data);
      at += sample.data.length;
    }
  }
  return join([ftyp, head(offsets), box("mdat", ...body)]);
}
