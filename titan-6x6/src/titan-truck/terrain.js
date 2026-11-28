import * as THREE from 'three';
import {
  MeshStandardNodeMaterial,
  MeshBasicNodeMaterial,
} from 'three/webgpu';
import {
  Fn,
  uniform,
  attribute,
  positionLocal,
  positionWorld,
  normalWorld,
  texture,
  float,
  vec2,
  vec3,
  abs,
  dot,
  mix,
  smoothstep,
  clamp,
  max,
  pow,
  length,
  fract,
} from 'three/tsl';

// ============================================================================
// DETERMINISTIC MATH & TSL HELPERS
// ============================================================================

function clampJS(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}

function smoothstepJS(e0, e1, x) {
  const t = clampJS((x - e0) / (e1 - e0), 0.0, 1.0);
  return t * t * (3.0 - 2.0 * t);
}

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

// ============================================================================
// ALPINE / HIGHLAND GRAVEL PROVING GROUND — DETERMINISTIC HEIGHTFIELD & ZONES
//   Coordinate System (Three.js +Y Up):
//     +X = Forward from launch pad, +Y = Up, +Z = Right (Starboard), -Z = Left
//   Dimensions: 240m x 240m (X, Z in [-120, +120])
//   CRITICAL: Both physics (`getTerrainHeight`) and rendered terrain vertices
//   evaluate the EXACT SAME analytical function below! Pure math — works
//   immediately at t = 0 even before visual offroad mesh finishes building.
// ============================================================================

export const PROVING_GROUND_HALF_SIZE = 120.0;
export const LAUNCH_PAD_RADIUS = 12.0;

// Traversable highland hills & proving climbs (smooth Gaussian summits, 12–19° grades)
const CLIMB_HILLS = [
  { cx: 52.0, cz: 0.5, sx: 14.5, sz: 11.5, h: 2.35 },
  { cx: 72.0, cz: 19.0, sx: 21.0, sz: 16.5, h: 5.55 },
  { cx: 36.0, cz: 54.0, sx: 25.0, sz: 16.0, h: 6.75 },
  { cx: 66.0, cz: -38.0, sx: 19.0, sz: 16.5, h: 4.80 },
  { cx: -48.0, cz: -28.0, sx: 22.0, sz: 18.0, h: 5.35 },
  { cx: -52.0, cz: 36.0, sx: 24.0, sz: 19.5, h: 6.35 },
  { cx: -6.0, cz: -56.0, sx: 24.0, sz: 16.5, h: 4.90 },
];

// Stepped traversable slate rock-crawl ledges (flat-topped with climbable beveled ramps)
const ROCK_LEDGES = [
  { cx: 34.0, cz: 21.5, hx: 5.5, hz: 4.2, ramp: 3.2, h: 0.52 },
  { cx: 43.5, cz: 24.0, hx: 5.2, hz: 4.6, ramp: 3.0, h: 0.92 },
  { cx: 51.5, cz: 27.0, hx: 4.6, hz: 3.8, ramp: 2.8, h: 0.64 },
  { cx: -24.0, cz: 26.0, hx: 6.0, hz: 4.5, ramp: 3.4, h: 0.72 },
];

/**
 * Evaluates full terrain height & surface zone masks at world (x, z).
 * Identical function used by both vertex mesh generation and 120Hz vehicle physics!
 */
function evaluateProvingGroundFull(x, z) {
  const r = Math.hypot(x, z);

  // 1. Flat Concrete Launch Pad around origin (EXACT Y = 0 for r <= 12.0m!)
  const padMask = 1.0 - smoothstepJS(LAUNCH_PAD_RADIUS, LAUNCH_PAD_RADIUS + 4.8, r);
  const offPad = 1.0 - padMask;

  if (offPad <= 0.0001) {
    return {
      y: 0.0,
      padMask: 1.0,
      roadMask: 0.0,
      mogulMask: 0.0,
      rockMask: 0.0,
      rutMask: 0.0,
    };
  }

  // 2. Graded Proving Loop Road + Direct Launch Straightaway (X = +12..+92)
  const ex = (x - 34.0) / 46.0;
  const ez = (z - 8.0) / 38.0;
  const ellR = Math.hypot(ex, ez);
  const ellDistApprox = Math.abs(ellR - 1.0) * 41.5;
  const loopRoad = 1.0 - smoothstepJS(4.4, 8.6, ellDistApprox);
  const loopRut =
    Math.exp(-Math.pow((ellDistApprox - 1.45) / 0.75, 2)) +
    Math.exp(-Math.pow((ellDistApprox + 1.45) / 0.75, 2));

  const straightX = smoothstepJS(11.0, 16.5, x) * (1.0 - smoothstepJS(76.0, 92.0, x));
  const straightZ = 1.0 - smoothstepJS(4.2, 8.2, Math.abs(z));
  const straightRoad = straightX * straightZ;
  const straightRut =
    straightX *
    (Math.exp(-Math.pow((Math.abs(z) - 1.39) / 0.62, 2)));

  const roadMask = clampJS(Math.max(loopRoad, straightRoad), 0.0, 1.0);
  const rutMask = clampJS(Math.max(loopRut * loopRoad * 0.65, straightRut * 0.85), 0.0, 1.0);

  // 3. Dedicated Suspension Articulation Mogul Track (X = +22..+65, Z = -18..-8)
  const mogulX = smoothstepJS(21.0, 26.5, x) * (1.0 - smoothstepJS(59.5, 66.0, x));
  const mogulZ = smoothstepJS(-19.2, -16.8, z) * (1.0 - smoothstepJS(-9.2, -6.8, z));
  const mogulMask = mogulX * mogulZ;

  let mogulHeight = 0.0;
  if (mogulMask > 0.0005) {
    const phase = (x - 23.0) * ((Math.PI * 2.0) / 9.2);
    const waveL = Math.pow(0.5 + 0.5 * Math.sin(phase), 1.55);
    const waveR = Math.pow(0.5 + 0.5 * Math.sin(phase + Math.PI), 1.55);
    const laneL = Math.exp(-Math.pow((z + 14.55) / 1.52, 2));
    const laneR = Math.exp(-Math.pow((z + 11.45) / 1.52, 2));
    mogulHeight = (laneL * waveL + laneR * waveR) * 0.64 * mogulMask;
  }

  // 4. Gentle Starter Proving-Lane Cross-Camber Ripples ahead of launch pad
  const starterX = smoothstepJS(16.5, 20.5, x) * (1.0 - smoothstepJS(35.0, 40.5, x));
  const starterZ = 1.0 - smoothstepJS(3.2, 6.2, Math.abs(z));
  const starterMask = starterX * starterZ;
  let starterRipples = 0.0;
  if (starterMask > 0.0005) {
    const sp = (x - 18.0) * 0.52;
    const asym = Math.sin(sp) * Math.sin(z * 0.58 + 0.45) * 0.24 + (0.5 + 0.5 * Math.sin(sp * 0.72)) * 0.16;
    starterRipples = asym * starterMask;
  }

  // 5. Smooth Traversable Highland Climb Hills (3m–7m)
  let hillY = 0.0;
  for (let i = 0; i < CLIMB_HILLS.length; i++) {
    const hill = CLIMB_HILLS[i];
    const dx = (x - hill.cx) / hill.sx;
    const dz = (z - hill.cz) / hill.sz;
    const d2 = dx * dx + dz * dz;
    if (d2 < 8.5) {
      hillY += hill.h * Math.exp(-d2);
    }
  }
  hillY *= 1.0 - mogulMask * 0.85;

  // 6. Stepped Traversable Rock Crawl Ledges
  let rockLedgeY = 0.0;
  let rockMask = 0.0;
  for (let i = 0; i < ROCK_LEDGES.length; i++) {
    const lg = ROCK_LEDGES[i];
    const dx = Math.max(0.0, Math.abs(x - lg.cx) - lg.hx);
    const dz = Math.max(0.0, Math.abs(z - lg.cz) - lg.hz);
    const edgeDist = Math.hypot(dx, dz);
    if (edgeDist < lg.ramp) {
      const plateau = 1.0 - smoothstepJS(0.0, lg.ramp, edgeDist);
      const strataStep = Math.sin(x * 0.85 + z * 0.65) * 0.045 * plateau;
      rockLedgeY = Math.max(rockLedgeY, plateau * lg.h + strataStep);
      rockMask = Math.max(rockMask, smoothstepJS(0.15, 0.72, plateau));
    }
  }

  // 7. Organic Alpine Highland Undulation
  const f1 = Math.sin(x * 0.048 + z * 0.036 + 0.7) * Math.cos(x * 0.031 - z * 0.052 + 1.2);
  const f2 = Math.sin(x * 0.115 - z * 0.092 + 2.1) * Math.cos(x * 0.088 + z * 0.108 - 0.5);
  const f3 = Math.sin(x * 0.26 + z * 0.22 - 0.9) * Math.cos(x * 0.21 - z * 0.29 + 1.7);
  const calmFactor = 1.0 - clampJS(roadMask * 0.72 + mogulMask * 0.92, 0.0, 0.94);
  const organicY = (f1 * 0.85 + f2 * 0.34 + f3 * 0.11) * calmFactor;

  // 8. Natural Proving-Ground Perimeter Amphitheater Rim (r = 92..120m)
  const rimT = smoothstepJS(90.0, PROVING_GROUND_HALF_SIZE, r);
  const rimAng = Math.atan2(z, x);
  const rimVar = 1.0 + 0.28 * Math.sin(rimAng * 5.0 + 0.8) + 0.16 * Math.cos(rimAng * 11.0 - 0.4);
  const rimY = Math.pow(rimT, 1.75) * 18.5 * rimVar;
  rockMask = clampJS(Math.max(rockMask, smoothstepJS(0.28, 0.78, rimT)), 0.0, 1.0);

  const totalY = (hillY + organicY + mogulHeight + starterRipples + rockLedgeY + rimY) * offPad;

  return {
    y: totalY,
    padMask,
    roadMask: roadMask * offPad,
    mogulMask: mogulMask * offPad,
    rockMask: rockMask * offPad,
    rutMask: rutMask * offPad,
  };
}

