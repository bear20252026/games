/**
 * main —— DOM 装配、输入路由与帧循环
 *
 * 指针/键盘事件先经过 route()：判断这一下落在"背"还是"尾巴"，切换 rest / stroke / tail 三种状态；
 * track()/reachBody()/tailPickup() 把屏幕坐标投到猫的 uv 空间。
 *
 * 每帧 frame() → move(dt) 推进物理 → poseHands(dt) 摆手 → paint(dt) 合成：
 * 身体 → 尾巴 → 手 → 手指毛边 → 月光 → 叠加层。
 *
 * 另外负责：全屏/横屏适配（syncFull/leaveLandscape）、主题切换、声音开关、体格面板。
 */

'use strict';
const stage = document.querySelector('#stage'),
  scene = document.querySelector('#scene');
const viewer = document.querySelector('#viewer'),
  retry = document.querySelector('#retry');
const soundButton = document.querySelector('#sound'),
  expand = document.querySelector('#expand');
const themeButton = document.querySelector('#theme'),
  themeRoot = document.documentElement;
let moonlit = themeRoot.dataset.theme === 'dark';
themeButton.setAttribute('aria-checked', String(moonlit));
themeButton.onclick = () => {
  moonlit = !moonlit;
  const theme = moonlit ? 'dark' : 'light';
  themeRoot.dataset.theme = theme;
  themeButton.setAttribute('aria-checked', String(moonlit));
  document.querySelector('meta[name="theme-color"]').content = moonlit ? '#101722' : '#fbf5ec';
  try {
    localStorage.setItem('pet-the-cat-theme', theme);
  } catch {}
  const url = new URL(location.href);
  if (url.searchParams.has('theme')) {
    url.searchParams.set('theme', theme);
    try {
      history.replaceState(null, '', url);
    } catch {}
  }
  if (ready) paint(0.001);
};
const choices = [...document.querySelectorAll('[data-cat]')],
  notice = document.querySelector('#notice');
const ctx = scene.getContext('2d', { alpha: false });
const layer = document.createElement('canvas'),
  shadow = document.createElement('canvas');
const shadowCtx = shadow.getContext('2d');
const handChange = new HandChange(),
  posedHand = new HandLayer(),
  blendLayer = document.createElement('canvas');
const blendCtx = blendLayer.getContext('2d', { alpha: false });
const cat = new OverheadCat(layer),
  purr = new Purr();
