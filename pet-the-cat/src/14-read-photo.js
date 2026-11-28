/**
 * readPhoto —— 资源加载入口
 *
 * 从 window.PET_ASSETS（applications 启动时塞进来的 513587 字节 + 目录表）里按名字取切片：
 *  - new Blob → Image.decode() 解 AVIF（浏览器原生解码）
 *  - 身体图按目录里的裁切框 [x,y,w,h,W,H] 缩放到画布尺寸；尾巴不裁切
 *  - 结果按名字缓存（original Map），失败自动重试
 *  - saba / saba-tail 走 silverTabby 合成
 */

'use strict';
const { readPhoto } = (() => {
  const { photos, directory } = window.PET_ASSETS;
  const originals = new Map();
  async function decodePhoto(name) {
    const [offset, count, x, y, w, h, W, H] = directory[name];
    const url = URL.createObjectURL(
      new Blob([photos.subarray(offset, offset + count)], { type: 'image/avif' }),
    );
    const img = new Image();
    try {
      img.src = url;
      await img.decode();
    } finally {
      URL.revokeObjectURL(url);
    }
    if (name === 'room') return img;
    const body = !name.includes('-');
    const c = document.createElement('canvas'),
      scale = body ? Math.min(1, img.width / w) : 1;
    c.width = Math.round(W * scale);
    c.height = Math.round(H * scale);
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, (x * c.width) / W, (y * c.height) / H, (w * c.width) / W, (h * c.height) / H);
    return c;
  }
  function original(name) {
    if (!originals.has(name))
      originals.set(
        name,
        decodePhoto(name).catch((e) => {
          originals.delete(name);
          throw e;
        }),
      );
    return originals.get(name);
  }
  async function readPhoto(name) {
    if (directory[name]) return original(name);
    if (name === 'saba' || name === 'saba-tail') {
      const tail = name.endsWith('-tail');
      return silverTabby(await original(tail ? 'mugi-tail' : 'mugi'), tail);
    }
    throw new Error('Unknown coat ' + name);
  }
  return { readPhoto };
})();