// ============================================================================
// DETERMINISTIC PHYSICS TERRAIN SAMPLER EXPORTS
// ============================================================================

export function getTerrainHeight(x, z, mode = 'offroad') {
  if (mode === 'studio') return 0.0;
  return evaluateProvingGroundFull(x, z).y;
}

export function getTerrainNormal(x, z, mode = 'offroad', targetVec = new THREE.Vector3()) {
  if (mode === 'studio') {
    return targetVec.set(0.0, 1.0, 0.0);
  }
  const eps = 0.25;
  const hL = evaluateProvingGroundFull(x - eps, z).y;
  const hR = evaluateProvingGroundFull(x + eps, z).y;
  const hD = evaluateProvingGroundFull(x, z - eps).y;
  const hU = evaluateProvingGroundFull(x, z + eps).y;
  return targetVec.set(hL - hR, 2.0 * eps, hD - hU).normalize();
}

export function getSurfaceGrip(x, z, mode = 'offroad') {
  if (mode === 'studio') {
    return { grip: 1.02, surface: 'concrete' };
  }
  const info = evaluateProvingGroundFull(x, z);
  if (info.padMask > 0.55) {
    return { grip: 1.04, surface: 'concrete' };
  }
  if (info.rockMask > 0.42) {
    return { grip: 0.79, surface: 'rock' };
  }
  if (info.mogulMask > 0.25) {
    return { grip: 0.85, surface: 'gravel' };
  }
  if (info.roadMask > 0.35) {
    return { grip: 0.93, surface: 'dirt' };
  }
  const n = getTerrainNormal(x, z, 'offroad', _tmpNorm);
  if (n.y < 0.86) {
    return { grip: 0.78, surface: 'rock' };
  }
  return { grip: 0.86, surface: 'gravel' };
}

const _tmpNorm = new THREE.Vector3();

// ============================================================================
// NON-DESTRUCTIBLE OBSTACLE COLLIDERS (EXACT MATCH TO VISUAL BOULDERS/MARKERS)
// ============================================================================

const RAW_OBSTACLE_SPECS = [
  { x: 25.5, z: 14.2, radius: 1.85, height: 1.55, kind: 'boulder', rotY: 0.4, sx: 1.15, sz: 0.92 },
  { x: 30.8, z: 31.5, radius: 2.35, height: 2.05, kind: 'boulder', rotY: 1.2, sx: 1.12, sz: 0.96 },
  { x: 47.5, z: 13.8, radius: 1.95, height: 1.65, kind: 'boulder', rotY: 2.1, sx: 1.08, sz: 0.94 },
  { x: 58.2, z: 33.4, radius: 2.65, height: 2.30, kind: 'boulder', rotY: 0.9, sx: 1.18, sz: 0.88 },
  { x: 76.0, z: -16.5, radius: 2.80, height: 2.45, kind: 'boulder', rotY: 2.7, sx: 1.10, sz: 0.95 },
  { x: 44.5, z: -27.5, radius: 2.25, height: 1.85, kind: 'boulder', rotY: 1.7, sx: 1.14, sz: 0.92 },
  { x: 18.0, z: -28.0, radius: 2.10, height: 1.75, kind: 'boulder', rotY: 0.2, sx: 1.06, sz: 0.95 },
  { x: -21.5, z: -17.0, radius: 2.40, height: 2.10, kind: 'boulder', rotY: 2.4, sx: 1.15, sz: 0.90 },
  { x: -34.0, z: 12.5, radius: 2.55, height: 2.20, kind: 'boulder', rotY: 1.1, sx: 1.10, sz: 0.92 },
  { x: -19.5, z: 36.0, radius: 2.30, height: 1.95, kind: 'boulder', rotY: 0.7, sx: 1.16, sz: 0.90 },
  { x: 12.0, z: 42.5, radius: 2.50, height: 2.15, kind: 'boulder', rotY: 2.9, sx: 1.12, sz: 0.95 },
  { x: 84.0, z: 8.0, radius: 2.75, height: 2.40, kind: 'boulder', rotY: 1.5, sx: 1.10, sz: 0.92 },
  { x: -42.0, z: -46.0, radius: 2.90, height: 2.65, kind: 'boulder', rotY: 0.5, sx: 1.18, sz: 0.90 },
  { x: 28.0, z: -48.0, radius: 2.60, height: 2.25, kind: 'boulder', rotY: 2.0, sx: 1.12, sz: 0.94 },
  { x: -62.0, z: 4.0, radius: 3.10, height: 2.75, kind: 'boulder', rotY: 1.3, sx: 1.15, sz: 0.92 },
  { x: 60.0, z: 54.0, radius: 2.85, height: 2.50, kind: 'boulder', rotY: 2.6, sx: 1.14, sz: 0.90 },
  { x: 20.5, z: -19.6, radius: 0.45, height: 2.15, kind: 'marker', rotY: 0.0, sx: 1.0, sz: 1.0 },
  { x: 20.5, z: -7.3, radius: 0.45, height: 2.15, kind: 'marker', rotY: 0.0, sx: 1.0, sz: 1.0 },
  { x: 66.5, z: -19.6, radius: 0.45, height: 2.15, kind: 'marker', rotY: 0.0, sx: 1.0, sz: 1.0 },
  { x: 66.5, z: -7.3, radius: 0.45, height: 2.15, kind: 'marker', rotY: 0.0, sx: 1.0, sz: 1.0 },
];

