import * as THREE from 'three';
import {
  MeshStandardNodeMaterial,
  MeshPhysicalNodeMaterial,
  MeshBasicNodeMaterial,
  PMREMGenerator,
} from 'three/webgpu';
import {
  Fn,
  uniform,
  attribute,
  uv,
  positionLocal,
  positionWorld,
  normalWorld,
  normalView,
  positionViewDirection,
  texture,
  float,
  vec2,
  vec3,
  sin,
  abs,
  dot,
  mix,
  smoothstep,
  clamp,
  max,
  pow,
  length,
} from 'three/tsl';

// ============================================================================
// WGSL / WebGPU r174 + WebGL2 SAFE MATH & COLOR HELPERS
//   - Zero unary minus on TSL nodes (always .negate() or .mul(-1.0))
//   - Zero exp() TSL import or normalNode overrides
//   - safePow guards against negative/zero bases producing NaN in WGSL
//   - ZERO material.needsUpdate = true / ZERO .transparent/.depthWrite/.wireframe
//     mutations after initialization -> ZERO WebGPU pipeline recompiles!
// ============================================================================

function invSmoothstep(lo, hi, x) {
  return float(1.0).sub(smoothstep(lo, hi, x));
}

function safePow(base, expVal) {
  return pow(max(base, float(0.0001)), float(expVal));
}

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linHex(hex, gain = 1.0) {
  const r = ((hex >> 16) & 255) / 255;
  const g = ((hex >> 8) & 255) / 255;
  const b = (hex & 255) / 255;
  return vec3(
    srgbToLinear(r) * gain,
    srgbToLinear(g) * gain,
    srgbToLinear(b) * gain
  );
}

function evalViewFresnel(powerExp) {
  const nV = normalView.normalize();
  const vV = positionViewDirection.normalize();
  const ndv = clamp(abs(dot(nV, vV)), 0.0, 1.0);
  return safePow(float(1.0).sub(ndv), powerExp);
}

// ============================================================================
// SHARED REACTIVE TSL UNIFORMS FOR TITAN 6X6
// ============================================================================

export function createTSLSharedUniforms() {
  return {
    uTime: uniform(0.0),
    uModeBlend: uniform(0.0), // 0.0 = architectural studio, 1.0 = alpine proving ground
    uStudioBlueprint: uniform(0.0), // 0.0 = alabaster studio, 1.0 = blueprint CAD studio
    uHeadlights: uniform(0.92), // Legacy alias (0..1)
    uHeadlightRamp: uniform(1.0), // 0..1 smooth LED/HID optical ramp for headlights, tails & markers
    uBraking: uniform(0.0), // 0..1 rear brake lamp surge
    uReverse: uniform(0.0), // 0..1 reverse gear backup lamp activation
    uPowerOn: uniform(1.0), // 0..1 cockpit dashboard & running system power
    uSpeed: uniform(0.0), // m/s forward speed
    uDustIntensity: uniform(0.0), // 0..1 dynamic tire/lower-body dust buildup
    uHighlightPulse: uniform(0.0), // 0..1 global inspection pulse modulation
    uElectricalPulse: uniform(0.0), // 0..1 electrical inspection HV conduit glow
    uSunDir: uniform(new THREE.Vector3(0.56, 0.72, 0.41).normalize()),
    uCamWorldPos: uniform(new THREE.Vector3(8.65, 2.55, 14.95)),
    uTruckPos: uniform(new THREE.Vector3(0.0, 0.0, 0.0)),
  };
}

// ============================================================================
// PROCEDURAL ARCHITECTURAL STUDIO & ALPINE PROVING-GROUND IBL ENVIRONMENTS
//   - Only Studio PMREM is generated synchronously on initial startup!
//   - Offroad PMREM is deferred lazily via `prebuildOffroadEnv()` / `getForMode('offroad')`.
// ============================================================================

function buildEquirectEnvironmentTexture(preset = 'studio') {
  const W = 256;
  const H = 128;
  const data = new Uint8Array(W * H * 4);
  const dir = new THREE.Vector3();

  const mix3 = (a, b, t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
  const ss = (e0, e1, x) => {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  };

  const sunDir = new THREE.Vector3(0.56, 0.68, 0.47).normalize();
  const rimDir = new THREE.Vector3(-0.74, 0.42, -0.52).normalize();
  const fillDir = new THREE.Vector3(-0.35, 0.28, 0.89).normalize();

  for (let py = 0; py < H; py++) {
    const v = 1.0 - py / (H - 1);
    const theta = (1.0 - v) * Math.PI;
    const sinT = Math.sin(theta);
    const cosT = Math.cos(theta);

    for (let px = 0; px < W; px++) {
      const u = px / W;
      const phi = (u - 0.5) * Math.PI * 2.0;
      dir.set(sinT * Math.cos(phi), cosT, sinT * Math.sin(phi));

      let rgb;
      if (preset === 'offroad') {
        const skyZen = [108, 146, 186];
        const skyMid = [174, 198, 222];
        const skyHor = [226, 236, 244];
        const gndHor = [132, 138, 144];
        const gndLow = [62, 69, 76];

        if (cosT >= 0.0) {
          rgb = mix3(skyHor, skyMid, ss(0.0, 0.30, cosT));
          rgb = mix3(rgb, skyZen, ss(0.24, 0.85, cosT));
        } else {
          rgb = mix3(gndHor, gndLow, ss(0.0, 0.42, -cosT));
        }

        const sDot = Math.max(0.0, dir.dot(sunDir));
        const sunGlow = Math.pow(sDot, 7.0) * 0.24 + Math.pow(sDot, 42.0) * 0.42;
        rgb = [
          rgb[0] + 255 * sunGlow,
          rgb[1] + 250 * sunGlow,
          rgb[2] + 240 * sunGlow,
        ];
      } else {
        const zen = [220, 226, 234];
        const wall = [166, 176, 188];
        const hor = [224, 229, 236];
        const flr = [148, 156, 166];
        const flrDeep = [104, 112, 122];

        if (cosT >= 0.0) {
          rgb = mix3(hor, wall, ss(0.04, 0.24, cosT));
          rgb = mix3(rgb, zen, ss(0.42, 0.86, cosT));
        } else {
          rgb = mix3(hor, flr, ss(0.0, 0.16, -cosT));
          rgb = mix3(rgb, flrDeep, ss(0.16, 0.72, -cosT));
        }

        const overheadStrip = ss(0.66, 0.86, cosT) * (1.0 - ss(0.22, 0.54, Math.abs(dir.z)));
        const keyCard = Math.pow(Math.max(0.0, dir.dot(sunDir)), 14.0);
        const rimCard = Math.pow(Math.max(0.0, dir.dot(rimDir)), 16.0);
        const fillCard = Math.pow(Math.max(0.0, dir.dot(fillDir)), 10.0);
        const negFlag = (1.0 - ss(0.06, 0.30, Math.abs(cosT - 0.14)))
          * ss(0.32, 0.72, Math.abs(dir.x))
          * 0.34;

        rgb = [
          rgb[0] * (1.0 - negFlag) + overheadStrip * 76 + keyCard * 72 + fillCard * 28 + rimCard * 18,
          rgb[1] * (1.0 - negFlag) + overheadStrip * 80 + keyCard * 72 + fillCard * 30 + rimCard * 36,
          rgb[2] * (1.0 - negFlag) + overheadStrip * 86 + keyCard * 70 + fillCard * 34 + rimCard * 52,
        ];
      }

      const idx = (py * W + px) * 4;
      data[idx + 0] = Math.max(0, Math.min(255, Math.round(rgb[0])));
      data[idx + 1] = Math.max(0, Math.min(255, Math.round(rgb[1])));
      data[idx + 2] = Math.max(0, Math.min(255, Math.round(rgb[2])));
      data[idx + 3] = 255;
    }
  }

  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

function buildPMREMScene(preset = 'studio') {
  const envScene = new THREE.Scene();
  const addCard = (hex, intensity, pos, rot, size) => {
    const c = new THREE.Color(hex).multiplyScalar(intensity);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(size[0], size[1]),
      new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })
    );
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.rotation.set(rot[0], rot[1], rot[2]);
    envScene.add(mesh);
  };

  if (preset === 'offroad') {
    envScene.background = new THREE.Color(0x9fb8d2);
    addCard(0xe4edf6, 1.35, [0, 12, 0], [Math.PI * 0.5, 0, 0], [28, 28]);
    addCard(0xfff9f0, 2.25, [10, 9.5, 8], [0.55, -0.78, 0], [7.5, 7.5]);
    addCard(0xd2e0ee, 1.05, [0, 2.5, -14], [0, 0, 0], [30, 8]);
    addCard(0xc8d8e8, 1.00, [0, 2.5, 14], [0, Math.PI, 0], [30, 8]);
    addCard(0x56606b, 0.85, [0, -6.5, 0], [-Math.PI * 0.5, 0, 0], [32, 32]);
  } else {
    envScene.background = new THREE.Color(0xc5cdd8);
    addCard(0xf8fbff, 1.85, [0, 11.0, 0], [Math.PI * 0.5, 0, 0], [22, 7.5]);
    addCard(0xfefcf8, 1.55, [9.5, 6.2, 8.5], [0.42, -0.82, 0], [9.0, 6.0]);
    addCard(0x9ed4f6, 1.25, [-10.0, 5.2, -7.8], [0.35, 2.25, 0], [8.5, 5.2]);
    addCard(0xe2e9f2, 1.10, [1.5, 3.0, 12.0], [0, Math.PI, 0], [16.0, 6.0]);
    addCard(0x28303b, 0.90, [-12.0, 2.2, 1.5], [0, Math.PI * 0.5, 0], [10.0, 5.5]);
    addCard(0x2e3642, 0.90, [12.0, 1.8, -2.5], [0, -Math.PI * 0.5, 0], [9.5, 5.0]);
    addCard(0xb8c2ce, 0.95, [0, -6.0, 0], [-Math.PI * 0.5, 0, 0], [30, 30]);
  }

  return envScene;
}

function generateEnvTexture(renderer, preset) {
  const PMREMClass = PMREMGenerator || THREE.PMREMGenerator;
  if (renderer && PMREMClass) {
    let pmrem = null;
    try {
      pmrem = new PMREMClass(renderer);
      const envScene = buildPMREMScene(preset);
      // Clamp sigmaRadians <= 0.035 to stay cleanly within Three.js r174 PMREMGenerator's 20-sample budget
      const rt = pmrem.fromScene(envScene, 0.032);
      envScene.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose?.();
          obj.material?.dispose?.();
        }
      });
      pmrem.dispose();
      const tex = rt.texture;
      tex._pmremTarget = rt;
      return tex;
    } catch (err) {
      try { pmrem?.dispose?.(); } catch {}
      console.warn(`[TITAN TSL] PMREM ${preset} fallback to procedural equirectangular map:`, err);
    }
  }
  return buildEquirectEnvironmentTexture(preset);
}

