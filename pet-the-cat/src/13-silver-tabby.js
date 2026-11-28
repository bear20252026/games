/**
 * silverTabby —— "银渐层"（saba）是算出来的，不是素材
 *
 * 站点没有 saba.avif，readPhoto 遇到 saba 时拿 mugi（茶虎）的像素现场调色：
 * 降饱和、抬亮底色、保留深色条纹的对比，得到银渐层观感。tail 参数决定处理身体还是尾巴。
 */

'use strict';
const { silverTabby } = (() => {
  function silverTabby(photo, tail) {
    const canvas = document.createElement('canvas');
    const w = (canvas.width = photo.width),
      h = (canvas.height = photo.height);
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(photo, 0, 0);
    const frame = ctx.getImageData(0, 0, w, h),
      pixels = frame.data;
    const source = [0, 32, 52, 66, 80, 94, 108, 127, 150, 180, 220, 255];
    const silver = [8, 18, 31, 49, 77, 112, 145, 174, 200, 223, 238, 248];
    const tones = new Uint8ClampedArray(768);
    for (let v = 0, j = 1; v < 256; v++) {
      while (v > source[j]) j++;
      const l =
        silver[j - 1] +
        ((v - source[j - 1]) / (source[j] - source[j - 1])) * (silver[j] - silver[j - 1]);
      tones[3 * v] = l + 0.6 - (2.3 * l) / 255;
      tones[3 * v + 1] = l + 1;
      tones[3 * v + 2] = l + 0.9 - (0.3 * l) / 255;
    }
    const earA = new Float32Array(w),
      earB = new Float32Array(w);
    if (!tail)
      for (let i = 0; i < w; i++) {
        const x = ((i + 0.5) * 1517) / w - 0.5;
        earA[i] = Math.exp(-(((x - 214) / 48) ** 2));
        earB[i] = Math.exp(-(((x - 192) / 51) ** 2));
      }
    for (let j = 0, i = 0; j < h; j++) {
      const y = ((j + 0.5) * 935) / h - 0.5;
      const a = tail ? 0 : Math.exp(-(((y - 309) / 46) ** 2)),
        b = tail ? 0 : Math.exp(-(((y - 580) / 26) ** 2));
      for (let k = 0; k < w; k++, i += 4) {
        if (!pixels[i + 3]) continue;
        const t = 3 * ((54 * pixels[i] + 183 * pixels[i + 1] + 19 * pixels[i + 2] + 128) >> 8);
        const ear = Math.max(earA[k] * a, earB[k] * b);
        pixels[i] = tones[t] + 18 * ear;
        pixels[i + 1] = tones[t + 1] - 12 * ear;
        pixels[i + 2] = tones[t + 2] - 10 * ear;
      }
    }
    ctx.putImageData(frame, 0, 0);
    return canvas;
  }
  return { silverTabby };
})();
