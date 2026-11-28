/**
 * 生成"可读版"：把 source/app.js 按天然的 IIFE 模块边界拆成 17 个文件，
 * 每个文件只加文件头注释，代码本体逐字保留（不改一行逻辑）。
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.argv[2];
const SRC = path.join(ROOT, 'source');
const OUT = path.join(ROOT, 'readable');
const APP = fs.readFileSync(path.join(SRC, 'app.js'), 'utf8');
const lines = APP.split('\n');

// ---------- 1. 找出模块边界 ----------
const mods = [];
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/^const \{([^}]+)\}=\(\(\)=>\{$/);
  if (!m) continue;
  const names = m[1].split(',').map(s => s.trim());
  let end = -1;
  for (let j = i; j < lines.length; j++) {
    if (lines[j] === `return {${m[1]}};})();`) { end = j; break; }
  }
  if (end < 0) throw new Error('module end not found for ' + m[1]);
  mods.push({ names, start: i, end });
}
const mainStart = mods.at(-1).end + 1;

// ---------- 2. 文件头注释 ----------
const headers = {
  CoatSurface: `/**
 * CoatSurface —— 把一张猫身照片变成"可变形毛皮"
 *
 * 做法：照片不做逐像素重绘，而是当作一张可形变的贴图（76×48 网格）。
 *  - xy：每个网格顶点在贴图里的采样位置（被按压/塌陷时由 OverheadCat 改写）
 *  - light：每个顶点的光照向量（着色用）
 *  - lift：隆起量（长毛猫的毛束被压弯的程度）
 *
 * 三条通道各有一张"材质图"：
 *  - strand：毛流方向（R 通道），决定高光往哪边扫
 *  - locks：发束的偏移与隆起（长毛猫按毛流方向撒"毛束"生成；短毛猫用邻域高光梯度）
 *  - napFactor：毛向因子表，光线逆毛和顺毛的亮度差（猫毛"丝绒感"的关键）
 *
 * 两种渲染路径，输出完全一致：
 *  - WebGL：顶点着色器把网格铺到画布，片元着色器做毛束位移 + 光照 + 毛向叠加
 *  - Canvas2D：warp() 用逆向映射逐像素采样（没有 WebGL 时的兜底，也用于导出静态帧）
 *
 * 怎么读：先看 setImage() 了解三张材质图怎么来的，再看 warp() 或 program() 里的片元着色器。
 */`,
  CoatOutline: `/**
 * CoatOutline —— 从身体图里"抠"出轮廓，供手部贴边、遮挡使用
 *
 * - lines/point：把身体图的 alpha 边缘按 marching 方式求交，得到一圈折线段（带法线）
 * - near()：给任意屏幕点找到最近的轮廓点，加权平滑后返回"贴边位置 + 法线 + 在头/背哪个区"
 * - fitNeck()：算出脖子上下两条极限线，手压下去时不能穿过脖子
 * - padCoverage()：查某个 uv 点是否还在猫身上（带 3px 柔化）
 *
 * 手要"压进毛里"而不是浮在照片上，靠的就是这一层几何信息。
 */`,
  CatTail: `/**
 * CatTail —— 尾巴的 26 节样条骨骼与抓握状态机
 *
 * 静止姿态由 path 常量（一串归一化控制点）采样成骨架；每节存 rest/upperRest 两个角度：
 * 平放、翘起。
 *
 * 状态：grab() 抓住 → drag() 拖动（超过程度会拉长、超过指尖会打滑）→ release()
 * 松手后 readyToCurl/beginCurl 让尾巴按随机延迟卷回去，回弹用二阶阻尼 turn()。
 *
 * 弯曲刚度沿长度衰减（bendWeight），所以根部硬、尾梢软；widthScale 表示被抓握处被捏细。
 */`,
  TailPhoto: `/**
 * TailPhoto —— 把尾巴照片贴着骨骼"蒙"上去
 *
 * 照片是横向条带：尾部横向切图，stripOrigin 处是尾巴根，之后每 1/1000 长度对应一列像素。
 * drawSections() 沿骨骼每 50px 取一条截面，截面上的像素按 widthScale 展开，形成四边形带；
 * 四边形再拆成两个三角形贴图。
 *
 * 两套光栅化：
 *  - rasterTriangle()：写进 ImageData 的软件光栅，带 1.5px 膨胀做边缘抗锯齿（小图/无 GPU 时）
 *  - drawTriangle()：用 canvas 的 clip + 仿射变换直接贴图（快，但有接缝）
 * 只有在尾巴形变超过亚像素阈值时才重绘（changed 判断），省掉大量开销。
 */`,
  TailSocket: `/**
 * TailSocket —— 尾巴根部与身体网格的"缝合"
 *
 * 尾巴是独立骨架，身体是独立网格，两者接口处会撕裂。这里把靠近尾巴的身体顶点
 * 按 influence(arc, 横向距离) 的权重拉到尾巴坐标系里，越靠根权重越大。
 * seat() 负责把尾巴横截面贴到身体表面（先取身体网格坐标，再按距离衰减回尾巴坐标），
 * 所以尾巴根看起来是从毛里长出来的，而不是插在身体上。
 */`,
  OverheadCat: `/**
 * OverheadCat —— 猫本体：骨架权重、姿态、被抚摸时的塌陷与绘制
 *
 * 网格顶点权重来自 widthWeight()（脸颊/脖子/肩/腰），restY()/unmap() 负责"屏幕坐标 ↔ 贴图坐标"
 * 的互算（身体被压扁后仍需正确采样毛皮）。
 *
 * 状态量都在 state 里：load（按压深度）、bulk（体积被推挤）、lift（毛被掀起）、
 * shearX/Y（被顺毛方向推的剪切）、pads（手指接触点）、tail（尾巴摆动）。
 * 每帧 tick() 用弹簧积分推进，draw() 把 xy/light/lift 写回 CoatSurface 再叠尾巴与轮廓。
 *
 * setCat() 是入口：按毛色决定长毛/短毛、pile（毛层厚度）、pale（浅色程度）、
 * guardFlow（挪威森林猫的护毛方向场）。
 */`,
  'sleeveReach,HandLayer': `/**
 * HandLayer —— 手腕/袖口的遮挡
 *
 * sleeveReach() 先算出袖子伸进画面多远；HandLayer 维护一张与画布同尺寸的遮罩，
 * 把被猫身挡住的袖口部分裁掉，于是手看起来是"从猫身后伸过来"的。
 */`,
  OverheadHand: `/**
 * OverheadHand —— 手部照片的分层绘制与落点
 *
 * 手是一张俯拍照片（手掌 + 五指 + 手指阴影）。load() 时把它拆成掌、指、阴影三层：
 *  - separateFingers()：沿指缝把相邻手指分开，避免手指互相穿插时出现硬边
 *  - digitShadow()：取出指缝的暗部做成阴影层
 * configure()/point()：根据接触点、猫的厚度、透视缩放，把三层贴合到猫身上
 * digitPoint()/contacts()：给每根手指算出落点，供 FurContact 生成接触毛边
 */`,
  TailHand: `/**
 * TailHand —— 抓尾巴那只手
 *
 * 和 OverheadHand 用同一套分层素材，但姿态不同：手掌包住尾巴（角度随抓握点旋转），
 * configure() 接收抓握位置、按压力度、滑动量、帧间隔，驱动手指弯曲与皮肤拉伸。
 */`,
  HandChange: `/**
 * HandChange —— 手从"背"切到"尾"（或反向）时的补间
 *
 * place() 记录起点姿态与目标姿态，按 amount 在两者之间插值（位置、角度、缩放、透明），
 * 避免手瞬移。held 变化时会重置过渡，move 里保存补间参数。
 */`,
  FurContact: `/**
 * FurContact —— 手指与毛的接触细节
 *
 *  - coatFringe()/furAlpha()：沿猫身边缘取一圈"毛边"alpha，手指压上去时毛会被遮住
 *  - fringeAlpha()/makeMargin()：生成指缘的一圈绒毛遮罩，让手指边缘"融"进毛里
 *  - fitMargin()：按透视与厚度调整遮罩位置
 * draw() 把指根阴影、毛边合成到手层上，这是"手真的陷进毛里"的观感来源。
 */`,
  Purr: `/**
 * Purr —— 用 WebAudio 现场合成呼噜声，站点没有任何音频文件
 *
 * makePurr() 建两条链路：低频锯齿（喉音）+ 带通噪声（气流），再用呼吸包络
 * breathBand() 调幅；toggle() 处理浏览器自动播放限制（首次点击才真正 start）。
 */`,
  silverTabby: `/**
 * silverTabby —— "银渐层"（saba）是算出来的，不是素材
 *
 * 站点没有 saba.avif，readPhoto 遇到 saba 时拿 mugi（茶虎）的像素现场调色：
 * 降饱和、抬亮底色、保留深色条纹的对比，得到银渐层观感。tail 参数决定处理身体还是尾巴。
 */`,
  readPhoto: `/**
 * readPhoto —— 资源加载入口
 *
 * 从 window.PET_ASSETS（applications 启动时塞进来的 513587 字节 + 目录表）里按名字取切片：
 *  - new Blob → Image.decode() 解 AVIF（浏览器原生解码）
 *  - 身体图按目录里的裁切框 [x,y,w,h,W,H] 缩放到画布尺寸；尾巴不裁切
 *  - 结果按名字缓存（original Map），失败自动重试
 *  - saba / saba-tail 走 silverTabby 合成
 */`,
  drawMoonlight: `/**
 * drawMoonlight —— 暗色主题的月光
 *
 * makeLightField() 预渲染一张窗棂投影 + 光斑的光照图（离屏 canvas），
 * drawMoonlight() 每帧按窗口尺寸与光源位置把它叠加到场景上，用 screen 混合提亮暗部。
 */`,
  Proportions: `/**
 * Proportions —— 体格滑杆（大小 / 躯干粗细）
 *
 * 两个 range 控件 → 档位表 closestStep() → 回调 OverheadCat.setThickness()，
 * 同时写 localStorage（按猫种分别记）。restore() 在换猫时恢复该猫上次的体型。
 */`,
  'main': `/**
 * main —— DOM 装配、输入路由与帧循环
 *
 * 指针/键盘事件先经过 route()：判断这一下落在"背"还是"尾巴"，切换 rest / stroke / tail 三种状态；
 * track()/reachBody()/tailPickup() 把屏幕坐标投到猫的 uv 空间。
 *
 * 每帧 frame() → move(dt) 推进物理 → poseHands(dt) 摆手 → paint(dt) 合成：
 * 身体 → 尾巴 → 手 → 手指毛边 → 月光 → 叠加层。
 *
 * 另外负责：全屏/横屏适配（syncFull/leaveLandscape）、主题切换、声音开关、体格面板。
 */`,
};

// ---------- 3. 写模块文件 ----------
fs.mkdirSync(path.join(OUT, 'src'), { recursive: true });

const pad = n => String(n).padStart(2, '0');
const slugs = {
  CoatSurface: 'coat-surface',
  CoatOutline: 'coat-outline',
  CatTail: 'cat-tail',
  TailPhoto: 'tail-photo',
  TailSocket: 'tail-socket',
  OverheadCat: 'overhead-cat',
  'sleeveReach,HandLayer': 'hand-layer',
  OverheadHand: 'overhead-hand',
  TailHand: 'tail-hand',
  HandChange: 'hand-change',
  FurContact: 'fur-contact',
  Purr: 'purr',
  silverTabby: 'silver-tabby',
  readPhoto: 'read-photo',
  drawMoonlight: 'moonlight',
  Proportions: 'proportions',
};

const written = [];
mods.forEach((mod, idx) => {
  const key = mod.names.join(',');
  const header = headers[key];
  if (!header) throw new Error('missing header for ' + key);
  const file = `${pad(idx + 1)}-${slugs[key]}.js`;
  const body = lines.slice(mod.start, mod.end + 1).join('\n');
  fs.writeFileSync(path.join(OUT, 'src', file), `${header}\n\n'use strict';\n${body}\n`, 'utf8');
  written.push(file);
});

// 主控文件
const mainBody = lines.slice(mainStart, lines.length - 1).join('\n');
fs.writeFileSync(
  path.join(OUT, 'src', `${pad(mods.length + 1)}-main.js`),
  `${headers.main}\n\n'use strict';\n${mainBody}\n`,
  'utf8'
);
written.push(`${pad(mods.length + 1)}-main.js`);

// 资源装载
fs.writeFileSync(
  path.join(OUT, 'src', '00-assets.js'),
  `/**
 * 00-assets —— 启动前把 27 张 AVIF 的字节流装进内存
 *
 * 原站把二进制塞在 <script id="pack"> 里，用 document.currentScript.photos 传给应用。
 * 这里改成：assets-data.js 里的 base64 → 这里 atob 还原成 Uint8Array → window.PET_ASSETS。
 * app.js 中唯一改动的就是读取来源（window.PET_ASSETS 而非 currentScript）。
 */\n\n` +
  fs.readFileSync(path.join(SRC, 'assets-data.js'), 'utf8') + '\n' +
  fs.readFileSync(path.join(SRC, 'boot.js'), 'utf8'),
  'utf8'
);

// ---------- 4. CSS 从内联样式里抽出来并排版 ----------
const head = fs.readFileSync(path.join(ROOT, '_unpacked', 'head.part.html'), 'utf8');
const cssRaw = head.replace(/^\s*<style>/, '').replace(/<\/style>\s*$/, '');

function prettyCss(src) {
  let out = '', depth = 0, paren = 0, line = '';
  const flush = () => { if (line.trim()) { out += '  '.repeat(depth) + line.trim() + '\n'; line = ''; } };
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '(') paren++;
    if (ch === ')') paren = Math.max(0, paren - 1);
    if (paren > 0) { line += ch; continue; }
    if (ch === '{') { flush(); out += '  '.repeat(depth) + '{\n'; depth++; continue; }
    if (ch === '}') { flush(); depth = Math.max(0, depth - 1); out += '  '.repeat(depth) + '}\n'; continue; }
    if (ch === ';' && paren === 0) { line += ';'; flush(); continue; }
    line += ch;
  }
  flush();
  return out;
}

fs.writeFileSync(
  path.join(OUT, 'styles.css'),
  `/* 站点内联 CSS 原样抽出，仅做了缩进/换行排版（选择器与声明未改动）。
   13 个猫种缩略图仍是内联的 webp data URI，所以文件仍有 30 多 KB。 */\n\n` +
  prettyCss(cssRaw),
  'utf8'
);

// ---------- 5. index.html ----------
const bodyPart = fs.readFileSync(path.join(ROOT, '_unpacked', 'body.part.html'), 'utf8');
const themeScript = `(()=>{
  const root=document.documentElement,requested=new URLSearchParams(location.search).get('theme');
  let stored;
  try{stored=localStorage.getItem('pet-the-cat-theme');}catch{}
  const theme=[requested,stored].find(value=>value==='light'||value==='dark')||'light';
  root.dataset.theme=theme;
  document.querySelector('meta[name="theme-color"]').content=theme==='dark'?'#101722':'#fbf5ec';
})();`;
const favicon = `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='10' fill='%23fbf5ec'/%3E%3Cpath d='M6 24 7 8 16 15Q20 13 24 15L34 8 33 25C31 37 8 37 6 24Z' fill='%23453327'/%3E%3C/svg%3E">`;

const scripts = ['00-assets.js', ...written].map(f => `<script src="src/${f}"></script>`).join('\n');

fs.writeFileSync(
  path.join(OUT, 'index.html'),
  `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#fbf5ec">
<script>${themeScript}</script>
<title>猫撫でシミュレーター（可读版）</title>
${favicon}
<style>:where(html){background:#fbf5ec;color-scheme:light}:where(html[data-theme=dark]){background:#101722;color-scheme:dark}</style>
<link rel="stylesheet" href="styles.css">
</head>
<body>${bodyPart}
<!-- 按依赖顺序加载：资源 → 18 个模块 → 主控（全部是普通 script，file:// 直接打开也能跑） -->
${scripts}
</body>
</html>
`,
  'utf8'
);

console.log('modules:', mods.length, '+ main + assets');
console.log(written.join('\n'));
console.log('css chars:', fs.statSync(path.join(OUT, 'styles.css')).size);
console.log('html chars:', fs.statSync(path.join(OUT, 'index.html')).size);