/**
 * Generates the architectural Studio IBL immediately (< 1 PMREM pass on startup) and defers
 * the Alpine Off-Road PMREM lazily until `prebuildOffroadEnv()` or `getForMode('offroad')`.
 */
export function createStudioEnvironment(renderer) {
  const studioTex = generateEnvTexture(renderer, 'studio');
  let offroadTex = null;

  const prebuildOffroadEnv = () => {
    if (!offroadTex) {
      offroadTex = generateEnvTexture(renderer, 'offroad');
      studioTex.offroad = offroadTex;
    }
    return offroadTex;
  };

  studioTex.studio = studioTex;
  studioTex.offroad = null;
  studioTex.prebuildOffroadEnv = prebuildOffroadEnv;
  studioTex.prebuildOffroad = prebuildOffroadEnv;
  studioTex.ensureOffroad = prebuildOffroadEnv;
  studioTex.isOffroadEnvReady = () => Boolean(offroadTex);
  studioTex.getForMode = (mode) => (mode === 'offroad' ? prebuildOffroadEnv() : studioTex);
  studioTex.disposeAll = () => {
    try {
      studioTex._pmremTarget?.dispose?.();
      studioTex.dispose?.();
    } catch {}
    if (offroadTex) {
      try {
        offroadTex._pmremTarget?.dispose?.();
        offroadTex.dispose?.();
      } catch {}
      offroadTex = null;
      studioTex.offroad = null;
    }
  };

  return studioTex;
}

export function createProvingGroundEnvironment(renderer) {
  return generateEnvTexture(renderer, 'offroad');
}

// ============================================================================
// VOLUMETRIC OPTICAL HEADLIGHT CONE MATERIAL (ZERO HARD EDGES, ADDITIVE TSL)
//   - Standard ConeGeometry / CylinderGeometry(rSmall, rBig) UV convention:
//     uv.y = 1.0 at lamp bezel, uv.y = 0.0 at far tip (set nearAtTop: false if inverted).
//   - Auto-modulates smoothly with `uniforms.uHeadlightRamp` (ZERO recompile!).
//   - Exposes `mat.userData.uBeamOpacity` uniform for live per-beam intensity trim.
// ============================================================================

export function createVolumetricBeamMaterial(uniforms, colorHex = 0xc8f0ff, options = {}) {
  const {
    opacity = 0.22,
    nearAtTop = true,
    fresnelPower = 2.15,
    axialPower = 1.75,
    side = THREE.FrontSide,
    name = 'Titan_VolumetricHeadlightBeam_TSL',
  } = options || {};

  const uBeamOpacity = uniform(opacity);
  const uHeadlightRamp = uniforms?.uHeadlightRamp || uniform(1.0);
  const uModeBlend = uniforms?.uModeBlend || uniform(0.0);

  const mat = new MeshBasicNodeMaterial({
    name,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side,
    fog: false,
    toneMapped: false,
  });

  const beamCol = linHex(colorHex, 1.0);

  mat.colorNode = Fn(() => {
    const vCoord = nearAtTop ? uv().y : float(1.0).sub(uv().y);
    const hotCore = linHex(0xf4fcff, 1.0);
    return mix(beamCol, hotCore, smoothstep(0.62, 1.0, vCoord).mul(0.45));
  })();

  mat.opacityNode = Fn(() => {
    const nV = normalView.normalize();
    const vV = positionViewDirection.normalize();
    const ndv = clamp(abs(dot(nV, vV)), 0.0, 1.0);

    // Smooth volumetric cylinder/cone silhouette falloff -> ZERO hard geometric edges
    const edgeSoft = safePow(ndv, fresnelPower);

    // Smooth axial decay from lamp bezel (vCoord = 1) to far tip (vCoord = 0)
    const vCoord = nearAtTop ? uv().y : float(1.0).sub(uv().y);
    const farFade = safePow(smoothstep(0.0, 0.94, vCoord), axialPower);
    const nearFeather = invSmoothstep(0.94, 1.0, vCoord);
    const axialFade = farFade.mul(nearFeather);

    const hl = clamp(uHeadlightRamp, 0.0, 1.0);
    const ramp = safePow(hl, 1.15).mul(smoothstep(0.0, 0.04, hl));
    const envBoost = mix(float(0.92), float(1.18), clamp(uModeBlend, 0.0, 1.0));

    return clamp(edgeSoft.mul(axialFade).mul(ramp).mul(uBeamOpacity).mul(envBoost), 0.0, 0.85);
  })();

  mat.userData.uBeamOpacity = uBeamOpacity;
  return mat;
}

// ============================================================================
// SUBSYSTEM GROUP MAPPING FOR PER-ASSEMBLY CUTAWAY & SELECTION HIGHLIGHTS
// ============================================================================

const SUBSYSTEM_ALIAS_MAP = {
  // 8 canonical engineering callout IDs
  body: ['RearBody', 'EquipmentHatches'],
  chassis: ['Chassis'],
  drivetrain: ['Drivetrain', 'Axles', 'Wheels'],
  suspension: ['SuspensionAssemblies', 'SteeringSystem', 'Axles'],
  powertrain: ['Powertrain'],
  cabin: ['CabinShell', 'CabinInterior', 'Doors'],
  recovery: ['FrontBumper', 'Tusks'],
  comms: ['RooftopEquipment'],
  // Extended mode aliases
  electrical: ['Powertrain', 'Lights', 'RooftopEquipment'],
  rearbody: ['RearBody'],
  equipmenthatches: ['EquipmentHatches'],
  hatches: ['EquipmentHatches'],
  cabinshell: ['CabinShell'],
  cabininterior: ['CabinInterior'],
  interior: ['CabinInterior'],
  doors: ['Doors'],
  frontbumper: ['FrontBumper'],
  bumper: ['FrontBumper'],
  tusks: ['Tusks'],
  rooftopequipment: ['RooftopEquipment'],
  rooftop: ['RooftopEquipment'],
  lights: ['Lights'],
  suspensionassemblies: ['SuspensionAssemblies'],
  steeringsystem: ['SteeringSystem'],
  steering: ['SteeringSystem'],
  axles: ['Axles'],
  frontaxle: ['Axles'],
  middleaxle: ['Axles'],
  rearaxle: ['Axles'],
  wheels: ['Wheels'],
};

function classifyMeshGroup(mesh) {
  const chain = [];
  let cur = mesh;
  while (cur) {
    if (cur.name) chain.push(cur.name);
    cur = cur.parent;
  }

  for (const name of chain) {
    const low = name.toLowerCase();
    if (low.includes('equipmenthatches') || low.startsWith('hatch_')) return 'EquipmentHatches';
    if (low === 'doors' || low.startsWith('door_')) return 'Doors';
    if (low.includes('cabininterior') || low.includes('steeringwheel')) return 'CabinInterior';
    if (low.includes('cabinshell')) return 'CabinShell';
    if (low.includes('rearbody')) return 'RearBody';
    if (low.includes('rooftop')) return 'RooftopEquipment';
    if (low.includes('tusk')) return 'Tusks';
    if (low.includes('frontbumper') || low.includes('winchdrum')) return 'FrontBumper';
    if (low === 'lights' || low.startsWith('light_')) return 'Lights';
    if (low.includes('powertrain') || low.includes('coolingfan')) return 'Powertrain';
    if (low.includes('drivetrain') || low.includes('driveshaft')) return 'Drivetrain';
    if (
      low.includes('suspensionassemblies') ||
      low.startsWith('susp_') ||
      low.startsWith('controlarm_') ||
      low.startsWith('spring_') ||
      low.startsWith('damper_')
    ) {
      return 'SuspensionAssemblies';
    }
    if (low.startsWith('wheel_') || low.startsWith('brakecaliper_')) return 'Wheels';
    if (low.includes('steeringsystem') || low.startsWith('steerknuckle_') || low.startsWith('tierod_')) {
      return 'SteeringSystem';
    }
    if (low.includes('frontaxle') || low.includes('middleaxle') || low.includes('rearaxle')) return 'Axles';
    if (low === 'cabin') return 'CabinShell';
    if (low.includes('chassis')) return 'Chassis';
  }
  return 'Other';
}

function classifyMaterialKind(matName) {
  const m = (matName || '').toLowerCase();
  if (m.includes('mat_armor_at08') || m.includes('armor_at08')) return 'armor_at08';
  if (m.includes('mat_hazard_box') || m.includes('hazard_box')) return 'hazard_box';
  if (m.includes('mat_armor_white') || m.includes('armor_white')) return 'armor_white';
  if (m.includes('mat_chassis_blue') || m.includes('chassis_blue')) return 'chassis_blue';
  if (m.includes('mat_rim_blue') || m.includes('rim_blue')) return 'rim_blue';
  if (m.includes('mat_rubber_tire') || m.includes('rubber_tire')) return 'rubber_tire';
  if (m.includes('mat_rubber_hose') || m.includes('rubber_hose')) return 'rubber_hose';
  if (m.includes('mat_glass_windshield') || m.includes('glass_windshield')) return 'glass_windshield';
  if (m.includes('mat_glass_side') || m.includes('glass_side')) return 'glass_side';
  if (m.includes('mat_tusk_ivory') || m.includes('tusk_ivory')) return 'tusk_ivory';
  if (m.includes('mat_emissive_cyan') || m.includes('emissive_cyan')) return 'emissive_cyan';
  if (m.includes('mat_emissive_red') || m.includes('emissive_red')) return 'emissive_red';
  if (m.includes('mat_emissive_amber') || m.includes('emissive_amber')) return 'emissive_amber';
  if (m.includes('mat_dashboard_ui') || m.includes('dashboard_ui')) return 'dashboard_ui';
  if (m.includes('mat_hv_orange') || m.includes('hv_orange')) return 'hv_orange';
  if (m.includes('mat_orange_coil') || m.includes('orange_coil')) return 'orange_coil';
  if (m.includes('mat_orange_accent') || m.includes('orange_accent')) return 'orange_accent';
  if (m.includes('mat_machined_steel') || m.includes('machined_steel')) return 'machined_steel';
  if (m.includes('mat_gunmetal') || m.includes('gunmetal')) return 'gunmetal';
  if (m.includes('mat_dark_steel') || m.includes('dark_steel')) return 'dark_steel';
  if (m.includes('mat_brass_antenna') || m.includes('brass_antenna')) return 'brass_antenna';
  if (m.includes('mat_seat_fabric') || m.includes('seat_fabric')) return 'seat_fabric';
  if (m.includes('mat_interior_graphite') || m.includes('interior_graphite')) return 'interior_graphite';
  return 'generic';
}

