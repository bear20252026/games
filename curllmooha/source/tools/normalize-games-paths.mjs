// Normalise a Curllmooha build for https://bear20252026.github.io/games/curllmooha/
// Usage: node tools/normalize-games-paths.mjs ../_build
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(process.argv[2] || '../_build');
const base = '/games/curllmooha/';
const textExt = new Set(['.html', '.js', '.css', '.json', '.webmanifest', '.svg', '.xml', '.txt']);
const segments = ['assets', 'cursors', 'draco', 'work', 'hire'];
const files = ['vipin-pathak-resume.pdf', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'site.webmanifest', 'og-image.jpg', 'lilita-one-uppercase.typeface.json'];

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

let changed = 0;
for (const file of walk(root)) {
  if (!textExt.has(path.extname(file).toLowerCase())) continue;
  const before = fs.readFileSync(file, 'utf8');
  let text = before;

  for (const segment of segments) {
    const re = new RegExp(`(["'(])/${segment}/`, 'g');
    text = text.replace(re, `$1${base}${segment}/`);
  }

  text = text.replaceAll('"/src/main.js"', `"${base}source/src/main.js"`);
  text = text.replaceAll("'/src/main.js'", `'${base}source/src/main.js'`);

  for (const name of files) {
    const re = new RegExp(`(["'(])/${name.replaceAll('.', '\\.')}(?=["')])`, 'g');
    text = text.replace(re, `$1${base}${name}`);
  }

  text = text.replaceAll('"start_url": "/"', `"start_url": "${base}"`);
  text = text.replaceAll('"scope": "/"', `"scope": "${base}"`);
  text = text.replaceAll('href="/"', `href="${base}"`);
  text = text.replaceAll("href='/'", `href='${base}'`);

  if (text !== before) {
    fs.writeFileSync(file, text);
    changed += 1;
  }
}

console.log(`normalised ${changed} file(s) under ${root}`);
