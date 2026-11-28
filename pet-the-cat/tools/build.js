const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2];
const UNPACKED = path.join(ROOT, '_unpacked');
const SRC = path.join(ROOT, 'source');

const headPart = fs.readFileSync(path.join(UNPACKED, 'head.part.html'), 'utf8');
const bodyPart = fs.readFileSync(path.join(UNPACKED, 'body.part.html'), 'utf8');
let app = fs.readFileSync(path.join(UNPACKED, 'app.js'), 'utf8');
const directory = JSON.parse(fs.readFileSync(path.join(UNPACKED, 'directory.json'), 'utf8'));
const bin = fs.readFileSync(path.join(UNPACKED, 'assets.bin'));

fs.mkdirSync(path.join(SRC, 'assets'), { recursive: true });

// ---- 1. 拆出 27 张 AVIF ----
for (const [name, meta] of Object.entries(directory)) {
  const [off, len] = meta;
  fs.writeFileSync(path.join(SRC, 'assets', name + '.avif'), bin.subarray(off, off + len));
}

// ---- 1b. 同时留一份可读的裁切信息 ----
fs.writeFileSync(path.join(SRC, 'assets-directory.json'), JSON.stringify(directory, null, 2), 'utf8');

// ---- 2. app.js：唯一改动是资源读取来源 ----
const ORIG = 'const {photos, directory}=document.currentScript;';
const PATCHED = 'const {photos, directory}=window.PET_ASSETS;';
if (!app.includes(ORIG)) throw new Error('asset loader line not found');
app = app.replace(ORIG, PATCHED);
fs.writeFileSync(path.join(SRC, 'app.js'), app, 'utf8');

// ---- 3. 资源数据（base64 + directory 元信息）----
const base64 = bin.toString('base64');
fs.writeFileSync(
  path.join(SRC, 'assets-data.js'),
  '/* 27 张 AVIF 精灵图合并成的一段字节流（原样来自站点 pack），以及每张图的偏移/尺寸信息\n' +
  '   directory 每项含义：[字节偏移, 字节长度, 裁切x, 裁切y, 裁切宽, 裁切高, 画布宽, 画布高] */\n' +
  'window.PET_ASSETS_DATA=' + JSON.stringify({ directory, bin: base64 }) + ';\n',
  'utf8'
);

// ---- 4. boot.js：把 base64 还原成 Uint8Array 并交给 app.js ----
fs.writeFileSync(
  path.join(SRC, 'boot.js'),
  `/* 原站把二进制资源塞在 <script id="pack"> 里，再用 document.currentScript.photos 交给应用。
   这里拆成独立文件：base64 -> Uint8Array -> window.PET_ASSETS，app.js 开头一行对应改成 window.PET_ASSETS。 */
(() => {
  const data = window.PET_ASSETS_DATA;
  const bytes = atob(data.bin);
  const photos = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) photos[i] = bytes.charCodeAt(i);
  window.PET_ASSETS = { photos, directory: data.directory };
})();
`,
  'utf8'
);

// ---- 5. 组装 index.html ----
const themeScript = `(()=>{
  const root=document.documentElement,requested=new URLSearchParams(location.search).get('theme');
  let stored;
  try{stored=localStorage.getItem('pet-the-cat-theme');}catch{}
  const theme=[requested,stored].find(value=>value==='light'||value==='dark')||'light';
  root.dataset.theme=theme;
  document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#101722':'#fbf5ec';
})();`;

const favicon = `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='10' fill='%23fbf5ec'/%3E%3Cpath d='M6 24 7 8 16 15Q20 13 24 15L34 8 33 25C31 37 8 37 6 24Z' fill='%23453327'/%3E%3C/svg%3E">`;
const baseStyle = `<style>:where(html){background:#fbf5ec;color-scheme:light}:where(html[data-theme=dark]){background:#101722;color-scheme:dark}</style>`;

function page({ inline }) {
  const tail = inline
    ? `<script>window.PET_ASSETS_DATA=${JSON.stringify({ directory, bin: base64 })};</script>
<script>${fs.readFileSync(path.join(SRC, 'boot.js'), 'utf8')}</script>
<script>${app}</script>`
    : `<script src="assets-data.js"></script>
<script src="boot.js"></script>
<script src="app.js"></script>`;
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#fbf5ec">
<script>${themeScript}</script>
<title>猫撫でシミュレーター</title>
${favicon}
${baseStyle}
${headPart}
</head>
<body>${bodyPart}
${tail}
</body>
</html>
`;
}

fs.writeFileSync(path.join(SRC, 'index.html'), page({ inline: false }), 'utf8');
fs.writeFileSync(path.join(ROOT, 'pet-the-cat-offline.html'), page({ inline: true }), 'utf8');

const kb = n => (n / 1024).toFixed(1) + ' KB';
console.log('source/index.html', kb(fs.statSync(path.join(SRC, 'index.html')).size));
console.log('source/app.js', kb(fs.statSync(path.join(SRC, 'app.js')).size), 'lines', app.split('\n').length);
console.log('source/assets-data.js', kb(fs.statSync(path.join(SRC, 'assets-data.js')).size));
console.log('offline html', kb(fs.statSync(path.join(ROOT, 'pet-the-cat-offline.html')).size));
console.log('assets', fs.readdirSync(path.join(SRC, 'assets')).length);