function classifyGhostBucket(kind) {
  if (
    kind === 'armor_white' ||
    kind === 'armor_at08' ||
    kind === 'hazard_box' ||
    kind === 'tusk_ivory' ||
    kind === 'glass_windshield' ||
    kind === 'glass_side'
  ) {
    return 'armor';
  }
  if (
    kind === 'chassis_blue' ||
    kind === 'rim_blue' ||
    kind === 'emissive_cyan' ||
    kind === 'dashboard_ui'
  ) {
    return 'chassis';
  }
  if (kind === 'rubber_tire' || kind === 'rubber_hose') {
    return 'tire';
  }
  return 'dark';
}

// ============================================================================
// SHARED CANONICAL PBR TSL MATERIAL BUILDER (~23 MATERIALS ACROSS ENTIRE TRUCK)
//   - Immutable transparency / depthWrite -> ZERO shader recompiles ever!
//   - Realistic automotive lighting channels (uHeadlightRamp, uBraking, uReverse)
// ============================================================================

function buildSharedPBRMaterial(srcMat, kind, uniforms, uElectricalPulse, hasVertexColor) {
  const isArmor = kind === 'armor_white' || kind === 'armor_at08' || kind === 'hazard_box';
  const isBlueMetal = kind === 'chassis_blue' || kind === 'rim_blue';
  const isTire = kind === 'rubber_tire';
  const isHose = kind === 'rubber_hose';
  const isGlass = kind === 'glass_windshield' || kind === 'glass_side';
  const isTusk = kind === 'tusk_ivory';
  const isOrangeMetal = kind === 'orange_accent' || kind === 'orange_coil' || kind === 'hv_orange';
  const isEmissive =
    kind === 'emissive_cyan' ||
    kind === 'emissive_red' ||
    kind === 'emissive_amber' ||
    kind === 'dashboard_ui';

  const srcMap = srcMat?.map || null;
  const srcNormalMap = srcMat?.normalMap || null;
  const srcRoughMap = srcMat?.roughnessMap || null;
  const srcMetalMap = srcMat?.metalnessMap || null;
  const srcEmissiveMap = srcMat?.emissiveMap || null;
  const baseColor = srcMat?.color ? srcMat.color.clone() : new THREE.Color(0.85, 0.87, 0.90);

  let baseRoughness = srcMat?.roughness ?? 0.48;
  let baseMetalness = srcMat?.metalness ?? 0.1;
  let envIntensity = 0.62;
  let usePhysical = false;
  let clearcoat = 0.0;
  let clearcoatRoughness = 0.25;
  let ior = 1.5;

  if (isArmor) {
    baseRoughness = 0.44;
    baseMetalness = 0.04;
    envIntensity = 0.50;
  } else if (isBlueMetal) {
    usePhysical = true;
    baseRoughness = 0.28;
    baseMetalness = 0.36;
    clearcoat = 0.48;
    clearcoatRoughness = 0.20;
    envIntensity = 0.88;
  } else if (isTire) {
    baseRoughness = 0.85;
    baseMetalness = 0.03;
    envIntensity = 0.36;
  } else if (isHose) {
    baseRoughness = 0.62;
    baseMetalness = 0.06;
    envIntensity = 0.44;
  } else if (isGlass) {
    usePhysical = true;
    baseRoughness = 0.05;
    baseMetalness = 0.06;
    clearcoat = 1.0;
    clearcoatRoughness = 0.04;
    ior = 1.52;
    envIntensity = 1.26;
  } else if (isTusk) {
    baseRoughness = 0.35;
    baseMetalness = 0.02;
    envIntensity = 0.54;
  } else if (isOrangeMetal) {
    usePhysical = true;
    baseRoughness = kind === 'hv_orange' ? 0.33 : 0.27;
    baseMetalness = kind === 'hv_orange' ? 0.20 : 0.32;
    clearcoat = 0.38;
    clearcoatRoughness = 0.22;
    envIntensity = 0.78;
  } else if (kind === 'machined_steel') {
    baseRoughness = 0.24;
    baseMetalness = 0.88;
    envIntensity = 1.04;
  } else if (kind === 'gunmetal') {
    baseRoughness = 0.38;
    baseMetalness = 0.72;
    envIntensity = 0.78;
  } else if (kind === 'dark_steel') {
    baseRoughness = 0.44;
    baseMetalness = 0.62;
    envIntensity = 0.70;
  } else if (kind === 'brass_antenna') {
    baseRoughness = 0.28;
    baseMetalness = 0.84;
    envIntensity = 0.94;
  } else if (kind === 'seat_fabric') {
    baseRoughness = 0.88;
    baseMetalness = 0.02;
    envIntensity = 0.28;
  } else if (kind === 'interior_graphite') {
    baseRoughness = 0.66;
    baseMetalness = 0.10;
    envIntensity = 0.36;
  } else if (isEmissive) {
    baseRoughness = kind === 'emissive_cyan' || kind === 'emissive_red' ? 0.14 : 0.22;
    baseMetalness = 0.06;
    envIntensity = 0.68;
  }

  // Strictly immutable pipeline state (NEVER mutated after creation!)
  const matOpts = {
    name: `${srcMat?.name || kind}_SharedPBR_TSL`,
    roughness: baseRoughness,
    metalness: baseMetalness,
    envMapIntensity: envIntensity,
    transparent: isGlass,
    depthWrite: !isGlass,
    depthTest: true,
    side: THREE.FrontSide,
  };
  if (usePhysical) {
    matOpts.clearcoat = clearcoat;
    matOpts.clearcoatRoughness = clearcoatRoughness;
    matOpts.ior = ior;
  }

  const mat = usePhysical
    ? new MeshPhysicalNodeMaterial(matOpts)
    : new MeshStandardNodeMaterial(matOpts);

  if (srcNormalMap && !isGlass) {
    mat.normalMap = srcNormalMap;
    const nScale = isArmor ? 0.55 : isTire ? 0.90 : 0.85;
    mat.normalScale = srcMat.normalScale
      ? srcMat.normalScale.clone().multiplyScalar(isArmor ? 0.65 : 1.0)
      : new THREE.Vector2(nScale, nScale);
  }

  const sampleTransformedTex = (tex) => {
    const rx = tex.repeat ? tex.repeat.x : 1;
    const ry = tex.repeat ? tex.repeat.y : 1;
    const ox = tex.offset ? tex.offset.x : 0;
    const oy = tex.offset ? tex.offset.y : 0;
    if (rx === 1 && ry === 1 && ox === 0 && oy === 0) {
      return texture(tex, uv());
    }
    return texture(tex, uv().mul(vec2(rx, ry)).add(vec2(ox, oy)));
  };

  const uHeadlightRamp = uniforms?.uHeadlightRamp || uniform(1.0);
  const uBraking = uniforms?.uBraking || uniform(0.0);
  const uPowerOn = uniforms?.uPowerOn || uniform(1.0);
  const uModeBlend = uniforms?.uModeBlend || uniform(0.0);
  const uDustIntensity = uniforms?.uDustIntensity || uniform(0.0);
  const uTime = uniforms?.uTime || uniform(0.0);

  // ==========================================================================
  // 1. COLOR NODE
  // ==========================================================================
  mat.colorNode = Fn(() => {
    const pW = positionWorld;
    const pL = positionLocal;
    const nW = normalWorld.normalize();

    if (isGlass) {
      const fres = evalViewFresnel(2.8);
      const deepCore =
        kind === 'glass_windshield'
          ? linHex(0x054a6e, 0.96)
          : linHex(0x064c70, 0.94);
      const midTeal =
        kind === 'glass_windshield'
          ? linHex(0x0c80aa, 1.04)
          : linHex(0x0d7da4, 1.02);
      const skyTint = mix(linHex(0x3ec6f2, 1.12), linHex(0x78c8ea, 1.08), uModeBlend);
      let glassCol = mix(deepCore, midTeal, clamp(fres.mul(1.25).add(0.18), 0.0, 1.0));
      glassCol = mix(glassCol, skyTint, fres.mul(0.55));
      return glassCol;
    }

    let col = vec3(baseColor.r, baseColor.g, baseColor.b);
    if (srcMap) {
      col = col.mul(sampleTransformedTex(srcMap).rgb);
    }
    if (hasVertexColor) {
      col = col.mul(attribute('color', 'vec3'));
    }

    if (isArmor) {
      const fres = evalViewFresnel(3.5);
      const edgeLift = linHex(0xf8fbff, 1.04).mul(fres.mul(0.10));
      const lowShade = invSmoothstep(0.6, 2.35, pW.y).mul(0.055);
      col = col.mul(float(1.0).sub(lowShade)).add(edgeLift);

      const lowDust = invSmoothstep(0.85, 2.05, pW.y)
        .mul(uModeBlend)
        .mul(float(0.10).add(uDustIntensity.mul(0.16)));
      col = mix(col, linHex(0x8c9298, 0.96), clamp(lowDust, 0.0, 0.28));
    } else if (isBlueMetal) {
      const fres = evalViewFresnel(2.8);
      const vividBlue = linHex(0x008ce6, 1.04);
      const cyanEdge = linHex(0x2cc2ff, 1.18);
      col = mix(col, vividBlue, float(0.28));
      col = mix(col, cyanEdge, fres.mul(0.34));
    } else if (isTire) {
      const fres = evalViewFresnel(4.0);
      col = col.mul(float(0.94)).add(linHex(0x4c5866, 0.09).mul(fres));

      const radialDist = length(vec2(pL.x, pL.y));
      const outerTread = smoothstep(0.58, 0.96, radialDist);
      const gravelDust = linHex(0x8e918e, 0.95);
      const dustMix = uModeBlend
        .mul(float(0.24).add(uDustIntensity.mul(0.26)))
        .mul(float(0.45).add(outerTread.mul(0.55)));
      col = mix(col, gravelDust, clamp(dustMix, 0.0, 0.48));
    } else if (isTusk) {
      const fres = evalViewFresnel(3.4);
      col = mix(col, linHex(0xfcf6e8, 1.05), fres.mul(0.14));
    } else if (kind === 'dark_steel' || kind === 'gunmetal') {
      const fres = evalViewFresnel(3.4);
      col = col.mul(float(0.94)).add(linHex(0x7c94ae, 0.16).mul(fres));
      const underDust = invSmoothstep(0.35, 1.45, pW.y).mul(uModeBlend).mul(0.14);
      col = mix(col, linHex(0x7d8288, 0.90), underDust);
    } else if (isOrangeMetal) {
      const fres = evalViewFresnel(3.0);
      col = mix(col, linHex(0xf57e10, 1.04), float(0.18));
      col = mix(col, linHex(0xffb858, 1.10), fres.mul(0.22));
    } else if (kind === 'emissive_cyan') {
      // Dark smoked optical lens housing when OFF -> luminous bright cyan-white projector when ON
      const hl = clamp(uHeadlightRamp, 0.0, 1.0);
      const smokedLens = linHex(0x0d1822, 0.92);
      const litLens = linHex(0x9ef2ff, 1.10);
      col = mix(smokedLens, litLens, smoothstep(0.02, 0.85, hl));
    } else if (kind === 'emissive_red') {
      // Deep ruby smoked tail lens when OFF -> rich crimson running/brake lens when lit
      const hl = clamp(uHeadlightRamp, 0.0, 1.0);
      const brk = clamp(uBraking, 0.0, 1.0);
      const darkRuby = linHex(0x280608, 1.0);
      const litRuby = linHex(0xcc1a12, 1.0);
      col = mix(darkRuby, litRuby, clamp(hl.mul(0.55).add(brk.mul(0.95)), 0.0, 1.0));
    } else if (kind === 'emissive_amber') {
      // Dark smoked amber clearance lens when OFF -> bright safety amber bar when ON
      const hl = clamp(uHeadlightRamp, 0.0, 1.0);
      col = mix(linHex(0x361c06, 1.0), linHex(0xf48e18, 1.0), float(0.22).add(hl.mul(0.78)));
    } else if (kind === 'dashboard_ui') {
      col = col.mul(0.28);
    }

    const downFace = clamp(nW.y.negate().mul(0.6).add(0.2), 0.0, 1.0);
    const bounceTint = mix(linHex(0xdce6f2, 0.065), linHex(0x7a8086, 0.05), uModeBlend);
    col = col.add(bounceTint.mul(downFace).mul(invSmoothstep(0.4, 3.8, pW.y)));

    return col;
  })();

  // ==========================================================================
  // 2. ROUGHNESS & METALNESS NODES
  // ==========================================================================
  if (!isGlass) {
    mat.roughnessNode = Fn(() => {
      const pW = positionWorld;
      let r = float(baseRoughness);
      if (srcRoughMap) {
        r = sampleTransformedTex(srcRoughMap).g.mul(float(baseRoughness));
      }

      if (isArmor) {
        const lowDustR = invSmoothstep(0.85, 2.05, pW.y).mul(uModeBlend).mul(0.14);
        r = r.add(lowDustR);
      } else if (isTire) {
        r = r.add(uModeBlend.mul(0.08));
      }

      return clamp(r, 0.12, 0.96);
    })();

    if (srcMetalMap) {
      mat.metalnessNode = Fn(() => {
        return clamp(sampleTransformedTex(srcMetalMap).b.mul(float(baseMetalness)), 0.0, 1.0);
      })();
    }
  }

  // ==========================================================================
  // 3. EMISSIVE NODE (REALISTIC AUTOMOTIVE LIGHTING CHANNELS + HV PULSE)
  // ==========================================================================
  mat.emissiveNode = Fn(() => {
    const fres = evalViewFresnel(3.2);
    let emis = vec3(0.0, 0.0, 0.0);

    if (kind === 'emissive_cyan') {
      // Dramatic OFF (dark smoked lens ~0.015) -> ON (intense glowing bright cyan-white optical emitter ~3.45!)
      const hl = clamp(uHeadlightRamp, 0.0, 1.0);
      const rampCurve = safePow(hl, 0.85);
      const hotCenter = float(1.0).sub(fres).mul(0.65);
      const emitterCol = mix(linHex(0x28d6ff, 1.0), linHex(0xd8faff, 1.0), hotCenter);
      const offStandby = linHex(0x164458, 0.018);
      const activeEmis = emitterCol.mul(rampCurve.mul(3.45).mul(clamp(uPowerOn, 0.35, 1.25)));
      emis = emis.add(mix(offStandby, activeEmis, smoothstep(0.0, 0.06, hl)));
    } else if (kind === 'emissive_red') {
      // 3 realistic automotive tail/brake states:
      //   1. Lights OFF & not braking -> dark ruby lens (~0.08)
      //   2. Lights ON  & not braking -> crisp red running tail lights (~0.65)
      //   3. Braking (uBraking > 0.05) -> blazing incandescent red brake lamps (~3.3+)
      const hl = clamp(uHeadlightRamp, 0.0, 1.0);
      const brk = clamp(uBraking, 0.0, 1.0);
      const tailLevel = mix(float(0.08), float(0.65), hl);
      const brakeSurge = brk.mul(3.20);
      const redTint = mix(linHex(0xd81610, 1.0), linHex(0xff3418, 1.0), brk);
      emis = emis.add(redTint.mul(tailLevel.add(brakeSurge)));
    } else if (kind === 'emissive_amber') {
      // Rich glowing amber side bars & arch clearance markers when Lights ON; dim smoked standby when OFF
      const hl = clamp(uHeadlightRamp, 0.0, 1.0);
      const amberLevel = mix(float(0.10), float(1.55), hl).mul(clamp(uPowerOn, 0.4, 1.25));
      emis = emis.add(linHex(0xff9418, 1.0).mul(amberLevel));
    } else if (kind === 'dashboard_ui') {
      const texSamp = srcEmissiveMap
        ? sampleTransformedTex(srcEmissiveMap).rgb
        : srcMap
          ? sampleTransformedTex(srcMap).rgb
          : linHex(0x28c8f4, 1.0);
      emis = emis.add(texSamp.mul(linHex(0x52e0ff, 1.45)).mul(uPowerOn));
    } else if (isArmor) {
      const rimSharp = evalViewFresnel(4.4);
      const rimCol = mix(linHex(0xdceeff, 0.13), linHex(0xcee2f2, 0.08), uModeBlend);
      emis = emis.add(rimCol.mul(rimSharp));
    } else if (isBlueMetal) {
      const rimBlue = evalViewFresnel(3.8);
      emis = emis.add(linHex(0x18aaf8, 0.18).mul(rimBlue));
    } else if (isGlass) {
      const glassRim = evalViewFresnel(3.0);
      emis = emis.add(linHex(0x40c8f4, 0.28).mul(glassRim));
    } else if (isTusk) {
      const ivoryRim = evalViewFresnel(4.2);
      emis = emis.add(linHex(0xf8eed8, 0.10).mul(ivoryRim));
    }

    // Shared HV Electrical inspection flow highlight (zero per-group material clones!)
    if (kind === 'hv_orange' || kind === 'hazard_box' || kind === 'emissive_cyan' || kind === 'dashboard_ui') {
      const ePulse = sin(uTime.mul(3.6).sub(positionWorld.x.mul(1.4))).mul(0.24).add(0.76);
      const eColor = kind === 'hv_orange' || kind === 'hazard_box'
        ? linHex(0xff8c1a, 1.05)
        : linHex(0x22d0ff, 1.15);
      emis = emis.add(eColor.mul(uElectricalPulse).mul(ePulse).mul(fres.mul(0.55).add(0.45)));
    }

    return emis;
  })();

  // ==========================================================================
  // 4. OPACITY NODE (ONLY ON IMMUTABLE GLASS MATERIALS — OPAQUE PBR STAYS PURE OPAQUE!)
  // ==========================================================================
  if (isGlass) {
    mat.opacityNode = Fn(() => {
      const fres = evalViewFresnel(2.8);
      return kind === 'glass_windshield'
        ? mix(float(0.44), float(0.88), fres)
        : mix(float(0.48), float(0.90), fres);
    })();
  }

  return {
    material: mat,
    kind,
    ghostBucket: classifyGhostBucket(kind),
    baseMatName: srcMat?.name || kind,
    isGlass,
    isEmissive,
  };
}

