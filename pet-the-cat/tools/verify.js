const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = process.argv[2];
const SRC = path.join(ROOT, 'source');
const offline = fs.readFileSync(path.join(ROOT, 'pet-the-cat-offline.html'), 'utf8');

const hash = b => crypto.createHash('sha256').update(b).digest('hex');

// 1. 从单文件版里取出 PET_ASSETS_DATA
const m = offline.match(/window\.PET_ASSETS_DATA=(\{.*?\});<\/script>/s);
if (!m) throw new Error('inline data not found');
const data = JSON.parse(m[1]);
const bin = Buffer.from(data.bin, 'base64');
const original = fs.readFileSync(path.join(ROOT, '_unpacked', 'assets.bin'));
console.log('inline bytes:', bin.length, '| original:', original.length, '| sha match:', hash(bin) === hash(original));

// 2. 单文件版里的 app 源码 == source/app.js
const appInOffline = offline.slice(offline.lastIndexOf('<script>') + 8, offline.lastIndexOf('</script>'));
const appFile = fs.readFileSync(path.join(SRC, 'app.js'), 'utf8');
console.log('app identical:', appInOffline.trim() === appFile.trim(), '| patched loader:', appFile.includes('window.PET_ASSETS'));

// 3. directory 完整性
let total = 0;
for (const [name, meta] of Object.entries(data.directory)) total += meta[1];
console.log('directory entries:', Object.keys(data.directory).length, '| total asset bytes:', total, '| matches bin:', total === bin.length);

// 4. 单文件版不含任何网络请求
const httpRefs = [...offline.matchAll(/["'(]?(https?:\/\/[^"')\s]+)/g)].map(x => x[1]).filter(u => !u.includes('www.w3.org'));
console.log('external refs:', httpRefs);

// 5. AVIF 文件头逐张确认
const files = fs.readdirSync(path.join(SRC, 'assets'));
const bad = files.filter(f => {
  const head = fs.readFileSync(path.join(SRC, 'assets', f)).subarray(4, 12).toString('latin1');
  return !head.includes('ftypavif');
});
console.log('avif files:', files.length, '| header ok:', files.length - bad.length, '| bad:', bad);