const furContact = new FurContact();
let hand, tailHand;
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const touchDisplay = matchMedia('(pointer: coarse), (hover: none) and (any-pointer: coarse)');
const portrait = matchMedia('(orientation: portrait)');
const mobileRoot = viewer.parentElement;
function turned() {
  return viewer.classList.contains('landscape') && portrait.matches;
}
const names = Object.fromEntries(choices.map((b) => [b.dataset.cat, b.getAttribute('aria-label')]));
const clamp = (n, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const follow = (a, b, dt, seconds) => a + (b - a) * -Math.expm1(-dt / seconds);
const smooth = (t) => t * t * (3 - 2 * t);
const heldPressure = 0.9;
const home = { u: 0.4, v: 0.555 };
let view,
  key,
  room,
  ready = false,
  request = 0,
  last = 0,
  keyboard = false,
  keyTime = 0;
let pointer = null,
  down = false,
  over = false,
  force = null;
let mode = 'rest',
  age = 0,
  origin = { ...home },
  startHeight = 0,
  retreat = 0;
let pad = { ...home },
  target = { ...home },
  altitude = 0,
  pressure = heldPressure,
  vx = 0,
  vy = 0,
  tuck = 0;
const requestedCat = new URLSearchParams(location.search).get('cat');
let lastPointer = null,
  selected = Object.hasOwn(names, requestedCat) ? requestedCat : 'kuro';
let passedTip = false,
  tailAnchor = false,
  area = 'back',
  keyTailStart = null,
  edgePointer = null,
  edgeMoved = false;
let operator = null,
  previousInput = null,
  returningToBody = false;
let catScale = 1;
const proportions = new Proportions((size, width) => {
  catScale = size;
  cat.setThickness(width);
  layout();
});
function layout() {
  const rect = stage.getBoundingClientRect();
  const r = turned() ? { width: rect.height, height: rect.width } : rect;
  if (r.width < 1 || r.height < 1) return;
  const dpr = Math.min(devicePixelRatio || 1, 1.7, 2350 / Math.max(r.width, r.height));
  const topCrop = Number(getComputedStyle(stage).getPropertyValue('--top-crop'));
  const framedHeight = r.height / (1 - topCrop);
  const zoom = Math.max(r.width / 1517, framedHeight / 935);
  const roomW = 1517 * zoom,
    roomH = 935 * zoom,
    roomX = (r.width - roomW) / 2;
  const roomY = (framedHeight - roomH) / 2 - (framedHeight - r.height);
  const baseW = roomW * 0.831,
    baseH = roomH * 0.831;
  const w = baseW * catScale,
    h = baseH * catScale;
  const x = roomX + roomW * 0.006 + (baseW - w) * 0.46;
  const y = roomY + (roomH - baseH) * 0.49 + (baseH - h) * 0.51;
  const kittenAmount = clamp((0.86 - catScale) / (0.86 - 0.65));
  const upperNeckExtra = (kittenAmount * clamp(baseW * 0.062, 24, 44)) / w;
  view = {
    width: r.width,
    height: r.height,
    dpr,
    x,
    y,
    w,
    h,
    roomX,
    roomY,
    roomW,
    roomH,
    baseW,
    kitten: catScale <= 0.79,
    upperNeckExtra,
    handWidth: baseW * 0.895,
    touchLift: Math.min(62, framedHeight * 0.215) + 40,
  };
  const sw = Math.round(r.width * dpr),
    sh = Math.round(r.height * dpr);
  if (scene.width !== sw || scene.height !== sh) {
    scene.width = sw;
    scene.height = sh;
    shadow.width = Math.max(1, Math.round(r.width * 0.28));
    shadow.height = Math.max(1, Math.round(r.height * 0.28));
  }
  if (ready) {
    reprojectPointer();
    paint(0.001);
  }
}
proportions.restore(selected);
new ResizeObserver(layout).observe(stage);
function reset() {
  handChange.reset();
  passedTip = false;
  tailAnchor = false;
  returningToBody = false;
  area = 'back';
  keyTailStart = null;
  edgePointer = null;
  edgeMoved = false;
  operator = null;
  previousInput = null;
  pointer = null;
  down = true;
  keyboard = false;
  mode = 'rest';
  pad = { ...home };
  target = { ...home };
  tuck = 0;
  lastPointer = null;
  force = null;
  pressure = heldPressure;
  altitude = 0;
  vx = 0;
  vy = 0;
  setOver(true);
}
async function choose(id) {
  selected = id;
  const ticket = ++request;
  try {
    const [photo, tailPhoto] = await Promise.all([readPhoto(id), readPhoto(id + '-tail')]);
    if (ticket !== request) return;
    cat.setCat(
      photo,
      tailPhoto,
      id,
      Math.max(850, Math.min(1152, Math.round(view.baseW * view.dpr))),
    );
    key = id;
    reset();
    if (ready) paint(0.001);
    stage.dataset.selected = id;
    stage.setAttribute('aria-label', names[id] + 'を撫でる');
    for (const b of choices) b.setAttribute('aria-pressed', String(b.dataset.cat === id));
    notice.textContent = names[id] + 'を選択';
    retry.hidden = true;
  } catch {
    if (ticket === request) {
      retry.hidden = false;
      notice.textContent = '猫を読み込めなかった。';
    }
  }
}
async function init() {
  retry.hidden = true;
  try {
    const [background, open, grip] = await Promise.all(
      ['room', 'hand-slim', 'grip-slim'].map(readPhoto),
    );
    room = background;
    hand = new OverheadHand().load(open);
    tailHand = new TailHand().load(grip);
    let wanted;
    do {
      wanted = selected;
      await choose(wanted);
    } while (wanted !== selected);
    if (key !== selected) throw Error();
    ready = true;
    stage.dataset.ready = 'true';
    layout();
  } catch {
    retry.hidden = false;
    notice.textContent = '読み込み直すボタンで再試行できる。';
  }
}
retry.onclick = () => (ready ? choose(selected) : init());
for (const b of choices)
  b.onclick = () => {
    if (ready) choose(b.dataset.cat);
    else selected = b.dataset.cat;
  };
function setOver(value) {
  over = value;
  stage.dataset.over = String(value);
  stage.dataset.pressed = String(down && value);
}
function point(e) {
  const r = stage.getBoundingClientRect();
  const rotated = turned();
  const x = rotated ? e.clientY - r.top : e.clientX - r.left;
  const y = rotated ? r.right - e.clientX : e.clientY - r.top;
  const lift = e.pointerType === 'touch' ? view.touchLift : 0;
  return { u: (x - view.x) / view.w, v: (y - view.y - lift) / view.h };
}
function track(p) {
  const previous = mode;
  if (previous !== 'stroke') {
    pad = { ...p };
    previousInput = operator;
    vx = 0;
    vy = 0;
    tuck = 0;
    if (previous !== 'rest') {
      altitude = 0.77;
      pressure = 0;
    }
  }
  target = p;
  mode = 'stroke';
}
function withdraw() {
  if (mode === 'away' || mode === 'withdraw') return;
  mode = 'withdraw';
  age = 0;
  origin = { ...pad };
  startHeight = altitude;
  retreat = (view.height - view.y) / view.h + 0.36;
}
function reachBody(p, holding) {
  const w = view.w;
  const margin = holding ? clamp(w * 0.087, 34, 72) : clamp(w * 0.05, 21, 44);
  const upper = holding ? clamp(w * 0.17, 58, 149) : clamp(w * 0.125, 43, 112);
  return cat.reach(p, margin / w, upper / w, true, view.upperNeckExtra);
}
function tailPickup(p, fromBody) {
  const tail = cat.tail,
    w = view.w;
  const margin = (fromBody ? clamp(w * 0.087, 34, 72) : clamp(w * 0.05, 21, 44)) / w;
  if (fromBody && p.u <= tail.point(0.54, true).u + 0.018) {
    const near = tail.closest(p.u, p.v, cat.tailBase.at, 0.54);
    const above = clamp(((near.v - p.v) * (935 / 1517)) / Math.max(0.001, near.distance));
    const upper = Math.min(0.17, clamp(w * 0.17, 58, 149) / w);
    const lower = Math.min(0.103, margin * 1.2);
    if (near.distance <= near.radius + lower + (upper - lower) * smooth(above)) return near;
  }
  const near = tail.closest(p.u, p.v);
  const directReach = fromBody ? Math.min(0.087, margin) : Math.min(0.05, margin * 0.7);
  if (near.at <= 0.075 || near.distance > near.radius + directReach) return null;
  if (!cat.unmap(p.u, p.v).zone) return near;
  if (
    near.at < 0.27 &&
    near.distance < near.radius + 0.002 &&
    cat.outline.near(cat, p.u, p.v).distance < 0.018
  )
    return near;
  return null;
}
function route(p) {
  const fromBody = over && mode === 'stroke' && area !== 'tail';
  edgePointer = null;
  edgeMoved = true;
  operator = { u: p.u, v: p.v };
  const tail = cat.tail;
  const baseX = cat.tailBaseX(),
    leftOfBase = p.u < baseX;
  if (leftOfBase && (tail.stroke || tailAnchor || passedTip)) {
    if (tail.stroke) previousInput = operator;
    tail.release();
    returningToBody = true;
    passedTip = false;
  }
  if (passedTip) {
    const hit = tail.closest(p.u, p.v);
    if (
      !cat.unmap(p.u, p.v).zone &&
      !(tail.releaseAge > 0.18 && hit.at > 0.08 && hit.distance < hit.radius)
    ) {
      setOver(false);
      if (mode !== 'tail-open') withdraw();
      return;
    }
    passedTip = false;
  }
  if (!tail.stroke && p.u >= baseX + (returningToBody ? 0.014 : 0)) {
    const near = tailPickup(p, fromBody);
    if (near) {
      tail.grab(p, near, fromBody);
      tailAnchor = true;
      returningToBody = false;
      if (fromBody) previousInput = tail.gripPoint();
    }
  }
  if (tail.stroke) {
    tail.drag(p, force ?? 0.6);
    area = 'tail';
    setOver(true);
    track(tail.gripPoint());
    return;
  }
  const contact = reachBody(p, over);
  if (!contact) {
    setOver(false);
    withdraw();
    return;
  }
  area = contact.zone;
  edgePointer = contact.snapped ? p : null;
  setOver(true);
  track(contact);
}
function reprojectPointer() {
  if (!lastPointer || keyboard || (!down && !over)) return;
  route(point(lastPointer));
  if (mode === 'stroke') pad = { ...target };
}
window.addEventListener('scroll', reprojectPointer, { passive: true });
function handle(e) {
  down = true;
  lastPointer = { clientX: e.clientX, clientY: e.clientY, pointerType: e.pointerType };
  const sensed =
    e.pressure > 0 &&
    (e.pointerType === 'pen' || (e.pointerType === 'touch' && Math.abs(e.pressure - 0.5) > 0.018));
  force = sensed ? clamp(e.pressure) : null;
  route(point(lastPointer));
}
function end() {
  cat.tail.release();
  passedTip = false;
  pointer = null;
  down = false;
  keyboard = false;
  lastPointer = null;
  edgePointer = null;
  setOver(false);
  withdraw();
}
for (const type of ['pointerenter', 'pointermove'])
  stage.addEventListener(type, (e) => {
    if (
      !ready ||
      keyboard ||
      e.target.closest('button') ||
      (pointer !== null && pointer !== e.pointerId)
    )
      return;
    if (e.pointerType !== 'touch' || pointer === e.pointerId) handle(e);
  });
stage.addEventListener('pointerdown', (e) => {
  if (!ready || pointer !== null || e.target.closest('button') || e.button !== 0) return;
  keyboard = false;
  if (e.pointerType !== 'mouse') {
    pointer = e.pointerId;
    try {
      stage.setPointerCapture(pointer);
    } catch {}
  }
  handle(e);
  e.preventDefault();
});
stage.addEventListener('pointerup', (e) => {
  if (!ready) return;
  if (e.pointerType === 'mouse') {
    if (!keyboard && pointer === null) handle(e);
  } else if (e.pointerId === pointer) end();
});
for (const t of ['pointercancel', 'lostpointercapture'])
  stage.addEventListener(t, (e) => {
    if (e.pointerId === pointer || (!keyboard && e.pointerType === 'mouse' && pointer === null))
      end();
  });
stage.addEventListener('pointerleave', (e) => {
  if (!keyboard && pointer === null && e.pointerType !== 'touch') end();
});
stage.addEventListener('keydown', (e) => {
  if (!ready || e.target !== stage || !['Enter', ' ', 't', 'T'].includes(e.key)) return;
  e.preventDefault();
  if (e.repeat || keyboard || pointer !== null) return;
  if (down) end();
  lastPointer = null;
  keyboard = e.key.toLowerCase() === 't' ? 'tail' : 'back';
  down = true;
  keyTime = 0;
  force = null;
  passedTip = false;
  if (keyboard === 'tail') {
    keyTailStart = cat.tail.point(0.185);
    route(keyTailStart);
  } else {
    setOver(true);
    operator = { u: 0.235, v: 0.55 };
    track(operator);
  }
});
stage.addEventListener('keyup', (e) => {
  if (
    (keyboard === 'back' && ['Enter', ' '].includes(e.key)) ||
    (keyboard === 'tail' && e.key.toLowerCase() === 't')
  ) {
    end();
    e.preventDefault();
  }
});
stage.addEventListener('blur', () => {
  if (keyboard) end();
});
window.addEventListener('blur', () => end());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    end();
    last = 0;
    purr.update(0, true);
  }
});
function move(dt) {
  age += dt;
  if (edgePointer && !edgeMoved && over && mode === 'stroke') {
    const contact = reachBody(edgePointer, true);
    if (contact) {
      target = contact;
      area = contact.zone;
      if (!contact.snapped) edgePointer = null;
    } else {
      edgePointer = null;
      setOver(false);
      withdraw();
    }
  }
  edgeMoved = false;
  if (keyboard) {
    keyTime += dt;
    if (keyboard === 'tail') {
      const f = smooth(clamp(keyTime / 2.55)),
        root = cat.tail.root,
        length = cat.tail.length + 0.034;
      const tipU = root.x + length * 0.923,
        tipV = (root.y + length * 0.385) / (935 / 1517);
      route({
        u: keyTailStart.u + (tipU - keyTailStart.u) * f,
        v: keyTailStart.v + (tipV - keyTailStart.v) * f,
      });
      if (keyTime >= 2.68) end();
    } else
      target = {
        u: 0.235 + 0.4 * (0.5 - 0.5 * Math.cos(keyTime * 1.7)),
        v: 0.55 + 0.046 * Math.sin(keyTime * 1.7),
      };
  }
  if (cat.tail.slipped()) {
    passedTip = true;
    cat.tail.release();
    setOver(false);
    pad = { ...cat.tail.releasePoint };
    target = { ...pad };
    mode = 'tail-open';
    age = 0;
  }
  const constrained = cat.tail.stroke ? cat.tail.gripPoint() : null;
  const inputPoint = constrained ?? (keyboard === 'back' ? target : operator);
  let desired = 0,
    height = 0;
  if (mode === 'rest') {
    desired = heldPressure;
  } else if (mode === 'stroke') {
    pad = constrained ?? { ...target };
    desired = force === null ? heldPressure : 0.86 + 0.13 * force;
  } else if (mode === 'tail-open') {
    height = 0.46;
    if (age > 0.155) withdraw();
  } else if (mode === 'withdraw') {
    const t = clamp(age / (reduce.matches ? 0.18 : 0.34)),
      f = smooth(t);
    pad.u = origin.u + 0.026 * f;
    pad.v = origin.v + (retreat - origin.v) * f;
    height = startHeight + (1 - startHeight) * f;
    if (t === 1) mode = 'away';
  } else height = 1;
  pressure = follow(pressure, desired, dt, desired > pressure ? 0.037 : 0.06);
  altitude = follow(altitude, height, dt, height > altitude ? 0.076 : 0.055);
  const tracking = mode === 'stroke';
  const moving = tracking && previousInput && inputPoint;
  const dx = moving ? clamp((inputPoint.u - previousInput.u) / dt, -1.5, 1.5) : 0;
  const dy = moving ? clamp((inputPoint.v - previousInput.v) / dt, -1.6, 1.6) : 0;
  previousInput = tracking ? inputPoint : null;
  vx = follow(vx, dx, dt, 0.057);
  vy = follow(vy, dy, dt, 0.057);
  const pull = Math.tanh(8.3 * (vx * 0.63 + vy * 0.616 * 0.86));
  tuck = follow(tuck, mode === 'stroke' ? pull : 0, dt, 0.089);
}
function poseHands(dt) {
  const tail = cat.tail,
    held = !!tail.stroke;
  let grip = null;
  if (held || handChange.held || handChange.move) {
    const t = tail.gripPoint();
    grip = tailHand;
    grip.configure(
      view,
      t,
      view.x + t.u * view.w,
      view.y + t.v * view.h,
      tail.amount,
      pressure,
      tail.slide,
      dt,
    );
  }
  return handChange.place(hand, grip, held, dt, view);
}
function tailContact(t, load) {
  return {
    u: t.ru,
    v: t.rv,
    zone: 'tail',
    pressure: load * 0.74,
    dx: vx,
    dy: vy,
    axisX: t.tx,
    axisY: t.ty,
    length: 0.029,
    width: t.radius * 0.76,
    pads: [],
  };
}
function paint(dt) {
  const { width: w, height: h, dpr } = view;
  view.reduced = reduce.matches;
  const rest = mode === 'rest',
    visible = mode !== 'away',
    touching = rest || mode === 'stroke';
  const x = view.x + view.w * pad.u,
    y = view.y + view.h * pad.v;
  const edgeYaw = 0.45 * smooth(clamp((x / w - 0.75) / 0.19));
  const motionX = Math.tanh(4.6 * vx),
    motionY = Math.tanh(3.9 * vy);
  const tail = cat.tail;
  const onBody = touching && area !== 'tail' && !tail.stroke;
  const pose = {
    x,
    y,
    pad,
    coat: onBody ? cat : null,
    dt,
    pressure,
    load: cat.state.load,
    lift: cat.state.lift,
    depth: onBody ? cat.tip.depth : 0,
    altitude,
    rest,
    tuck,
    angle: edgeYaw + 0.17 * motionX - 0.058 * motionY,
    motionX,
    motionY,
  };
  let input = null,
    blend = 0;
  if (visible) {
    hand.configure(view, pose);
    if (tail.stroke) {
      input = tailContact(tail.point(tail.at), pressure);
    } else {
      let pads = null;
      if (onBody) {
        pads = hand.contacts();
        if (view.upperNeckExtra) {
          const drop = cat.upperPadDrop(view, pad, pads);
          if (drop > 0) {
            hand.py += drop;
            for (const finger of pads) finger.y += drop;
          }
        }
      }
      const opening = handChange.held || !!handChange.move;
      blend = poseHands(dt);
      if (pads)
        input = cat.contact(
          view,
          opening ? hand.contacts() : pads,
          pressure * (1 - altitude),
          vx,
          vy,
          pad.u,
        );
      if (!input && onBody && opening && returningToBody && tail.releasePoint) {
        const q = tailHand.q;
        tailHand.point(tailHand.layout.cx, tailHand.layout.cy, q);
        const tuft = tail.closest((q[0] - view.x) / view.w, (q[1] - view.y) / view.h);
        const support =
          1 -
          smooth(clamp(((tuft.distance - tuft.feltRadius) * view.w) / (0.035 * view.handWidth)));
        if (support > 0) input = tailContact(tuft, pressure * support);
      }
    }
  } else if (handChange.view) handChange.reset();
  cat.draw(view, input, dt);
  if (visible && tail.stroke) blend = poseHands(dt);
  if (tail.amount < 0.002 && !tail.stroke) {
    tailAnchor = false;
    returningToBody = false;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.drawImage(room, view.roomX, view.roomY, view.roomW, view.roomH);
  const sw = shadow.width,
    sh = shadow.height;
  shadowCtx.clearRect(0, 0, sw, sh);
  shadowCtx.filter = 'blur(' + Math.max(0.8, view.w * 0.00135) + 'px)';
  shadowCtx.drawImage(layer, 0, 0, sw, sh);
  shadowCtx.filter = 'none';
  shadowCtx.globalCompositeOperation = 'source-in';
  shadowCtx.fillStyle = '#382316';
  shadowCtx.fillRect(0, 0, sw, sh);
  shadowCtx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 0.29;
  ctx.drawImage(shadow, view.w * 0.0018, view.h * 0.007, w, h);
  ctx.globalAlpha = 1;
  ctx.drawImage(layer, 0, 0, w, h);
  if (visible) {
    const drawGrip = (context) => {
      posedHand.draw(context, view, (g) => tailHand.drawSkin(g), 0);
    };
    if (blend > 0 && blend < 1) {
      if (blendLayer.width !== scene.width || blendLayer.height !== scene.height) {
        blendLayer.width = scene.width;
        blendLayer.height = scene.height;
      }
      blendCtx.setTransform(1, 0, 0, 1, 0, 0);
      blendCtx.drawImage(scene, 0, 0);
      blendCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawGrip(blendCtx);
    }
    if (blend < 1) {
      if (hand.transition || hand.sleeveDrop > 1)
        posedHand.draw(ctx, view, (g) => hand.drawSkin(g), altitude);
      else hand.draw(ctx);
    }
    if (blend === 1) drawGrip(ctx);
    else if (blend > 0) {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = blend;
      ctx.drawImage(blendLayer, 0, 0);
      ctx.restore();
    }
  }
  if (onBody && input && input.zone !== 'tail' && blend === 0 && cat.longCoat) {
    furContact.draw(ctx, view, layer, cat, hand, input, altitude);
  }
  if (moonlit) drawMoonlight(ctx, view);
  purr.update(input?.pressure ?? 0);
}
function frame(ms) {
  requestAnimationFrame(frame);
  if (!ready || !view || document.hidden) {
    last = 0;
    return;
  }
  const elapsed = ms - last;
  if (
    last &&
    elapsed < 32 &&
    (mode === 'rest' || mode === 'away') &&
    !cat.tailMoving(elapsed / 1000)
  )
    return;
  const dt = last ? clamp(elapsed / 1000, 0.001, 0.075) : 1 / 60;
  last = ms;
  move(dt);
  paint(dt);
}
soundButton.onclick = async () => {
  if (soundButton.disabled) return;
  soundButton.disabled = true;
  try {
    const on = await purr.toggle();
    soundButton.setAttribute('aria-checked', String(on));
  } catch {
    notice.textContent = '音を再生できなかった。';
  } finally {
    soundButton.disabled = false;
  }
};
let mobileNative = false;
function syncFull() {
  const landscape = viewer.classList.contains('landscape');
  const on =
    landscape || document.fullscreenElement === viewer || viewer.classList.contains('is-full');
  const mobile = landscape || (!on && touchDisplay.matches);
  const label = mobile
    ? on
      ? '横画面を終了'
      : '横画面にする'
    : on
      ? '全画面を終了'
      : '全画面にする';
  expand.setAttribute('aria-pressed', String(on));
  expand.setAttribute('aria-label', label);
  expand.querySelector('use').setAttribute('href', on ? '#exit' : mobile ? '#rotate' : '#full');
  document.documentElement.classList.toggle('is-full-page', on);
  layout();
}
function leaveLandscape() {
  viewer.classList.remove('landscape');
  if (mobileNative) {
    mobileNative = false;
    try {
      screen.orientation?.unlock();
    } catch {}
  }
  syncFull();
}
expand.onclick = async () => {
  if (viewer.classList.contains('landscape')) {
    leaveLandscape();
    if (document.fullscreenElement === mobileRoot) await document.exitFullscreen().catch(() => {});
  } else if (document.fullscreenElement === viewer) await document.exitFullscreen();
  else if (viewer.classList.contains('is-full')) viewer.classList.remove('is-full');
  else if (touchDisplay.matches) {
    viewer.classList.add('landscape');
    syncFull();
    if (document.fullscreenEnabled && typeof screen.orientation?.lock === 'function') {
      try {
        await mobileRoot.requestFullscreen();
        if (!viewer.classList.contains('landscape')) {
          if (document.fullscreenElement === mobileRoot) await document.exitFullscreen();
          return;
        }
        if (document.fullscreenElement === mobileRoot) {
          mobileNative = true;
          await screen.orientation.lock('landscape');
        }
      } catch {
        /* The responsive landscape view also works without a native lock. */
      }
    }
  } else
    try {
      await viewer.requestFullscreen();
    } catch {
      viewer.classList.add('is-full');
    }
  syncFull();
};
document.addEventListener('fullscreenchange', () => {
  if (mobileNative && document.fullscreenElement !== mobileRoot) leaveLandscape();
  else syncFull();
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (viewer.classList.contains('landscape')) {
    expand.click();
    return;
  }
  if (viewer.classList.contains('is-full')) {
    viewer.classList.remove('is-full');
    syncFull();
  }
});
portrait.addEventListener('change', syncFull);
touchDisplay.addEventListener('change', syncFull);
syncFull();
init();
requestAnimationFrame(frame);