// ============================================================================
// PRE-COMPILED SHARED CUTAWAY GHOST, SELECTION RIM & WIREFRAME MATERIAL POOLS
//   - 4 Ghost Cutaway materials (with live uGhostOpacity uniform)
//   - 1 Additive Fresnel Selection Highlight Overlay (preserves all PBR decals!)
//   - 3 Technical CAD Clay + 4 Blueprint X-Ray + 4 Pure Mesh Topology materials
//   - ZERO .needsUpdate = true, ZERO .transparent/.depthWrite/.wireframe flips!
// ============================================================================

const VALID_RENDER_STYLES = new Set(['pbr', 'wire_tech', 'wire_blueprint', 'wire_mesh']);

const OUTER_SHELL_GROUPS = new Set([
  'RearBody',
  'EquipmentHatches',
  'CabinShell',
  'Doors',
  'FrontBumper',
  'Tusks',
  'RooftopEquipment',
  'Lights',
]);

const CAD_EDGE_PALETTE = {
  wire_tech: {
    armor: { hex: 0x1a2636, opacity: 0.78 },
    chassis: { hex: 0x0d8ce0, opacity: 0.95 },
    accent: { hex: 0xe87812, opacity: 0.92 },
  },
  // Pure light-theme Architectural X-Ray Vellum (crisp cobalt, electric cyan & safety amber on light canvas!)
  wire_blueprint: {
    armor: { hex: 0x2a69a8, opacityOuter: 0.44, opacityInner: 0.76 },
    chassis: { hex: 0x0077cc, opacityOuter: 0.92, opacityInner: 0.96 },
    accent: { hex: 0xd96608, opacityOuter: 0.92, opacityInner: 0.95 },
  },
};

function classifyCadCategory(kind, groupKey, meshContextName = '') {
  const lowCtx = String(meshContextName || '').toLowerCase();

  if (
    kind === 'hv_orange' ||
    kind === 'orange_coil' ||
    kind === 'orange_accent' ||
    kind === 'emissive_amber' ||
    kind === 'emissive_red' ||
    kind === 'hazard_box' ||
    groupKey === 'Powertrain' ||
    groupKey === 'SuspensionAssemblies' ||
    lowCtx.includes('winch')
  ) {
    return 'accent';
  }

  if (
    kind === 'chassis_blue' ||
    kind === 'rim_blue' ||
    kind === 'emissive_cyan' ||
    kind === 'dashboard_ui' ||
    groupKey === 'Chassis' ||
    groupKey === 'Axles' ||
    groupKey === 'Drivetrain' ||
    groupKey === 'SteeringSystem'
  ) {
    return 'chassis';
  }

  return 'armor';
}

function buildSharedGhostMaterial(name, baseHex, rimHex, defaultOpacity) {
  const uGhostOpacity = uniform(defaultOpacity);
  const mat = new MeshBasicNodeMaterial({
    name,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: 1.5,
    polygonOffsetUnits: 1.5,
  });

  mat.colorNode = Fn(() => {
    const fres = evalViewFresnel(2.6);
    return mix(linHex(baseHex, 1.0), linHex(rimHex, 1.12), fres.mul(0.65));
  })();

  mat.opacityNode = Fn(() => {
    const fres = evalViewFresnel(2.4);
    const op = clamp(uGhostOpacity, 0.04, 0.55);
    return clamp(op.add(fres.mul(0.22)), 0.0, 0.65);
  })();

  return { material: mat, uGhostOpacity };
}

