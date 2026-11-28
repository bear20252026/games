// ============================================================================
// TITAN 6X6 — PROCEDURAL WEBAUDIO HYBRID DIESEL-ELECTRIC SOUND ENGINE
//   - Zero external audio assets (100% synthesized WebAudio API)
//   - Initializes cleanly on first user gesture (`unlock()`)
//   - Soft master compressor prevents clipping across overlapping layers
// ============================================================================

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export class TruckAudioEngine {
  constructor(options = {}) {
    this.ctx = null;
    this.masterGain = null;
    this.compressor = null;
    this.noiseBuffer = null;

    this.muted = Boolean(options.muted ?? false);
    this.volume = clamp(options.volume ?? 0.65, 0.0, 1.0);
    this.unlocked = false;
    this.engineRunning = false;
    this.drivingActive = false;

    // Continuous drivetrain & tire synthesis nodes
    this._continuousReady = false;
    this._genOscA = null;
    this._genOscB = null;
    this._genSubOsc = null;
    this._genChugLfo = null;
    this._genChugDepth = null;
    this._genFilter = null;
    this._genGain = null;

    this._motorOscA = null;
    this._motorOscB = null;
    this._motorFilter = null;
    this._motorGain = null;

    this._tireNoiseSrc = null;
    this._tireBodyFilter = null;
    this._tireBodyGain = null;
    this._tireGritFilter = null;
    this._tireGritGain = null;

    // Continuous planetary-gear electric recovery winch synthesis nodes
    this._winchOscCore = null;
    this._winchOscMesh = null;
    this._winchOscSub = null;
    this._winchFilter = null;
    this._winchGain = null;

    // Event cooldown & edge-detection trackers
    this._lastSuspTime = -10;
    this._lastBrakeHissTime = -10;
    this._prevBraking = 0;
    this._startupRampUntil = 0;
    this._winchRatchetAccum = 0;
    this._lastWinchClickTime = -10;
    this._prevWinchPhase = 'stowed';
  }

  /**
   * Lazily initializes & resumes AudioContext on user gesture.
   * Safe to call repeatedly; returns true if AudioContext is running.
   */
  unlock() {
    const AudioCtx =
      typeof window !== 'undefined'
        ? window.AudioContext || window.webkitAudioContext
        : null;
    if (!AudioCtx) return false;

    try {
      if (!this.ctx) {
        this.ctx = new AudioCtx();
        this._setupMasterBus();
        this._buildNoiseBuffer();
        this._setupContinuousGraph();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      this.unlocked = true;
      this._applyMasterGain(0.03);
      return this.ctx.state === 'running';
    } catch {
      return false;
    }
  }

  _setupMasterBus() {
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -14;
    this.compressor.knee.value = 18;
    this.compressor.ratio.value = 4.5;
    this.compressor.attack.value = 0.006;
    this.compressor.release.value = 0.18;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.muted ? 0.0001 : this.volume;

    this.masterGain.connect(this.compressor);
    this.compressor.connect(this.ctx.destination);
  }

  _buildNoiseBuffer() {
    // 3-second seamless pink/brown-weighted noise buffer for tires, air-brakes & hydraulics
    const sampleRate = this.ctx.sampleRate;
    const len = Math.floor(sampleRate * 3.0);
    const buf = this.ctx.createBuffer(1, len, sampleRate);
    const data = buf.getChannelData(0);

    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    let b3 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2.0 - 1.0;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.950 * b2 + white * 0.048;
      b3 = 0.720 * b3 + white * 0.145;
      data[i] = clamp((b0 + b1 + b2 + b3 + white * 0.16) * 0.75, -1.0, 1.0);
    }
    this.noiseBuffer = buf;
  }

  _setupContinuousGraph() {
    if (this._continuousReady || !this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;

    // ------------------------------------------------------------------------
    // 1. HEAVY HYBRID V8 DIESEL GENERATOR RUMBLE
    // ------------------------------------------------------------------------
    this._genOscA = this.ctx.createOscillator();
    this._genOscB = this.ctx.createOscillator();
    this._genSubOsc = this.ctx.createOscillator();
    this._genOscA.type = 'sawtooth';
    this._genOscB.type = 'triangle';
    this._genSubOsc.type = 'sine';
    this._genOscA.frequency.value = 32;
    this._genOscB.frequency.value = 64.5;
    this._genSubOsc.frequency.value = 28;

    // Firing-order chug modulation onto lowpass filter cutoff
    this._genChugLfo = this.ctx.createOscillator();
    this._genChugLfo.type = 'sine';
    this._genChugLfo.frequency.value = 14;
    this._genChugDepth = this.ctx.createGain();
    this._genChugDepth.gain.value = 28;

    this._genFilter = this.ctx.createBiquadFilter();
    this._genFilter.type = 'lowpass';
    this._genFilter.frequency.value = 125;
    this._genFilter.Q.value = 2.4;

    this._genGain = this.ctx.createGain();
    this._genGain.gain.value = 0.0001;

    const genOscBGain = this.ctx.createGain();
    genOscBGain.gain.value = 0.55;
    const genSubGain = this.ctx.createGain();
    genSubGain.gain.value = 0.70;

    this._genOscA.connect(this._genFilter);
    this._genOscB.connect(genOscBGain).connect(this._genFilter);
    this._genSubOsc.connect(genSubGain).connect(this._genFilter);
    this._genChugLfo.connect(this._genChugDepth).connect(this._genFilter.frequency);
    this._genFilter.connect(this._genGain).connect(this.masterGain);

    this._genOscA.start(now);
    this._genOscB.start(now);
    this._genSubOsc.start(now);
    this._genChugLfo.start(now);

    // ------------------------------------------------------------------------
    // 2. ELECTRIC TRACTION MOTOR & INVERTER HARMONIC WHINE
    // ------------------------------------------------------------------------
    this._motorOscA = this.ctx.createOscillator();
    this._motorOscB = this.ctx.createOscillator();
    this._motorOscA.type = 'sine';
    this._motorOscB.type = 'triangle';
    this._motorOscA.frequency.value = 210;
    this._motorOscB.frequency.value = 315; // crisp fifth harmonic

    const motorBGain = this.ctx.createGain();
    motorBGain.gain.value = 0.32;

    this._motorFilter = this.ctx.createBiquadFilter();
    this._motorFilter.type = 'bandpass';
    this._motorFilter.frequency.value = 460;
    this._motorFilter.Q.value = 2.8;

    this._motorGain = this.ctx.createGain();
    this._motorGain.gain.value = 0.0001;

    this._motorOscA.connect(this._motorFilter);
    this._motorOscB.connect(motorBGain).connect(this._motorFilter);
    this._motorFilter.connect(this._motorGain).connect(this.masterGain);

    this._motorOscA.start(now);
    this._motorOscB.start(now);

    // ------------------------------------------------------------------------
    // 3. SURFACE-ADAPTIVE TIRE ROLLING & GRAVEL GRIT NOISE
    // ------------------------------------------------------------------------
    this._tireNoiseSrc = this.ctx.createBufferSource();
    this._tireNoiseSrc.buffer = this.noiseBuffer;
    this._tireNoiseSrc.loop = true;

    this._tireBodyFilter = this.ctx.createBiquadFilter();
    this._tireBodyFilter.type = 'bandpass';
    this._tireBodyFilter.frequency.value = 380;
    this._tireBodyFilter.Q.value = 1.1;

    this._tireBodyGain = this.ctx.createGain();
    this._tireBodyGain.gain.value = 0.0001;

    this._tireGritFilter = this.ctx.createBiquadFilter();
    this._tireGritFilter.type = 'bandpass';
    this._tireGritFilter.frequency.value = 1650;
    this._tireGritFilter.Q.value = 1.8;

    this._tireGritGain = this.ctx.createGain();
    this._tireGritGain.gain.value = 0.0001;

    this._tireNoiseSrc.connect(this._tireBodyFilter).connect(this._tireBodyGain).connect(this.masterGain);
    this._tireNoiseSrc.connect(this._tireGritFilter).connect(this._tireGritGain).connect(this.masterGain);
    this._tireNoiseSrc.start(now);

    // ------------------------------------------------------------------------
    // 4. ELECTRIC PLANETARY-GEAR RECOVERY WINCH MOTOR
    // ------------------------------------------------------------------------
    this._winchOscCore = this.ctx.createOscillator();
    this._winchOscMesh = this.ctx.createOscillator();
    this._winchOscSub = this.ctx.createOscillator();
    this._winchOscCore.type = 'sawtooth';
    this._winchOscMesh.type = 'triangle';
    this._winchOscSub.type = 'sine';
    this._winchOscCore.frequency.value = 180;
    this._winchOscMesh.frequency.value = 364;
    this._winchOscSub.frequency.value = 90;

    const winchCoreGain = this.ctx.createGain();
    winchCoreGain.gain.value = 0.42;
    const winchMeshGain = this.ctx.createGain();
    winchMeshGain.gain.value = 0.36;
    const winchSubGain = this.ctx.createGain();
    winchSubGain.gain.value = 0.52;

    this._winchFilter = this.ctx.createBiquadFilter();
    this._winchFilter.type = 'lowpass';
    this._winchFilter.frequency.value = 780;
    this._winchFilter.Q.value = 2.2;

    this._winchGain = this.ctx.createGain();
    this._winchGain.gain.value = 0.0001;

    this._winchOscCore.connect(winchCoreGain).connect(this._winchFilter);
    this._winchOscMesh.connect(winchMeshGain).connect(this._winchFilter);
    this._winchOscSub.connect(winchSubGain).connect(this._winchFilter);
    this._winchFilter.connect(this._winchGain).connect(this.masterGain);

    this._winchOscCore.start(now);
    this._winchOscMesh.start(now);
    this._winchOscSub.start(now);

    this._continuousReady = true;
  }

  _isAudible() {
    return Boolean(!this.muted && this.ctx && this.ctx.state === 'running' && this.masterGain);
  }

  _applyMasterGain(tc = 0.04) {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const target = this.muted ? 0.0001 : Math.max(0.0001, this.volume);
    this.masterGain.gain.setTargetAtTime(target, now, tc);
  }

  setMuted(muted) {
    this.muted = Boolean(muted);
    this._applyMasterGain(0.03);
  }

  setVolume(vol) {
    this.volume = clamp(Number(vol) || 0, 0.0, 1.0);
    this._applyMasterGain(0.03);
  }

  getState() {
    return {
      unlocked: this.unlocked,
      running: Boolean(this.ctx && this.ctx.state === 'running'),
      muted: this.muted,
      volume: this.volume,
      engineRunning: this.engineRunning,
      drivingActive: this.drivingActive,
    };
  }

  // ==========================================================================
  // CHOREOGRAPHED HYBRID DIESEL-ELECTRIC STARTUP & SHUTDOWN
  // ==========================================================================

  triggerStartup() {
    this.engineRunning = true;
    this.unlock();
    if (!this._isAudible()) return;

    const now = this.ctx.currentTime;
    this._startupRampUntil = now + 1.45;

    // 1. Heavy HV Contactor Relay Click / Clack (0.00s)
    this._playTransientClick(now, 1450, 0.11, 0.025);
    this._playTransientClick(now + 0.032, 620, 0.14, 0.04);

    // 2. Electric Inverter Rising Harmonic Sweep (0.09s -> 0.98s)
    const invA = this.ctx.createOscillator();
    const invB = this.ctx.createOscillator();
    const invGain = this.ctx.createGain();
    const invFilter = this.ctx.createBiquadFilter();
    invA.type = 'sine';
    invB.type = 'triangle';
    invA.frequency.setValueAtTime(165, now + 0.08);
    invA.frequency.exponentialRampToValueAtTime(760, now + 0.68);
    invA.frequency.exponentialRampToValueAtTime(280, now + 1.08);
    invB.frequency.setValueAtTime(248, now + 0.08);
    invB.frequency.exponentialRampToValueAtTime(1140, now + 0.68);
    invB.frequency.exponentialRampToValueAtTime(420, now + 1.08);

    invFilter.type = 'bandpass';
    invFilter.frequency.setValueAtTime(480, now + 0.08);
    invFilter.frequency.exponentialRampToValueAtTime(1200, now + 0.68);
    invFilter.Q.value = 2.6;

    invGain.gain.setValueAtTime(0.0001, now + 0.08);
    invGain.gain.linearRampToValueAtTime(0.075, now + 0.30);
    invGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);

    invA.connect(invFilter);
    invB.connect(invFilter);
    invFilter.connect(invGain).connect(this.masterGain);
    invA.start(now + 0.08);
    invB.start(now + 0.08);
    invA.stop(now + 1.18);
    invB.stop(now + 1.18);

    // 3. Heavy V8 Diesel Generator Ignition Bloom settling into deep idle (0.36s -> 1.55s)
    const crank = this.ctx.createOscillator();
    const crankSub = this.ctx.createOscillator();
    const crankLP = this.ctx.createBiquadFilter();
    const crankGain = this.ctx.createGain();
    crank.type = 'sawtooth';
    crankSub.type = 'sine';

    crank.frequency.setValueAtTime(22, now + 0.36);
    crank.frequency.exponentialRampToValueAtTime(66, now + 0.72);
    crank.frequency.exponentialRampToValueAtTime(34, now + 1.48);

    crankSub.frequency.setValueAtTime(20, now + 0.36);
    crankSub.frequency.exponentialRampToValueAtTime(52, now + 0.72);
    crankSub.frequency.exponentialRampToValueAtTime(30, now + 1.48);

    crankLP.type = 'lowpass';
    crankLP.frequency.setValueAtTime(95, now + 0.36);
    crankLP.frequency.exponentialRampToValueAtTime(310, now + 0.72);
    crankLP.frequency.exponentialRampToValueAtTime(140, now + 1.48);
    crankLP.Q.value = 2.8;

    crankGain.gain.setValueAtTime(0.0001, now + 0.36);
    crankGain.gain.linearRampToValueAtTime(0.24, now + 0.68);
    crankGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.58);

    crank.connect(crankLP);
    crankSub.connect(crankLP);
    crankLP.connect(crankGain).connect(this.masterGain);
    crank.start(now + 0.36);
    crankSub.start(now + 0.36);
    crank.stop(now + 1.62);
    crankSub.stop(now + 1.62);

    // Smoothly bring up the continuous idle rumble as the ignition bloom fades out
    if (this._genGain) {
      this._genGain.gain.setTargetAtTime(0.11, now + 0.95, 0.22);
    }
  }

  triggerShutdown() {
    const wasRunning = this.engineRunning;
    this.engineRunning = false;
    this.drivingActive = false;
    if (!this._isAudible() || !wasRunning) return;

    const now = this.ctx.currentTime;

    // Fade continuous oscillators down cleanly
    if (this._continuousReady) {
      this._genGain.gain.setTargetAtTime(0.0001, now, 0.16);
      this._motorGain.gain.setTargetAtTime(0.0001, now, 0.12);
      this._tireBodyGain.gain.setTargetAtTime(0.0001, now, 0.08);
      this._tireGritGain.gain.setTargetAtTime(0.0001, now, 0.08);
      if (this._winchGain) {
        this._winchGain.gain.setTargetAtTime(0.0001, now, 0.06);
      }
    }

    // Generator wind-down groan
    const down = this.ctx.createOscillator();
    const lp = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    down.type = 'sawtooth';
    down.frequency.setValueAtTime(36, now);
    down.frequency.exponentialRampToValueAtTime(13, now + 0.85);
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(150, now);
    lp.frequency.exponentialRampToValueAtTime(48, now + 0.85);
    g.gain.setValueAtTime(0.14, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.90);
    down.connect(lp).connect(g).connect(this.masterGain);
    down.start(now);
    down.stop(now + 0.92);

    // Inverter power-down fall
    const inv = this.ctx.createOscillator();
    const invG = this.ctx.createGain();
    inv.type = 'sine';
    inv.frequency.setValueAtTime(340, now);
    inv.frequency.exponentialRampToValueAtTime(70, now + 0.62);
    invG.gain.setValueAtTime(0.045, now);
    invG.gain.exponentialRampToValueAtTime(0.0001, now + 0.66);
    inv.connect(invG).connect(this.masterGain);
    inv.start(now);
    inv.stop(now + 0.68);

    // Final HV contactor disconnect click
    this._playTransientClick(now + 0.72, 780, 0.11, 0.035);
  }

  // ==========================================================================
  // CONTINUOUS REAL-TIME DRIVING MODULATION
  // ==========================================================================

  update(dt, telemetry = {}) {
    const {
      speed = 0,
      throttle = 0,
      rpmNorm = 0,
      braking = 0,
      suspensionImpulse = 0,
      onGround = true,
      surface = 'gravel',
      drivingActive = false,
    } = telemetry;

    this.drivingActive = Boolean(drivingActive);

    if (!this._continuousReady || !this._isAudible()) {
      this._prevBraking = braking;
      return;
    }

    const now = this.ctx.currentTime;
    const absSpeed = Math.abs(speed);
    const speedNorm = clamp(absSpeed / 19.0, 0.0, 1.0);
    const rpm = clamp(rpmNorm, 0.0, 1.0);
    const thr = clamp(Math.abs(throttle), 0.0, 1.0);
    const brk = clamp(braking, 0.0, 1.0);
    const active = this.drivingActive || this.engineRunning;

    if (!active) {
      this._genGain.gain.setTargetAtTime(0.0001, now, 0.12);
      this._motorGain.gain.setTargetAtTime(0.0001, now, 0.10);
      this._tireBodyGain.gain.setTargetAtTime(0.0001, now, 0.08);
      this._tireGritGain.gain.setTargetAtTime(0.0001, now, 0.08);
      this._prevBraking = brk;
      return;
    }

    // 1. Heavy V8 Diesel Generator Rumble
    const genFreq = 30.0 + rpm * 44.0 + thr * 9.0;
    this._genOscA.frequency.setTargetAtTime(genFreq, now, 0.055);
    this._genOscB.frequency.setTargetAtTime(genFreq * 2.012, now, 0.055);
    this._genSubOsc.frequency.setTargetAtTime(Math.max(22.0, genFreq * 0.85), now, 0.06);
    this._genChugLfo.frequency.setTargetAtTime(11.5 + rpm * 22.0, now, 0.06);
    this._genChugDepth.gain.setTargetAtTime(22.0 + thr * 48.0, now, 0.06);
    this._genFilter.frequency.setTargetAtTime(115.0 + rpm * 210.0 + thr * 115.0, now, 0.06);

    const inStartup = now < this._startupRampUntil;
    const genLevel = inStartup ? 0.08 : 0.10 + rpm * 0.09 + thr * 0.07;
    this._genGain.gain.setTargetAtTime(genLevel, now, 0.08);

    // 2. Electric Traction Motor Whine (subtle regen pitch inflection under braking)
    const motorPitch = 185.0 + speedNorm * 980.0 + thr * 140.0 - brk * 55.0;
    this._motorOscA.frequency.setTargetAtTime(Math.max(120.0, motorPitch), now, 0.045);
    this._motorOscB.frequency.setTargetAtTime(Math.max(180.0, motorPitch * 1.5), now, 0.045);
    this._motorFilter.frequency.setTargetAtTime(Math.max(240.0, motorPitch * 1.35), now, 0.05);
    const motorLevel = (speedNorm * 0.042 + thr * 0.022 + brk * speedNorm * 0.018) * (this.drivingActive ? 1.0 : 0.0);
    this._motorGain.gain.setTargetAtTime(Math.max(0.0001, motorLevel), now, 0.06);

    // 3. Surface-Adaptive Tire Rolling & Gravel Grit Noise
    const groundGate = onGround && this.drivingActive && absSpeed > 0.35 ? 1.0 : 0.0;
    const rollEnv = groundGate * Math.pow(speedNorm, 0.78);

    let bodyFreq = 360;
    let bodyGain = 0.11;
    let gritFreq = 1650;
    let gritGain = 0.06;

    if (surface === 'gravel') {
      bodyFreq = 440 + speedNorm * 320;
      bodyGain = 0.13;
      gritFreq = 1750 + speedNorm * 900;
      gritGain = 0.085;
    } else if (surface === 'dirt') {
      bodyFreq = 310 + speedNorm * 240;
      bodyGain = 0.11;
      gritFreq = 1280 + speedNorm * 580;
      gritGain = 0.048;
    } else if (surface === 'rock') {
      bodyFreq = 480 + speedNorm * 280;
      bodyGain = 0.10;
      gritFreq = 1480 + speedNorm * 620;
      gritGain = 0.042;
    } else {
      // concrete
      bodyFreq = 240 + speedNorm * 190;
      bodyGain = 0.065;
      gritFreq = 980 + speedNorm * 320;
      gritGain = 0.012;
    }

    this._tireBodyFilter.frequency.setTargetAtTime(bodyFreq, now, 0.06);
    this._tireBodyGain.gain.setTargetAtTime(Math.max(0.0001, rollEnv * bodyGain), now, 0.07);
    this._tireGritFilter.frequency.setTargetAtTime(gritFreq, now, 0.06);
    this._tireGritGain.gain.setTargetAtTime(Math.max(0.0001, rollEnv * gritGain), now, 0.07);

    // 4. Pneumatic Air-Brake Hiss (on hard brake engagement or release after braking)
    const brakeJustReleased = this._prevBraking > 0.45 && brk < 0.15;
    const brakeHardHit = this._prevBraking < 0.25 && brk > 0.65 && absSpeed > 4.0;
    if ((brakeJustReleased || brakeHardHit) && now - this._lastBrakeHissTime > 0.85) {
      this._lastBrakeHissTime = now;
      this._playBrakeAirHiss(brakeHardHit ? 0.85 : 0.62);
    }

    // 5. Pneumatic Suspension Compression Thump (when hitting moguls / rock ledges)
    const impulse = Math.abs(suspensionImpulse || 0);
    if (this.drivingActive && impulse > 0.20 && now - this._lastSuspTime > 0.16) {
      this._lastSuspTime = now;
      this._playSuspensionThump(clamp(impulse, 0.2, 1.4));
    }

    this._prevBraking = brk;
  }

  // ==========================================================================
  // MECHANICAL INTERACTION & UI SOUNDS
  // ==========================================================================

  playDoorSound(opening = true) {
    this.unlock();
    if (!this._isAudible()) return;
    const now = this.ctx.currentTime;

    if (opening) {
      // Heavy armored latch release clunk + rising hydraulic hinge swoosh
      this._playArmoredClunk(now, 145, 0.16);
      this._playTransientClick(now + 0.018, 920, 0.09, 0.025);
      this._playHydraulicSwoosh(now + 0.05, 0.42, 420, 1180, 0.068);
    } else {
      // Hydraulic close swoosh culminating in heavy sealed armored thud
      this._playHydraulicSwoosh(now, 0.34, 980, 340, 0.058);
      this._playArmoredClunk(now + 0.30, 112, 0.22);
      this._playTransientClick(now + 0.33, 760, 0.10, 0.03);
    }
  }

  playHatchSound(opening = true) {
    this.unlock();
    if (!this._isAudible()) return;
    const now = this.ctx.currentTime;

    // Initial lock pin click
    this._playTransientClick(now, opening ? 1320 : 960, 0.08, 0.022);

    // Electric actuator servo whine
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const filt = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc2.type = 'sine';
    const fStart = opening ? 310 : 520;
    const fEnd = opening ? 540 : 275;

    osc.frequency.setValueAtTime(fStart, now + 0.03);
    osc.frequency.exponentialRampToValueAtTime(fEnd, now + 0.48);
    osc2.frequency.setValueAtTime(fStart * 2.0, now + 0.03);
    osc2.frequency.exponentialRampToValueAtTime(fEnd * 2.0, now + 0.48);

    filt.type = 'bandpass';
    filt.frequency.setValueAtTime(opening ? 880 : 680, now + 0.03);
    filt.Q.value = 3.2;

    gain.gain.setValueAtTime(0.0001, now + 0.03);
    gain.gain.linearRampToValueAtTime(0.055, now + 0.09);
    gain.gain.setValueAtTime(0.050, now + 0.42);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.52);

    osc.connect(filt);
    osc2.connect(filt);
    filt.connect(gain).connect(this.masterGain);
    osc.start(now + 0.03);
    osc2.start(now + 0.03);
    osc.stop(now + 0.54);
    osc2.stop(now + 0.54);

    // End-stop mechanical latch click
    this._playArmoredClunk(now + 0.48, opening ? 190 : 128, opening ? 0.09 : 0.16);
  }

  playUiClick() {
    this.unlock();
    if (!this._isAudible()) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1850, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.015);
    gain.gain.setValueAtTime(0.032, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

    osc.connect(gain).connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.022);
  }

  /**
   * Crisp tactile heavy-duty automotive relay clack when toggling Headlights / Roof Pods (L).
   */
  playLightRelayClick(on = true) {
    this.unlock();
    if (!this._isAudible()) return;
    const now = this.ctx.currentTime;

    if (on) {
      // Primary 40A headlight contactor snap + damped relay housing thump + secondary roof-bar relay close
      this._playRelaySnap(now, 1740, 520, 0.075, 0.017);
      this._playRelayHousingThump(now + 0.003, 215, 88, 0.044, 0.024);
      this._playRelaySnap(now + 0.022, 1320, 440, 0.048, 0.015);
    } else {
      // Slightly deeper spring-return relay release clack
      this._playRelaySnap(now, 1140, 340, 0.066, 0.019);
      this._playRelayHousingThump(now + 0.004, 168, 70, 0.036, 0.022);
    }
  }

  /**
   * Continuous real-time electric planetary-gear recovery winch sound controller.
   * Tracks reel speed, drops pitch authentically under heavy haul tension, and emits
   * crisp mechanical drum ratchet pawl pulses & phase-transition solenoid/seat cues.
   */
  updateWinchAudio(dt, state = {}) {
    const {
      active = false,
      speedNorm = 0,
      tensionNorm = 0,
      phase = 'stowed',
    } = state || {};

    const prevPhase = this._prevWinchPhase;
    this._prevWinchPhase = phase;

    if (!this._continuousReady || !this._isAudible() || !this._winchGain) {
      this._winchRatchetAccum = 0;
      return;
    }

    const now = this.ctx.currentTime;
    const safeDt = clamp(Number(dt) || 0, 0.0, 0.1);
    const spd = clamp(Math.abs(Number(speedNorm) || 0), 0.0, 1.0);
    const tension = clamp(Number(tensionNorm) || 0, 0.0, 1.0);

    // Phase-transition mechanical cues (solenoid engagement, anchor bite, cradle seat)
    if (phase !== prevPhase) {
      if (phase === 'deploying') {
        this._playRelaySnap(now, 1480, 480, 0.068, 0.018);
        this._playRelayHousingThump(now + 0.008, 190, 76, 0.042, 0.026);
      } else if (phase === 'deployed') {
        // Forged steel hook lands cleanly on studio floor + drum brake lock
        this._playArmoredClunk(now, 195, 0.085);
        this._playTransientClick(now + 0.018, 1220, 0.045, 0.018);
      } else if (phase === 'anchored') {
        this._playArmoredClunk(now, 235, 0.11);
        this._playTransientClick(now + 0.014, 1620, 0.062, 0.020);
      } else if (phase === 'tensioning') {
        this._playRelaySnap(now, 1560, 560, 0.072, 0.018);
      } else if (phase === 'reeling') {
        this._playRelaySnap(now, 1380, 420, 0.075, 0.020);
        this._playRelayHousingThump(now + 0.006, 175, 68, 0.050, 0.028);
      } else if (phase === 'stowed' && prevPhase !== 'stowed') {
        this._playArmoredClunk(now, 152, 0.125);
        this._playTransientClick(now + 0.022, 920, 0.052, 0.020);
      }
    }

    const motorSpinning =
      Boolean(active) &&
      (phase === 'deploying' || phase === 'reeling' || phase === 'tensioning' || spd > 0.03);

    if (!motorSpinning) {
      this._winchGain.gain.setTargetAtTime(0.0001, now, 0.045);
      this._winchRatchetAccum = 0;
      return;
    }

    // Electric planetary-gear motor whine: pitch tracks reel speed & sags realistically under heavy haul load
    const baseFreq = clamp(158.0 + spd * 238.0 - tension * 54.0, 92.0, 440.0);
    this._winchOscCore.frequency.setTargetAtTime(baseFreq, now, 0.045);
    this._winchOscMesh.frequency.setTargetAtTime(baseFreq * 2.02, now, 0.045);
    this._winchOscSub.frequency.setTargetAtTime(Math.max(48.0, baseFreq * 0.50), now, 0.05);

    const filterCutoff = clamp(560.0 + spd * 640.0 + tension * 210.0, 420.0, 1680.0);
    this._winchFilter.frequency.setTargetAtTime(filterCutoff, now, 0.05);

    const motorLevel =
      phase === 'tensioning'
        ? 0.034 + tension * 0.024
        : 0.020 + spd * 0.040 + tension * 0.022;
    this._winchGain.gain.setTargetAtTime(clamp(motorLevel, 0.0001, 0.086), now, 0.045);

    // Mechanical drum ratchet / pawl click pulses when paying out, hauling while anchored, or reeling in
    const reelingPhase = phase === 'reeling' || phase === 'anchored';
    if ((phase === 'deploying' || reelingPhase) && spd > 0.04) {
      const clickRateHz = 6.2 + spd * 7.8;
      this._winchRatchetAccum += safeDt * clickRateHz;
      if (this._winchRatchetAccum >= 1.0 && now - this._lastWinchClickTime > 0.055) {
        this._winchRatchetAccum -= Math.floor(this._winchRatchetAccum);
        this._lastWinchClickTime = now;
        this._playWinchRatchetClick(tension, reelingPhase);
      }
    }
  }

  // ==========================================================================
  // INTERNAL ONE-SHOT SYNTHESIS PRIMITIVES
  // ==========================================================================

  _playTransientClick(startTime, freq, peakGain, duration) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, startTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.35, startTime + duration);
    g.gain.setValueAtTime(peakGain, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(g).connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.005);
  }

  _playRelaySnap(startTime, fStart, fEnd, peakGain, duration) {
    const osc = this.ctx.createOscillator();
    const bp = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(fStart, startTime);
    osc.frequency.exponentialRampToValueAtTime(fEnd, startTime + duration);
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime((fStart + fEnd) * 0.65, startTime);
    bp.Q.value = 1.9;
    g.gain.setValueAtTime(peakGain, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(bp).connect(g).connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.006);
  }

  _playRelayHousingThump(startTime, fStart, fEnd, peakGain, duration) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(fStart, startTime);
    osc.frequency.exponentialRampToValueAtTime(fEnd, startTime + duration);
    g.gain.setValueAtTime(peakGain, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
    osc.connect(g).connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + duration + 0.006);
  }

  _playWinchRatchetClick(tensionNorm = 0, reelingIn = false) {
    const now = this.ctx.currentTime;
    const baseFreq = reelingIn ? 1180 + tensionNorm * 320 : 1480 - tensionNorm * 140;
    const peak = 0.020 + tensionNorm * 0.016;
    this._playRelaySnap(now, baseFreq, baseFreq * 0.42, peak, 0.013);
  }

  _playArmoredClunk(startTime, baseFreq, peakGain) {
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, startTime);
    osc.frequency.exponentialRampToValueAtTime(36, startTime + 0.11);
    g.gain.setValueAtTime(peakGain, startTime);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.125);
    osc.connect(g).connect(this.masterGain);
    osc.start(startTime);
    osc.stop(startTime + 0.14);
  }

  _playHydraulicSwoosh(startTime, duration, freqStart, freqEnd, peakGain) {
    if (!this.noiseBuffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(freqStart, startTime);
    bp.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
    bp.Q.value = 2.1;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, startTime);
    g.gain.linearRampToValueAtTime(peakGain, startTime + duration * 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    src.connect(bp).connect(g).connect(this.masterGain);
    src.start(startTime, Math.random() * 1.5, duration + 0.02);
  }

  _playBrakeAirHiss(intensity = 0.7) {
    if (!this.noiseBuffer) return;
    const now = this.ctx.currentTime;
    const dur = 0.24 + intensity * 0.10;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;

    const bp = this.ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(2600, now);
    bp.frequency.exponentialRampToValueAtTime(1050, now + dur);
    bp.Q.value = 1.6;

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.068 * intensity, now + 0.022);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    src.connect(bp).connect(g).connect(this.masterGain);
    src.start(now, Math.random() * 1.5, dur + 0.02);
  }

  _playSuspensionThump(impulse = 0.5) {
    const now = this.ctx.currentTime;
    const gainScale = clamp(impulse * 0.14, 0.03, 0.20);

    // Deep damped suspension compression thud
    const sub = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(76 + impulse * 18, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + 0.14);
    g.gain.setValueAtTime(gainScale, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    sub.connect(g).connect(this.masterGain);
    sub.start(now);
    sub.stop(now + 0.18);

    // Subtle hydraulic damper gas-valve hiss
    if (this.noiseBuffer && impulse > 0.35) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(1150, now);
      bp.frequency.exponentialRampToValueAtTime(480, now + 0.11);
      bp.Q.value = 2.0;
      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(0.028 * Math.min(1.2, impulse), now);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      src.connect(bp).connect(ng).connect(this.masterGain);
      src.start(now, Math.random() * 1.5, 0.14);
    }
  }

  dispose() {
    this.engineRunning = false;
    this.drivingActive = false;
    const stopNode = (n) => {
      try { n?.stop?.(); } catch {}
    };
    stopNode(this._genOscA);
    stopNode(this._genOscB);
    stopNode(this._genSubOsc);
    stopNode(this._genChugLfo);
    stopNode(this._motorOscA);
    stopNode(this._motorOscB);
    stopNode(this._tireNoiseSrc);
    stopNode(this._winchOscCore);
    stopNode(this._winchOscMesh);
    stopNode(this._winchOscSub);
    this._continuousReady = false;
    try {
      this.ctx?.close?.();
    } catch {}
    this.ctx = null;
    this.unlocked = false;
  }
}
