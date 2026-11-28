/**
 * Stretcher
 * Makes a chop longer or shorter without changing its pitch, so a hit can be
 * dragged somewhere else in the bar and the audio either side of it gives
 * way to make room.
 *
 * It works by overlap-add: the chop is rebuilt from short overlapping grains,
 * each lifted from a little further along (or less far along) than the last.
 * Before a grain is laid down, the best-matching spot nearby is looked for,
 * so the waves line up where grains meet instead of cancelling (WSOLA). The
 * attack at the front of the chop is copied across untouched: a smeared
 * transient is what gives a stretch away.
 */

// Length of one grain: long enough to hold a couple of cycles of a low voice
const GRAIN_SECONDS = 0.04;
// How far either side of the ideal spot a grain may be taken from
const SEARCH_SECONDS = 0.01;
// The front of the chop that is never stretched
const ATTACK_SECONDS = 0.03;
// Only every nth sample is compared when matching grains
const MATCH_STRIDE = 4;

/**
 * @param {Float32Array[]} channels - The chop, one array per channel
 * @param {number} ratio - New length over old: 2 is twice as long
 * @param {number} sampleRate
 * @returns {Float32Array[]} The stretched chop, `round(length * ratio)` samples
 */
export function stretchChannels(channels, ratio, sampleRate) {
  const length = channels[0].length;
  const outLength = Math.max(1, Math.round(length * ratio));
  const grain = Math.round((GRAIN_SECONDS * sampleRate) / 2) * 2;
  const hop = grain / 2;
  const out = channels.map(() => new Float32Array(outLength));

  // Too short to cut into grains: play what there is, faded at the end
  if (length < grain * 2 || outLength < grain * 2) {
    const copied = Math.min(length, outLength);
    const fade = Math.min(copied, Math.round(0.005 * sampleRate));
    channels.forEach((data, c) => {
      out[c].set(data.subarray(0, copied));
      for (let i = 0; i < fade; i++) out[c][copied - 1 - i] *= i / fade;
    });
    return out;
  }

  const guide = mixDown(channels);
  const search = Math.round(SEARCH_SECONDS * sampleRate);
  const lastStart = length - grain;
  // Output time to input time: straight through the attack, then at the
  // rate that brings the rest of the chop in on time
  const attack = Math.min(Math.round(ATTACK_SECONDS * sampleRate), length >> 1, outLength >> 1);
  const rate = (length - attack) / (outLength - attack);
  const ideal = (t) => (t <= attack ? t : attack + (t - attack) * rate);

  const window = new Float32Array(grain);
  for (let i = 0; i < grain; i++) window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / grain);
  const weight = new Float32Array(outLength);

  let previous = 0;
  for (let outPos = 0; outPos < outLength; outPos += hop) {
    const target = clamp(Math.round(ideal(outPos)), 0, lastStart);
    // Carrying straight on from the last grain is a perfect join: do that
    // for as long as it stays close enough to where we ought to be
    const carryOn = previous + hop;
    let from = target;
    if (outPos === 0) from = 0;
    else if (carryOn <= lastStart && Math.abs(carryOn - target) <= search) from = carryOn;
    else if (carryOn <= lastStart)
      from = bestMatch(guide, carryOn, target, search, grain, lastStart);

    const count = Math.min(grain, outLength - outPos);
    for (let c = 0; c < channels.length; c++) {
      const data = channels[c];
      const dest = out[c];
      for (let i = 0; i < count; i++) dest[outPos + i] += data[from + i] * window[i];
    }
    for (let i = 0; i < count; i++) weight[outPos + i] += window[i];
    previous = from;
  }

  // The ends are covered by one grain only: bring them up to full level
  for (const dest of out) {
    for (let i = 0; i < outLength; i++) {
      if (weight[i] > 1e-3) dest[i] /= weight[i];
    }
  }
  return out;
}

/** Start of the grain near `target` that sounds most like the one at `like` */
function bestMatch(guide, like, target, search, grain, lastStart) {
  const low = Math.max(0, target - search);
  const high = Math.min(lastStart, target + search);
  let best = clamp(target, low, high);
  let bestScore = Number.NEGATIVE_INFINITY;
  for (let start = low; start <= high; start++) {
    let dot = 0;
    let energy = 0;
    for (let i = 0; i < grain; i += MATCH_STRIDE) {
      const sample = guide[start + i];
      dot += sample * guide[like + i];
      energy += sample * sample;
    }
    const score = dot / Math.sqrt(energy + 1e-9);
    if (score > bestScore) {
      bestScore = score;
      best = start;
    }
  }
  return best;
}

function mixDown(channels) {
  if (channels.length === 1) return channels[0];
  const mono = new Float32Array(channels[0].length);
  for (const data of channels) {
    for (let i = 0; i < mono.length; i++) mono[i] += data[i];
  }
  return mono;
}

function clamp(value, low, high) {
  return Math.max(low, Math.min(high, value));
}