function buildSharedSelectionOverlayMaterial(uniforms) {
  const uPulse = uniforms?.uHighlightPulse || uniform(0.0);
  const mat = new MeshBasicNodeMaterial({
    name: 'Titan_SharedSelectionRim_TSL',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: -1.5,
    polygonOffsetUnits: -1.5,
    toneMapped: false,
  });

  mat.colorNode = Fn(() => {
    const selWave = float(0.80).add(uPulse.mul(0.20));
    return linHex(0x1cb4ff, 1.18).mul(selWave);
  })();

  mat.opacityNode = Fn(() => {
    const fres = evalViewFresnel(2.2);
    const selWave = float(0.80).add(uPulse.mul(0.20));
    return clamp(fres.mul(0.72).add(0.10).mul(selWave), 0.0, 0.82);
  })();

  return mat;
}

function buildSharedTechClayMaterial(name, baseHex) {
  const mat = new MeshStandardNodeMaterial({
    name,
    roughness: 0.78,
    metalness: 0.02,
    envMapIntensity: 0.28,
    transparent: false,
    depthWrite: true,
    depthTest: true,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: 1.5,
    polygonOffsetUnits: 1.5,
  });

  mat.colorNode = Fn(() => {
    const pW = positionWorld;
    const nW = normalWorld.normalize();
    const fres = evalViewFresnel(3.4);

    let col = linHex(baseHex, 1.0);
    const lowShade = invSmoothstep(0.4, 2.4, pW.y).mul(0.045);
    const upLift = clamp(nW.y.mul(0.5).add(0.5), 0.0, 1.0).mul(0.045);
    col = col.mul(float(1.0).sub(lowShade).add(upLift)).add(linHex(0xf9fbfe, 0.06).mul(fres));
    return col;
  })();

  return mat;
}

function buildSharedBlueprintMaterial(name, coreHex, rimHex, baseLo, baseHi) {
  const mat = new MeshBasicNodeMaterial({
    name,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.FrontSide,
    polygonOffset: true,
    polygonOffsetFactor: 1.5,
    polygonOffsetUnits: 1.5,
    toneMapped: false,
  });

  mat.colorNode = Fn(() => {
    const fres = evalViewFresnel(2.5);
    return mix(linHex(coreHex, 1.0), linHex(rimHex, 1.0), fres.mul(0.58));
  })();

  mat.opacityNode = Fn(() => {
    const fres = evalViewFresnel(2.6);
    return clamp(mix(float(baseLo), float(baseHi), fres), 0.0, 0.45);
  })();

  return mat;
}

function buildSharedMeshWireMaterial(name, baseHex, baseAlpha) {
  const mat = new MeshBasicNodeMaterial({
    name,
    wireframe: true,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });

  mat.colorNode = Fn(() => linHex(baseHex, 1.0))();
  mat.opacityNode = Fn(() => float(baseAlpha))();
  return mat;
}

function createSharedMaterialPools(uniforms) {
  return {
    ghost: {
      armor: buildSharedGhostMaterial('Titan_GhostArmor_TSL', 0xd8e2ec, 0x9ec4e8, 0.12),
      chassis: buildSharedGhostMaterial('Titan_GhostChassis_TSL', 0x0d7ec8, 0x48ceff, 0.16),
      dark: buildSharedGhostMaterial('Titan_GhostDark_TSL', 0x3b4858, 0x8ea6be, 0.15),
      tire: buildSharedGhostMaterial('Titan_GhostTire_TSL', 0x262e38, 0x6c7d90, 0.12),
    },
    selectionOverlay: buildSharedSelectionOverlayMaterial(uniforms),
    wireTech: {
      armor: buildSharedTechClayMaterial('Titan_CAD_TechClay_Armor', 0xeceff4),
      chassis: buildSharedTechClayMaterial('Titan_CAD_TechClay_Chassis', 0xe3edf6),
      accent: buildSharedTechClayMaterial('Titan_CAD_TechClay_Accent', 0xf3ece4),
    },
    wireBlueprint: {
      armor: buildSharedBlueprintMaterial('Titan_CAD_Blueprint_Armor', 0xd8eafc, 0x1b88e5, 0.09, 0.22),
      chassis: buildSharedBlueprintMaterial('Titan_CAD_Blueprint_Chassis', 0xbde0ff, 0x0078d4, 0.14, 0.30),
      accent: buildSharedBlueprintMaterial('Titan_CAD_Blueprint_Accent', 0xffe3c4, 0xe87812, 0.14, 0.30),
      ghost: buildSharedBlueprintMaterial('Titan_CAD_Blueprint_Ghost', 0xe6f0fa, 0x6ba6db, 0.025, 0.06),
    },
    wireMesh: {
      armor: buildSharedMeshWireMaterial('Titan_CAD_PureMesh_Armor', 0x1e2b3a, 0.64),
      chassis: buildSharedMeshWireMaterial('Titan_CAD_PureMesh_Chassis', 0x0d8ce0, 0.88),
      accent: buildSharedMeshWireMaterial('Titan_CAD_PureMesh_Accent', 0xe87812, 0.88),
      ghost: buildSharedMeshWireMaterial('Titan_CAD_PureMesh_Ghost', 0x6b7c8e, 0.14),
    },
  };
}

// ============================================================================
// GEOMETRY METRICS & RIG HELPER DETECTION
// ============================================================================

function isRigOrCadHelper(obj) {
  if (!obj) return true;
  if (obj.userData?.__isCadWireframeHelper || obj.userData?.__isRigHelper) return true;
  if (obj.isLine || obj.isLineSegments || obj.isLight) return true;
  const name = obj.name || '';
  if (name.startsWith('Rig_')) return true;
  let cur = obj.parent;
  while (cur) {
    if (
      cur.userData?.__isCadWireframeHelper ||
      cur.userData?.__isRigHelper ||
      (cur.name || '').startsWith('Rig_')
    ) {
      return true;
    }
    cur = cur.parent;
  }
  return false;
}

function isMechanicalPivotNode(obj) {
  if (!obj) return false;
  const name = obj.name || '';
  const hasTransform =
    (obj.position && obj.position.lengthSq() > 1e-8) ||
    (obj.quaternion && Math.abs(obj.quaternion.w) < 0.999999);
  if (hasTransform) return true;
  return /^(Door_|Hatch_|Wheel_|BrakeCaliper_|SteerKnuckle_|TieRod_|SteeringWheel|SteeringRack_|SwayBars_|WinchDrum_|CoolingFan_|Driveshaft_|TransferCase|FrontAxle|MiddleAxle|RearAxle|Susp_|ControlArm_|Spring_|Damper_)/i.test(
    name
  );
}

function computeTruckGeometryStats(truckRoot) {
  const stats = { triangles: 0, vertices: 0, meshes: 0, nodes: 0, pivots: 0 };
  if (!truckRoot) return stats;

  const statsRoot = truckRoot.getObjectByName?.('TruckRoot') || truckRoot;
  statsRoot.traverse((obj) => {
    if (isRigOrCadHelper(obj)) return;

    if (obj.isMesh && obj.geometry) {
      stats.meshes += 1;
      const geo = obj.geometry;
      const posAttr = geo.attributes?.position;
      if (posAttr) {
        stats.vertices += posAttr.count;
        if (geo.index) {
          stats.triangles += Math.round(geo.index.count / 3);
        } else {
          stats.triangles += Math.floor(posAttr.count / 3);
        }
      }
    }

    const objName = obj.name || '';
    const isSplitPrimitive =
      obj.isMesh &&
      Boolean(obj.parent?.isGroup) &&
      obj.children.length === 0 &&
      (obj.position?.lengthSq?.() || 0) < 1e-8 &&
      (/_\d+$/.test(objName) ||
        objName === (obj.parent.name || '') ||
        (objName.length > 0 &&
          obj.parent.children.some(
            (sib) => sib !== obj && sib.isMesh && (sib.name || '').startsWith(`${objName}_`)
          )));

    if (!isSplitPrimitive) {
      stats.nodes += 1;
      if (obj !== statsRoot && isMechanicalPivotNode(obj)) {
        stats.pivots += 1;
      }
    }
  });

  return stats;
}

// ============================================================================
// MAIN UPGRADER & ZERO-RECOMPILE MATERIAL CONTROLLER
// ============================================================================

const GHOST_OPACITY_THRESHOLD = 0.86;
const CAD_EDGE_THRESHOLD_DEG = 28;

/**
 * Upgrades all meshes in `truckRoot` onto a compact shared TSL material pool (~39 total NodeMaterials):
 *   - ~23 canonical PBR materials (immutable pipeline state)
 *   - 4 shared translucent Ghost cutaway materials (live uGhostOpacity uniform)
 *   - 1 shared additive Fresnel Selection Rim overlay
 *   - 11 shared Wireframe CAD materials (3 Technical Clay + 4 Blueprint X-Ray + 4 Pure Mesh)
 * ZERO `.needsUpdate = true` and ZERO `.transparent/.depthWrite/.wireframe` mutations after init!
 */