let _cachedColliders = null;

export function getObstacleColliders() {
  if (!_cachedColliders) {
    _cachedColliders = RAW_OBSTACLE_SPECS.map((spec) => ({
      x: spec.x,
      z: spec.z,
      y: getTerrainHeight(spec.x, spec.z, 'offroad'),
      radius: spec.radius,
      height: spec.height,
      kind: spec.kind,
    }));
  }
  return _cachedColliders;
}

// ============================================================================
// INCREMENTAL SEAMLESS ALPINE GRAVEL & SLATE ROCK TEXTURE SUITE
//   - Supports chunked row-by-row idle building (0 dropped frames!) OR instant
//     synchronous completion if Drive is entered before background warm-up ends.
//   - Kept strictly separate (`detailMap` vs `normalMap`) for WebGL2 safety.
// ============================================================================

let _cachedTerrainMaps = null;

function createProvingGroundMapsBuilder() {
  if (_cachedTerrainMaps) {
    return {
      isDone: () => true,
      stepRows: () => true,
      finish: () => _cachedTerrainMaps,
    };
  }

  const G = 128;
  const GM = 127;
  const grid = new Float32Array(G * G);
  let seed = 824619;
  for (let i = 0; i < G * G; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    grid[i] = seed / 4294967296;
  }

  const sampleP = (u, v, period, ox = 0, oy = 0) => {
    const x = u * period;
    const y = v * period;
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const fx = x - ix;
    const fy = y - iy;
    const ux = fx * fx * (3.0 - 2.0 * fx);
    const uy = fy * fy * (3.0 - 2.0 * fy);
    const x0 = (((ix % period) + period) % period + ox) & GM;
    const x1 = ((((ix + 1) % period) + period) % period + ox) & GM;
    const y0 = ((((iy % period) + period) % period + oy) & GM) << 7;
    const y1 = (((((iy + 1) % period) + period) % period + oy) & GM) << 7;
    const a = grid[y0 + x0];
    const b = grid[y0 + x1];
    const c = grid[y1 + x0];
    const d = grid[y1 + x1];
    return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
  };

  const ridgedP = (u, v, period, ox, oy) => {
    const n = sampleP(u, v, period, ox, oy) * 2.0 - 1.0;
    const r = 1.0 - Math.abs(n);
    return r * r;
  };

  const N = 512;
  const NM = 511;
  const heightField = new Float32Array(N * N);
  const detailData = new Uint8Array(N * N * 4);
  const normalData = new Uint8Array(N * N * 4);

  let detailRow = 0;
  let normalRow = 0;
  let done = false;

  const finalizeTextures = () => {
    if (_cachedTerrainMaps) {
      done = true;
      return _cachedTerrainMaps;
    }
    const makeTex = (data) => {
      const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.colorSpace = THREE.NoColorSpace;
      tex.needsUpdate = true;
      return tex;
    };
    _cachedTerrainMaps = {
      detailMap: makeTex(detailData),
      normalMap: makeTex(normalData),
    };
    done = true;
    return _cachedTerrainMaps;
  };

  const stepRows = (maxRows = 24) => {
    if (done) return true;
    let count = 0;

    while (detailRow < N && count < maxRows) {
      const y = detailRow++;
      const v = y / N;
      for (let x = 0; x < N; x++) {
        const u = x / N;
        const i = y * N + x;

        const pebble =
          sampleP(u, v, 32, 7, 19) * 0.45 +
          sampleP(u, v, 64, 41, 83) * 0.35 +
          sampleP(u, v, 112, 97, 29) * 0.20;

        const dirt =
          sampleP(u, v, 8, 13, 53) * 0.55 +
          sampleP(u, v, 20, 71, 11) * 0.30 +
          sampleP(u, v, 44, 31, 67) * 0.15;

        const r1 = ridgedP(u, v, 6, 17, 47);
        const r2 = ridgedP(u, v, 16, 59, 23);
        const strata = Math.sin((v * 10.0 + sampleP(u, v, 4, 29, 73) * 1.2) * Math.PI * 2.0) * 0.5 + 0.5;
        const slate = clampJS(r1 * 0.52 + r2 * 0.30 + strata * 0.18, 0.0, 1.0);

        const macro = sampleP(u, v, 4, 89, 37) * 0.65 + sampleP(u, v, 10, 19, 101) * 0.35;

        heightField[i] = pebble * 0.42 + dirt * 0.26 + slate * 0.32;

        const idx = i * 4;
        detailData[idx + 0] = Math.round(clampJS(pebble, 0, 1) * 255);
        detailData[idx + 1] = Math.round(clampJS(dirt, 0, 1) * 255);
        detailData[idx + 2] = Math.round(clampJS(slate, 0, 1) * 255);
        detailData[idx + 3] = Math.round(clampJS(macro, 0, 1) * 255);
      }
      count++;
    }

    if (detailRow >= N) {
      const nStrength = 4.2;
      while (normalRow < N && count < maxRows * 3) {
        const y = normalRow++;
        const ym = (y - 1) & NM;
        const yp = (y + 1) & NM;
        for (let x = 0; x < N; x++) {
          const xm = (x - 1) & NM;
          const xp = (x + 1) & NM;
          const i = y * N + x;
          const dx = (heightField[y * N + xp] - heightField[y * N + xm]) * nStrength;
          const dz = (heightField[yp * N + x] - heightField[ym * N + x]) * nStrength;
          const inv = 1.0 / Math.sqrt(dx * dx + dz * dz + 1.0);
          const idx = i * 4;
          normalData[idx + 0] = Math.round((-dx * inv * 0.5 + 0.5) * 255);
          normalData[idx + 1] = Math.round((-dz * inv * 0.5 + 0.5) * 255);
          normalData[idx + 2] = Math.round((inv * 0.5 + 0.5) * 255);
          normalData[idx + 3] = 255;
        }
        count++;
      }
    }

    if (detailRow >= N && normalRow >= N) {
      finalizeTextures();
      return true;
    }
    return false;
  };

  const finish = () => {
    while (!done) {
      stepRows(N);
    }
    return _cachedTerrainMaps;
  };

  return {
    isDone: () => done,
    stepRows,
    finish,
  };
}

