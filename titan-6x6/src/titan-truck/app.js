import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import {
  createTSLSharedUniforms,
  createStudioEnvironment,
  upgradeTruckMaterialsToTSL,
  createDustSystem,
} from './tslMaterials.js';
import {
  createEnvironments,
  getTerrainHeight,
} from './terrain.js';
import { TruckAudioEngine } from './audio.js';
import { TruckRig } from './truckRig.js';
import { TitanVehiclePhysics } from './vehiclePhysics.js';
import {
  CameraDirector,
  CAMERA_MODES,
  STUDIO_VIEWPOINTS,
  HERO_PRESET,
} from './cameras.js';
import {
  ANNOTATIONS,
  INSPECTION_MODES,
  WIREFRAME_STYLES,
  CAMERA_VIEWPOINTS,
  projectAnnotations,
} from './storytelling.js';

// ============================================================================
// CONSTANTS & METADATA MAPS
// ============================================================================

const MODULE_START_MS = performance.now();

const INSPECTION_MODE_IDS = INSPECTION_MODES.map((m) => m.id);
const INSPECTION_CAMERA_MAP = Object.fromEntries(
  INSPECTION_MODES.map((m) => [m.id, m.camera])
);
const WIREFRAME_STYLE_MAP = Object.fromEntries(
  WIREFRAME_STYLES.map((s) => [s.id, s])
);
const STUDIO_VIEWPOINT_IDS = new Set(STUDIO_VIEWPOINTS.map((v) => v.id));
const DRIVE_CAMERA_IDS = new Set(CAMERA_MODES.map((c) => c.id));

const STUDIO_BG_ALABASTER = new THREE.Color('#F6F7F9');
const STUDIO_BG_BLUEPRINT = new THREE.Color('#EFF4FA');
const OFFROAD_BG_COLOR = new THREE.Color('#D5E0EC');
const _tmpStudioBg = new THREE.Color();
const _tmpBgColor = new THREE.Color();
const _originPos = new THREE.Vector3(0, 0, 0);
const _zeroQuat = new THREE.Quaternion();

const WINCH_PHASE_LABELS = {
  stowed: 'Winch',
  deploying: 'Spooling',
  deployed: 'Deployed',
  tensioning: 'Tensioning',
  anchored: 'Pulling',
  reeling: 'Reeling',
};

function getDprForQuality(quality, dynamicScale = 1.0) {
  const cap = quality === 'high' ? 1.5 : 1.15;
  const base = Math.min(window.devicePixelRatio || 1, cap);
  return Math.max(1.0, Math.round(base * dynamicScale * 100) / 100);
}

// ============================================================================
// RENDERER INITIALIZATION WITH GRACEFUL WEBGPU -> WEBGL2 FALLBACK
// ============================================================================

async function initRendererWithFallback(stageWrap, quality, onStatus) {
  const dpr = getDprForQuality(quality);
  const initW = stageWrap.clientWidth || window.innerWidth;
  const initH = Math.max(1, stageWrap.clientHeight || window.innerHeight);

  const buildRenderer = (forceWebGL) => {
    const r = new WebGPURenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      forceWebGL,
    });
    r.setPixelRatio(dpr);
    r.setSize(initW, initH);
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.04;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.shadowMap.autoUpdate = false;
    r.shadowMap.needsUpdate = true;
    return r;
  };

  const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
  if (hasWebGPU) {
    const gpuRenderer = buildRenderer(false);
    try {
      await Promise.race([
        gpuRenderer.init(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('WebGPU init timeout')), 4000)
        ),
      ]);
      const isWebGPU = Boolean(gpuRenderer.backend?.isWebGPUBackend);
      return {
        renderer: gpuRenderer,
        backend: isWebGPU ? 'webgpu' : 'webgl2',
      };
    } catch (err) {
      console.warn('[TITAN] WebGPU unavailable, falling back to WebGL2 backend:', err);
      onStatus?.('Switching to WebGL2 fallback…');
      try {
        gpuRenderer.dispose();
      } catch {}
    }
  }

  const glRenderer = buildRenderer(true);
  await glRenderer.init();
  return { renderer: glRenderer, backend: 'webgl2' };
}

// ============================================================================
// MAIN TITAN 6X6 APPLICATION
// ============================================================================