export function upgradeTruckMaterialsToTSL(truckRoot, uniforms) {
  const sharedPbrMap = new Map(); // canonicalKey -> pbrHandle
  const groups = new Map(); // groupKey -> meshBindings[]
  const meshBindings = [];
  const groupAlphaMap = new Map();
  const groupGhostedMap = new Map();
  const edgeGeometryCache = new Map(); // geometry.uuid -> THREE.EdgesGeometry | null
  const cadLineMaterials = new Map(); // `${groupKey}|${cadCategory}|${isOuter}` -> entry

  const uElectricalPulse = uniforms?.uElectricalPulse || uniform(0.0);
  const emptyStats = { triangles: 0, vertices: 0, meshes: 0, nodes: 0, pivots: 0 };

  if (!truckRoot) {
    return {
      setGroupOpacity() {},
      setSelectedGroup() {},
      setElectricalHighlight() {},
      setRenderStyle() {
        return 'pbr';
      },
      getRenderStyle() {
        return 'pbr';
      },
      getGeometryStats() {
        return { ...emptyStats };
      },
      getMaterialPoolStats() {
        return { pbrCount: 0, sharedPoolCount: 0, totalMaterials: 0 };
      },
      prebuildWireframeEdgesAsync() {
        return Promise.resolve(true);
      },
      isWireframeEdgesReady() {
        return true;
      },
      getSelectedGroup() {
        return null;
      },
      resetAll() {},
      dispose() {},
      materialHandles: sharedPbrMap,
      groups,
      uniforms,
    };
  }

  // Snapshot exact live GLB geometry metrics before any helper objects are attached
  const cachedGeometryStats = computeTruckGeometryStats(truckRoot);
  const pools = createSharedMaterialPools(uniforms);

  const uniqueGeometries = [];
  const seenGeoUuids = new Set();

  truckRoot.traverse((obj) => {
    if (!obj.isMesh || !obj.material || isRigOrCadHelper(obj)) return;

    const groupKey = classifyMeshGroup(obj);
    const isOuterShell = OUTER_SHELL_GROUPS.has(groupKey);
    const hasVertexColor = Boolean(obj.geometry?.attributes?.color);
    const isMultiMat = Array.isArray(obj.material);
    const srcMaterials = isMultiMat ? obj.material : [obj.material];
    const meshContextName = `${obj.parent?.name || ''} ${obj.name || ''}`;

    let anyOpaque = false;
    let anyGlass = false;
    const bindingHandles = [];
    const slotCategories = [];

    const upgradedList = srcMaterials.map((srcMat) => {
      if (!srcMat) return srcMat;
      const kind = classifyMaterialKind(srcMat.name || obj.name);
      const cadCategory = classifyCadCategory(kind, groupKey, meshContextName);
      // Share strictly by canonical material key (~23 PBR materials across the entire truck!)
      const canonicalKey = `${srcMat.uuid || srcMat.name || kind}|${hasVertexColor ? 1 : 0}`;

      let handle = sharedPbrMap.get(canonicalKey);
      if (!handle) {
        handle = buildSharedPBRMaterial(srcMat, kind, uniforms, uElectricalPulse, hasVertexColor);
        sharedPbrMap.set(canonicalKey, handle);
      }

      bindingHandles.push(handle);
      slotCategories.push(cadCategory);
      if (!handle.isGlass && !handle.isEmissive) anyOpaque = true;
      if (handle.isGlass) anyGlass = true;
      return handle.material;
    });

    if (!groupAlphaMap.has(groupKey)) {
      groupAlphaMap.set(groupKey, 1.0);
      groupGhostedMap.set(groupKey, false);
    }

    const pbrMaterial = isMultiMat ? upgradedList : upgradedList[0];

    // Pre-resolve shared pool materials per mesh (zero allocations on button clicks!)
    const resolvePoolSlot = (fn) => (isMultiMat ? bindingHandles.map(fn) : fn(bindingHandles[0], 0));
    const ghostMaterial = resolvePoolSlot((h) => pools.ghost[h.ghostBucket].material);
    const techMaterial = resolvePoolSlot((h, idx) =>
      h.isGlass ? pools.ghost.armor.material : pools.wireTech[slotCategories[idx] || 'armor']
    );
    const blueprintMaterial = resolvePoolSlot((_, idx) => pools.wireBlueprint[slotCategories[idx] || 'armor']);
    const blueprintGhostMaterial = resolvePoolSlot(() => pools.wireBlueprint.ghost);
    const meshWireMaterial = resolvePoolSlot((_, idx) => pools.wireMesh[slotCategories[idx] || 'armor']);
    const meshWireGhostMaterial = resolvePoolSlot(() => pools.wireMesh.ghost);

    obj.material = pbrMaterial;

    const lowName = (obj.name || '').toLowerCase();
    const isSmallLightTrim =
      groupKey === 'Lights' ||
      lowName.includes('light_') ||
      lowName.includes('amberlight') ||
      lowName.includes('marker') ||
      lowName.includes('display') ||
      lowName.includes('windshield') ||
      lowName.includes('window') ||
      lowName.includes('lens');
    const isPureGlassOrEmissive = !anyOpaque;
    const isGlassMesh = anyGlass && !anyOpaque;

    const isDeepInterior = groupKey === 'Powertrain' || groupKey === 'CabinInterior';
    const defaultCastShadow = anyOpaque && !anyGlass && !isSmallLightTrim && !isDeepInterior;
    const defaultReceiveShadow = anyOpaque && !isPureGlassOrEmissive && !anyGlass;

    obj.castShadow = defaultCastShadow;
    obj.receiveShadow = defaultReceiveShadow;
    obj.renderOrder = isGlassMesh ? 2 : 0;

    const primaryCadCategory = slotCategories[0] || 'armor';
    const primaryGhostBucket = bindingHandles[0]?.ghostBucket || 'dark';

    const geo = obj.geometry;
    if (geo && geo.attributes?.position && geo.attributes.position.count >= 3 && !seenGeoUuids.has(geo.uuid)) {
      seenGeoUuids.add(geo.uuid);
      uniqueGeometries.push(geo);
    }

    const binding = {
      mesh: obj,
      groupKey,
      isOuterShell,
      isGlassMesh,
      isMultiMat,
      pbrMaterial,
      ghostMaterial,
      techMaterial,
      blueprintMaterial,
      blueprintGhostMaterial,
      meshWireMaterial,
      meshWireGhostMaterial,
      ghostBuckets: new Set(bindingHandles.map((h) => h.ghostBucket)),
      primaryGhostBucket,
      cadCategory: primaryCadCategory,
      defaultCastShadow,
      defaultReceiveShadow,
      edgeLines: null,
      edgeLineEntry: null,
      selectionOverlayMesh: null,
    };

    meshBindings.push(binding);
    if (!groups.has(groupKey)) groups.set(groupKey, []);
    groups.get(groupKey).push(binding);
  });

  // Track which groups touch each ghost bucket so uGhostOpacity updates smoothly
  const ghostBucketGroups = {
    armor: new Set(),
    chassis: new Set(),
    dark: new Set(),
    tire: new Set(),
  };
  for (const b of meshBindings) {
    for (const bk of b.ghostBuckets) {
      ghostBucketGroups[bk]?.add(b.groupKey);
    }
  }

  let activeStyle = 'pbr';
  let activeSelectedGroup = null;
  let activeSelectedKeys = new Set();

  // Incremental zero-stall EdgesGeometry warm-up cursors
  let edgeGeoIndex = 0;
  let edgeAttachIndex = 0;
  let cadEdgesReady = false;
  let prebuildPromise = null;
  let prebuildResolve = null;
  let prebuildRafId = null;
  let disposed = false;

  const scheduleFrame =
    typeof requestAnimationFrame === 'function'
      ? (cb) => requestAnimationFrame(cb)
      : (cb) => setTimeout(cb, 0);
  const cancelFrame =
    typeof cancelAnimationFrame === 'function'
      ? (id) => cancelAnimationFrame(id)
      : (id) => clearTimeout(id);

  function resolveGroupKeys(groupName) {
    if (!groupName) return [];
    const raw = String(groupName).trim();
    if (groups.has(raw)) return [raw];
    const low = raw.toLowerCase();
    if (SUBSYSTEM_ALIAS_MAP[low]) return SUBSYSTEM_ALIAS_MAP[low];

    const matched = [];
    for (const key of groups.keys()) {
      if (key.toLowerCase() === low || key.toLowerCase().includes(low)) {
        matched.push(key);
      }
    }
    return matched;
  }

  function getOrCreateCadLineEntry(groupKey, cadCategory, isOuterShell) {
    const key = `${groupKey}|${cadCategory}|${isOuterShell ? 1 : 0}`;
    let entry = cadLineMaterials.get(key);
    if (!entry) {
      const mat = new THREE.LineBasicMaterial({
        color: new THREE.Color(0x1a2636),
        transparent: true,
        opacity: 0.78,
        depthTest: true,
        depthWrite: false,
        toneMapped: false,
      });
      entry = { material: mat, groupKey, cadCategory, isOuterShell, lines: [] };
      cadLineMaterials.set(key, entry);
    }
    return entry;
  }

  function buildNextUniqueEdgeGeo() {
    if (edgeGeoIndex >= uniqueGeometries.length) return false;
    const geo = uniqueGeometries[edgeGeoIndex++];
    if (edgeGeometryCache.has(geo.uuid)) return true;

    const built = new THREE.EdgesGeometry(geo, CAD_EDGE_THRESHOLD_DEG);
    if (built.attributes?.position && built.attributes.position.count > 0) {
      edgeGeometryCache.set(geo.uuid, built);
    } else {
      built.dispose();
      edgeGeometryCache.set(geo.uuid, null);
    }
    return true;
  }

  function attachNextEdgeLineMesh() {
    if (edgeAttachIndex >= meshBindings.length) return false;
    const b = meshBindings[edgeAttachIndex++];
    if (b.edgeLines) return true;

    const geo = b.mesh.geometry;
    if (!geo) return true;
    const edgeGeo = edgeGeometryCache.get(geo.uuid);
    if (!edgeGeo) return true;

    const lineEntry = getOrCreateCadLineEntry(b.groupKey, b.cadCategory, b.isOuterShell);
    const lineSegs = new THREE.LineSegments(edgeGeo, lineEntry.material);
    lineSegs.name = `${b.mesh.name || 'Mesh'}_CADEdges`;
    lineSegs.userData.__isCadWireframeHelper = true;
    lineSegs.raycast = () => {};
    lineSegs.castShadow = false;
    lineSegs.receiveShadow = false;
    lineSegs.frustumCulled = b.mesh.frustumCulled;
    lineSegs.visible = false;
    lineSegs.renderOrder = 3;

    b.mesh.add(lineSegs);
    b.edgeLines = lineSegs;
    b.edgeLineEntry = lineEntry;
    lineEntry.lines.push(lineSegs);
    return true;
  }

  function markEdgesReady() {
    cadEdgesReady = true;
    if (prebuildRafId !== null) {
      cancelFrame(prebuildRafId);
      prebuildRafId = null;
    }
    if (prebuildResolve) {
      const done = prebuildResolve;
      prebuildResolve = null;
      done(true);
    }
  }

  function ensureCadEdgeLinesSync() {
    if (cadEdgesReady || disposed) return;
    if (prebuildRafId !== null) {
      cancelFrame(prebuildRafId);
      prebuildRafId = null;
    }
    while (edgeGeoIndex < uniqueGeometries.length) {
      buildNextUniqueEdgeGeo();
    }
    while (edgeAttachIndex < meshBindings.length) {
      attachNextEdgeLineMesh();
    }
    markEdgesReady();
  }

  /**
   * Incrementally builds cached EdgesGeometry(geo, 24°) & LineSegments across idle frames
   * using a strict per-frame time budget (default 4.5 ms) so initial load and UI stay 60fps.
   */
  function prebuildWireframeEdgesAsync(budgetMs = 4.5) {
    if (cadEdgesReady || disposed) return Promise.resolve(true);
    if (prebuildPromise) return prebuildPromise;

    const safeBudget = Math.max(1.5, Math.min(12.0, Number(budgetMs) || 4.5));
    prebuildPromise = new Promise((resolve) => {
      prebuildResolve = resolve;

      const step = () => {
        prebuildRafId = null;
        if (disposed || cadEdgesReady) {
          markEdgesReady();
          return;
        }

        const t0 = performance.now();
        let processed = 0;

        while (edgeGeoIndex < uniqueGeometries.length) {
          buildNextUniqueEdgeGeo();
          processed++;
          if (processed >= 1 && performance.now() - t0 >= safeBudget) {
            prebuildRafId = scheduleFrame(step);
            return;
          }
        }

        while (edgeAttachIndex < meshBindings.length) {
          attachNextEdgeLineMesh();
          processed++;
          if (processed >= 6 && performance.now() - t0 >= safeBudget) {
            prebuildRafId = scheduleFrame(step);
            return;
          }
        }

        markEdgesReady();
      };

      prebuildRafId = scheduleFrame(step);
    });

    return prebuildPromise;
  }

  function syncGhostOpacities() {
    for (const bucketName of ['armor', 'chassis', 'dark', 'tire']) {
      const groupSet = ghostBucketGroups[bucketName];
      let sum = 0;
      let count = 0;
      for (const gk of groupSet) {
        const a = groupAlphaMap.get(gk) ?? 1.0;
        if (a < GHOST_OPACITY_THRESHOLD) {
          sum += a;
          count++;
        }
      }
      if (count > 0) {
        const avg = sum / count;
        // Map group cutaway alpha cleanly into architectural ghost opacity range [0.08..0.38]
        const mapped = Math.max(0.075, Math.min(0.40, avg * 0.62 + 0.04));
        pools.ghost[bucketName].uGhostOpacity.value = mapped;
      }
    }
  }

  function applyBindingPresentation(b) {
    const alpha = groupAlphaMap.get(b.groupKey) ?? 1.0;
    const isGhosted = alpha < GHOST_OPACITY_THRESHOLD;

    if (activeStyle === 'pbr') {
      b.mesh.material = isGhosted ? b.ghostMaterial : b.pbrMaterial;
      b.mesh.castShadow = b.defaultCastShadow && !isGhosted;
      b.mesh.receiveShadow = b.defaultReceiveShadow && !isGhosted;
      b.mesh.renderOrder = b.isGlassMesh ? 2 : isGhosted ? 1 : 0;
    } else if (activeStyle === 'wire_tech') {
      b.mesh.material = isGhosted ? b.ghostMaterial : b.techMaterial;
      b.mesh.castShadow = b.defaultCastShadow && !isGhosted;
      b.mesh.receiveShadow = b.defaultReceiveShadow && !isGhosted;
      b.mesh.renderOrder = b.isGlassMesh ? 2 : isGhosted ? 1 : 0;
    } else if (activeStyle === 'wire_blueprint') {
      b.mesh.material = isGhosted ? b.blueprintGhostMaterial : b.blueprintMaterial;
      b.mesh.castShadow = false;
      b.mesh.receiveShadow = false;
      b.mesh.renderOrder = b.isOuterShell ? 1 : 2;
    } else {
      // 'wire_mesh'
      b.mesh.material = isGhosted ? b.meshWireGhostMaterial : b.meshWireMaterial;
      b.mesh.castShadow = false;
      b.mesh.receiveShadow = false;
      b.mesh.renderOrder = b.isOuterShell ? 1 : 2;
    }
  }

  function syncCadLineEntry(entry) {
    const showEdges = activeStyle === 'wire_tech' || activeStyle === 'wire_blueprint';
    if (!showEdges) {
      for (let i = 0; i < entry.lines.length; i++) {
        entry.lines[i].visible = false;
      }
      return;
    }

    const groupAlpha = groupAlphaMap.get(entry.groupKey) ?? 1.0;
    const hasSelection = activeSelectedKeys.size > 0;
    const isSelected = hasSelection && activeSelectedKeys.has(entry.groupKey);

    let hex;
    let baseOp;
    if (activeStyle === 'wire_blueprint') {
      const spec = CAD_EDGE_PALETTE.wire_blueprint[entry.cadCategory] || CAD_EDGE_PALETTE.wire_blueprint.armor;
      hex = spec.hex;
      baseOp = entry.isOuterShell ? spec.opacityOuter : spec.opacityInner;
      if (isSelected) {
        hex = entry.cadCategory === 'accent' ? 0xffc46b : 0x8ef5ff;
      }
    } else {
      const spec = CAD_EDGE_PALETTE.wire_tech[entry.cadCategory] || CAD_EDGE_PALETTE.wire_tech.armor;
      hex = spec.hex;
      baseOp = spec.opacity;
      if (isSelected && entry.cadCategory === 'armor') {
        hex = 0x0d8ce0;
      }
    }

    let op = baseOp;
    if (groupAlpha < 0.015) {
      op = 0.0;
    } else if (groupAlpha < GHOST_OPACITY_THRESHOLD) {
      const minGhost = activeStyle === 'wire_blueprint' ? 0.16 : 0.14;
      const exp = activeStyle === 'wire_blueprint' ? 0.80 : 0.85;
      op = baseOp * Math.max(minGhost, Math.pow(groupAlpha, exp));
    }

    if (hasSelection) {
      op = isSelected ? Math.min(1.0, Math.max(op, baseOp) * 1.18) : op * 0.44;
    }

    entry.material.color.setHex(hex);
    entry.material.opacity = op;

    const visible = op > 0.01;
    const order =
      activeStyle === 'wire_blueprint' && (!entry.isOuterShell || entry.cadCategory !== 'armor')
        ? 4
        : 3;

    for (let i = 0; i < entry.lines.length; i++) {
      entry.lines[i].visible = visible;
      entry.lines[i].renderOrder = order;
    }
  }

  function setGroupOpacity(groupName, alpha) {
    const keys = resolveGroupKeys(groupName);
    if (keys.length === 0) return;

    const clamped = Math.max(0.0, Math.min(1.0, alpha));
    const keySet = new Set(keys);
    let anyGhostStateFlipped = false;

    for (const k of keys) {
      groupAlphaMap.set(k, clamped);
      const nextGhosted = clamped < GHOST_OPACITY_THRESHOLD;
      const prevGhosted = groupGhostedMap.get(k) || false;
      if (nextGhosted !== prevGhosted) {
        groupGhostedMap.set(k, nextGhosted);
        anyGhostStateFlipped = true;
        const list = groups.get(k);
        if (list) {
          for (let i = 0; i < list.length; i++) {
            applyBindingPresentation(list[i]);
          }
        }
      }
    }

    if (anyGhostStateFlipped || clamped < GHOST_OPACITY_THRESHOLD) {
      syncGhostOpacities();
    }

    if (cadEdgesReady && (activeStyle === 'wire_tech' || activeStyle === 'wire_blueprint')) {
      for (const entry of cadLineMaterials.values()) {
        if (keySet.has(entry.groupKey)) {
          syncCadLineEntry(entry);
        }
      }
    }
  }

  function setSelectedGroup(groupNameOrNull) {
    activeSelectedGroup = groupNameOrNull || null;
    activeSelectedKeys = new Set(resolveGroupKeys(groupNameOrNull));

    for (let i = 0; i < meshBindings.length; i++) {
      const b = meshBindings[i];
      const isSel = activeSelectedKeys.has(b.groupKey);
      if (isSel) {
        if (!b.selectionOverlayMesh && b.mesh.geometry) {
          const ov = new THREE.Mesh(b.mesh.geometry, pools.selectionOverlay);
          ov.name = `${b.mesh.name || 'Mesh'}_SelectRim`;
          ov.userData.__isCadWireframeHelper = true;
          ov.raycast = () => {};
          ov.castShadow = false;
          ov.receiveShadow = false;
          ov.frustumCulled = b.mesh.frustumCulled;
          ov.renderOrder = 3;
          b.mesh.add(ov);
          b.selectionOverlayMesh = ov;
        }
        if (b.selectionOverlayMesh) {
          b.selectionOverlayMesh.visible = true;
        }
      } else if (b.selectionOverlayMesh) {
        b.selectionOverlayMesh.visible = false;
      }
    }

    if (cadEdgesReady && (activeStyle === 'wire_tech' || activeStyle === 'wire_blueprint')) {
      for (const entry of cadLineMaterials.values()) {
        syncCadLineEntry(entry);
      }
    }
  }

  function setElectricalHighlight(enabled) {
    uElectricalPulse.value = enabled ? 1.0 : 0.0;
  }

  function setRenderStyle(style = 'pbr') {
    const raw = String(style || 'pbr').trim().toLowerCase();
    const normalized = VALID_RENDER_STYLES.has(raw) ? raw : 'pbr';
    if (normalized === activeStyle) {
      return activeStyle;
    }

    activeStyle = normalized;

    if (normalized === 'wire_tech' || normalized === 'wire_blueprint') {
      ensureCadEdgeLinesSync();
    }

    for (let i = 0; i < meshBindings.length; i++) {
      applyBindingPresentation(meshBindings[i]);
    }

    if (cadEdgesReady) {
      for (const entry of cadLineMaterials.values()) {
        syncCadLineEntry(entry);
      }
    }

    return activeStyle;
  }

  function getRenderStyle() {
    return activeStyle;
  }

  function getGeometryStats() {
    return { ...cachedGeometryStats };
  }

  function getMaterialPoolStats() {
    const pbrCount = sharedPbrMap.size;
    // 4 ghost + 1 selectionOverlay + 3 wireTech + 4 wireBlueprint + 4 wireMesh = 16 shared pool materials
    const sharedPoolCount = 16;
    return {
      pbrCount,
      sharedPoolCount,
      totalMaterials: pbrCount + sharedPoolCount,
    };
  }

  function resetAll() {
    activeSelectedGroup = null;
    activeSelectedKeys = new Set();
    uElectricalPulse.value = 0.0;

    for (const key of groups.keys()) {
      groupAlphaMap.set(key, 1.0);
      groupGhostedMap.set(key, false);
    }

    for (let i = 0; i < meshBindings.length; i++) {
      const b = meshBindings[i];
      applyBindingPresentation(b);
      if (b.selectionOverlayMesh) {
        b.selectionOverlayMesh.visible = false;
      }
    }

    if (cadEdgesReady) {
      for (const entry of cadLineMaterials.values()) {
        syncCadLineEntry(entry);
      }
    }
  }

  function dispose() {
    disposed = true;
    if (prebuildRafId !== null) {
      cancelFrame(prebuildRafId);
      prebuildRafId = null;
    }
    if (prebuildResolve) {
      const done = prebuildResolve;
      prebuildResolve = null;
      done(false);
    }

    setRenderStyle('pbr');

    for (let i = 0; i < meshBindings.length; i++) {
      const b = meshBindings[i];
      if (b.edgeLines) {
        if (b.edgeLines.parent) b.edgeLines.parent.remove(b.edgeLines);
        b.edgeLines = null;
        b.edgeLineEntry = null;
      }
      if (b.selectionOverlayMesh) {
        if (b.selectionOverlayMesh.parent) b.selectionOverlayMesh.parent.remove(b.selectionOverlayMesh);
        b.selectionOverlayMesh = null;
      }
    }

    for (const edgeGeo of edgeGeometryCache.values()) {
      edgeGeo?.dispose?.();
    }
    edgeGeometryCache.clear();

    for (const entry of cadLineMaterials.values()) {
      entry.material?.dispose?.();
    }
    cadLineMaterials.clear();

    Object.values(pools.ghost).forEach((g) => g.material?.dispose?.());
    pools.selectionOverlay?.dispose?.();
    Object.values(pools.wireTech).forEach((m) => m?.dispose?.());
    Object.values(pools.wireBlueprint).forEach((m) => m?.dispose?.());
    Object.values(pools.wireMesh).forEach((m) => m?.dispose?.());

    cadEdgesReady = false;
  }

  function getWarmupMaterials() {
    const list = [];
    Object.values(pools.ghost).forEach((g) => g?.material && list.push(g.material));
    if (pools.selectionOverlay) list.push(pools.selectionOverlay);
    Object.values(pools.wireTech).forEach((m) => m && list.push(m));
    Object.values(pools.wireBlueprint).forEach((m) => m && list.push(m));
    Object.values(pools.wireMesh).forEach((m) => m && list.push(m));
    return list;
  }

  return {
    setGroupOpacity,
    setSelectedGroup,
    setElectricalHighlight,
    setRenderStyle,
    getRenderStyle,
    getGeometryStats,
    getMaterialPoolStats,
    getWarmupMaterials,
    prebuildWireframeEdgesAsync,
    isWireframeEdgesReady: () => cadEdgesReady,
    resetAll,
    dispose,
    getSelectedGroup: () => activeSelectedGroup,
    materialHandles: sharedPbrMap,
    groups,
    uniforms,
  };
}