// ============================================================================
// 1. LIGHTWEIGHT ARCHITECTURAL STUDIO ENVIRONMENT (`studioGroup`)
//    - Builds in < 3 ms synchronously on page load!
//    - ZERO `floorMat.needsUpdate = true` & ZERO `.transparent` mutation ever!
//      Uses immutable `floorMat` (opaque) + pre-built `floorFadeMat` (crossfade)
//      and drives Alabaster <-> Blueprint purely via `uStudioBlueprint` uniform.
// ============================================================================

function buildStudioContactShadowMaterial(uniforms, uStudioBlueprint) {
  const mat = new MeshBasicNodeMaterial({
    name: 'Titan_StudioContactShadow_TSL',
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });

  mat.colorNode = Fn(() => {
    // Cool architectural shadow tint (soft slate on pure white Showcase, soft cobalt on light X-Ray Vellum)
    return mix(linHex(0x162231, 1.0), linHex(0x1e4d7a, 1.0), uStudioBlueprint);
  })();

  mat.opacityNode = Fn(() => {
    const pW = positionWorld;
    const lx = pW.x.sub(uniforms.uTruckPos.x);
    const lz = pW.z.sub(uniforms.uTruckPos.z);

    // Soft ambient occlusion under the chassis belly
    const bellyD = length(vec2(lx.div(4.75), lz.div(1.85)));
    const bellyAO = invSmoothstep(0.25, 1.42, bellyD).mul(0.13);

    // Subtle directional key-light ground shadow offset slightly back-left from the front-right key light
    const keyShadowD = length(vec2(lx.add(0.65).div(5.25), lz.add(0.55).div(2.25)));
    const keyShadow = invSmoothstep(0.35, 1.48, keyShadowD).mul(0.09);

    // Six crisp localized tire contact shadows (exact axle & track coordinates)
    const wheelAO = (ax, az) => {
      const wd = length(vec2(lx.sub(float(ax)).div(1.08), lz.sub(float(az)).div(0.64)));
      return invSmoothstep(0.16, 1.18, wd).mul(0.24);
    };

    const wF = max(wheelAO(2.18, 1.39), wheelAO(2.18, -1.39));
    const wM = max(wheelAO(-1.36, 1.39), wheelAO(-1.36, -1.39));
    const wR = max(wheelAO(-3.58, 1.39), wheelAO(-3.58, -1.39));
    const tiresAO = max(wF, max(wM, wR));

    // Guarantee exact 0.000 alpha well inside the quad edges (ZERO visible edge, ZERO disc!)
    const edgeMask = invSmoothstep(5.8, 8.2, length(vec2(lx.mul(0.92), lz.mul(1.55))));
    const studioGate = invSmoothstep(0.02, 0.55, uniforms.uModeBlend);
    const bpScale = mix(float(1.0), float(0.45), uStudioBlueprint);

    return clamp(max(max(bellyAO, keyShadow), tiresAO), 0.0, 0.27)
      .mul(edgeMask)
      .mul(studioGate)
      .mul(bpScale);
  })();

  return mat;
}

function buildStudioGroup(uniforms, uStudioBlueprint) {
  const group = new THREE.Group();
  group.name = 'Titan_StudioEnvironment';

  // Pure TSL soft contact + directional ground shadow plane directly on the uniform white canvas
  // (100% WebGPU & WebGL2 native — ZERO visible disk, ZERO visible floor sheet, ZERO ShadowMaterial!)
  const floorGeo = new THREE.PlaneGeometry(22, 14);
  floorGeo.rotateX(-Math.PI * 0.5);

  const floorMat = buildStudioContactShadowMaterial(uniforms, uStudioBlueprint);
  const floorFadeMat = floorMat;

  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.name = 'Studio_ContactShadow';
  floorMesh.receiveShadow = false;
  floorMesh.castShadow = false;
  floorMesh.position.y = 0.001;
  floorMesh.renderOrder = 0;
  floorMesh.raycast = () => {};
  group.add(floorMesh);

  // Uniform studio background dome (100% uniform #F6F7F9 white in Showcase; #EFF4FA in light X-Ray Vellum)
  const domeGeo = new THREE.SphereGeometry(285, 32, 16);
  const domeMat = new MeshBasicNodeMaterial({
    name: 'Studio_CycloramaDome_TSL',
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
  });

  domeMat.colorNode = Fn(() => {
    const uniformWhite = linHex(0xf6f7f9, 1.0);
    const uniformVellum = linHex(0xeff4fa, 1.0);
    return mix(uniformWhite, uniformVellum, uStudioBlueprint);
  })();

  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  domeMesh.name = 'Studio_CycloramaDome';
  domeMesh.frustumCulled = false;
  domeMesh.raycast = () => {};
  group.add(domeMesh);

  return { group, floorMesh, floorMat, floorFadeMat, domeMesh, domeMat };
}

// ============================================================================
// 2. DEFERRED INCREMENTAL ALPINE PROVING GROUND BUILDER (`offroadGroup`)
//    - Builds incrementally in background idle slices after first Hero frame
//    - Or completes remaining slices synchronously on `ensureOffroadBuilt()`
// ============================================================================