async function bootstrap() {
  const bootstrapStartMs = MODULE_START_MS;

  const stageWrap = document.getElementById('stage-wrap');
  const loaderOverlay = document.getElementById('loader-overlay');
  const loaderBar = document.getElementById('loader-bar');
  const loaderPct = document.getElementById('loader-pct');
  const loaderStatus = document.getElementById('loader-status');

  const setLoader = (pct, msg) => {
    if (loaderBar) loaderBar.style.width = `${Math.max(4, Math.min(100, pct))}%`;
    if (loaderPct) loaderPct.textContent = `${Math.round(pct)}%`;
    if (loaderStatus && msg) loaderStatus.textContent = msg;
  };

  setLoader(8, 'Initializing WebGPU & loading TITAN 6X6…');

  // Performance & Verification Telemetry
  const perfMetrics = {
    loadMs: 0,
    bootstrapMs: 0,
    lastButtonSwitchMs: 0,
    maxButtonSwitchMs: 0,
    offroadReady: false,
    wireframeEdgesReady: false,
  };

  let idleWakeUntil = performance.now() + 2000;
  let shadowDirty = true;

  function wakeRenderer(needsShadow = false, holdMs = 700) {
    idleWakeUntil = Math.max(idleWakeUntil, performance.now() + holdMs);
    if (needsShadow) shadowDirty = true;
  }

  function measureButtonSwitch(fn) {
    const t0 = performance.now();
    const result = fn();
    wakeRenderer(true, 950);
    const elapsed = performance.now() - t0;
    perfMetrics.lastButtonSwitchMs = Number(elapsed.toFixed(2));
    if (perfMetrics.lastButtonSwitchMs > perfMetrics.maxButtonSwitchMs) {
      perfMetrics.maxButtonSwitchMs = perfMetrics.lastButtonSwitchMs;
    }
    return result;
  }

  // Application state — starts directly in clean PBR Studio Showcase ('inspect')!
  const state = {
    ready: false,
    appMode: 'inspect', // 'inspect' | 'wireframe' | 'drive'
    wireframeStyle: 'wire_tech', // 'wire_tech' | 'wire_blueprint' | 'wire_mesh'
    studioTheme: 'alabaster', // 'alabaster' | 'blueprint'
    blueprintBlend: 0,
    envMode: 'studio', // 'studio' | 'offroad'
    inspectionMode: 'exterior',
    explodeAmount: 0,
    annotationsVisible: false, // Clean hero view by default!
    selectedAnnotation: null,
    doorsOpen: false,
    hatchesOpen: false,
    headlightsOn: true,
    winchActive: false,
    winchPhase: 'stowed',
    paused: false,
    shortcutsOpen: false,
    cameraPopoverOpen: false,
    audioPopoverOpen: false,
    quality: 'high', // 'high' | 'balanced'
    backend: 'webgpu',
    fps: 60,
    envBlend: 0,
    audioMuted: false,
    audioVolume: 0.75,
  };

  // Driving inputs (frame-rate-independent keyboard + touch + script overrides)
  const keysHeld = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
  };
  const touchHeld = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    handbrake: false,
  };
  const scriptOverrideInputs = {
    forward: null,
    backward: null,
    left: null,
    right: null,
    handbrake: null,
  };

  // Cached viewport dimensions — updated ONLY on init & resize (zero per-frame layout reads!)
  let viewportW = stageWrap.clientWidth || window.innerWidth;
  let viewportH = Math.max(1, stageWrap.clientHeight || window.innerHeight);

  // 1. Kick off GLB fetch IMMEDIATELY in parallel with WebGPU device initialization!
  const gltfLoader = new GLTFLoader();
  const gltfPromise = new Promise((resolve, reject) => {
    gltfLoader.load(
      './titan_truck.glb',
      resolve,
      (xhr) => {
        if (xhr.total > 0) {
          const p = 18 + (xhr.loaded / xhr.total) * 58;
          setLoader(p, `Loading TITAN 6X6 (${(xhr.loaded / 1048576).toFixed(1)} MB)…`);
        }
      },
      reject
    );
  });

  // Initialize WebGPU/WebGL2 renderer concurrently while GLB downloads
  const { renderer, backend } = await initRendererWithFallback(
    stageWrap,
    state.quality,
    (msg) => setLoader(16, msg)
  );
  state.backend = backend;
  stageWrap.innerHTML = '';
  stageWrap.appendChild(renderer.domElement);

  const qualityBtn = document.getElementById('btn-quality');
  const rendererBadgeText = document.getElementById('renderer-badge-text');
  if (qualityBtn) qualityBtn.dataset.backend = backend;
  if (rendererBadgeText) {
    rendererBadgeText.textContent = backend === 'webgpu' ? 'WebGPU' : 'WebGL2';
  }

  // 2. Scene, Camera, Lighting & Lightweight Studio-Only Environment
  const scene = new THREE.Scene();
  scene.background = STUDIO_BG_ALABASTER.clone();

  const camera = new THREE.PerspectiveCamera(
    HERO_PRESET.fov,
    viewportW / viewportH,
    0.35,
    400
  );

  // Shared reactive TSL uniforms
  const tslUniforms = createTSLSharedUniforms();

  // Procedural Studio-only PMREM at startup (Offroad PMREM deferred until post-hero idle!)
  const envMap = createStudioEnvironment(renderer);
  scene.environment = envMap.getForMode ? envMap.getForMode('studio') : envMap;
  scene.environmentIntensity = 0.78;

  // Architectural Studio & Highland Proving Ground Lighting Rig
  const hemiLight = new THREE.HemisphereLight(0xf6f9fc, 0xbec9d6, 0.88);
  scene.add(hemiLight);

  const KEY_LIGHT_OFFSET = new THREE.Vector3(16, 22.5, 15);
  const keyLight = new THREE.DirectionalLight(0xfffcf6, 2.35);
  keyLight.position.set(16, 24, 15);
  keyLight.target.position.set(0, 1.5, 0);
  keyLight.castShadow = true;
  // Crisp 1536 shadow map (1.5 cm/texel inside 11.5m studio frustum; 44% fewer shadow pixels than 2048)
  keyLight.shadow.mapSize.set(1536, 1536);
  keyLight.shadow.camera.near = 12;
  keyLight.shadow.camera.far = 56;
  const initialShadowExtent = 11.5;
  keyLight.shadow.camera.left = -initialShadowExtent;
  keyLight.shadow.camera.right = initialShadowExtent;
  keyLight.shadow.camera.top = initialShadowExtent;
  keyLight.shadow.camera.bottom = -initialShadowExtent;
  keyLight.shadow.bias = -0.00034;
  keyLight.shadow.normalBias = 0.042;
  keyLight.shadow.radius = 2.0;
  scene.add(keyLight);
  scene.add(keyLight.target);
  keyLight.target.updateMatrixWorld();

  // Fixed orthonormal light-space basis for texel-snapped driving shadows (ZERO shadow swimming!)
  const _shadowLightZ = KEY_LIGHT_OFFSET.clone().normalize();
  const _shadowLightX = new THREE.Vector3()
    .crossVectors(new THREE.Vector3(0, 1, 0), _shadowLightZ)
    .normalize();
  const _shadowLightY = new THREE.Vector3()
    .crossVectors(_shadowLightZ, _shadowLightX)
    .normalize();
  const _shadowRawTarget = new THREE.Vector3();
  const _shadowSnappedTarget = new THREE.Vector3(0, 1.5, 0);
  let _lastShadowExtent = initialShadowExtent;
  let _lastShadowSnapKey = 'static';

  function updateKeyLightShadowCamera(truckPos, isDriving, explodeAmount) {
    const desiredExtent = isDriving ? 14.5 : explodeAmount > 0.05 ? 13.5 : 11.5;
    if (Math.abs(desiredExtent - _lastShadowExtent) > 0.01) {
      keyLight.shadow.camera.left = -desiredExtent;
      keyLight.shadow.camera.right = desiredExtent;
      keyLight.shadow.camera.top = desiredExtent;
      keyLight.shadow.camera.bottom = -desiredExtent;
      keyLight.shadow.camera.updateProjectionMatrix();
      _lastShadowExtent = desiredExtent;
      _lastShadowSnapKey = '';
    }

    if (!isDriving) {
      if (_lastShadowSnapKey !== 'static') {
        keyLight.target.position.set(0, 1.5, 0);
        keyLight.position.set(16, 24, 15);
        keyLight.target.updateMatrixWorld();
        _lastShadowSnapKey = 'static';
      }
      return;
    }

    const mapRes = Math.max(512, keyLight.shadow.mapSize.width || 2048);
    const texelSize = (desiredExtent * 2) / mapRes;
    _shadowRawTarget.set(truckPos.x || 0, (truckPos.y || 0) + 1.5, truckPos.z || 0);
    const iu = Math.round(_shadowRawTarget.dot(_shadowLightX) / texelSize);
    const iv = Math.round(_shadowRawTarget.dot(_shadowLightY) / texelSize);
    const iw = Math.round(_shadowRawTarget.dot(_shadowLightZ) / texelSize);
    const snapKey = `${iu},${iv},${iw},${mapRes}`;

    if (snapKey !== _lastShadowSnapKey) {
      _shadowSnappedTarget
        .set(0, 0, 0)
        .addScaledVector(_shadowLightX, iu * texelSize)
        .addScaledVector(_shadowLightY, iv * texelSize)
        .addScaledVector(_shadowLightZ, iw * texelSize);
      keyLight.target.position.copy(_shadowSnappedTarget);
      keyLight.position.copy(_shadowSnappedTarget).add(KEY_LIGHT_OFFSET);
      keyLight.target.updateMatrixWorld();
      _lastShadowSnapKey = snapKey;
    }
  }

  const fillLight = new THREE.DirectionalLight(0xd2e7fb, 0.72);
  fillLight.position.set(-18, 12, -14);
  scene.add(fillLight);

  const rimLight = new THREE.DirectionalLight(0xcfe8ff, 0.58);
  rimLight.position.set(-14, 7.5, 16);
  scene.add(rimLight);

  // Studio-only environment built synchronously (< 5ms); Offroad terrain deferred post-hero!
  const envController = createEnvironments(scene, tslUniforms);
  envController?.setEnvironmentMode?.('studio', true);
  envController?.setStudioTheme?.('alabaster', true);

  // Deferred off-road tire dust system (created lazily on idle warm-up or Drive entry)
  let dustSystem = null;
  function ensureDustSystem() {
    if (!dustSystem) {
      dustSystem = createDustSystem(scene, tslUniforms, 140);
    }
    return dustSystem;
  }

  // Procedural WebAudio engine
  const audio = new TruckAudioEngine();
  audio.setVolume?.(state.audioVolume);

  // Camera Director (starts immediately orbitable in Inspect mode!)
  const cameraDirector = new CameraDirector(camera, renderer.domElement, {
    getTerrainHeight: (x, z, mode) => getTerrainHeight(x, z, mode),
    onUserInteract: () => {
      wakeRenderer(false, 950);
      if (state.cameraPopoverOpen) setCameraPopoverOpen(false);
      if (state.audioPopoverOpen) setAudioPopoverOpen(false);
      closeSystemsPopovers?.();
    },
  });

  // 3. Await GLB load that started concurrently with renderer init
  let truckRoot = null;
  try {
    const gltf = await gltfPromise;
    truckRoot = gltf.scene;
    truckRoot.name = truckRoot.name || 'TitanTruckGLB';
  } catch (err) {
    console.error('[TITAN] Failed to load titan_truck.glb:', err);
    setLoader(100, 'Failed to load titan_truck.glb — check server path');
    throw err;
  }

  setLoader(84, 'Upgrading shared TSL materials & 6×6 rig…');

  const tslController = upgradeTruckMaterialsToTSL(truckRoot, tslUniforms);
  scene.add(truckRoot);

  // Initialize Mechanical Rig & 6×6 Vehicle Physics on the EXACT same truckRoot
  const truckRig = new TruckRig(truckRoot, tslController, tslUniforms, {
    scene,
    getTerrainHeight,
  });
  truckRig.setEnvironmentContext?.({ scene, getTerrainHeight });
  const physics = new TitanVehiclePhysics();
  physics.setActive(false);
  physics.reset(_originPos, 0, 'studio');

  truckRig.setHeadlights?.(state.headlightsOn);
  truckRig.setRenderStyle?.('pbr');
  // Settle initial mechanical pose cleanly before compiling hero frame
  truckRig.update?.(0.001);

  setLoader(94, 'Compiling WebGPU hero frame…');

  if (typeof renderer.compileAsync === 'function') {
    try {
      await renderer.compileAsync(scene, camera);
    } catch (err) {
      console.warn('[TITAN] compileAsync skipped:', err);
    }
  }

  // ==========================================================================
  // CACHED DOM REFERENCES (Zero hot-path DOM query churn!)
  // ==========================================================================

  const domRefs = {
    statusToast: document.getElementById('status-toast'),
    driveHintPill: document.getElementById('drive-hint-pill'),
    cadTelemetryText: document.getElementById('cad-telemetry-text'),
    cameraPicker: document.getElementById('camera-picker'),
    btnCameraPicker: document.getElementById('btn-camera-picker'),
    cameraPopoverTitle: document.getElementById('camera-popover-title'),
    cameraPopoverList: document.getElementById('camera-popover-list'),
    camPickerLabel: document.getElementById('cam-picker-label'),
    audioUtility: document.getElementById('audio-utility'),
    btnAudio: document.getElementById('btn-audio'),
    annotationsLayer: document.getElementById('annotations-layer'),
    annotationsSvg: document.getElementById('annotations-svg'),
    annotationsPins: document.getElementById('annotations-pins'),
    annotationDrawer: document.getElementById('annotation-drawer'),
    drawerCode: document.getElementById('drawer-code'),
    drawerTitle: document.getElementById('drawer-title'),
    drawerProvenance: document.getElementById('drawer-provenance'),
    drawerSummary: document.getElementById('drawer-summary'),
    drawerSpecs: document.getElementById('drawer-specs'),
    btnDoors: document.getElementById('btn-doors'),
    wireBtnDoors: document.getElementById('wire-btn-doors'),
    driveBtnDoors: document.getElementById('drive-btn-doors'),
    btnHatches: document.getElementById('btn-hatches'),
    wireBtnHatches: document.getElementById('wire-btn-hatches'),
    btnLights: document.getElementById('btn-lights'),
    driveBtnLights: document.getElementById('drive-btn-lights'),
    hudLampLights: document.getElementById('hud-lamp-lights'),
    btnWinch: document.getElementById('btn-winch'),
    driveBtnWinch: document.getElementById('drive-btn-winch'),
    inspectWinchLabel: document.getElementById('inspect-winch-label'),
    driveWinchLabel: document.getElementById('drive-winch-label'),
    btnAnnotations: document.getElementById('btn-annotations'),
    wireBtnAnnotations: document.getElementById('wire-btn-annotations'),
    explodeSliderA: document.getElementById('explode-slider'),
    explodeSliderB: document.getElementById('wire-explode-slider'),
    explodeValueA: document.getElementById('explode-value'),
    explodeValueB: document.getElementById('wire-explode-value'),
    dockInspect: document.getElementById('dock-inspect'),
    dockWireframe: document.getElementById('dock-wireframe'),
    shortcutsOverlay: document.getElementById('shortcuts-overlay'),
    modalKicker: document.getElementById('modal-kicker'),
    modalTitle: document.getElementById('modal-title'),
    modalBtnResume: document.getElementById('modal-btn-resume'),
    topVolumeSlider: document.getElementById('top-volume-slider'),
    modalVolumeSlider: document.getElementById('modal-volume'),
    topVolumeVal: document.getElementById('top-volume-val'),
    modalVolumeVal: document.getElementById('modal-volume-val'),
    qualityLabel: document.getElementById('quality-label'),
    modePills: Array.from(document.querySelectorAll('.mode-pill')),
    layerBtns: Array.from(document.querySelectorAll('.layer-tab, .wire-layer-btn')),
    wireStyleBtns: Array.from(document.querySelectorAll('.wire-style-btn')),
    mobileToggleBtns: Array.from(document.querySelectorAll('.mobile-controls-toggle')),
    camOptionBtns: [],
  };

  let toastTimer = null;
  let driveHintTimer = null;
  let lastPopoverContext = null;
  let annotationPinsBuilt = false;
  let annotationHalfWidthsDirty = true;
  let lastAnnotationsLayerVisible = false;
  let lastWinchPhase = 'stowed';
  let lastWinchActiveUI = false;
  let suppressNextWinchToast = false;
  const annotationDomMap = new Map();

  // ==========================================================================
  // UI HELPERS: TOAST, TELEMETRY, POPOVERS, ZERO-THRASH ANNOTATIONS
  // ==========================================================================

  function hideToast() {
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }
    domRefs.statusToast?.classList.remove('is-visible');
  }

  function showToast(text) {
    const el = domRefs.statusToast;
    if (!el) return;
    el.textContent = text;
    el.classList.add('is-visible');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('is-visible');
    }, 1750);
  }

  function showDriveHint(show) {
    const el = domRefs.driveHintPill;
    if (!el) return;
    if (driveHintTimer) {
      clearTimeout(driveHintTimer);
      driveHintTimer = null;
    }
    const visible = Boolean(show);
    el.classList.toggle('is-visible', visible);
    document.body.classList.toggle('has-drive-hint', visible);
    if (visible) {
      driveHintTimer = setTimeout(() => {
        el.classList.remove('is-visible');
        document.body.classList.remove('has-drive-hint');
      }, 4500);
    }
  }

  let cadTelemetryInitialized = false;
  function updateCadTelemetry() {
    const el = domRefs.cadTelemetryText;
    if (!el || cadTelemetryInitialized) return;
    const stats = tslController?.getGeometryStats?.();
    if (!stats) return;
    const tris = Number(stats.triangles || 0).toLocaleString('en-US');
    const nodes = Number(stats.nodes || stats.meshes || 0).toLocaleString('en-US');
    const pivots = Number(stats.pivots || 0).toLocaleString('en-US');
    el.textContent = `${tris} TRIS · ${nodes} NODES · ${pivots} PIVOTS`;
    cadTelemetryInitialized = true;
  }

  function setCameraPopoverOpen(open) {
    const next = Boolean(open);
    if (next === state.cameraPopoverOpen) return;
    state.cameraPopoverOpen = next;
    domRefs.cameraPicker?.classList.toggle('is-open', next);
    domRefs.btnCameraPicker?.setAttribute('aria-expanded', String(next));
  }

  function setAudioPopoverOpen(open) {
    const next = Boolean(open);
    if (next === state.audioPopoverOpen) return;
    state.audioPopoverOpen = next;
    domRefs.audioUtility?.classList.toggle('is-popover-open', next);
  }

  function rebuildCameraPopover(force = false) {
    const listEl = domRefs.cameraPopoverList;
    if (!listEl) return;

    const isDrive = state.appMode === 'drive';
    const context = isDrive ? 'drive' : 'studio';
    if (!force && context === lastPopoverContext) {
      syncCameraPickerActiveUI();
      return;
    }
    lastPopoverContext = context;

    const items = isDrive ? CAMERA_VIEWPOINTS.drive : CAMERA_VIEWPOINTS.studio;
    const activeId = isDrive
      ? cameraDirector.getMode()
      : cameraDirector.getStudioViewpointId();

    if (domRefs.cameraPopoverTitle) {
      domRefs.cameraPopoverTitle.textContent = isDrive ? 'Drive Cameras' : 'Studio Viewpoints';
    }

    listEl.innerHTML = '';
    const builtBtns = [];
    items.forEach((item) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `cam-option-btn${item.id === activeId ? ' is-active' : ''}`;
      btn.dataset.camOption = item.id;
      btn.setAttribute('role', 'menuitem');
      btn.innerHTML = `<span>${item.label}</span><span class="cam-opt-dot" aria-hidden="true"></span>`;
      btn.addEventListener('click', () => {
        audio.unlock?.();
        audio.playUiClick?.();
        measureButtonSwitch(() => {
          setCameraMode(item.id);
          setCameraPopoverOpen(false);
        });
      });
      listEl.appendChild(btn);
      builtBtns.push(btn);
    });
    domRefs.camOptionBtns = builtBtns;

    const activeItem = items.find((i) => i.id === activeId) || items[0];
    if (domRefs.camPickerLabel && activeItem) {
      domRefs.camPickerLabel.textContent = activeItem.shortLabel || activeItem.label;
    }
  }

  function syncCameraPickerActiveUI() {
    const isDrive = state.appMode === 'drive';
    const items = isDrive ? CAMERA_VIEWPOINTS.drive : CAMERA_VIEWPOINTS.studio;
    const activeId = isDrive
      ? cameraDirector.getMode()
      : cameraDirector.getStudioViewpointId();

    for (let i = 0; i < domRefs.camOptionBtns.length; i++) {
      const btn = domRefs.camOptionBtns[i];
      btn.classList.toggle('is-active', btn.dataset.camOption === activeId);
    }

    const activeItem = items.find((i) => i.id === activeId) || items[0];
    if (domRefs.camPickerLabel && activeItem) {
      domRefs.camPickerLabel.textContent = activeItem.shortLabel || activeItem.label;
    }
  }

  // Lazily build SVG lines + HTML pin pills for all 8 technical annotations (zero startup cost!)
  function ensureAnnotationPinsDOM() {
    if (annotationPinsBuilt) return;
    const svg = domRefs.annotationsSvg;
    const pinsWrap = domRefs.annotationsPins;
    if (!svg || !pinsWrap) return;

    svg.innerHTML = '';
    pinsWrap.innerHTML = '';
    annotationDomMap.clear();

    const svgNS = 'http://www.w3.org/2000/svg';
    ANNOTATIONS.forEach((ann) => {
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('class', 'ann-line');
      svg.appendChild(line);

      const dot = document.createElementNS(svgNS, 'circle');
      dot.setAttribute('class', 'ann-anchor-dot');
      dot.setAttribute('r', '3.5');
      svg.appendChild(dot);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ann-pin';
      btn.dataset.annId = ann.id;
      btn.innerHTML = `<span class="pin-code">${ann.code}</span><span>${ann.label}</span>`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        audio.unlock?.();
        audio.playUiClick?.();
        measureButtonSwitch(() => {
          selectAnnotation(state.selectedAnnotation === ann.id ? null : ann.id);
        });
      });
      pinsWrap.appendChild(btn);

      annotationDomMap.set(ann.id, {
        line,
        dot,
        btn,
        meta: ann,
        halfW: 92,
        wasVisible: false,
        lastLeft: '',
        lastTop: '',
        lastAx: '',
        lastAy: '',
      });
    });

    annotationPinsBuilt = true;
    annotationHalfWidthsDirty = true;
  }

  function selectAnnotation(idOrNull) {
    if (!idOrNull && state.selectedAnnotation === null && !truckRig.focusedSubsystem) {
      return;
    }

    state.selectedAnnotation = idOrNull;
    const drawer = domRefs.annotationDrawer;

    if (!idOrNull) {
      truckRig.focusSubsystem?.(null);
      drawer?.classList.remove('is-open');
      if (annotationPinsBuilt) {
        annotationDomMap.forEach(({ line, dot, btn }) => {
          line.classList.remove('is-selected');
          dot.classList.remove('is-selected');
          btn.classList.remove('is-selected');
        });
      }
      return;
    }

    const meta = ANNOTATIONS.find((a) => a.id === idOrNull);
    if (!meta) return;

    ensureAnnotationPinsDOM();

    // Ensure annotations layer is visible when focusing programmatically
    if (!state.annotationsVisible && state.appMode !== 'drive') {
      state.annotationsVisible = true;
      syncMechanicalButtonsUI();
    }

    truckRig.focusSubsystem?.(meta.id);

    if (
      state.appMode !== 'drive' &&
      state.inspectionMode !== 'exploded' &&
      meta.preferredMode &&
      meta.preferredMode !== state.inspectionMode
    ) {
      setInspectionMode(meta.preferredMode, { keepFocus: true, quiet: true, skipCamera: true });
    }

    if (cameraDirector.getMode() !== 'orbit') {
      cameraDirector.setMode('orbit', { keepPreset: true });
    }
    cameraDirector.setPresetTarget(
      meta.cameraFocus.pos,
      meta.cameraFocus.lookAt,
      meta.cameraFocus.fov,
      { preserveOrbit: true, aspectAdapt: true }
    );

    annotationDomMap.forEach(({ line, dot, btn }, key) => {
      const isSel = key === meta.id;
      line.classList.toggle('is-selected', isSel);
      dot.classList.toggle('is-selected', isSel);
      btn.classList.toggle('is-selected', isSel);
    });

    if (domRefs.drawerCode) domRefs.drawerCode.textContent = meta.fullLabel;
    if (domRefs.drawerTitle) domRefs.drawerTitle.textContent = meta.label;
    if (domRefs.drawerProvenance) {
      domRefs.drawerProvenance.textContent = meta.architectureTag;
      domRefs.drawerProvenance.dataset.kind = meta.architectureTag.toLowerCase().includes('inferred')
        ? 'inferred'
        : 'exterior';
    }
    if (domRefs.drawerSummary) domRefs.drawerSummary.textContent = meta.summary;
    if (domRefs.drawerSpecs) {
      domRefs.drawerSpecs.innerHTML = meta.specs
        .map((s) => `<span class="spec-chip">${s}</span>`)
        .join('');
    }
    drawer?.classList.add('is-open');
    showToast(meta.fullLabel);
  }

  function updateAnnotationsOverlay() {
    const shouldShow =
      (state.appMode === 'inspect' || state.appMode === 'wireframe') &&
      state.annotationsVisible;

    if (shouldShow !== lastAnnotationsLayerVisible) {
      lastAnnotationsLayerVisible = shouldShow;
      domRefs.annotationsLayer?.classList.toggle('is-visible', shouldShow);
      if (shouldShow) {
        ensureAnnotationPinsDOM();
        annotationHalfWidthsDirty = true;
      }
    }

    if (!shouldShow) return;

    ensureAnnotationPinsDOM();

    // Measure pill widths in a single read pass ONLY when dirty (never interleaved with style writes!)
    if (annotationHalfWidthsDirty) {
      annotationDomMap.forEach((dom) => {
        if (dom.btn.style.display === 'none') {
          dom.btn.style.display = 'inline-flex';
        }
      });
      annotationDomMap.forEach((dom) => {
        const ow = dom.btn.offsetWidth;
        if (ow > 20) dom.halfW = Math.max(72, ow * 0.5);
      });
      annotationHalfWidthsDirty = false;
    }

    const w = viewportW;
    const h = viewportH;
    const anchors = truckRig.getAnnotationAnchors?.() || null;
    const isDesktop = w > 700;
    const drawerOpen = Boolean(state.selectedAnnotation);
    const safeInsets = {
      left: isDesktop ? 132 : 108,
      right: isDesktop ? (drawerOpen ? 372 : 132) : 108,
      top: isDesktop ? 88 : 112,
      bottom: isDesktop ? 150 : 120,
    };
    const projected = projectAnnotations(camera, anchors, truckRoot, w, h, safeInsets);
    const rightSafeEdge = drawerOpen && isDesktop ? w - 332 : w - 12;

    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      const dom = annotationDomMap.get(p.id);
      if (!dom) continue;

      if (!p.visible) {
        if (dom.wasVisible) {
          dom.btn.style.display = 'none';
          dom.line.style.display = 'none';
          dom.dot.style.display = 'none';
          dom.wasVisible = false;
        }
        continue;
      }

      if (!dom.wasVisible) {
        dom.btn.style.display = 'inline-flex';
        dom.line.style.display = '';
        dom.dot.style.display = '';
        dom.wasVisible = true;
      }

      const halfW = dom.halfW || 92;
      const minPillX = Math.min(w * 0.5, halfW + 12);
      const maxPillX = Math.max(minPillX, rightSafeEdge - halfW);
      const clampedPillX = THREE.MathUtils.clamp(p.pillX, minPillX, maxPillX);

      const leftStr = clampedPillX.toFixed(1);
      const topStr = p.pillY.toFixed(1);
      const axStr = p.anchorX.toFixed(1);
      const ayStr = p.anchorY.toFixed(1);

      if (leftStr !== dom.lastLeft) {
        dom.btn.style.left = `${leftStr}px`;
        dom.line.setAttribute('x2', leftStr);
        dom.lastLeft = leftStr;
      }
      if (topStr !== dom.lastTop) {
        dom.btn.style.top = `${topStr}px`;
        dom.line.setAttribute('y2', topStr);
        dom.lastTop = topStr;
      }
      if (axStr !== dom.lastAx) {
        dom.line.setAttribute('x1', axStr);
        dom.dot.setAttribute('cx', axStr);
        dom.lastAx = axStr;
      }
      if (ayStr !== dom.lastAy) {
        dom.line.setAttribute('y1', ayStr);
        dom.dot.setAttribute('cy', ayStr);
        dom.lastAy = ayStr;
      }
    }
  }

  // ==========================================================================
  // CORE MODE SWITCHING, WIREFRAME CAD & MECHANICAL CONTROLLERS
  // ==========================================================================

  function syncWinchButtonsUI(phase = state.winchPhase, active = state.winchActive) {
    const isLit = Boolean(active || (phase && phase !== 'stowed'));
    const isPulling =
      phase === 'anchored' ||
      phase === 'reeling' ||
      phase === 'tensioning' ||
      phase === 'deploying';

    const buttons = [domRefs.btnWinch, domRefs.driveBtnWinch];
    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      if (!btn) continue;
      btn.classList.toggle('is-on', isLit);
      btn.classList.toggle('is-winch-pulling', isPulling);
      btn.dataset.winchPhase = phase || 'stowed';
    }

    const labelText = WINCH_PHASE_LABELS[phase] || 'Winch';
    if (domRefs.inspectWinchLabel) {
      domRefs.inspectWinchLabel.textContent = phase === 'stowed' ? 'Winch' : labelText;
    }
    if (domRefs.driveWinchLabel) {
      domRefs.driveWinchLabel.textContent = phase === 'stowed' ? 'Winch' : labelText;
    }
  }

  function syncMechanicalButtonsUI() {
    domRefs.btnDoors?.classList.toggle('is-on', state.doorsOpen);
    domRefs.wireBtnDoors?.classList.toggle('is-on', state.doorsOpen);
    domRefs.driveBtnDoors?.classList.toggle('is-on', state.doorsOpen);

    domRefs.btnHatches?.classList.toggle('is-on', state.hatchesOpen);
    domRefs.wireBtnHatches?.classList.toggle('is-on', state.hatchesOpen);

    domRefs.btnLights?.classList.toggle('is-on', state.headlightsOn);
    domRefs.driveBtnLights?.classList.toggle('is-on', state.headlightsOn);
    domRefs.hudLampLights?.classList.toggle('is-lit-blue', state.headlightsOn);

    syncWinchButtonsUI(state.winchPhase, state.winchActive);

    domRefs.btnAnnotations?.classList.toggle('is-on', state.annotationsVisible);
    domRefs.wireBtnAnnotations?.classList.toggle('is-on', state.annotationsVisible);
  }

  function applyRenderStyle(targetStyle) {
    const currentStyle = tslController?.getRenderStyle?.();
    if (currentStyle !== targetStyle) {
      tslController.setRenderStyle?.(targetStyle);
    }
    truckRig.setRenderStyle?.(targetStyle);
  }

  function setStudioTheme(theme, instant = false) {
    const normalized = theme === 'blueprint' ? 'blueprint' : 'alabaster';
    const changed = state.studioTheme !== normalized;
    state.studioTheme = normalized;
    if (changed || document.body.dataset.theme !== normalized) {
      document.body.dataset.theme = normalized;
    }
    if (changed || instant) {
      envController?.setStudioTheme?.(normalized, instant);
    }
    if (instant) {
      state.blueprintBlend = normalized === 'blueprint' ? 1.0 : 0.0;
    }
  }

  function syncWireframeStyleButtonsUI() {
    for (let i = 0; i < domRefs.wireStyleBtns.length; i++) {
      const btn = domRefs.wireStyleBtns[i];
      btn.classList.toggle('is-active', btn.dataset.wireStyle === state.wireframeStyle);
    }
  }

  function setWireframeStyle(style, options = {}) {
    if (!WIREFRAME_STYLE_MAP[style]) return;
    if (
      state.appMode === 'wireframe' &&
      state.wireframeStyle === style &&
      !options.force
    ) {
      return;
    }

    state.wireframeStyle = style;
    syncWireframeStyleButtonsUI();

    const styleMeta = WIREFRAME_STYLE_MAP[style];
    if (state.appMode !== 'wireframe' && !options.onlyPreference) {
      // setAppMode('wireframe') applies the newly updated state.wireframeStyle + theme directly (no double work!)
      setAppMode('wireframe', { quiet: true });
      if (!options.quiet) {
        showToast(`CAD · ${styleMeta.label.toUpperCase()}`);
      }
      return;
    }

    if (state.appMode === 'wireframe') {
      applyRenderStyle(style);
      setStudioTheme(styleMeta.theme, Boolean(options.instant));
      updateCadTelemetry();
      if (!options.quiet) {
        showToast(`CAD · ${styleMeta.label.toUpperCase()}`);
      }
    }
  }

  function setExplodeAmount(val, options = {}) {
    const clamped = THREE.MathUtils.clamp(Number(val) || 0, 0, 1);
    if (Math.abs(clamped - state.explodeAmount) < 1e-4 && !options.force) {
      return;
    }
    state.explodeAmount = clamped;
    truckRig.setExplodeAmount?.(clamped);

    const pct = Math.round(clamped * 100);
    if (domRefs.explodeSliderA && options.source !== 'inspect') {
      domRefs.explodeSliderA.value = String(pct);
    }
    if (domRefs.explodeSliderB && options.source !== 'wireframe') {
      domRefs.explodeSliderB.value = String(pct);
    }
    if (domRefs.explodeValueA) domRefs.explodeValueA.textContent = `${pct}%`;
    if (domRefs.explodeValueB) domRefs.explodeValueB.textContent = `${pct}%`;

    if (clamped > 0.05 && state.inspectionMode !== 'exploded' && !options.keepMode) {
      state.inspectionMode = 'exploded';
      syncInspectionButtonsUI();
    } else if (clamped <= 0.01 && state.inspectionMode === 'exploded' && !options.keepMode) {
      state.inspectionMode = 'exterior';
      syncInspectionButtonsUI();
    }
  }

  function syncInspectionButtonsUI() {
    for (let i = 0; i < domRefs.layerBtns.length; i++) {
      const btn = domRefs.layerBtns[i];
      const isActive = btn.dataset.inspectMode === state.inspectionMode;
      btn.classList.toggle('is-active', isActive);
      if (btn.getAttribute('role') === 'tab') {
        btn.setAttribute('aria-selected', String(isActive));
      }
    }
  }

  function setInspectionMode(mode, options = {}) {
    if (!INSPECTION_MODE_IDS.includes(mode)) return;
    const prevInspection = state.inspectionMode;
    state.inspectionMode = mode;
    document.body.dataset.inspectLayer = mode;
    truckRig.setInspectionMode?.(mode);

    if (mode === 'exploded') {
      const nextExp = state.explodeAmount < 0.2 ? 1.0 : state.explodeAmount;
      if (Math.abs(nextExp - state.explodeAmount) > 1e-4) {
        setExplodeAmount(nextExp, { keepMode: true });
      }
    } else if (state.explodeAmount > 1e-4) {
      setExplodeAmount(0, { keepMode: true });
    }

    if (!options.keepFocus && (state.selectedAnnotation !== null || truckRig.focusedSubsystem)) {
      selectAnnotation(null);
    }

    const rigStateAfterMode = truckRig.getState?.();
    if (
      rigStateAfterMode &&
      typeof rigStateAfterMode.doorsOpen === 'boolean' &&
      rigStateAfterMode.doorsOpen !== state.doorsOpen
    ) {
      state.doorsOpen = rigStateAfterMode.doorsOpen;
      syncMechanicalButtonsUI();
    }

    const preset = INSPECTION_CAMERA_MAP[mode];
    if (
      preset &&
      state.appMode !== 'drive' &&
      !options.keepFocus &&
      !options.skipCamera
    ) {
      if (cameraDirector.getMode() !== 'orbit') {
        cameraDirector.setMode('orbit', { keepPreset: true });
      }
      cameraDirector.setPresetTarget(preset.pos, preset.lookAt, preset.fov, {
        preserveOrbit: true,
        aspectAdapt: true,
      });
      if (mode === 'exterior' && cameraDirector.studioViewpointId !== 'hero') {
        cameraDirector.studioViewpointId = 'hero';
        syncCameraPickerActiveUI();
      }
    }

    if (prevInspection !== mode || options.force) {
      syncInspectionButtonsUI();
    }
    if (!options.quiet) {
      const prefix = state.appMode === 'wireframe' ? 'CAD LAYER' : 'INSPECT';
      showToast(`${prefix} · ${mode.toUpperCase()}`);
    }
  }

  function setDoorsOpen(open, options = {}) {
    const next = Boolean(open);
    if (next === state.doorsOpen && !options.force) return;
    state.doorsOpen = next;
    truckRig.setDoorsOpen?.(next);
    syncMechanicalButtonsUI();
    if (!options.silent) {
      audio.unlock?.();
      audio.playDoorSound?.(next);
      showToast(`CABIN DOORS · ${next ? 'OPEN' : 'CLOSED'}`);
    }
  }

  function setHatchesOpen(open, options = {}) {
    const next = Boolean(open);
    if (next === state.hatchesOpen && !options.force) return;
    state.hatchesOpen = next;
    truckRig.setHatchesOpen?.(next);
    syncMechanicalButtonsUI();
    if (!options.silent) {
      audio.unlock?.();
      audio.playHatchSound?.(next);
      showToast(`SERVICE HATCHES · ${next ? 'OPEN' : 'SEALED'}`);
    }
  }

  function setHeadlights(on, options = {}) {
    const next = Boolean(on);
    if (next === state.headlightsOn && !options.force) return;
    state.headlightsOn = next;
    truckRig.setHeadlights?.(next);
    syncMechanicalButtonsUI();
    if (!options.silent) {
      audio.unlock?.();
      if (typeof audio.playLightRelayClick === 'function') {
        audio.playLightRelayClick(next);
      } else {
        audio.playUiClick?.();
      }
      showToast(`HEADLIGHTS · ${next ? 'ON' : 'OFF'}`);
    }
  }

  function setWinchActive(active, options = {}) {
    const next = Boolean(active);
    if (next === state.winchActive && !options.force) return;
    state.winchActive = next;
    suppressNextWinchToast = Boolean(options.silent);
    truckRig.setWinchActive?.(next);
    const rigNow = truckRig.getState?.();
    if (rigNow?.winchPhase) {
      state.winchPhase = rigNow.winchPhase;
      lastWinchPhase = rigNow.winchPhase;
    } else {
      state.winchPhase = next ? 'deploying' : 'stowed';
    }
    lastWinchActiveUI = state.winchActive;
    syncWinchButtonsUI(state.winchPhase, state.winchActive);

    if (!next) {
      physics.setWinchAnchor?.(null);
    }

    if (!options.silent) {
      audio.unlock?.();
      if (next) {
        if (state.winchPhase === 'anchored') {
          showToast('WINCH ANCHORED — REELING RECOVERY PULL');
        } else if (state.appMode === 'drive') {
          showToast('WINCH DEPLOYING — ANCHORING AHEAD');
        } else {
          showToast('RECOVERY WINCH · DEPLOYING');
        }
      } else if (state.winchPhase === 'stowed') {
        showToast('WINCH STOWED');
      } else {
        showToast('RECOVERY WINCH · REELING IN');
      }
    }
  }

  function setAnnotationsVisible(visible, options = {}) {
    const next = Boolean(visible);
    if (next === state.annotationsVisible && !options.force) return;
    state.annotationsVisible = next;
    if (next) {
      ensureAnnotationPinsDOM();
    } else if (state.selectedAnnotation !== null || truckRig.focusedSubsystem) {
      selectAnnotation(null);
    }
    syncMechanicalButtonsUI();
    if (!options.silent) {
      audio.unlock?.();
      audio.playUiClick?.();
      showToast(`CALLOUTS · ${next ? 'VISIBLE' : 'HIDDEN'}`);
    }
  }

  function setCameraMode(modeId, options = {}) {
    // Support BOTH Studio Viewpoints and Drive Cameras!
    if (state.appMode !== 'drive' && STUDIO_VIEWPOINT_IDS.has(modeId)) {
      const vp = cameraDirector.setStudioViewpoint(modeId, options);
      syncCameraPickerActiveUI();
      if (!options.quiet) {
        showToast(`VIEW · ${vp.label.toUpperCase()}`);
      }
      return vp;
    }

    if (DRIVE_CAMERA_IDS.has(modeId)) {
      const meta = cameraDirector.setMode(modeId, options);
      syncCameraPickerActiveUI();
      if (!options.quiet) {
        showToast(`CAMERA · ${meta.label.toUpperCase()}`);
      }
      return meta;
    }

    return cameraDirector.getModeMeta();
  }

  function cycleCamera() {
    if (state.appMode !== 'drive') {
      const vp = cameraDirector.cycleStudioViewpoint();
      syncCameraPickerActiveUI();
      showToast(`VIEW · ${vp.label.toUpperCase()}`);
      return vp;
    }
    const meta = cameraDirector.cycleMode();
    syncCameraPickerActiveUI();
    showToast(`CAMERA · ${meta.label.toUpperCase()}`);
    return meta;
  }

  function setEnvironment(envMode, instant = false) {
    if (envMode === 'offroad') {
      envController?.ensureOffroadBuilt?.();
      perfMetrics.offroadReady = Boolean(envController?.isOffroadBuilt?.() ?? true);
    }

    const changed = state.envMode !== envMode;
    state.envMode = envMode;
    if (changed || instant) {
      envController?.setEnvironmentMode?.(envMode, instant);
    }
    // IMPORTANT: Keep ONE constant `scene.environment` PMREM texture permanently across Studio & Off-Road!
    // Swapping `scene.environment` triggers a multi-second full shader recompile in Three.js r174 WebGPU/WebGL2.
    cameraDirector.setAppContext(state.appMode, state.envMode);
  }

  function clearInputs() {
    keysHeld.forward = false;
    keysHeld.backward = false;
    keysHeld.left = false;
    keysHeld.right = false;
    keysHeld.handbrake = false;
    touchHeld.forward = false;
    touchHeld.backward = false;
    touchHeld.left = false;
    touchHeld.right = false;
    touchHeld.handbrake = false;
    scriptOverrideInputs.forward = null;
    scriptOverrideInputs.backward = null;
    scriptOverrideInputs.left = null;
    scriptOverrideInputs.right = null;
    scriptOverrideInputs.handbrake = null;
  }

  function collapseMobileDockPanels() {
    domRefs.dockInspect?.classList.remove('is-mobile-expanded');
    domRefs.dockWireframe?.classList.remove('is-mobile-expanded');
    document.body.classList.remove('is-mobile-dock-open');
    for (let i = 0; i < domRefs.mobileToggleBtns.length; i++) {
      const btn = domRefs.mobileToggleBtns[i];
      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  }

  function teardownDriveSession() {
    clearInputs();
    physics.setWinchAnchor?.(null);
    physics.setActive(false);
    physics.reset(_originPos, 0, 'studio');
    truckRoot.position.set(0, 0, 0);
    truckRoot.quaternion.identity();
    truckRoot.updateMatrixWorld(true);
    truckRig.resetDrivingPose?.();
    truckRig.update?.(0.016);
    if (tslUniforms.uTruckPos) tslUniforms.uTruckPos.value.set(0, 0, 0);
    if (cameraDirector.lastTruckPos) cameraDirector.lastTruckPos.set(0, 0, 0);
    state.winchActive = false;
    state.winchPhase = 'stowed';
    lastWinchPhase = 'stowed';
    lastWinchActiveUI = false;
    suppressNextWinchToast = false;
    syncWinchButtonsUI('stowed', false);
    if (tslUniforms.uBraking) tslUniforms.uBraking.value = 0;
    if (tslUniforms.uReverse) tslUniforms.uReverse.value = 0;
    dustSystem?.clear?.();
    audio.updateWinchAudio?.(0.016, {
      active: false,
      speedNorm: 0,
      tensionNorm: 0,
      phase: 'stowed',
    });
    audio.triggerShutdown?.();
  }

  function setAppMode(nextMode, options = {}) {
    if (!['inspect', 'wireframe', 'drive'].includes(nextMode)) return;
    const prevMode = state.appMode;
    if (nextMode === prevMode && !options.force) return;

    state.appMode = nextMode;
    document.body.dataset.appMode = nextMode;

    setCameraPopoverOpen(false);
    setAudioPopoverOpen(false);
    closeSystemsPopovers?.();
    collapseMobileDockPanels();

    for (let i = 0; i < domRefs.modePills.length; i++) {
      const pill = domRefs.modePills[i];
      pill.classList.toggle('is-active', pill.dataset.appMode === nextMode);
    }

    if (nextMode === 'inspect') {
      showDriveHint(false);
      if (prevMode === 'drive') {
        teardownDriveSession();
      }

      applyRenderStyle('pbr');
      setStudioTheme('alabaster', prevMode === 'drive');
      setEnvironment('studio', prevMode === 'drive');
      cameraDirector.setAppContext('inspect', 'studio');

      if (prevMode === 'drive') {
        // Snap camera & OrbitControls immediately to Hero 3/4 centered on truck at origin (0,0,0)!
        cameraDirector.setStudioViewpoint('hero', { immediate: true });
        syncCameraPickerActiveUI();
      } else if (cameraDirector.getMode() !== 'orbit') {
        cameraDirector.setMode('orbit', { keepPreset: true });
      }

      syncInspectionButtonsUI();
      rebuildCameraPopover();
      wakeRenderer(true, 950);
      if (!options.quiet && prevMode !== nextMode) {
        showToast('SHOWCASE · STUDIO PBR');
      }
    } else if (nextMode === 'wireframe') {
      showDriveHint(false);
      if (prevMode === 'drive') {
        teardownDriveSession();
      }

      setEnvironment('studio', prevMode === 'drive');
      applyRenderStyle(state.wireframeStyle);
      const styleMeta = WIREFRAME_STYLE_MAP[state.wireframeStyle] || WIREFRAME_STYLES[0];
      setStudioTheme(styleMeta.theme, prevMode === 'drive');
      updateCadTelemetry();
      cameraDirector.setAppContext('wireframe', 'studio');

      if (prevMode === 'drive') {
        cameraDirector.setStudioViewpoint('hero', { immediate: true });
        syncCameraPickerActiveUI();
      } else if (cameraDirector.getMode() !== 'orbit') {
        cameraDirector.setMode('orbit', { keepPreset: true });
      }

      syncWireframeStyleButtonsUI();
      syncInspectionButtonsUI();
      rebuildCameraPopover();
      wakeRenderer(true, 950);
      if (!options.quiet && prevMode !== nextMode) {
        showToast(`WIREFRAME · ${styleMeta.label.toUpperCase()}`);
      }
    } else if (nextMode === 'drive') {
      audio.unlock?.();
      if (state.selectedAnnotation !== null || truckRig.focusedSubsystem) {
        selectAnnotation(null);
      }
      if (state.explodeAmount > 1e-4) {
        setExplodeAmount(0, { keepMode: true });
      }
      if (state.inspectionMode !== 'exterior') {
        state.inspectionMode = 'exterior';
        document.body.dataset.inspectLayer = 'exterior';
        truckRig.setInspectionMode?.('exterior');
        syncInspectionButtonsUI();
      }

      applyRenderStyle('pbr');
      setStudioTheme('alabaster', true);

      setHatchesOpen(false, { silent: true });
      setWinchActive(false, { silent: true });
      setDoorsOpen(false, { silent: true });
      setHeadlights(true, { silent: true });

      ensureDustSystem();
      setEnvironment('offroad', true);
      physics.setWinchAnchor?.(null);
      physics.reset(_originPos, 0, 'offroad');
      physics.setActive(true);
      const initialDriveState = physics.getState();
      truckRig.applyPhysicsState?.(initialDriveState, 0.016);
      if (tslUniforms.uTruckPos && initialDriveState?.position) {
        tslUniforms.uTruckPos.value.copy(initialDriveState.position);
      }

      cameraDirector.setAppContext('drive', 'offroad');
      cameraDirector.setMode('chase', { immediate: true });
      cameraDirector.update(0.016, initialDriveState);
      rebuildCameraPopover();
      wakeRenderer(true, 950);
      audio.triggerStartup?.();
      hideToast();
      showDriveHint(true);
    }
  }

  function resetVehicle(pos = null, yaw = 0) {
    if (state.appMode === 'drive') {
      clearInputs();
      physics.setWinchAnchor?.(null);
      truckRig.resetDrivingPose?.();
      state.winchActive = false;
      state.winchPhase = 'stowed';
      lastWinchPhase = 'stowed';
      lastWinchActiveUI = false;
      suppressNextWinchToast = false;
      syncWinchButtonsUI('stowed', false);
      physics.reset(pos || _originPos, yaw, 'offroad');
      truckRig.applyPhysicsState?.(physics.getState(), 0.016);
      dustSystem?.clear?.();
      audio.updateWinchAudio?.(0.016, {
        active: false,
        speedNorm: 0,
        tensionNorm: 0,
        phase: 'stowed',
      });
      cameraDirector.setMode(cameraDirector.getMode());
      audio.playUiClick?.();
      showToast('VEHICLE RESET TO LAUNCH PAD');
    } else {
      selectAnnotation(null);
      setExplodeAmount(0);
      setInspectionMode('exterior', { quiet: true, skipCamera: true });
      setDoorsOpen(false, { silent: true });
      setHatchesOpen(false, { silent: true });
      setWinchActive(false, { silent: true });
      cameraDirector.setStudioViewpoint('hero');
      syncCameraPickerActiveUI();
      showToast('STUDIO VIEW RESET');
    }
  }

  function setShortcutsOpen(open, pausePhysics = false) {
    const next = Boolean(open);
    state.shortcutsOpen = next;
    state.paused = next && (pausePhysics || state.appMode === 'drive');

    if (domRefs.modalKicker) {
      domRefs.modalKicker.textContent = state.paused
        ? 'TITAN 6X6 · SIMULATION PAUSED'
        : 'TITAN 6X6 · CONTROLS';
    }
    if (domRefs.modalTitle) {
      domRefs.modalTitle.textContent = state.paused ? 'Drive Paused' : 'Keyboard Shortcuts';
    }
    if (domRefs.modalBtnResume) {
      domRefs.modalBtnResume.textContent = state.paused ? 'Resume Drive' : 'Close';
    }

    domRefs.shortcutsOverlay?.classList.toggle('is-open', next);
    if (next) {
      setCameraPopoverOpen(false);
      setAudioPopoverOpen(false);
      clearInputs();
    }
  }

  function setPaused(paused) {
    setShortcutsOpen(Boolean(paused), Boolean(paused));
  }

  function setMasterVolume(pct) {
    const clamped = THREE.MathUtils.clamp(Math.round(Number(pct) || 0), 0, 100);
    state.audioVolume = clamped / 100;
    audio.setVolume?.(state.audioVolume);

    if (domRefs.topVolumeSlider && Number(domRefs.topVolumeSlider.value) !== clamped) {
      domRefs.topVolumeSlider.value = String(clamped);
    }
    if (domRefs.modalVolumeSlider && Number(domRefs.modalVolumeSlider.value) !== clamped) {
      domRefs.modalVolumeSlider.value = String(clamped);
    }
    if (domRefs.topVolumeVal) domRefs.topVolumeVal.textContent = `${clamped}%`;
    if (domRefs.modalVolumeVal) domRefs.modalVolumeVal.textContent = `${clamped}%`;

    if (clamped === 0 && !state.audioMuted) {
      state.audioMuted = true;
      audio.setMuted?.(true);
      domRefs.btnAudio?.classList.add('is-muted');
    } else if (clamped > 0 && state.audioMuted) {
      state.audioMuted = false;
      audio.setMuted?.(false);
      domRefs.btnAudio?.classList.remove('is-muted');
    }
  }

  let dynamicDprScale = 1.0;
  let lowFpsStreak = 0;

  function setQuality(q) {
    state.quality = q === 'balanced' ? 'balanced' : 'high';
    dynamicDprScale = 1.0;
    lowFpsStreak = 0;
    renderer.setPixelRatio(getDprForQuality(state.quality, dynamicDprScale));
    const sz = state.quality === 'high' ? 1536 : 1024;
    if (keyLight.shadow.mapSize.width !== sz) {
      keyLight.shadow.mapSize.set(sz, sz);
      if (keyLight.shadow.map) {
        keyLight.shadow.map.dispose();
        keyLight.shadow.map = null;
      }
    }
    renderer.shadowMap.needsUpdate = true;
    if (domRefs.qualityLabel) {
      domRefs.qualityLabel.textContent = state.quality === 'high' ? 'High' : 'Bal';
    }
    showToast(`QUALITY · ${state.quality.toUpperCase()}`);
  }

  // ==========================================================================
  // WIRE UP ALL BUTTONS, SLIDERS, POPOVERS & KEYBOARD SHORTCUTS
  // ==========================================================================

  // Top-Left brand home button -> smoothly resets view to Hero 3/4
  document.getElementById('btn-brand-home')?.addEventListener('click', () => {
    audio.unlock?.();
    audio.playUiClick?.();
    measureButtonSwitch(() => {
      if (state.appMode === 'drive') {
        setAppMode('inspect');
      } else {
        cameraDirector.setStudioViewpoint('hero');
        syncCameraPickerActiveUI();
        showToast('VIEW · HERO 3/4');
      }
    });
  });

  // ==========================================================================
  // AWWWARDS PROGRESSIVE-DISCLOSURE SYSTEMS POPOVER (Inspect & Wireframe)
  // ==========================================================================

  const systemsWrapInspect = document.getElementById('systems-wrap-inspect');
  const systemsWrapWire = document.getElementById('systems-wrap-wire');
  const btnSystemsInspect = document.getElementById('btn-systems-inspect');
  const btnSystemsWire = document.getElementById('btn-systems-wire');

  function closeSystemsPopovers() {
    systemsWrapInspect?.classList.remove('is-open');
    systemsWrapWire?.classList.remove('is-open');
    btnSystemsInspect?.setAttribute('aria-expanded', 'false');
    btnSystemsWire?.setAttribute('aria-expanded', 'false');
  }

  function toggleSystemsPopover(wrapEl, btnEl) {
    if (!wrapEl || !btnEl) return;
    const willOpen = !wrapEl.classList.contains('is-open');
    closeSystemsPopovers();
    if (state.cameraPopoverOpen) setCameraPopoverOpen(false);
    if (state.audioPopoverOpen) setAudioPopoverOpen(false);
    if (willOpen) {
      wrapEl.classList.add('is-open');
      btnEl.setAttribute('aria-expanded', 'true');
    }
  }

  btnSystemsInspect?.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.unlock?.();
    audio.playUiClick?.();
    toggleSystemsPopover(systemsWrapInspect, btnSystemsInspect);
  });

  btnSystemsWire?.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.unlock?.();
    audio.playUiClick?.();
    toggleSystemsPopover(systemsWrapWire, btnSystemsWire);
  });

  document.addEventListener('click', (e) => {
    if (
      systemsWrapInspect?.classList.contains('is-open') &&
      !systemsWrapInspect.contains(e.target)
    ) {
      closeSystemsPopovers();
    }
    if (
      systemsWrapWire?.classList.contains('is-open') &&
      !systemsWrapWire.contains(e.target)
    ) {
      closeSystemsPopovers();
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSystemsPopovers();
  });

  // Hero section inline CTAs (Home / Inspect Exterior hero)
  document.getElementById('hero-cta-drive')?.addEventListener('click', () => {
    audio.unlock?.();
    audio.playUiClick?.();
    measureButtonSwitch(() => setAppMode('drive'));
  });

  document.getElementById('hero-cta-explode')?.addEventListener('click', () => {
    audio.unlock?.();
    audio.playUiClick?.();
    measureButtonSwitch(() => setInspectionMode('exploded'));
  });

  // Top-Center 3-mode switcher
  domRefs.modePills.forEach((pill) => {
    pill.addEventListener('click', () => {
      audio.unlock?.();
      audio.playUiClick?.();
      measureButtonSwitch(() => setAppMode(pill.dataset.appMode));
    });
  });

  // Top-Right Audio button (click = mute/unmute, right-click = volume popover)
  domRefs.btnAudio?.addEventListener('click', () => {
    audio.unlock?.();
    state.audioMuted = !state.audioMuted;
    audio.setMuted?.(state.audioMuted);
    domRefs.btnAudio?.classList.toggle('is-muted', state.audioMuted);
    showToast(state.audioMuted ? 'AUDIO · MUTED' : 'AUDIO · ACTIVE');
  });

  domRefs.btnAudio?.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    setAudioPopoverOpen(!state.audioPopoverOpen);
  });

  domRefs.topVolumeSlider?.addEventListener('input', (e) => {
    setMasterVolume(e.target.value);
  });

  // Top-Right Quality/Engine pill
  qualityBtn?.addEventListener('click', () => {
    audio.unlock?.();
    audio.playUiClick?.();
    measureButtonSwitch(() => setQuality(state.quality === 'high' ? 'balanced' : 'high'));
  });

  // Top-Right Shortcuts (?) button
  document.getElementById('btn-shortcuts')?.addEventListener('click', () => {
    audio.unlock?.();
    audio.playUiClick?.();
    setShortcutsOpen(!state.shortcutsOpen, state.appMode === 'drive');
  });

  // Drive hint pill click-to-dismiss
  domRefs.driveHintPill?.addEventListener('click', () => {
    showDriveHint(false);
  });

  // Inspect & Wireframe Layer tabs
  domRefs.layerBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.unlock?.();
      audio.playUiClick?.();
      measureButtonSwitch(() => setInspectionMode(btn.dataset.inspectMode));
    });
  });

  // Wireframe CAD Render Style buttons
  domRefs.wireStyleBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      audio.unlock?.();
      audio.playUiClick?.();
      measureButtonSwitch(() => setWireframeStyle(btn.dataset.wireStyle));
    });
  });

  // Explode sliders (Inspect + Wireframe synced)
  domRefs.explodeSliderA?.addEventListener('input', (e) => {
    setExplodeAmount(Number(e.target.value) / 100, { source: 'inspect' });
  });
  domRefs.explodeSliderB?.addEventListener('input', (e) => {
    setExplodeAmount(Number(e.target.value) / 100, { source: 'wireframe' });
  });

  // Mechanical toggles (Inspect + Wireframe + Drive synced)
  domRefs.btnDoors?.addEventListener('click', () =>
    measureButtonSwitch(() => setDoorsOpen(!state.doorsOpen))
  );
  domRefs.wireBtnDoors?.addEventListener('click', () =>
    measureButtonSwitch(() => setDoorsOpen(!state.doorsOpen))
  );
  domRefs.driveBtnDoors?.addEventListener('click', () =>
    measureButtonSwitch(() => setDoorsOpen(!state.doorsOpen))
  );

  domRefs.btnHatches?.addEventListener('click', () =>
    measureButtonSwitch(() => setHatchesOpen(!state.hatchesOpen))
  );
  domRefs.wireBtnHatches?.addEventListener('click', () =>
    measureButtonSwitch(() => setHatchesOpen(!state.hatchesOpen))
  );

  domRefs.btnLights?.addEventListener('click', () =>
    measureButtonSwitch(() => setHeadlights(!state.headlightsOn))
  );
  domRefs.driveBtnLights?.addEventListener('click', () =>
    measureButtonSwitch(() => setHeadlights(!state.headlightsOn))
  );

  domRefs.btnWinch?.addEventListener('click', () =>
    measureButtonSwitch(() => setWinchActive(!state.winchActive))
  );
  domRefs.driveBtnWinch?.addEventListener('click', () =>
    measureButtonSwitch(() => setWinchActive(!state.winchActive))
  );

  domRefs.btnAnnotations?.addEventListener('click', () =>
    measureButtonSwitch(() => setAnnotationsVisible(!state.annotationsVisible))
  );
  domRefs.wireBtnAnnotations?.addEventListener('click', () =>
    measureButtonSwitch(() => setAnnotationsVisible(!state.annotationsVisible))
  );

  document.getElementById('drive-btn-reset')?.addEventListener('click', () =>
    measureButtonSwitch(() => resetVehicle())
  );
  document.getElementById('drive-btn-pause')?.addEventListener('click', () => {
    audio.playUiClick?.();
    setShortcutsOpen(true, true);
  });

  // Mobile expandable controls drawer toggles
  const wireMobileToggle = (btnId, panelEl) => {
    const btn = document.getElementById(btnId);
    if (!btn || !panelEl) return;
    btn.addEventListener('click', () => {
      audio.unlock?.();
      audio.playUiClick?.();
      const open = panelEl.classList.toggle('is-mobile-expanded');
      btn.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
      document.body.classList.toggle('is-mobile-dock-open', open);
      if (open) setCameraPopoverOpen(false);
    });
  };
  wireMobileToggle('btn-mobile-controls-inspect', domRefs.dockInspect);
  wireMobileToggle('btn-mobile-controls-wire', domRefs.dockWireframe);

  // Bottom-Right Camera Picker & Popover
  domRefs.btnCameraPicker?.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.unlock?.();
    audio.playUiClick?.();
    setAudioPopoverOpen(false);
    setCameraPopoverOpen(!state.cameraPopoverOpen);
  });

  document.getElementById('btn-reset-orbit')?.addEventListener('click', () => {
    audio.unlock?.();
    audio.playUiClick?.();
    cameraDirector.setStudioViewpoint('hero');
    syncCameraPickerActiveUI();
    setCameraPopoverOpen(false);
    showToast('ORBIT RESET · HERO 3/4');
  });

  // Close popovers when clicking outside
  document.addEventListener('click', (e) => {
    if (state.cameraPopoverOpen && !e.target.closest('#camera-picker')) {
      setCameraPopoverOpen(false);
    }
    if (state.audioPopoverOpen && !e.target.closest('#audio-utility')) {
      setAudioPopoverOpen(false);
    }
  });

  // Annotation Detail Drawer close
  document.getElementById('drawer-close')?.addEventListener('click', () => {
    audio.playUiClick?.();
    selectAnnotation(null);
  });

  // Shortcuts & Pause Modal buttons
  document.getElementById('modal-close')?.addEventListener('click', () => setShortcutsOpen(false));
  domRefs.modalBtnResume?.addEventListener('click', () => setShortcutsOpen(false));
  document.getElementById('modal-btn-reset')?.addEventListener('click', () => {
    setShortcutsOpen(false);
    resetVehicle();
  });
  document.getElementById('modal-btn-inspect')?.addEventListener('click', () => {
    setShortcutsOpen(false);
    measureButtonSwitch(() => setAppMode('inspect'));
  });
  document.getElementById('modal-btn-wireframe')?.addEventListener('click', () => {
    setShortcutsOpen(false);
    measureButtonSwitch(() => setAppMode('wireframe'));
  });
  domRefs.modalVolumeSlider?.addEventListener('input', (e) => {
    setMasterVolume(e.target.value);
  });
  domRefs.shortcutsOverlay?.addEventListener('click', (e) => {
    if (e.target.id === 'shortcuts-overlay') setShortcutsOpen(false);
  });

  // Mobile Touch Drive Controls
  const touchMap = {
    throttle: 'forward',
    brake: 'backward',
    left: 'left',
    right: 'right',
    handbrake: 'handbrake',
  };
  document.querySelectorAll('[data-touch-key]').forEach((btn) => {
    const key = touchMap[btn.dataset.touchKey];
    if (!key) return;
    const press = (e) => {
      e.preventDefault();
      audio.unlock?.();
      touchHeld[key] = true;
      btn.classList.add('is-pressed');
    };
    const release = (e) => {
      e.preventDefault();
      touchHeld[key] = false;
      btn.classList.remove('is-pressed');
    };
    btn.addEventListener('pointerdown', press);
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
  });

  renderer.domElement.addEventListener('pointerdown', () => {
    audio.unlock?.();
    cameraDirector.cancelIntro();
  });

  // Full Keyboard Controller
  window.addEventListener('keydown', (e) => {
    const code = e.code;
    const tag = e.target?.tagName;
    const typing = tag === 'INPUT' && e.target.type !== 'range';
    if (typing) return;

    if (code === 'Escape') {
      e.preventDefault();
      if (state.cameraPopoverOpen) {
        setCameraPopoverOpen(false);
        return;
      }
      if (state.audioPopoverOpen) {
        setAudioPopoverOpen(false);
        return;
      }
      if (state.selectedAnnotation && !state.shortcutsOpen) {
        selectAnnotation(null);
        return;
      }
      setShortcutsOpen(!state.shortcutsOpen, state.appMode === 'drive');
      return;
    }

    if (e.key === '?' || (code === 'Slash' && e.shiftKey)) {
      e.preventDefault();
      audio.unlock?.();
      audio.playUiClick?.();
      setShortcutsOpen(!state.shortcutsOpen, state.appMode === 'drive');
      return;
    }

    if (code === 'Tab') {
      e.preventDefault();
      audio.unlock?.();
      audio.playUiClick?.();
      if (state.shortcutsOpen) setShortcutsOpen(false);
      measureButtonSwitch(() =>
        setAppMode(state.appMode === 'drive' ? 'inspect' : 'drive')
      );
      return;
    }

    if (state.shortcutsOpen) return;

    if (
      state.appMode === 'drive' &&
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)
    ) {
      e.preventDefault();
    }

    if (code === 'KeyW' || code === 'ArrowUp') keysHeld.forward = true;
    if (code === 'KeyS' || code === 'ArrowDown') keysHeld.backward = true;
    if (code === 'KeyA' || code === 'ArrowLeft') keysHeld.left = true;
    if (code === 'KeyD' || code === 'ArrowRight') keysHeld.right = true;
    if (code === 'Space') keysHeld.handbrake = true;

    if (!e.repeat) {
      if (code === 'KeyC') {
        audio.unlock?.();
        audio.playUiClick?.();
        cycleCamera();
      } else if (code === 'KeyL') {
        measureButtonSwitch(() => setHeadlights(!state.headlightsOn));
      } else if (code === 'KeyV') {
        measureButtonSwitch(() => setWinchActive(!state.winchActive));
      } else if (code === 'KeyE') {
        measureButtonSwitch(() => setDoorsOpen(!state.doorsOpen));
      } else if (code === 'KeyR') {
        measureButtonSwitch(() => resetVehicle());
      } else if (code === 'KeyF') {
        audio.unlock?.();
        audio.playUiClick?.();
        measureButtonSwitch(() =>
          setAppMode(state.appMode === 'wireframe' ? 'inspect' : 'wireframe')
        );
      } else if (code === 'KeyX' && state.appMode !== 'drive') {
        audio.unlock?.();
        audio.playUiClick?.();
        const nextMode = state.explodeAmount > 0.1 ? 'exterior' : 'exploded';
        measureButtonSwitch(() => setInspectionMode(nextMode));
      }
    }
  });

  window.addEventListener('keyup', (e) => {
    const code = e.code;
    if (code === 'KeyW' || code === 'ArrowUp') keysHeld.forward = false;
    if (code === 'KeyS' || code === 'ArrowDown') keysHeld.backward = false;
    if (code === 'KeyA' || code === 'ArrowLeft') keysHeld.left = false;
    if (code === 'KeyD' || code === 'ArrowRight') keysHeld.right = false;
    if (code === 'Space') keysHeld.handbrake = false;
  });

  window.addEventListener('blur', () => clearInputs());

  // Responsive Resize Handler — caches viewport dimensions & adapts framing cleanly!
  let lastViewportAspect = camera.aspect;
  function handleResize() {
    viewportW = stageWrap.clientWidth || window.innerWidth;
    viewportH = Math.max(1, stageWrap.clientHeight || window.innerHeight);
    annotationHalfWidthsDirty = true;

    const nextAspect = viewportW / viewportH;
    const aspectChanged = Math.abs(nextAspect - lastViewportAspect) > 0.04;
    lastViewportAspect = nextAspect;

    camera.aspect = nextAspect;
    camera.updateProjectionMatrix();
    renderer.setSize(viewportW, viewportH);

    if (
      aspectChanged &&
      state.appMode !== 'drive' &&
      cameraDirector.getMode() === 'orbit' &&
      !cameraDirector.userDragging
    ) {
      if (state.inspectionMode !== 'exterior' && INSPECTION_CAMERA_MAP[state.inspectionMode]) {
        const preset = INSPECTION_CAMERA_MAP[state.inspectionMode];
        cameraDirector.setPresetTarget(preset.pos, preset.lookAt, preset.fov, {
          preserveOrbit: true,
          aspectAdapt: true,
          immediate: true,
        });
      } else {
        cameraDirector.setStudioViewpoint(cameraDirector.getStudioViewpointId(), {
          immediate: true,
        });
      }
    }

    if (state.annotationsVisible) {
      updateAnnotationsOverlay();
    }
  }
  window.addEventListener('resize', handleResize);

  // ==========================================================================
  // DRIVING TELEMETRY HUD UPDATER (Diff-guarded for zero redundant DOM writes!)
  // ==========================================================================

  const hudSpeedEl = document.getElementById('hud-speed');
  const hudGearEl = document.getElementById('hud-gear');
  const hudSurfaceEl = document.getElementById('hud-surface');
  const hudRpmFill = document.getElementById('hud-rpm-fill');
  const hudBrakeLamp = document.getElementById('hud-lamp-brake');
  const hudHbLamp = document.getElementById('hud-lamp-hb');
  const wheelBars = Array.from({ length: 6 }, (_, i) =>
    document.querySelector(`[data-wheel-bar="${i}"]`)
  );
  const wheelCols = Array.from({ length: 6 }, (_, i) =>
    document.querySelector(`[data-wheel-col="${i}"]`)
  );

  const hudCache = {
    speed: '',
    gear: '',
    surface: '',
    rpmPct: -1,
    braking: null,
    handbrake: null,
    wheelHeight: [-1, -1, -1, -1, -1, -1],
    wheelHeavy: [null, null, null, null, null, null],
    wheelAir: [null, null, null, null, null, null],
  };

  function updateDrivingHUD(pState) {
    if (state.appMode !== 'drive' || !pState) return;

    const speedStr = String(Math.round(Math.abs(pState.speedKmh || 0))).padStart(2, '0');
    if (speedStr !== hudCache.speed && hudSpeedEl) {
      hudSpeedEl.textContent = speedStr;
      hudCache.speed = speedStr;
    }

    const gearStr = String(pState.gear || 'N');
    if (gearStr !== hudCache.gear && hudGearEl) {
      hudGearEl.textContent = gearStr;
      hudCache.gear = gearStr;
    }

    const surfaceStr = String(pState.surface || 'CONCRETE').toUpperCase();
    if (surfaceStr !== hudCache.surface && hudSurfaceEl) {
      hudSurfaceEl.textContent = surfaceStr;
      hudCache.surface = surfaceStr;
    }

    const rpmPct = Math.round(THREE.MathUtils.clamp((pState.rpmNorm || 0.15) * 100, 8, 100));
    if (rpmPct !== hudCache.rpmPct && hudRpmFill) {
      hudRpmFill.style.width = `${rpmPct}%`;
      hudCache.rpmPct = rpmPct;
    }

    const isBraking = Boolean(pState.braking);
    if (isBraking !== hudCache.braking) {
      hudBrakeLamp?.classList.toggle('is-lit-red', isBraking);
      hudCache.braking = isBraking;
    }

    const isHb = Boolean(pState.handbrake);
    if (isHb !== hudCache.handbrake) {
      hudHbLamp?.classList.toggle('is-lit-amber', isHb);
      hudCache.handbrake = isHb;
    }

    const wheels = pState.wheelStates || [];
    for (let i = 0; i < 6; i++) {
      const w = wheels[i];
      const bar = wheelBars[i];
      const col = wheelCols[i];
      if (!w || !bar) continue;
      const norm = Number.isFinite(w.compressionNorm)
        ? THREE.MathUtils.clamp(w.compressionNorm, 0, 1)
        : THREE.MathUtils.clamp((w.compressionOffset + 0.34) / 0.56, 0, 1);
      const heightPct = w.grounded ? Math.round(16 + norm * 84) : 8;
      if (heightPct !== hudCache.wheelHeight[i]) {
        bar.style.height = `${heightPct}%`;
        hudCache.wheelHeight[i] = heightPct;
      }
      const isHeavy = norm > 0.72;
      if (isHeavy !== hudCache.wheelHeavy[i]) {
        bar.classList.toggle('is-heavy', isHeavy);
        hudCache.wheelHeavy[i] = isHeavy;
      }
      const isAir = !w.grounded;
      if (isAir !== hudCache.wheelAir[i]) {
        col?.classList.toggle('is-airborne', isAir);
        hudCache.wheelAir[i] = isAir;
      }
    }
  }

  // ==========================================================================
  // LIVE WINCH TELEMETRY, PHYSICS ANCHOR & AUDIO SYNCHRONIZATION
  // ==========================================================================

  const _winchAudioParams = {
    active: false,
    speedNorm: 0,
    tensionNorm: 0,
    phase: 'stowed',
  };

  function syncWinchRuntime(dt) {
    const rigState = truckRig.getState?.();
    const phase = rigState?.winchPhase || (state.winchActive ? 'deploying' : 'stowed');
    const rigActive =
      typeof rigState?.winchActive === 'boolean' ? rigState.winchActive : state.winchActive;
    const anchorWorld =
      state.appMode === 'drive' ? (rigState?.winchAnchorWorld || null) : null;

    // 1. Feed live recovery anchor point into 6x6 vehicle physics
    if (state.appMode === 'drive') {
      physics.setWinchAnchor?.(anchorWorld);
    }

    // 2. Drive realistic electric planetary-gear winch motor & drum ratchet audio
    _winchAudioParams.active = phase !== 'stowed';
    _winchAudioParams.speedNorm = Number(rigState?.winchDrumSpeedNorm) || 0;
    _winchAudioParams.tensionNorm = Number(rigState?.winchTensionNorm) || 0;
    _winchAudioParams.phase = phase;
    audio.updateWinchAudio?.(dt, _winchAudioParams);

    // 3. Detect phase & auto-stow transitions -> update LED/label & show non-intrusive toast
    const phaseChanged = phase !== lastWinchPhase;
    const activeChanged = rigActive !== lastWinchActiveUI;

    if (activeChanged) {
      state.winchActive = rigActive;
      lastWinchActiveUI = rigActive;
    }

    if (phaseChanged) {
      const prevPhase = lastWinchPhase;
      state.winchPhase = phase;
      lastWinchPhase = phase;

      if (!suppressNextWinchToast) {
        if (phase === 'anchored' && prevPhase !== 'anchored') {
          showToast('WINCH ANCHORED — REELING RECOVERY PULL');
        } else if (phase === 'stowed' && prevPhase !== 'stowed') {
          showToast('WINCH STOWED');
        }
      } else if (phase === 'stowed') {
        suppressNextWinchToast = false;
      }
    }

    if (phaseChanged || activeChanged) {
      syncWinchButtonsUI(phase, state.winchActive);
    }

    return phase !== 'stowed';
  }

  // ==========================================================================
  // MAIN ANIMATION LOOP (Zero per-frame allocations & zero layout thrashing!)
  // ==========================================================================

  let lastTime = performance.now();
  let fpsAccum = 0;
  let fpsFrames = 0;

  const _driveInputScratch = {
    forward: 0,
    backward: 0,
    left: 0,
    right: 0,
    handbrake: false,
  };

  const _studioCamState = {
    position: _originPos,
    quaternion: _zeroQuat,
    speedMs: 0,
    steerAngle: 0,
    winchActive: false,
  };

  const _driveCamState = {
    position: _originPos,
    quaternion: _zeroQuat,
    speedMs: 0,
    steerAngle: 0,
    winchActive: false,
  };

  const _studioAudioState = {
    drivingActive: false,
    speed: 0,
    throttle: 0,
    rpmNorm: 0.14,
  };

  const _driveAudioState = {
    speed: 0,
    throttle: 0,
    rpmNorm: 0.16,
    braking: false,
    suspensionImpulse: 0,
    onGround: true,
    surface: 'gravel',
    drivingActive: true,
  };

  function getMergedDriveInputs() {
    _driveInputScratch.forward =
      scriptOverrideInputs.forward !== null
        ? scriptOverrideInputs.forward
        : keysHeld.forward || touchHeld.forward
        ? 1
        : 0;
    _driveInputScratch.backward =
      scriptOverrideInputs.backward !== null
        ? scriptOverrideInputs.backward
        : keysHeld.backward || touchHeld.backward
        ? 1
        : 0;
    _driveInputScratch.left =
      scriptOverrideInputs.left !== null
        ? scriptOverrideInputs.left
        : keysHeld.left || touchHeld.left
        ? 1
        : 0;
    _driveInputScratch.right =
      scriptOverrideInputs.right !== null
        ? scriptOverrideInputs.right
        : keysHeld.right || touchHeld.right
        ? 1
        : 0;
    _driveInputScratch.handbrake =
      scriptOverrideInputs.handbrake !== null
        ? Boolean(scriptOverrideInputs.handbrake)
        : Boolean(keysHeld.handbrake || touchHeld.handbrake);
    return _driveInputScratch;
  }

  // ==========================================================================
  // DEMAND-DRIVEN SHADOWS & SMART STUDIO IDLE SLEEP (0% Idle GPU Saturation!)
  // ==========================================================================

  let _lastRenderedCamPos = new THREE.Vector3(999, 999, 999);
  let _lastRenderedCamQuat = new THREE.Quaternion();
  let _lastRenderedFov = -1;
  let _lastRenderedAppMode = '';
  let _lastRenderedLayer = '';
  let _lastRenderedWireStyle = '';

  // Wake instantaneously on any pointer, scroll-zoom, touch, keyboard, click, or resize gesture
  window.addEventListener('pointerdown', () => wakeRenderer(false, 900), { passive: true });
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.buttons > 0) wakeRenderer(false, 800);
    },
    { passive: true }
  );
  window.addEventListener('wheel', () => wakeRenderer(false, 900), { passive: true });
  window.addEventListener('touchstart', () => wakeRenderer(false, 1000), { passive: true });
  window.addEventListener('touchmove', () => wakeRenderer(false, 900), { passive: true });
  window.addEventListener('keydown', () => wakeRenderer(true, 900), { passive: true });
  window.addEventListener('click', () => wakeRenderer(true, 900), { passive: true });
  window.addEventListener('input', () => wakeRenderer(true, 900), { passive: true });
  window.addEventListener('resize', () => wakeRenderer(false, 900), { passive: true });

  function animate(now) {
    requestAnimationFrame(animate);

    const elapsedSec = Math.max(0.001, (now - lastTime) * 0.001);
    const rawDt = Math.min(elapsedSec, 0.05);
    const envDt = Math.min(elapsedSec, 0.25);
    lastTime = now;
    const dt = state.paused ? 0 : rawDt;

    const isDriving = state.appMode === 'drive';
    const hasSelection = Boolean(state.selectedAnnotation || truckRig.focusedSubsystem);
    const rigAnimating = Boolean(truckRig.isAnimating?.());

    // 1. Mode-specific simulation, lighting & recovery winch updates
    let activeTruckState = _studioCamState;

    if (state.appMode === 'inspect' || state.appMode === 'wireframe') {
      truckRig.update?.(dt);
      const winchEngaged = syncWinchRuntime(dt);
      _studioCamState.winchActive = winchEngaged;
      audio.update?.(dt, _studioAudioState);
    } else if (isDriving) {
      const inputs = getMergedDriveInputs();
      const pState = state.paused
        ? physics.getState()
        : physics.step(dt, inputs, 'offroad');

      truckRig.applyPhysicsState?.(pState, dt);
      truckRig.update?.(dt);
      const winchEngaged = syncWinchRuntime(dt);

      _driveCamState.position = pState.position || _originPos;
      _driveCamState.quaternion = pState.quaternion || _zeroQuat;
      _driveCamState.speedMs = pState.speedMs || 0;
      _driveCamState.steerAngle = pState.steerAngle || 0;
      _driveCamState.winchActive = winchEngaged;
      activeTruckState = _driveCamState;

      if (tslUniforms.uTruckPos && pState.position) {
        tslUniforms.uTruckPos.value.copy(pState.position);
      }

      dustSystem?.update?.(dt, pState.wheelStates, pState.speedMs, camera);

      _driveAudioState.speed = Math.abs(pState.speedMs || 0);
      _driveAudioState.throttle = pState.throttle || 0;
      _driveAudioState.rpmNorm = pState.rpmNorm || 0.16;
      _driveAudioState.braking = Boolean(pState.braking || pState.handbrake);
      _driveAudioState.suspensionImpulse = pState.maxSuspImpulse || pState.suspensionImpulse || 0;
      _driveAudioState.onGround = (pState.groundedCount ?? 6) > 0;
      _driveAudioState.surface = pState.surface || 'gravel';
      _driveAudioState.drivingActive = !state.paused;
      audio.update?.(dt, _driveAudioState);

      updateDrivingHUD(pState);
    }

    // 2. Environment, studio blueprint theme blend & lighting atmosphere
    const tp = activeTruckState.position || _originPos;
    envController?.update?.(envDt, tp);
    const blend = envController?.getModeBlend ? envController.getModeBlend() : state.envBlend;
    const blendMoving = Math.abs(blend - state.envBlend) > 1e-4 || (blend > 0.002 && blend < 0.998);
    state.envBlend = blend;

    const targetBlueprint =
      state.appMode === 'wireframe' && state.studioTheme === 'blueprint' ? 1.0 : 0.0;
    const prevBlueprint = state.blueprintBlend;
    if (envController?.getStudioThemeBlend) {
      state.blueprintBlend = envController.getStudioThemeBlend();
    } else {
      const bpRate = 1 - Math.exp(-envDt * 9.0);
      state.blueprintBlend += (targetBlueprint - state.blueprintBlend) * bpRate;
      if (Math.abs(targetBlueprint - state.blueprintBlend) < 0.002) {
        state.blueprintBlend = targetBlueprint;
      }
    }
    const blueprintMoving = Math.abs(state.blueprintBlend - prevBlueprint) > 1e-4;

    cameraDirector.update(rawDt, activeTruckState);

    const camMoved =
      _lastRenderedCamPos.distanceToSquared(camera.position) > 1e-7 ||
      1.0 - Math.abs(_lastRenderedCamQuat.dot(camera.quaternion)) > 1e-7 ||
      Math.abs(_lastRenderedFov - camera.fov) > 0.002;
    const stateChanged =
      _lastRenderedAppMode !== state.appMode ||
      _lastRenderedLayer !== state.inspectionMode ||
      _lastRenderedWireStyle !== state.wireframeStyle;

    // Skip redundant 3D render passes when Studio/Wireframe is 100% static (keeps GPU & clicks instantaneous!)
    const mustRender =
      isDriving ||
      rigAnimating ||
      camMoved ||
      stateChanged ||
      blendMoving ||
      blueprintMoving ||
      hasSelection ||
      shadowDirty ||
      now < idleWakeUntil;

    if (!mustRender) {
      return;
    }

    fpsAccum += rawDt;
    fpsFrames++;
    if (fpsAccum >= 0.5) {
      state.fps = Math.round(fpsFrames / fpsAccum);
      fpsAccum = 0;
      fpsFrames = 0;
      // Gentle adaptive DPR governor during active Drive mode so frame pacing stays silky
      if (isDriving && !state.paused) {
        if (state.fps < 36) {
          lowFpsStreak++;
          if (lowFpsStreak >= 2 && dynamicDprScale > 0.72) {
            dynamicDprScale = Math.max(0.72, dynamicDprScale - 0.14);
            renderer.setPixelRatio(getDprForQuality(state.quality, dynamicDprScale));
            lowFpsStreak = 0;
          }
        } else {
          lowFpsStreak = 0;
        }
      }
    }

    if (tslUniforms.uTime) tslUniforms.uTime.value += dt;
    if (tslUniforms.uHighlightPulse) {
      tslUniforms.uHighlightPulse.value = hasSelection
        ? 0.5 + 0.5 * Math.sin((tslUniforms.uTime?.value || 0) * 2.4)
        : 0.0;
    }

    // 3. Key shadow camera & demand-driven shadow update
    // IMPORTANT: Keep `keyLight.castShadow`, `fillLight.visible`, `rimLight.visible` ALWAYS `true`
    // so Three.js WebGPU/WebGL2 active light/shadow count NEVER changes (zero shader recompiles!).
    const activeWireShadowless =
      state.appMode === 'wireframe' &&
      (state.wireframeStyle === 'wire_blueprint' || state.wireframeStyle === 'wire_mesh');

    updateKeyLightShadowCamera(tp, isDriving, state.explodeAmount);
    if (
      !activeWireShadowless &&
      (isDriving || shadowDirty || stateChanged || truckRig.hasGeometryMotion?.())
    ) {
      renderer.shadowMap.needsUpdate = true;
      shadowDirty = false;
    }

    _tmpStudioBg.lerpColors(STUDIO_BG_ALABASTER, STUDIO_BG_BLUEPRINT, state.blueprintBlend);
    _tmpBgColor.lerpColors(_tmpStudioBg, OFFROAD_BG_COLOR, blend);
    scene.background.copy(_tmpBgColor);

    // Balanced clean white studio illumination (keep Blueprint X-Ray attenuated & Off-Road Drive untouched!)
    const studioEnvInt = THREE.MathUtils.lerp(0.78, 0.08, state.blueprintBlend);
    const studioHemi = THREE.MathUtils.lerp(0.90, 0.16, state.blueprintBlend);
    const studioKey = THREE.MathUtils.lerp(2.38, 0.30, state.blueprintBlend);
    const studioFill = THREE.MathUtils.lerp(0.74, 0.0, state.blueprintBlend);
    const studioRim = THREE.MathUtils.lerp(0.62, 0.0, state.blueprintBlend);
    const studioExposure = THREE.MathUtils.lerp(1.03, 1.02, state.blueprintBlend);

    scene.environmentIntensity = THREE.MathUtils.lerp(studioEnvInt, 0.78, blend);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(studioExposure, 1.0, blend);
    hemiLight.intensity = THREE.MathUtils.lerp(studioHemi, 1.02, blend);
    keyLight.intensity = THREE.MathUtils.lerp(studioKey, 2.75, blend);
    fillLight.intensity = THREE.MathUtils.lerp(studioFill, 0.72, blend);
    rimLight.intensity = THREE.MathUtils.lerp(studioRim, 0.58, blend);

    if (tslUniforms.uCamWorldPos) {
      tslUniforms.uCamWorldPos.value.copy(camera.position);
    }

    // 4. Render frame & project technical annotations (no-op when Callouts hidden!)
    renderer.render(scene, camera);
    updateAnnotationsOverlay();

    _lastRenderedCamPos.copy(camera.position);
    _lastRenderedCamQuat.copy(camera.quaternion);
    _lastRenderedFov = camera.fov;
    _lastRenderedAppMode = state.appMode;
    _lastRenderedLayer = state.inspectionMode;
    _lastRenderedWireStyle = state.wireframeStyle;
  }

  // ==========================================================================
  // DEFERRED BACKGROUND IDLE WARM-UP (Runs AFTER First Hero Frame Renders!)
  // ==========================================================================

  function scheduleBackgroundWarmup() {
    const runIdleStep = (fn) =>
      new Promise((resolve) => {
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(
            () => {
              Promise.resolve(fn()).then(resolve, resolve);
            },
            { timeout: 120 }
          );
        } else {
          setTimeout(() => {
            Promise.resolve(fn()).then(resolve, resolve);
          }, 16);
        }
      });

    (async () => {
      // 1. Pre-compile all 16 shared Wireframe / Cutaway Ghost / Line materials in ONE tiny off-screen batch
      //    so first click on Wireframe, Blueprint X-Ray, Pure Mesh, Chassis, or Exploded is INSTANT!
      await runIdleStep(async () => {
        if (typeof renderer.compileAsync !== 'function') return;
        const poolMats = tslController?.getWarmupMaterials?.() || [];
        if (poolMats.length === 0) return;

        const warmupGroup = new THREE.Group();
        warmupGroup.name = '__ShaderWarmupBatch__';
        const triGeo = new THREE.BufferGeometry();
        triGeo.setAttribute(
          'position',
          new THREE.Float32BufferAttribute([0, 0, 0, 0.001, 0, 0, 0, 0.001, 0], 3)
        );
        triGeo.setAttribute('normal', new THREE.Float32BufferAttribute([0, 1, 0, 0, 1, 0, 0, 1, 0], 3));
        triGeo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2));

        for (let i = 0; i < poolMats.length; i++) {
          const m = new THREE.Mesh(triGeo, poolMats[i]);
          m.position.set(0, -120, 0);
          m.frustumCulled = false;
          warmupGroup.add(m);
        }

        const lineGeo = new THREE.BufferGeometry();
        lineGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, -120, 0, 0.001, -120, 0], 3));
        const lineMat = new THREE.LineBasicMaterial({ color: 0x0d8ce0, transparent: true, opacity: 0.8 });
        const lineObj = new THREE.LineSegments(lineGeo, lineMat);
        lineObj.frustumCulled = false;
        warmupGroup.add(lineObj);

        scene.add(warmupGroup);
        try {
          await renderer.compileAsync(warmupGroup, camera, scene);
        } catch {
          try {
            await renderer.compileAsync(scene, camera);
          } catch {}
        }
        scene.remove(warmupGroup);
        triGeo.dispose();
        lineGeo.dispose();
        lineMat.dispose();
      });

      // 2. Pre-build CAD Wireframe EdgesGeometry incrementally (4.0ms/frame budget)
      await runIdleStep(async () => {
        if (typeof tslController?.prebuildWireframeEdgesAsync === 'function') {
          await tslController.prebuildWireframeEdgesAsync(4.0);
        }
        perfMetrics.wireframeEdgesReady = Boolean(
          tslController?.isWireframeEdgesReady?.() ?? true
        );
      });

      // 3. Pre-build Off-Road Proving Ground incrementally (4.5ms/frame budget) & pre-compile its shaders!
      await runIdleStep(async () => {
        if (typeof envController?.prebuildOffroadAsync === 'function') {
          await envController.prebuildOffroadAsync(4.5);
        }
        perfMetrics.offroadReady = Boolean(envController?.isOffroadBuilt?.() ?? true);

        if (
          typeof renderer.compileAsync === 'function' &&
          envController?.offroadGroup &&
          state.appMode !== 'drive'
        ) {
          const og = envController.offroadGroup;
          const prevVis = og.visible;
          og.visible = true;
          try {
            await renderer.compileAsync(og, camera, scene);
          } catch {}
          og.visible = prevVis;
        }
      });

      // 4. Pre-allocate Off-Road Dust Particle System
      await runIdleStep(() => {
        ensureDustSystem();
      });
    })().catch((err) => {
      console.warn('[TITAN] Background warm-up note:', err);
    });
  }

  function getPerfSnapshot() {
    const offroadReady = Boolean(
      envController?.isOffroadBuilt?.() ?? perfMetrics.offroadReady
    );
    const wireframeEdgesReady = Boolean(
      tslController?.isWireframeEdgesReady?.() ?? perfMetrics.wireframeEdgesReady
    );
    perfMetrics.offroadReady = offroadReady;
    perfMetrics.wireframeEdgesReady = wireframeEdgesReady;

    return {
      loadMs: perfMetrics.loadMs,
      bootstrapMs: perfMetrics.bootstrapMs,
      lastButtonSwitchMs: perfMetrics.lastButtonSwitchMs,
      maxButtonSwitchMs: perfMetrics.maxButtonSwitchMs,
      offroadReady,
      wireframeEdgesReady,
      offroadEnvReady: Boolean(envMap?.isOffroadEnvReady?.() ?? false),
      materialPool: tslController?.getMaterialPoolStats?.() || null,
    };
  }

  // ==========================================================================
  // PUBLIC AUTOMATION & VERIFICATION API (`window.__TITAN_APP__`)
  // ==========================================================================

  window.__TITAN_APP__ = {
    get ready() {
      return state.ready;
    },
    getMode: () => state.appMode,
    setAppMode: (m, opts) => measureButtonSwitch(() => setAppMode(m, opts)),
    getWireframeStyle: () => state.wireframeStyle,
    setWireframeStyle: (s, opts) => measureButtonSwitch(() => setWireframeStyle(s, opts)),
    getInspectionMode: () => state.inspectionMode,
    setInspectionMode: (m, opts) => measureButtonSwitch(() => setInspectionMode(m, opts)),
    setExplode: (v, opts) => setExplodeAmount(v, opts),
    setExplodeAmount: (v, opts) => setExplodeAmount(v, opts),
    setCameraMode: (m, opts) => measureButtonSwitch(() => setCameraMode(m, opts)),
    getCameraMode: () =>
      state.appMode === 'drive'
        ? cameraDirector.getMode()
        : cameraDirector.getStudioViewpointId(),
    cycleCamera: () => cycleCamera(),
    getCameraModes: () =>
      state.appMode === 'drive'
        ? CAMERA_MODES.map((c) => c.id)
        : STUDIO_VIEWPOINTS.map((v) => v.id),
    toggleDoors: () => measureButtonSwitch(() => setDoorsOpen(!state.doorsOpen)),
    setDoorsOpen: (v) => measureButtonSwitch(() => setDoorsOpen(v)),
    toggleHatches: () => measureButtonSwitch(() => setHatchesOpen(!state.hatchesOpen)),
    setHatchesOpen: (v) => measureButtonSwitch(() => setHatchesOpen(v)),
    toggleHeadlights: () => measureButtonSwitch(() => setHeadlights(!state.headlightsOn)),
    setHeadlights: (v) => measureButtonSwitch(() => setHeadlights(v)),
    toggleWinch: () => measureButtonSwitch(() => setWinchActive(!state.winchActive)),
    setWinchActive: (v) => measureButtonSwitch(() => setWinchActive(v)),
    toggleAnnotations: () =>
      measureButtonSwitch(() => setAnnotationsVisible(!state.annotationsVisible)),
    setAnnotationsVisible: (v) =>
      measureButtonSwitch(() => setAnnotationsVisible(v, { silent: true })),
    focusAnnotation: (id) => selectAnnotation(id),
    selectAnnotation: (id) => selectAnnotation(id),
    resetVehicle: (pos, yaw) => resetVehicle(pos, yaw),
    setDriveInputs: (partial = {}) => {
      for (const k of Object.keys(scriptOverrideInputs)) {
        if (k in partial) scriptOverrideInputs[k] = partial[k];
      }
    },
    clearDriveInputs: () => clearInputs(),
    setPaused: (v) => setPaused(v),
    setShortcutsOpen: (v) => setShortcutsOpen(v, false),
    setQuality: (q) => measureButtonSwitch(() => setQuality(q)),
    getGeometryStats: () => tslController?.getGeometryStats?.() || null,
    getPerfMetrics: () => getPerfSnapshot(),
    getState: () => ({
      ready: state.ready,
      appMode: state.appMode,
      wireframeStyle: state.wireframeStyle,
      renderStyle: tslController?.getRenderStyle?.() || 'pbr',
      studioTheme: state.studioTheme,
      envMode: state.envMode,
      inspectionMode: state.inspectionMode,
      explodeAmount: state.explodeAmount,
      cameraMode: cameraDirector.getMode(),
      studioViewpoint: cameraDirector.getStudioViewpointId(),
      cameraPosition: camera.position.toArray(),
      cameraTarget: cameraDirector.currentLookAt.toArray(),
      paused: state.paused,
      shortcutsOpen: state.shortcutsOpen,
      quality: state.quality,
      rendererBackend: state.backend,
      fps: state.fps,
      selectedAnnotation: state.selectedAnnotation,
      annotationsVisible: state.annotationsVisible,
      doorsOpen: state.doorsOpen,
      hatchesOpen: state.hatchesOpen,
      headlightsOn: state.headlightsOn,
      winchActive: state.winchActive,
      winchPhase: state.winchPhase,
      perfMetrics: getPerfSnapshot(),
      geometryStats: tslController?.getGeometryStats?.() || null,
      rigState: truckRig.getState?.() || null,
      physicsState: physics.getState?.() || null,
    }),
  };

  // Initialize lightweight UI state (Annotation DOM deferred until Callouts toggled!)
  rebuildCameraPopover(true);
  updateCadTelemetry();
  syncMechanicalButtonsUI();
  syncInspectionButtonsUI();
  syncWireframeStyleButtonsUI();

  // Render first Hero frame immediately, record loadMs, dismiss loader veil, start loop!
  setLoader(100, 'Ready.');
  renderer.render(scene, camera);
  perfMetrics.loadMs = Number(performance.now().toFixed(1));
  perfMetrics.bootstrapMs = Number((performance.now() - bootstrapStartMs).toFixed(1));
  state.ready = true;

  requestAnimationFrame(() => {
    loaderOverlay?.classList.add('is-hidden');
    lastTime = performance.now();
    requestAnimationFrame(animate);
    // Launch zero-stall background warm-up AFTER first hero frame paints!
    setTimeout(scheduleBackgroundWarmup, 40);
  });
}

bootstrap().catch((err) => {
  console.error('[TITAN] Bootstrap failed:', err);
  const st = document.getElementById('loader-status');
  if (st) st.textContent = `Startup error: ${err?.message || err}`;
});