// ============================================================================
// SUBTLE TSL-SHADED OFF-ROAD TIRE DUST PARTICLE SYSTEM
//   - Active ONLY during off-road proving-ground driving (`uModeBlend > 0.15`)
//   - Restrained alpine gravel dust puffs kicked up behind grounded spinning tires
// ============================================================================

let _cachedDustTex = null;

function getDustPuffTexture() {
  if (_cachedDustTex) return _cachedDustTex;
  const N = 128;
  const data = new Uint8Array(N * N * 4);

  let seed = 314159;
  const rnd = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const G = 32;
  const grid = new Float32Array(G * G);
  for (let i = 0; i < G * G; i++) grid[i] = rnd();

  const noise2 = (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3 - 2 * fx);
    const uy = fy * fy * (3 - 2 * fy);
    const x0 = ix & 31;
    const x1 = (ix + 1) & 31;
    const y0 = (iy & 31) << 5;
    const y1 = ((iy + 1) & 31) << 5;
    const a = grid[y0 + x0];
    const b = grid[y0 + x1];
    const c = grid[y1 + x0];
    const d = grid[y1 + x1];
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };

  for (let py = 0; py < N; py++) {
    const v = (py / (N - 1)) * 2.0 - 1.0;
    for (let px = 0; px < N; px++) {
      const u = (px / (N - 1)) * 2.0 - 1.0;
      const r = Math.hypot(u, v);
      const radial = Math.max(0.0, 1.0 - r);
      const soft = Math.pow(radial, 1.9);
      const wisp =
        noise2(px * 0.08, py * 0.08) * 0.55 +
        noise2(px * 0.18 + 5.3, py * 0.18 + 2.7) * 0.45;
      const alpha = Math.max(0.0, Math.min(1.0, soft * (0.55 + wisp * 0.72)));
      const idx = (py * N + px) * 4;
      data[idx + 0] = 205;
      data[idx + 1] = 202;
      data[idx + 2] = 196;
      data[idx + 3] = Math.round(alpha * 255);
    }
  }

  const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  _cachedDustTex = tex;
  return tex;
}