function createGradedTerrainGeometryBuilder(segs = 216) {
  const row = segs + 1;
  const count = row * row;
  const pos = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const cols = new Float32Array(count * 3);
  const extra = new Float32Array(count * 2);

  const mapCoord = (t) => {
    const s = t * 2.0 - 1.0;
    const mag = Math.abs(s);
    const innerSplit = 0.78;
    const innerSpan = 72.0;
    const outerSpan = PROVING_GROUND_HALF_SIZE;
    const shaped =
      mag <= innerSplit
        ? (mag / innerSplit) * innerSpan
        : innerSpan + Math.pow((mag - innerSplit) / (1.0 - innerSplit), 1.42) * (outerSpan - innerSpan);
    return Math.sign(s) * shaped;
  };

  // Precompute 1D coordinate lookup table once (saves ~94,000 Math.pow calls!)
  const coords = new Float32Array(row);
  for (let i = 0; i <= segs; i++) {
    coords[i] = mapCoord(i / segs);
  }

  let curZ = 0;
  let geo = null;

  const stepRows = (maxRows = 16) => {
    if (geo) return true;
    let doneCount = 0;
    while (curZ <= segs && doneCount < maxRows) {
      const iz = curZ++;
      const z = coords[iz];
      const baseIdx = iz * row;
      let pi = baseIdx * 3;
      let ui = baseIdx * 2;
      let ci = baseIdx * 3;
      let ei = baseIdx * 2;

      for (let ix = 0; ix <= segs; ix++) {
        const x = coords[ix];
        const info = evaluateProvingGroundFull(x, z);
        pos[pi++] = x;
        pos[pi++] = info.y;
        pos[pi++] = z;

        uvs[ui++] = x * 0.14;
        uvs[ui++] = z * 0.14;

        cols[ci++] = info.roadMask;
        cols[ci++] = info.padMask;
        cols[ci++] = info.rockMask;

        extra[ei++] = info.mogulMask;
        extra[ei++] = info.rutMask;
      }
      doneCount++;
    }
    return curZ > segs;
  };

  const finalize = () => {
    if (geo) return geo;
    while (curZ <= segs) {
      stepRows(row);
    }

    const indices = new Uint32Array(segs * segs * 6);
    let ii = 0;
    for (let iz = 0; iz < segs; iz++) {
      for (let ix = 0; ix < segs; ix++) {
        const a = iz * row + ix;
        const b = a + 1;
        const c = a + row;
        const d = c + 1;
        indices[ii++] = a;
        indices[ii++] = c;
        indices[ii++] = b;
        indices[ii++] = b;
        indices[ii++] = c;
        indices[ii++] = d;
      }
    }

    geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    geo.setAttribute('aZoneExtra', new THREE.BufferAttribute(extra, 2));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    return geo;
  };

  return {
    rowsDone: () => curZ > segs,
    stepRows,
    finalize,
  };
}

