/**
 * DreamFx
 * The SAUCE fader on a take row: an effects send, like an aux bus on a desk.
 * The take always plays straight through; the fader sets how much of it is
 * also sent into a wide, washed, far-away return. Built only from the
 * browser's own audio nodes, so it sounds the same live and in a bounce:
 *
 *   chorus   two slowly wobbling short delays, hard left and right: width
 *   echo     a dotted-eighth ping-pong in time with the beat, darker on
 *            every repeat
 *   reverb   a long, slow-blooming hall (its impulse response is made here,
 *            from shaped noise), fed by the take and by its echoes
 *
 * With the fader all the way up the dry take is pulled back a little, so
 * the wash has room; pull the fader down and what is already in the hall
 * rings out on its own.
 */

// Dry level with the send fully up (it is 1 with the send closed)
const DRY_LEVEL = 0.85;
// The send opens gently: the first half of the fader is a hint of space
const SEND_CURVE = 1.5;
const SEND_GLIDE_SECONDS = 0.03;
const CHORUS_LEVEL = 0.3;
const CHORUS = [
  { delay: 0.017, rate: 0.23, pan: -0.8 },
  { delay: 0.024, rate: 0.31, pan: 0.8 },
];
const CHORUS_DEPTH_SECONDS = 0.003;
// Echo: three sixteenths, the classic dotted eighth
const ECHO_BEATS = 0.75;
const ECHO_FEEDBACK = 0.42;
const ECHO_LEVEL = 0.3;
const ECHO_TONE_HZ = 2600;
const ECHO_TO_REVERB = 0.6;
const MAX_ECHO_SECONDS = 2;
// Reverb: the hall takes a moment to open up, then hangs for seconds
const REVERB_SECONDS = 4.2;
const REVERB_BLOOM_SECONDS = 0.07;
const REVERB_PRE_DELAY_SECONDS = 0.03;
// Keep the low end of the take out of the hall, or it turns to mud
const REVERB_LOW_CUT_HZ = 280;
const REVERB_LEVEL = 0.6;

/**
 * Build the chain in an audio context (the live one, or an offline render).
 * @param {BaseAudioContext} ctx
 * @param {AudioNode} dest - Where the result goes
 * @returns {{input: AudioNode, setTempo: Function, setAmount: Function}}
 *   Play the take into `input`; `setTempo(bpm)` keeps the echo in time;
 *   `setAmount(0..1)` is the send fader
 */
export function createDreamFx(ctx, dest) {
  const bus = ctx.createGain();
  const dry = gain(ctx, 1);
  bus.connect(dry).connect(dest);
  // Everything below hangs off the send
  const input = gain(ctx, 0);
  bus.connect(input);

  // Reverb
  const reverbIn = ctx.createGain();
  const preDelay = ctx.createDelay(1);
  preDelay.delayTime.value = REVERB_PRE_DELAY_SECONDS;
  const lowCut = ctx.createBiquadFilter();
  lowCut.type = "highpass";
  lowCut.frequency.value = REVERB_LOW_CUT_HZ;
  const hall = ctx.createConvolver();
  hall.buffer = hallImpulse(ctx);
  input.connect(reverbIn);
  reverbIn
    .connect(preDelay)
    .connect(lowCut)
    .connect(hall)
    .connect(gain(ctx, REVERB_LEVEL))
    .connect(dest);

  // Chorus
  const chorusOut = gain(ctx, CHORUS_LEVEL);
  chorusOut.connect(dest);
  for (const voice of CHORUS) {
    const delay = ctx.createDelay(1);
    delay.delayTime.value = voice.delay;
    const wobble = ctx.createOscillator();
    wobble.frequency.value = voice.rate;
    wobble.connect(gain(ctx, CHORUS_DEPTH_SECONDS)).connect(delay.delayTime);
    wobble.start();
    input.connect(delay).connect(panner(ctx, voice.pan)).connect(chorusOut);
  }

  // Echo: left repeats feed the right and back again
  const echoLeft = ctx.createDelay(MAX_ECHO_SECONDS);
  const echoRight = ctx.createDelay(MAX_ECHO_SECONDS);
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = ECHO_TONE_HZ;
  const echoOut = gain(ctx, ECHO_LEVEL);
  input.connect(echoLeft);
  echoLeft.connect(echoRight);
  echoRight.connect(gain(ctx, ECHO_FEEDBACK)).connect(tone).connect(echoLeft);
  echoLeft.connect(panner(ctx, -0.7)).connect(echoOut);
  echoRight.connect(panner(ctx, 0.7)).connect(echoOut);
  echoOut.connect(dest);
  echoOut.connect(gain(ctx, ECHO_TO_REVERB)).connect(reverbIn);

  let tempo = 0;
  const setTempo = (bpm) => {
    if (bpm === tempo) return;
    const seconds = Math.min(MAX_ECHO_SECONDS, (60 / bpm) * ECHO_BEATS);
    for (const echo of [echoLeft, echoRight]) {
      // The first time it is simply set; after that it glides, like a tape echo
      if (tempo === 0) echo.delayTime.value = seconds;
      else echo.delayTime.setTargetAtTime(seconds, ctx.currentTime, 0.1);
    }
    tempo = bpm;
  };

  let amount = null;
  const setAmount = (value) => {
    if (value === amount) return;
    const levels = [
      [dry.gain, 1 - (1 - DRY_LEVEL) * value],
      [input.gain, value ** SEND_CURVE],
    ];
    for (const [param, level] of levels) {
      // Set outright the first time; after that the fader glides
      if (amount === null) param.value = level;
      else param.setTargetAtTime(level, ctx.currentTime, SEND_GLIDE_SECONDS);
    }
    amount = value;
  };

  return { input: bus, setTempo, setAmount };
}

/** A hall, as an impulse response: stereo noise that blooms, then dies away over seconds */
function hallImpulse(ctx) {
  const length = Math.round(REVERB_SECONDS * ctx.sampleRate);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  // -60 dB by the end of the buffer
  const decay = Math.log(1000) / REVERB_SECONDS;

  for (let channel = 0; channel < 2; channel++) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const t = i / ctx.sampleRate;
      const bloom = 1 - Math.exp(-t / REVERB_BLOOM_SECONDS);
      data[i] = (Math.random() * 2 - 1) * bloom * Math.exp(-t * decay);
    }
  }
  return impulse;
}

function gain(ctx, level) {
  const node = ctx.createGain();
  node.gain.value = level;
  return node;
}

function panner(ctx, pan) {
  const node = ctx.createStereoPanner();
  node.pan.value = pan;
  return node;
}