export function createDustSystem(scene, uniforms, maxParticles = 140) {
  const dustTex = getDustPuffTexture();
  const geo = new THREE.PlaneGeometry(1.0, 1.0);

  const alphaArr = new Float32Array(maxParticles);
  const alphaAttr = new THREE.InstancedBufferAttribute(alphaArr, 1);
  geo.setAttribute('aParticleAlpha', alphaAttr);

  const mat = new MeshBasicNodeMaterial({
    name: 'Titan_TireDust_TSL',
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    fog: false,
  });

  mat.colorNode = Fn(() => {
    const pW = positionWorld;
    const heightLift = smoothstep(0.0, 2.2, pW.y).mul(0.18);
    const baseDust = linHex(0xa8a9a6, 0.95);
    const sunlitDust = linHex(0xd4d8dc, 1.05);
    return mix(baseDust, sunlitDust, heightLift);
  })();

  mat.opacityNode = Fn(() => {
    const texA = texture(dustTex, uv()).a;
    const pAlpha = attribute('aParticleAlpha', 'float');
    const modeGate = smoothstep(0.18, 0.68, uniforms.uModeBlend);
    return clamp(texA.mul(pAlpha).mul(modeGate).mul(0.34), 0.0, 0.42);
  })();

  const mesh = new THREE.InstancedMesh(geo, mat, maxParticles);
  mesh.name = 'Titan_TireDustSystem';
  mesh.frustumCulled = false;
  mesh.renderOrder = 4;
  mesh.visible = false;
  mesh.raycast = () => {};

  if (scene) {
    scene.add(mesh);
  }

  const particles = Array.from({ length: maxParticles }, () => ({
    active: false,
    age: 0,
    life: 1.0,
    x: 0,
    y: -100,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    size0: 0.45,
    size1: 2.1,
    rot: 0,
    rotSpd: 0,
    peakAlpha: 0.7,
  }));

  let cursor = 0;
  let spawnAccum = 0;
  const dummy = new THREE.Object3D();
  const camTarget = new THREE.Vector3();

  dummy.position.set(0, -100, 0);
  dummy.scale.setScalar(0.001);
  dummy.updateMatrix();
  for (let i = 0; i < maxParticles; i++) {
    mesh.setMatrixAt(i, dummy.matrix);
    alphaArr[i] = 0.0;
  }
  mesh.instanceMatrix.needsUpdate = true;
  alphaAttr.needsUpdate = true;

  function spawnAt(wx, wy, wz, speedAbs, surface, slip) {
    const p = particles[cursor];
    cursor = (cursor + 1) % maxParticles;

    const surfaceScale =
      surface === 'gravel' ? 1.05 : surface === 'dirt' ? 0.95 : surface === 'rock' ? 0.35 : 0.18;

    p.active = true;
    p.age = 0;
    p.life = 0.75 + Math.random() * 0.75;
    p.x = wx + (Math.random() - 0.5) * 0.48;
    p.y = wy + 0.14 + Math.random() * 0.20;
    p.z = wz + (Math.random() - 0.5) * 0.48;
    p.vx = (Math.random() - 0.5) * (0.9 + speedAbs * 0.08);
    p.vy = 0.55 + Math.min(1.6, speedAbs * 0.09) + Math.random() * 0.45;
    p.vz = (Math.random() - 0.5) * (0.9 + speedAbs * 0.08);
    p.size0 = 0.42 + Math.random() * 0.25;
    p.size1 = 1.55 + Math.min(1.8, speedAbs * 0.08) + Math.random() * 0.75;
    p.rot = Math.random() * Math.PI * 2.0;
    p.rotSpd = (Math.random() - 0.5) * 1.4;
    p.peakAlpha = Math.min(1.0, (0.35 + speedAbs * 0.045 + slip * 0.45) * surfaceScale);
  }

  function clear() {
    for (let i = 0; i < maxParticles; i++) {
      particles[i].active = false;
      alphaArr[i] = 0.0;
    }
    alphaAttr.needsUpdate = true;
    mesh.visible = false;
  }

  function update(dt, wheelContacts, speed = 0, camera = null) {
    const safeDt = Math.min(Math.max(dt || 0, 0), 0.05);
    const modeBlend = uniforms?.uModeBlend?.value ?? 0.0;
    const speedAbs = Math.abs(speed || 0);

    if (uniforms?.uDustIntensity) {
      const targetDust = modeBlend > 0.2 ? Math.min(1.0, (speedAbs / 12.0) * modeBlend) : 0.0;
      const rate = targetDust > uniforms.uDustIntensity.value ? 0.35 : 0.12;
      uniforms.uDustIntensity.value += (targetDust - uniforms.uDustIntensity.value) * Math.min(1.0, safeDt * rate);
    }

    if (modeBlend > 0.22 && speedAbs > 1.4 && Array.isArray(wheelContacts) && wheelContacts.length > 0) {
      const spawnRate = Math.min(58, (speedAbs - 1.0) * 3.4);
      spawnAccum += spawnRate * safeDt;
      while (spawnAccum >= 1.0) {
        spawnAccum -= 1.0;
        const w = wheelContacts[Math.floor(Math.random() * wheelContacts.length)];
        if (!w) continue;
        const grounded = w.grounded ?? w.onGround ?? true;
        if (!grounded) continue;
        const pos = w.contactPoint || w.position || w.worldPos || w;
        if (!pos || typeof pos.x !== 'number') continue;
        const surface = w.surface || 'gravel';
        if (surface === 'concrete' && speedAbs < 6.0) continue;
        const slip = Math.abs(w.slip || 0);
        spawnAt(pos.x, pos.y, pos.z, speedAbs, surface, slip);
      }
    } else {
      spawnAccum = 0;
    }

    if (camera && camera.position) {
      camTarget.copy(camera.position);
    } else if (uniforms?.uCamWorldPos?.value) {
      camTarget.copy(uniforms.uCamWorldPos.value);
    } else {
      camTarget.set(10, 6, 12);
    }

    let activeCount = 0;
    for (let i = 0; i < maxParticles; i++) {
      const p = particles[i];
      if (!p.active) {
        alphaArr[i] = 0.0;
        continue;
      }

      p.age += safeDt;
      if (p.age >= p.life || modeBlend < 0.05) {
        p.active = false;
        alphaArr[i] = 0.0;
        dummy.position.set(0, -100, 0);
        dummy.scale.setScalar(0.001);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        continue;
      }

      activeCount++;
      const f = p.age / p.life;
      const drag = Math.exp(-safeDt * 1.9);
      p.vx *= drag;
      p.vz *= drag;
      p.vy = p.vy * Math.exp(-safeDt * 1.15) + 0.12 * safeDt;

      p.x += p.vx * safeDt;
      p.y += p.vy * safeDt;
      p.z += p.vz * safeDt;
      p.rot += p.rotSpd * safeDt;

      const size = p.size0 + (p.size1 - p.size0) * Math.pow(f, 0.72);
      const fadeIn = Math.min(1.0, f / 0.16);
      const fadeOut = Math.pow(1.0 - f, 1.45);
      alphaArr[i] = p.peakAlpha * fadeIn * fadeOut;

      dummy.position.set(p.x, p.y, p.z);
      dummy.lookAt(camTarget);
      dummy.rotateZ(p.rot);
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.visible = activeCount > 0 && modeBlend > 0.05;
    if (activeCount > 0 || mesh.visible) {
      mesh.instanceMatrix.needsUpdate = true;
      alphaAttr.needsUpdate = true;
    }
  }

  function dispose() {
    if (mesh.parent) mesh.parent.remove(mesh);
    geo.dispose();
    mat.dispose();
  }

  return { mesh, update, clear, dispose };
}