function buildBoulderGeometry() {
  const geo = new THREE.IcosahedronGeometry(1.0, 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);
    const a = Math.atan2(z, x);
    const facet1 = Math.sin(x * 3.1 + y * 2.4 - z * 2.8) * 0.12;
    const facet2 = Math.cos(a * 3.0 + y * 4.2) * 0.08;
    const scale = 0.88 + facet1 + facet2;
    x *= scale;
    z *= scale;
    y = y < 0 ? y * 0.52 : Math.pow(y, 0.88) * 0.84 * scale;
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

function buildDistantHighlandHills(uniforms) {
  const segsA = 192;
  const segsH = 14;
  const innerR = 122.0;
  const outerR = 258.0;

  const ridge = (a, freq, phase) => 1.0 - Math.abs(Math.sin(a * freq + phase));
  const evalRidgeHeight = (ang) => {
    return (
      12.0 +
      Math.pow(ridge(ang, 2.0, 0.5), 1.35) * 19.0 +
      Math.pow(ridge(ang, 5.0, 1.9), 1.85) * 16.0 +
      Math.pow(ridge(ang, 9.0, 0.4), 2.10) * 9.5 +
      Math.pow(ridge(ang, 17.0, 2.3), 2.20) * 4.2
    );
  };

  const positions = [];
  const uvs = [];
  const indices = [];

  for (let ih = 0; ih <= segsH; ih++) {
    const f = ih / segsH;
    for (let ia = 0; ia <= segsA; ia++) {
      const ang = (ia / segsA) * Math.PI * 2.0;
      const peakH = evalRidgeHeight(ang);
      const r = innerR + (outerR - innerR) * Math.pow(f, 0.86);
      const y = -2.5 + Math.sin(f * Math.PI * 0.82) * peakH + f * 6.0;
      positions.push(Math.cos(ang) * r, y, Math.sin(ang) * r);
      uvs.push((ia / segsA) * 14.0, f * 2.0);
    }
  }

  const row = segsA + 1;
  for (let ih = 0; ih < segsH; ih++) {
    for (let ia = 0; ia < segsA; ia++) {
      const a = ih * row + ia;
      const b = a + 1;
      const c = a + row;
      const d = c + 1;
      indices.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  const mat = new MeshBasicNodeMaterial({
    name: 'ProvingGround_DistantHills_TSL',
    side: THREE.DoubleSide,
    fog: false,
  });

  mat.colorNode = Fn(() => {
    const nW = normalWorld.normalize();
    const pW = positionWorld;
    const sunDir = uniforms.uSunDir.normalize();
    const ndl = clamp(dot(nW, sunDir).mul(0.55).add(0.45), 0.0, 1.0);

    const slateShadow = linHex(0x526070, 1.0);
    const slateLit = linHex(0x8898aa, 1.0);
    const crestFrost = linHex(0xb8c6d4, 1.0);
    let col = mix(slateShadow, slateLit, ndl);
    col = mix(col, crestFrost, smoothstep(24.0, 44.0, pW.y).mul(smoothstep(0.45, 0.82, nW.y)).mul(0.55));

    const dist = length(vec2(pW.x, pW.z));
    const haze = clamp(smoothstep(115.0, 265.0, dist).mul(0.68).add(invSmoothstep(-2.0, 16.0, pW.y).mul(0.45)), 0.0, 0.84);
    const skyHor = linHex(0xd8e4f0, 1.0);
    return mix(col, skyHor, haze);
  })();

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'ProvingGround_DistantHighlandHills';
  mesh.frustumCulled = false;
  mesh.raycast = () => {};
  return mesh;
}

function buildProvingGroundSkyDome(uniforms, uStudioBlueprint, detailMap) {
  const geo = new THREE.SphereGeometry(320, 48, 24);

  const mat = new MeshBasicNodeMaterial({
    name: 'ProvingGround_AlpineSky_TSL',
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
  });

  mat.colorNode = Fn(() => {
    const dir = positionLocal.normalize();
    const elev = clamp(dir.y, -0.2, 1.0);
    const sunDir = uniforms.uSunDir.normalize();
    const t = uniforms.uTime;

    const cHor = linHex(0xdbe6f1, 1.04);
    const cMid = linHex(0xb3c9e0, 1.02);
    const cZen = linHex(0x7c9ec2, 1.00);

    let sky = mix(cHor, cMid, smoothstep(0.0, 0.28, elev));
    sky = mix(sky, cZen, smoothstep(0.24, 0.84, elev));

    const sunDot = max(dot(dir, sunDir), float(0.0));
    const sunHalo = safePow(sunDot, 6.0).mul(0.14).add(safePow(sunDot, 48.0).mul(0.22));
    sky = sky.add(linHex(0xfffbf2, 1.25).mul(sunHalo));

    const cloudUV = vec2(
      dir.x.div(max(elev.add(0.28), float(0.28))).mul(0.22).add(t.mul(0.0025)),
      dir.z.div(max(elev.add(0.28), float(0.28))).mul(0.22).add(t.mul(0.0012))
    );
    const cSample = texture(detailMap, cloudUV);
    const cloudBand = smoothstep(0.04, 0.22, elev).mul(invSmoothstep(0.75, 0.96, elev));
    const cloudDens = smoothstep(0.38, 0.78, cSample.a).mul(cloudBand).mul(0.32);
    sky = mix(sky, linHex(0xf0f5fa, 1.06), cloudDens);

    sky = mix(linHex(0x8894a0, 1.0), sky, smoothstep(-0.08, 0.015, elev));

    const studioAlabaster = mix(linHex(0xeef1f5, 1.0), linHex(0xdde5ef, 1.0), smoothstep(0.24, 0.88, elev));
    const studioBlueprint = mix(linHex(0x081424, 1.0), linHex(0x040b16, 1.0), smoothstep(0.24, 0.88, elev));
    const studioSky = mix(studioAlabaster, studioBlueprint, uStudioBlueprint);
    return mix(studioSky, sky, smoothstep(0.02, 0.96, uniforms.uModeBlend));
  })();

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'ProvingGround_SkyDome';
  mesh.frustumCulled = false;
  mesh.raycast = () => {};
  return mesh;
}

function buildTerrainMaterial(uniforms, detailMap, normalMap) {
  const terrainMat = new MeshStandardNodeMaterial({
    name: 'ProvingGround_AlpineTerrain_TSL',
    roughness: 0.88,
    metalness: 0.03,
    normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    envMapIntensity: 0.42,
  });

  terrainMat.colorNode = Fn(() => {
    const pW = positionWorld;
    const nW = normalWorld.normalize();
    const zone = attribute('color', 'vec3');
    const extra = attribute('aZoneExtra', 'vec2');

    const roadW = zone.x;
    const padW = zone.y;
    const rockZone = zone.z;
    const mogulW = extra.x;
    const rutW = extra.y;

    const uvMacro = vec2(pW.x.mul(0.035), pW.z.mul(0.035));
    const uvMid = vec2(pW.x.mul(0.16), pW.z.mul(0.16));
    const uvSide = vec2(pW.x.add(pW.z).mul(0.11), pW.y.mul(0.28));

    const dMacro = texture(detailMap, uvMacro);
    const dMid = texture(detailMap, uvMid);
    const dSide = texture(detailMap, uvSide);

    const gravelTex = dMid.r.mul(0.65).add(dMacro.r.mul(0.35));
    const dirtTex = dMid.g.mul(0.60).add(dMacro.a.mul(0.40));
    const slateTex = mix(dMid.b, dSide.b, invSmoothstep(0.60, 0.90, nW.y));

    let col = mix(linHex(0x6e767f, 1.0), linHex(0x9ca4ac, 1.0), gravelTex);
    col = mix(col, linHex(0x82847e, 1.0), dMacro.a.mul(0.45));

    const dirtCol = mix(linHex(0x5e5e59, 1.0), linHex(0x84827a, 1.0), dirtTex);
    col = mix(col, dirtCol, roadW.mul(0.82));
    col = mix(col, linHex(0x464a4f, 1.0), rutW.mul(0.42));

    const mogulCol = mix(linHex(0x7c848c, 1.0), linHex(0xa8b0b8, 1.0), gravelTex);
    col = mix(col, mogulCol, mogulW.mul(0.76));

    const steepSlope = invSmoothstep(0.74, 0.91, nW.y);
    const rockBlend = clamp(max(steepSlope, rockZone.mul(0.92)), 0.0, 1.0);
    const rockCol = mix(linHex(0x363f48, 1.0), linHex(0x606b76, 1.0), slateTex);
    col = mix(col, rockCol, rockBlend);

    const padRadius = length(vec2(pW.x, pW.z));
    const camToP = pW.sub(uniforms.uCamWorldPos);
    const camDist = length(camToP);
    const sinElev = max(abs(camToP.y).div(max(camDist, float(0.1))), float(0.18));
    const fwPad = clamp(camDist.mul(0.0022).div(sinElev), 0.014, 0.24);
    const padAaFade = invSmoothstep(26.0, 54.0, camDist);

    const jointDistX = abs(fract(pW.x.mul(0.25)).sub(0.5)).mul(4.0);
    const jointDistZ = abs(fract(pW.z.mul(0.25)).sub(0.5)).mul(4.0);
    const jSoft = max(float(0.045), fwPad.mul(1.75));
    const jEnergy = clamp(float(0.04).div(max(float(0.04), fwPad.mul(0.9))), 0.16, 1.0);
    const jointX = invSmoothstep(float(0.016), float(0.036).add(jSoft), jointDistX).mul(jEnergy);
    const jointZ = invSmoothstep(float(0.016), float(0.036).add(jSoft), jointDistZ).mul(jEnergy);
    const joints = max(jointX, jointZ).mul(0.22).mul(padAaFade);

    let padCol = mix(linHex(0xb4bcc6, 1.0), linHex(0xc8cfd8, 1.0), dMid.r.mul(0.5).add(0.25));
    padCol = padCol.mul(float(1.0).sub(joints));
    const ringSoft = max(float(0.09), fwPad.mul(1.6));
    const padBorder = invSmoothstep(float(0.05), float(0.11).add(ringSoft), abs(padRadius.sub(11.2)));
    padCol = mix(padCol, linHex(0x008ce6, 1.02), padBorder.mul(0.68));
    col = mix(col, padCol, padW);

    const truckDX = pW.x.sub(uniforms.uTruckPos.x);
    const truckDZ = pW.z.sub(uniforms.uTruckPos.z);
    const truckProx = invSmoothstep(1.8, 6.2, length(vec2(truckDX, truckDZ)));
    col = col.mul(float(1.0).sub(truckProx.mul(0.18)));

    const horizDist = length(vec2(pW.x, pW.z));
    const farMist = smoothstep(94.0, 126.0, horizDist);
    return mix(col, linHex(0xd0dce8, 1.0), farMist.mul(0.45));
  })();

  terrainMat.roughnessNode = Fn(() => {
    const zone = attribute('color', 'vec3');
    const padW = zone.y;
    const rockZone = zone.z;
    const rBase = mix(float(0.90), float(0.76), padW);
    return clamp(mix(rBase, float(0.82), rockZone), 0.65, 0.96);
  })();

  return terrainMat;
}

function buildProvingGroundProps(group, uniforms, uStudioBlueprint, detailMap, normalMap) {
  const colliders = getObstacleColliders();
  const boulderSpecs = [];
  const markerSpecs = [];
  for (let i = 0; i < RAW_OBSTACLE_SPECS.length; i++) {
    const raw = RAW_OBSTACLE_SPECS[i];
    const col = colliders[i];
    if (raw.kind === 'boulder') {
      boulderSpecs.push({ ...raw, y: col.y });
    } else {
      markerSpecs.push({ ...raw, y: col.y });
    }
  }

  const boulderGeo = buildBoulderGeometry();
  const boulderMat = new MeshStandardNodeMaterial({
    name: 'ProvingGround_SlateBoulders_TSL',
    roughness: 0.84,
    metalness: 0.06,
    normalMap,
    normalScale: new THREE.Vector2(1.15, 1.15),
    envMapIntensity: 0.45,
  });

  boulderMat.colorNode = Fn(() => {
    const pW = positionWorld;
    const nW = normalWorld.normalize();
    const s = texture(detailMap, vec2(pW.x.mul(0.28), pW.z.mul(0.28).add(pW.y.mul(0.32))));
    const darkSlate = linHex(0x363e47, 1.0);
    const paleGranite = linHex(0x6d7782, 1.0);
    let col = mix(darkSlate, paleGranite, s.b.mul(0.7).add(s.r.mul(0.3)));
    const topDust = smoothstep(0.55, 0.90, nW.y).mul(0.32);
    col = mix(col, linHex(0x9ea6ae, 1.0), topDust);
    return col;
  })();

  const boulderMesh = new THREE.InstancedMesh(boulderGeo, boulderMat, boulderSpecs.length);
  boulderMesh.name = 'ProvingGround_SlateBoulders';
  boulderMesh.castShadow = true;
  boulderMesh.receiveShadow = true;
  const dummy = new THREE.Object3D();
  boulderSpecs.forEach((b, idx) => {
    dummy.position.set(b.x, b.y + b.height * 0.26, b.z);
    dummy.rotation.set(0.08 * Math.sin(idx * 2.1), b.rotY, 0.06 * Math.cos(idx * 1.7));
    dummy.scale.set(b.radius * b.sx, b.height, b.radius * b.sz);
    dummy.updateMatrix();
    boulderMesh.setMatrixAt(idx, dummy.matrix);
  });
  boulderMesh.instanceMatrix.needsUpdate = true;
  group.add(boulderMesh);

  if (markerSpecs.length > 0) {
    const markerGroup = new THREE.Group();
    markerGroup.name = 'ProvingGround_Markers';
    const postGeo = new THREE.BoxGeometry(0.34, 1.95, 0.34);
    const bandGeo = new THREE.BoxGeometry(0.38, 0.24, 0.38);
    const postMat = new MeshStandardNodeMaterial({
      name: 'ProvingGround_MarkerSteel',
      color: new THREE.Color(0x2c343e),
      roughness: 0.42,
      metalness: 0.65,
    });
    const bandMat = new MeshStandardNodeMaterial({
      name: 'ProvingGround_MarkerCyan',
      color: new THREE.Color(0x1096e6),
      roughness: 0.32,
      metalness: 0.35,
      emissive: new THREE.Color(0x0c74bc),
      emissiveIntensity: 0.55,
    });

    markerSpecs.forEach((m, i) => {
      const pylon = new THREE.Group();
      pylon.name = `ProvingGround_Pylon_${i + 1}`;
      pylon.position.set(m.x, m.y, m.z);

      const post = new THREE.Mesh(postGeo, postMat);
      post.position.y = 0.92;
      post.castShadow = true;
      post.receiveShadow = true;
      pylon.add(post);

      const band = new THREE.Mesh(bandGeo, bandMat);
      band.position.y = 1.62;
      pylon.add(band);

      markerGroup.add(pylon);
    });
    group.add(markerGroup);
  }

  const distantHills = buildDistantHighlandHills(uniforms);
  group.add(distantHills);

  const skyDome = buildProvingGroundSkyDome(uniforms, uStudioBlueprint, detailMap);
  group.add(skyDome);

  return { boulderMesh, distantHills, skyDome };
}

// ============================================================================
// UNIFIED ENVIRONMENT CONTROLLER (`createEnvironments`)
//   - Immediately builds lightweight Studio (< 3 ms) on startup
//   - Defers heavy 240m x 240m Proving Ground mesh + maps to idle frames via
//     `prebuildOffroadAsync()` OR on-demand `ensureOffroadBuilt()`
//   - ZERO `material.needsUpdate = true` anywhere!
// ============================================================================

export function createEnvironments(scene, uniforms) {
  const uStudioBlueprint = uniforms?.uStudioBlueprint || uniform(0.0);
  const studio = buildStudioGroup(uniforms, uStudioBlueprint);

  // Pre-create empty offroad container so `envController.offroadGroup` is valid from frame 0
  const offroadGroup = new THREE.Group();
  offroadGroup.name = 'Titan_OffroadProvingGround';
  offroadGroup.visible = false;

  studio.group.visible = true;

  if (scene) {
    scene.add(studio.group);
    scene.add(offroadGroup);
  }

  let currentMode = 'studio';
  let targetBlend = 0.0;
  let currentBlend = 0.0;

  let currentStudioTheme = 'alabaster';
  let targetBlueprintBlend = 0.0;
  let currentBlueprintBlend = 0.0;

  let offroadBuilt = false;
  let offroadSkyDome = null;
  let offroadStage = 0; // 0=init, 1=maps, 2=terrainVerts, 3=terrainMesh, 4=props, 5=done
  let mapsBuilder = null;
  let terrainGeoBuilder = null;
  let terrainMaps = null;
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

  if (uniforms?.uModeBlend) {
    uniforms.uModeBlend.value = 0.0;
  }
  uStudioBlueprint.value = 0.0;

  function stepOffroadBuildUnit(isSync = false) {
    if (offroadBuilt || disposed) return true;

    if (offroadStage === 0) {
      mapsBuilder = createProvingGroundMapsBuilder();
      terrainGeoBuilder = createGradedTerrainGeometryBuilder(160);
      offroadStage = 1;
      if (!isSync) return false;
    }

    if (offroadStage === 1) {
      if (isSync) {
        terrainMaps = mapsBuilder.finish();
        offroadStage = 2;
      } else {
        const mapsDone = mapsBuilder.stepRows(24);
        if (mapsDone) {
          terrainMaps = mapsBuilder.finish();
          offroadStage = 2;
        }
        return false;
      }
    }

    if (offroadStage === 2) {
      if (isSync) {
        offroadStage = 3;
      } else {
        const vertsDone = terrainGeoBuilder.stepRows(18);
        if (vertsDone) {
          offroadStage = 3;
        }
        return false;
      }
    }

    if (offroadStage === 3) {
      const terrainGeo = terrainGeoBuilder.finalize();
      const terrainMat = buildTerrainMaterial(uniforms, terrainMaps.detailMap, terrainMaps.normalMap);
      const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
      terrainMesh.name = 'ProvingGround_TerrainMesh';
      terrainMesh.receiveShadow = true;
      terrainMesh.castShadow = false;
      offroadGroup.add(terrainMesh);
      terrainGeoBuilder = null;
      offroadStage = 4;
      if (!isSync) return false;
    }

    if (offroadStage === 4) {
      const props = buildProvingGroundProps(
        offroadGroup,
        uniforms,
        uStudioBlueprint,
        terrainMaps.detailMap,
        terrainMaps.normalMap
      );
      offroadSkyDome = props.skyDome;
      mapsBuilder = null;
      offroadStage = 5;
      offroadBuilt = true;

      // Sync visibility cleanly in case mode already blended before completion
      const offroadVisible = currentBlend > 0.004;
      offroadGroup.visible = offroadVisible;
      if (offroadSkyDome) {
        offroadSkyDome.visible = offroadVisible;
        if (uniforms?.uTruckPos?.value) {
          offroadSkyDome.position.set(uniforms.uTruckPos.value.x || 0, 0, uniforms.uTruckPos.value.z || 0);
        }
      }

      if (prebuildRafId !== null) {
        cancelFrame(prebuildRafId);
        prebuildRafId = null;
      }
      if (prebuildResolve) {
        const done = prebuildResolve;
        prebuildResolve = null;
        done(true);
      }
      return true;
    }

    return offroadBuilt;
  }

  /**
   * Synchronously completes any remaining off-road proving-ground build work (idempotent).
   * Auto-invoked whenever switching to 'offroad' mode.
   */
  function ensureOffroadBuilt() {
    if (offroadBuilt || disposed) return offroadGroup;
    if (prebuildRafId !== null) {
      cancelFrame(prebuildRafId);
      prebuildRafId = null;
    }
    stepOffroadBuildUnit(true);
    return offroadGroup;
  }

  /**
   * Incrementally builds the off-road terrain maps, 240m x 240m mesh, boulders, markers,
   * distant highland hills & sky dome across idle animation frames after hero paint.
   */
  function prebuildOffroadAsync(budgetMs = 5.0) {
    if (offroadBuilt || disposed) return Promise.resolve(true);
    if (prebuildPromise) return prebuildPromise;

    const safeBudget = Math.max(1.5, Math.min(12.0, Number(budgetMs) || 5.0));
    prebuildPromise = new Promise((resolve) => {
      prebuildResolve = resolve;

      const tick = () => {
        prebuildRafId = null;
        if (disposed || offroadBuilt) {
          if (prebuildResolve) {
            const done = prebuildResolve;
            prebuildResolve = null;
            done(offroadBuilt);
          }
          return;
        }

        const t0 = performance.now();
        let steps = 0;
        while (!offroadBuilt) {
          stepOffroadBuildUnit(false);
          steps++;
          if (offroadBuilt || (steps >= 1 && performance.now() - t0 >= safeBudget)) {
            break;
          }
        }

        if (!offroadBuilt && !disposed) {
          prebuildRafId = scheduleFrame(tick);
        }
      };

      prebuildRafId = scheduleFrame(tick);
    });

    return prebuildPromise;
  }

  function applyBlend(blend) {
    currentBlend = clampJS(blend, 0.0, 1.0);
    if (uniforms?.uModeBlend) {
      uniforms.uModeBlend.value = currentBlend;
    }

    const studioVisible = currentBlend < 0.86;
    const offroadVisible = currentBlend > 0.004;
    const inTransition = studioVisible && offroadVisible;

    if (offroadVisible && !offroadBuilt) {
      ensureOffroadBuilt();
    }

    // Pure TSL studio contact shadow fades out cleanly via uModeBlend during off-road Drive transition
    studio.floorMesh.visible = currentBlend < 0.55;
    studio.floorMesh.position.y = 0.001;
    studio.floorMesh.renderOrder = 0;

    studio.group.visible = studioVisible;
    studio.domeMesh.visible = !offroadVisible;

    offroadGroup.visible = offroadVisible && offroadBuilt;
    if (offroadSkyDome) {
      offroadSkyDome.visible = offroadVisible && offroadBuilt;
    }
  }

  function applyBlueprintBlend(blend) {
    currentBlueprintBlend = clampJS(blend, 0.0, 1.0);
    uStudioBlueprint.value = currentBlueprintBlend;
    const envInt = 0.25 * (1.0 - currentBlueprintBlend);
    studio.floorMat.envMapIntensity = envInt;
    studio.floorFadeMat.envMapIntensity = envInt;
  }

  function setEnvironmentMode(mode = 'studio', instant = false) {
    const normalized = mode === 'offroad' ? 'offroad' : 'studio';
    currentMode = normalized;
    targetBlend = normalized === 'offroad' ? 1.0 : 0.0;
    if (normalized === 'offroad') {
      ensureOffroadBuilt();
    }
    if (instant) {
      applyBlend(targetBlend);
    }
  }

  function setStudioTheme(theme = 'alabaster', instant = false) {
    const normalized = String(theme || 'alabaster').trim().toLowerCase() === 'blueprint'
      ? 'blueprint'
      : 'alabaster';
    currentStudioTheme = normalized;
    targetBlueprintBlend = normalized === 'blueprint' ? 1.0 : 0.0;
    if (instant) {
      applyBlueprintBlend(targetBlueprintBlend);
    }
    return currentStudioTheme;
  }

  function update(dt, truckPos = null) {
    const themeDt = Math.min(Math.max(dt || 0, 0), 0.25);

    if (Math.abs(targetBlend - currentBlend) > 0.0005) {
      const rate = 1.0 - Math.exp(-themeDt * 7.5);
      const next = currentBlend + (targetBlend - currentBlend) * rate;
      applyBlend(Math.abs(targetBlend - next) < 0.008 ? targetBlend : next);
    }

    if (Math.abs(targetBlueprintBlend - currentBlueprintBlend) > 0.0005) {
      const rate = 1.0 - Math.exp(-themeDt * 9.5);
      const next = currentBlueprintBlend + (targetBlueprintBlend - currentBlueprintBlend) * rate;
      applyBlueprintBlend(Math.abs(targetBlueprintBlend - next) < 0.005 ? targetBlueprintBlend : next);
    }

    if (truckPos && uniforms?.uTruckPos?.value) {
      uniforms.uTruckPos.value.set(truckPos.x || 0, truckPos.y || 0, truckPos.z || 0);
    }

    if (truckPos) {
      const tx = truckPos.x || 0;
      const tz = truckPos.z || 0;
      studio.domeMesh.position.set(tx, 0, tz);
      if (offroadSkyDome) {
        offroadSkyDome.position.set(tx, 0, tz);
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

    studio.floorMat?.dispose?.();
    studio.floorFadeMat?.dispose?.();

    [studio.group, offroadGroup].forEach((g) => {
      if (g.parent) g.parent.remove(g);
      g.traverse((obj) => {
        if (obj.isMesh) {
          obj.geometry?.dispose?.();
          if (obj.material && obj.material !== studio.floorMat && obj.material !== studio.floorFadeMat) {
            obj.material.dispose?.();
          }
        }
      });
    });
  }

  return {
    studioGroup: studio.group,
    offroadGroup,
    ensureOffroadBuilt,
    prebuildOffroadAsync,
    isOffroadBuilt: () => offroadBuilt,
    isOffroadReady: () => offroadBuilt,
    setEnvironmentMode,
    getEnvironmentMode: () => currentMode,
    getModeBlend: () => currentBlend,
    setStudioTheme,
    getStudioTheme: () => currentStudioTheme,
    getStudioThemeBlend: () => currentBlueprintBlend,
    update,
    dispose,
  };
}
