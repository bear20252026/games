/**
 * Purr —— 用 WebAudio 现场合成呼噜声，站点没有任何音频文件
 *
 * makePurr() 建两条链路：低频锯齿（喉音）+ 带通噪声（气流），再用呼吸包络
 * breathBand() 调幅；toggle() 处理浏览器自动播放限制（首次点击才真正 start）。
 */

'use strict';
const { Purr } = (() => {
  function breathBand(gain, a1, a2, b1, b2) {
    let z1 = 0,
      z2 = 0,
      w1 = 0,
      w2 = 0;
    return () => {
      const x = gain * (2 * Math.random() - 1);
      const y = x + z1;
      z1 = 2 * x - a1 * y + z2;
      z2 = x - a2 * y;
      const out = y + w1;
      w1 = -2 * y - b1 * out + w2;
      w2 = y - b2 * out;
      return out;
    };
  }
  function makePurr(ctx) {
    const rate = 24000,
      clip = ctx.createBuffer(1, 9 * rate, rate),
      data = clip.getChannelData(0);
    const throatNoise = breathBand(
      0.031123062,
      -1.840968141,
      0.858616601,
      -1.968871069,
      0.96963571,
    );
    const airNoise = breathBand(0.045636007, -1.796412445, 0.83151183, -1.941966293, 0.945405516);
    const drift =
      'ULHHNTVELQZWEPWNBXNTXJIFZOVAEDRMQYRCZBWNUCRXWQGLFYEMHUFFAICVOKFVULWOOZHJRBNEISTXRYFGWGQAONCBBGJGDGZC';
    const tau = 2 * Math.PI;
    let phase = 0,
      noise = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / rate,
        a = Math.sin((t * tau) / 3),
        b = Math.sin(tau * (t / 3 + 0.07 * Math.sin((t * tau) / 7)));
      const pos = (t + 1) / 0.11,
        j = Math.floor(pos),
        v = drift.charCodeAt(j);
      const wobble = (v - 65 + (drift.charCodeAt(j + 1) - v) * (pos - j)) * 0.056 - 0.7;
      phase +=
        (tau * (24.1 + 0.725 * a + 0.175 * Math.sin((t * tau) / 1.5) + 0.7 * b + 0.3 * wobble)) /
        rate;
      const h = Math.sin(phase),
        pulse = (1 + h) * 0.5,
        sq = pulse * pulse,
        cube = sq * pulse;
      noise = 0.6561 * noise + 0.2432 * (2 * Math.random() - 1);
      const bright = 0.28 * h + 0.16 * Math.sin(2 * phase) + 0.1 * Math.sin(3 * phase);
      const deep =
        0.35 * h +
        0.19 * Math.sin(2 * phase + 0.2) +
        0.064 * Math.sin(3 * phase + 0.4) +
        0.038 * Math.sin(4 * phase + 0.6) +
        0.023 * Math.sin(5 * phase + 0.8);
      const aVoice =
        (bright * (0.6 + 0.4 * cube) + noise * (0.2 + 0.74 * cube)) *
        (0.31 + 0.4 * Math.abs(a) + 0.19 * Math.max(0, a));
      const rasp = 0.043 * throatNoise() * (0.38 + 0.62 * sq);
      const air = 0.009 * airNoise() * (0.18 + 0.82 * Math.max(0, -b) ** 2);
      const bVoice =
        (deep * (0.69 + 0.31 * sq) + rasp + air) *
        (0.37 + 0.38 * Math.abs(b) + 0.16 * Math.max(0, b));
      const edge = Math.min(1, i / (rate * 0.09), (data.length - 1 - i) / (rate * 0.09));
      data[i] = 0.5 * (aVoice + bVoice) * edge;
    }
    return clip;
  }
  class Purr {
    enabled = false;
    async toggle() {
      if (!this.context) {
        const Audio = window.AudioContext || window.webkitAudioContext;
        if (!Audio) throw Error('audio unavailable');
        this.context = new Audio();
        const ctx = this.context;
        const clip = makePurr(ctx);
        const source = ctx.createBufferSource();
        source.buffer = clip;
        source.loop = true;
        this.gain = ctx.createGain();
        this.gain.gain.value = 0;
        const low = ctx.createBiquadFilter();
        low.type = 'lowpass';
        low.frequency.value = 590;
        source.connect(low).connect(this.gain).connect(ctx.destination);
        source.start();
      }
      await this.context.resume();
      this.enabled = !this.enabled;
      this.update(0, true);
      return this.enabled;
    }
    update(value, immediate = false) {
      if (!this.context) return;
      const target = this.enabled && !document.hidden ? 0.05 + 0.58 * value : 0;
      if (immediate || Math.abs(target - (this.target ?? -1)) > 0.008) {
        this.target = target;
        this.gain.gain.setTargetAtTime(target, this.context.currentTime, immediate ? 0.1 : 0.24);
      }
    }
  }
  return { Purr };
})();
