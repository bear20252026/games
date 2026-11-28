/**
 *
 * 站点把整站压成一段字节流，藏在 <script id="pack"> 里，用两层编码：
 *  1) 每个字符存 14 bit（charCode-12288），拆成两个 7-bit 字节，得到一段解码器 JS；
 *  2) 解码器用 LZMA 变体解出一个 149110 字节的字典块，拼回 HTML+CSS、应用 JS，
 *     以及 513587 字节的图片区（27 张 AVIF）。
 *
 * 用法：node tools/decode.js .
 * 产物：_unpacked/（head.part.html, body.part.html, app.js, directory.json, assets.bin）
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2] || '.';
const ORIGINAL = path.join(ROOT, 'original', 'packed-page.html');
const DECODER = path.join(ROOT, 'tools', 'stage1-decoder.js');
const OUT = path.join(ROOT, '_unpacked');

const html = fs.readFileSync(ORIGINAL, 'utf8');
const m = html.match(/<script type="application\/octet-stream" id="pack">(.*?)<\/script>/s);
if (!m) throw new Error('pack script not found');
const pack = m[1];

// 第一层：14 bit -> 两字节，还原解码器脚本
let code = fs.readFileSync(DECODER, 'utf8');
const a = "const W=document.getElementById('pack');const E=W.textContent;W.remove();";
const b = "document.head.insertAdjacentHTML('beforeend',V.slice(0,af));document.body.insertAdjacentHTML('afterbegin',V.slice(af));const D=document.createElement('script');D.photos=L;D.directory=ae;D.textContent=ay;document.body.append(D);D.remove();";
if (!code.includes(a) || !code.includes(b)) throw new Error('decoder pattern mismatch');
code = code.replace(a, 'const E=__PACK__;').replace(b, 'dump(V.slice(0,af),V.slice(af),ay,ae,L);');

fs.mkdirSync(path.join(OUT, 'assets'), { recursive: true });

new Function('__PACK__', 'dump', code)(
  pack,
  (headHtml, bodyHtml, js, DIR, L) => {
    fs.writeFileSync(path.join(OUT, 'head.part.html'), headHtml, 'utf8');
    fs.writeFileSync(path.join(OUT, 'body.part.html'), bodyHtml, 'utf8');
    fs.writeFileSync(path.join(OUT, 'app.js'), js, 'utf8');
    fs.writeFileSync(path.join(OUT, 'directory.json'), JSON.stringify(DIR, null, 2), 'utf8');
    fs.writeFileSync(path.join(OUT, 'assets.bin'), Buffer.from(L));
    const entries = Object.entries(DIR);
    console.log('head chars', headHtml.length, '| body chars', bodyHtml.length, '| js chars', js.length);
    console.log('assets:', entries.length, '| total bytes:', L.length);
  }
);
console.log('unpacked ->', OUT);
