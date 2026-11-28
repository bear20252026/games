/**
 * TapeSound
 * A cassette going into a deck: plastic sliding, the clack as it seats, the
 * door, then the PLAY key. Made from shaped noise, the same every time, on
 * any audio context: CLIP's offline one, or a phone's as its player card is
 * first tapped (ADR-0030, ADR-0032). No DOM.
 */

/**
 * @param {BaseAudioContext} ctx
 * @param {AudioNode} out
 * @param {number} from - When the tape starts on its way in, on the context's clock
 * @param {number} lead - Seconds from then to the beat; the PLAY key goes down just before it
 */
export function tapeGoingIn(ctx, out, from, lead) {
  const shape = ctx.createWaveShaper();
  const curve = new Float32Array(512);
  for (let i = 0; i < 512; i++) curve[i] = Math.tanh((i / 256 - 1) * 2.2);
  shape.curve = curve;
  const soften = ctx.createBiquadFilter();
  soften.type = "lowpass";
  soften.frequency.value = 7200;
  const level = ctx.createGain();
  level.gain.value = 0.7;
  shape.connect(soften).connect(level).connect(out);

  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  let seed = 5;
  for (let i = 0; i < data.length; i++) {
    seed = (seed * 16807) % 2147483647;
    data[i] = (seed / 2147483647) * 2 - 1;
  }
  const burst = (after, lasts, type, frequency, loud, offset) => {
    const at = Math.max(ctx.currentTime, from + after);
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    source.buffer = noise;
    filter.type = type;
    filter.frequency.value = frequency;
    gain.gain.setValueAtTime(loud, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + lasts);
    source.connect(filter).connect(gain).connect(shape);
    source.start(at, offset, lasts + 0.02);
  };
  burst(0.34, 0.5, "bandpass", 3400, 0.07, 0.1);
  burst(0.9, 0.035, "highpass", 2600, 0.7, 0.2);
  burst(0.905, 0.09, "lowpass", 700, 0.9, 0.3);
  burst(0.975, 0.03, "bandpass", 1800, 0.3, 0.4);
  burst(1.12, 0.05, "bandpass", 1300, 0.55, 0.15);
  burst(1.125, 0.1, "lowpass", 420, 0.7, 0.25);
  burst(lead - 0.12, 0.05, "highpass", 2200, 0.5, 0.35);
  burst(lead - 0.115, 0.1, "lowpass", 600, 0.9, 0.45);
}
