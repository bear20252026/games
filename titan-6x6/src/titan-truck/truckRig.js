/**
 * TITAN 6X6 ("AT-08") — Mechanical Rig, Zero-Clipping Suspension Clamp,
 * Engineering-Grade Automotive Lighting & Functional Twin Recovery Winch
 *
 * Canonical Three.js (+Y Up) Vehicle Coordinate System:
 *   +X = Forward (nose / tusks)
 *   +Y = Up (ground plane Y = 0)
 *   +Z = Right (Starboard, reference side)
 *   -Z = Left (Port)
 *
 * Features:
 *   - Hard kinematic zero-tire-clipping safety clamp matched to exact titan_truck.glb arch ceilings
 *   - Smooth 0.18 s LED/HID headlight ramp driving TSL emissives (uHeadlightRamp/uHeadlights),
 *     calibrated dual headlight SpotLights + wide roof flood SpotLight, subtle volumetric optical
 *     light shafts, radial lens halo flares, rear red brake bounce light, and crisp white reverse
 *     backup lamps + ground-bounce illumination (auto-hides optical cones/flares in Wireframe CAD)
 *   - True mechanical twin-drum recovery winch with dynamic 20-segment zero-GC catenary steel cables,
 *     exact V2 WinchDrum_L/R rotation (dTheta = dLength / R_drum), sculpted Y-equalizer + forged
 *     safety-latch hook, floor-seated Studio demo (deploy -> slack drape -> tension snap -> reel stow),
 *     and functional Off-Road Drive ground-anchor stake hauling the 18-ton truck up steep terrain!
 */

import * as THREE from 'three';
import { getTerrainHeight as defaultGetTerrainHeight } from './terrain.js';
import { computeSafeMaxUpOffset, VEHICLE_CONSTANTS } from './vehiclePhysics.js';
import * as TSLMaterials from './tslMaterials.js';

// ---------------------------------------------------------------------------
// Constants & Engineering Configuration
// ---------------------------------------------------------------------------

const WHEEL_IDS = ['FL', 'FR', 'ML', 'MR', 'RL', 'RR'];
const WHEEL_SIDES = { FL: -1, FR: +1, ML: -1, MR: +1, RL: -1, RR: +1 };
const TRACK_WIDTH = 2.78;
const CONTROL_ARM_LEN = 0.48; // chassis rail to axle link geometry in wheels_suspension.py
const SPRING_FREE_LEN = 0.55; // exact Spring_XX span (0.551m top-perch to axle seat)
const DAMPER_FREE_LEN = 0.64; // exact Damper_XX span (0.642m top heim to lower clevis)

const DOOR_OPEN_ANGLE = THREE.MathUtils.degToRad(62);
const HATCH_SIDE_OPEN_ANGLE = THREE.MathUtils.degToRad(72);
const HATCH_REAR_OPEN_ANGLE = THREE.MathUtils.degToRad(85);

// Winch physical constants (drum radius measured dynamically from WinchDrum_L/R, fallback 0.188 m)
const WINCH_DEFAULT_DRUM_RADIUS = 0.188;
const WINCH_STUDIO_EXT = 4.60; // meters forward from fairlead in Studio showcase
const WINCH_DRIVE_ANCHOR_DIST = 11.5; // meters forward terrain anchor distance in Off-Road Drive
const WINCH_DRIVE_DETACH_DIST = 2.45; // meters auto-detach threshold once truck reaches stake
const WINCH_ARENA_SAFE_RADIUS = 106.0;
const HOOK_FLOOR_Y = 0.072; // forged hook/clevis resting height cleanly flush on floor
const CABLE_SEGMENTS = 20;
const CABLE_RADIAL_SIDES = 6;
const CABLE_RADIUS = 0.017;

// Headlight & rear lamp timing
const HEADLIGHT_RAMP_DURATION = 0.18; // seconds smooth LED/HID ignition ramp

// Canonical TSL material groups (aligned with tslMaterials.js)
const ALL_GROUPS = [
  'Chassis',
  'RearBody',
  'EquipmentHatches',
  'CabinShell',
  'CabinInterior',
  'Doors',
  'FrontBumper',
  'Tusks',
  'RooftopEquipment',
  'Lights',
  'Powertrain',
  'Drivetrain',
  'Axles',
  'SteeringSystem',
  'SuspensionAssemblies',
  'Wheels',
];

// 7 Engineering Inspection Modes — target opacity per assembly group
export const INSPECTION_MODES = Object.freeze([
  'exterior',
  'chassis',
  'powertrain',
  'suspension',
  'interior',
  'electrical',
  'exploded',
]);

const MODE_OPACITIES = {
  exterior: {
    Chassis: 1.0, RearBody: 1.0, EquipmentHatches: 1.0, CabinShell: 1.0,
    CabinInterior: 1.0, Doors: 1.0, FrontBumper: 1.0, Tusks: 1.0,
    RooftopEquipment: 1.0, Lights: 1.0, Powertrain: 1.0, Drivetrain: 1.0,
    Axles: 1.0, SteeringSystem: 1.0, SuspensionAssemblies: 1.0, Wheels: 1.0,
  },
  chassis: {
    Chassis: 1.0, RearBody: 0.10, EquipmentHatches: 0.10, CabinShell: 0.10,
    CabinInterior: 0.12, Doors: 0.10, FrontBumper: 0.22, Tusks: 0.20,
    RooftopEquipment: 0.10, Lights: 0.24, Powertrain: 0.22, Drivetrain: 0.95,
    Axles: 1.0, SteeringSystem: 1.0, SuspensionAssemblies: 0.95, Wheels: 0.36,
  },
  powertrain: {
    Chassis: 0.35, RearBody: 0.08, EquipmentHatches: 0.08, CabinShell: 0.08,
    CabinInterior: 0.10, Doors: 0.08, FrontBumper: 0.14, Tusks: 0.14,
    RooftopEquipment: 0.08, Lights: 0.22, Powertrain: 1.0, Drivetrain: 1.0,
    Axles: 0.68, SteeringSystem: 0.42, SuspensionAssemblies: 0.26, Wheels: 0.22,
  },
  suspension: {
    Chassis: 0.28, RearBody: 0.08, EquipmentHatches: 0.08, CabinShell: 0.08,
    CabinInterior: 0.08, Doors: 0.08, FrontBumper: 0.14, Tusks: 0.14,
    RooftopEquipment: 0.08, Lights: 0.14, Powertrain: 0.10, Drivetrain: 0.65,
    Axles: 1.0, SteeringSystem: 1.0, SuspensionAssemblies: 1.0, Wheels: 0.07,
  },
  interior: {
    Chassis: 0.42, RearBody: 0.26, EquipmentHatches: 0.18, CabinShell: 0.18,
    CabinInterior: 1.0, Doors: 0.22, FrontBumper: 0.48, Tusks: 0.48,
    RooftopEquipment: 0.12, Lights: 0.55, Powertrain: 0.20, Drivetrain: 0.35,
    Axles: 0.55, SteeringSystem: 0.55, SuspensionAssemblies: 0.55, Wheels: 0.62,
  },
  electrical: {
    Chassis: 0.16, RearBody: 0.12, EquipmentHatches: 0.12, CabinShell: 0.12,
    CabinInterior: 0.88, Doors: 0.12, FrontBumper: 0.16, Tusks: 0.14,
    RooftopEquipment: 1.0, Lights: 1.0, Powertrain: 1.0, Drivetrain: 0.24,
    Axles: 0.16, SteeringSystem: 0.16, SuspensionAssemblies: 0.16, Wheels: 0.16,
  },
  exploded: {
    Chassis: 1.0, RearBody: 1.0, EquipmentHatches: 1.0, CabinShell: 1.0,
    CabinInterior: 1.0, Doors: 1.0, FrontBumper: 1.0, Tusks: 1.0,
    RooftopEquipment: 1.0, Lights: 1.0, Powertrain: 1.0, Drivetrain: 1.0,
    Axles: 1.0, SteeringSystem: 1.0, SuspensionAssemblies: 1.0, Wheels: 1.0,
  },
};

// Clean non-colliding Exploded-View vectors in TruckRoot space (+X Fwd, +Y Up, +Z Right)
const EXPLODE_BASE_Y = 0.82;

const EXPLODE_VECTORS = {
  Chassis: new THREE.Vector3(0.0, 0.0 + EXPLODE_BASE_Y, 0.0),
  SteeringRack_Assembly: new THREE.Vector3(0.0, 0.0 + EXPLODE_BASE_Y, 0.0),
  SwayBars_Assembly: new THREE.Vector3(0.0, 0.0 + EXPLODE_BASE_Y, 0.0),
  RooftopEquipment: new THREE.Vector3(0.0, +2.28 + EXPLODE_BASE_Y, 0.0),
  RearBody: new THREE.Vector3(-1.35, +1.55 + EXPLODE_BASE_Y, 0.0),
  Hatch_Left_Main: new THREE.Vector3(-0.85, +1.20 + EXPLODE_BASE_Y, -1.10),
  Hatch_Right_Main: new THREE.Vector3(-0.85, +1.20 + EXPLODE_BASE_Y, +1.10),
  Hatch_Rear_Service: new THREE.Vector3(-2.35, +1.20 + EXPLODE_BASE_Y, 0.0),
  CabinShell: new THREE.Vector3(+1.25, +1.35 + EXPLODE_BASE_Y, 0.0),
  CabinInterior: new THREE.Vector3(+1.05, +0.45 + EXPLODE_BASE_Y, 0.0),
  Door_Left: new THREE.Vector3(+0.90, +0.55 + EXPLODE_BASE_Y, -1.65),
  Door_Right: new THREE.Vector3(+0.90, +0.55 + EXPLODE_BASE_Y, +1.65),
  FrontBumper: new THREE.Vector3(+1.85, -0.10 + EXPLODE_BASE_Y, 0.0),
  Tusks: new THREE.Vector3(+2.95, +0.18 + EXPLODE_BASE_Y, 0.0),
  Powertrain: new THREE.Vector3(-0.35, +0.68 + EXPLODE_BASE_Y, 0.0),
  Drivetrain: new THREE.Vector3(0.0, -0.45 + EXPLODE_BASE_Y, 0.0),
  FrontAxle: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, 0.0),
  MiddleAxle: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, 0.0),
  RearAxle: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, 0.0),
  TieRod_Front: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, 0.0),
  SteerKnuckle_FL: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, 0.0),
  SteerKnuckle_FR: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, 0.0),
  Wheel_FL_child: new THREE.Vector3(0.0, 0.0, -1.15),
  Wheel_FR_child: new THREE.Vector3(0.0, 0.0, +1.15),
  Wheel_FL_root: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, -1.15),
  Wheel_FR_root: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, +1.15),
  Wheel_ML: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, -1.15),
  Wheel_MR: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, +1.15),
  Wheel_RL: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, -1.15),
  Wheel_RR: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, +1.15),
  BrakeCaliper_ML: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, -0.18),
  BrakeCaliper_MR: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, +0.18),
  BrakeCaliper_RL: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, -0.18),
  BrakeCaliper_RR: new THREE.Vector3(0.0, -0.78 + EXPLODE_BASE_Y, +0.18),
  Susp_FL: new THREE.Vector3(0.0, -0.35 + EXPLODE_BASE_Y, -0.45),
  Susp_FR: new THREE.Vector3(0.0, -0.35 + EXPLODE_BASE_Y, +0.45),
  Susp_ML: new THREE.Vector3(0.0, -0.35 + EXPLODE_BASE_Y, -0.45),
  Susp_MR: new THREE.Vector3(0.0, -0.35 + EXPLODE_BASE_Y, +0.45),
  Susp_RL: new THREE.Vector3(0.0, -0.35 + EXPLODE_BASE_Y, -0.45),
  Susp_RR: new THREE.Vector3(0.0, -0.35 + EXPLODE_BASE_Y, +0.45),
  Light_Headlight_L: new THREE.Vector3(+1.25, +1.35 + EXPLODE_BASE_Y, 0.0),
  Light_Headlight_R: new THREE.Vector3(+1.25, +1.35 + EXPLODE_BASE_Y, 0.0),
  Light_RoofPods: new THREE.Vector3(+1.25, +1.35 + EXPLODE_BASE_Y, 0.0),
  Light_ArchMarkers: new THREE.Vector3(0.0, 0.0 + EXPLODE_BASE_Y, 0.0),
  Light_Brake_L: new THREE.Vector3(-1.35, +1.55 + EXPLODE_BASE_Y, 0.0),
  Light_Brake_R: new THREE.Vector3(-1.35, +1.55 + EXPLODE_BASE_Y, 0.0),
};

// 8 Canonical Technical Annotation Anchor specs (aligned with storytelling.js)
const SUBSYSTEM_ANCHOR_SPECS = {
  body:       { nodeKey: 'RearBody',         rootPos: new THREE.Vector3(-2.15, 3.65, 1.48) },
  chassis:    { nodeKey: 'Chassis',          rootPos: new THREE.Vector3(+0.45, 2.15, 1.42) },
  drivetrain: { nodeKey: 'Drivetrain',       rootPos: new THREE.Vector3(-0.35, 1.08, 0.35) },
  suspension: { nodeKey: 'Susp_MR',          rootPos: new THREE.Vector3(-1.65, 1.34, 1.38) },
  powertrain: { nodeKey: 'Powertrain',       rootPos: new THREE.Vector3(-1.15, 2.38, 0.55) },
  cabin:      { nodeKey: 'CabinShell',       rootPos: new THREE.Vector3(+2.85, 2.88, 1.28) },
  recovery:   { nodeKey: 'FrontBumper',      rootPos: new THREE.Vector3(+4.55, 1.48, 0.92) },
  comms:      { nodeKey: 'RooftopEquipment', rootPos: new THREE.Vector3(-0.95, 4.88, 0.35) },
};

// Fallback node -> group mapping for direct Three.js opacity when tslController is absent
const NODE_GROUP_KEYS = {
  Chassis: 'Chassis',
  RearBody: 'RearBody',
  EquipmentHatches: 'EquipmentHatches',
  CabinShell: 'CabinShell',
  CabinInterior: 'CabinInterior',
  Doors: 'Doors',
  FrontBumper: 'FrontBumper',
  Tusks: 'Tusks',
  RooftopEquipment: 'RooftopEquipment',
  Lights: 'Lights',
  Powertrain: 'Powertrain',
  Drivetrain: 'Drivetrain',
  FrontAxle: 'Axles',
  MiddleAxle: 'Axles',
  RearAxle: 'Axles',
  SteeringSystem: 'SteeringSystem',
  SuspensionAssemblies: 'SuspensionAssemblies',
  Wheel_FL: 'Wheels', Wheel_FR: 'Wheels',
  Wheel_ML: 'Wheels', Wheel_MR: 'Wheels',
  Wheel_RL: 'Wheels', Wheel_RR: 'Wheels',
  BrakeCaliper_FL: 'Wheels', BrakeCaliper_FR: 'Wheels',
  BrakeCaliper_ML: 'Wheels', BrakeCaliper_MR: 'Wheels',
  BrakeCaliper_RL: 'Wheels', BrakeCaliper_RR: 'Wheels',
};

function dampAlpha(lambda, dt) {
  return 1 - Math.exp(-lambda * Math.min(Math.max(dt, 0), 0.1));
}

function smoothstep01(t) {
  const x = THREE.MathUtils.clamp(t, 0, 1);
  return x * x * (3 - 2 * x);
}

function stripBlenderSuffix(name) {
  return name.replace(/\.\d{3}$/, '');
}

/**
 * Generates a soft optical radial lens flare texture (procedural canvas, zero network I/O).
 */
function createRadialFlareTexture() {
  if (typeof document === 'undefined') return null;
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const cx = size * 0.5;
  const cy = size * 0.5;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 1.0)');
  grad.addColorStop(0.18, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.42, 'rgba(235, 248, 255, 0.34)');
  grad.addColorStop(0.72, 'rgba(210, 238, 255, 0.08)');
  grad.addColorStop(1.0, 'rgba(200, 232, 255, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // Subtle horizontal anamorphic optical streak for automotive headlamp authenticity
  const streak = ctx.createRadialGradient(cx, cy, 0, cx, cy, cx);
  streak.addColorStop(0.0, 'rgba(255, 255, 255, 0.45)');
  streak.addColorStop(0.55, 'rgba(230, 246, 255, 0.10)');
  streak.addColorStop(1.0, 'rgba(220, 242, 255, 0.0)');
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.0, 0.22);
  ctx.fillStyle = streak;
  ctx.beginPath();
  ctx.arc(0, 0, cx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Generates an axial fade texture for fallback volumetric light cones if TSL beam helper is unavailable.
 */
function createAxialBeamFallbackTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Canvas top (y=0) maps to uv.y=1 (near lamp); bottom (y=128) maps to uv.y=0 (far end)
  const grad = ctx.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0.0, 'rgba(255, 255, 255, 0.0)');
  grad.addColorStop(0.06, 'rgba(255, 255, 255, 0.85)');
  grad.addColorStop(0.28, 'rgba(240, 250, 255, 0.46)');
  grad.addColorStop(0.68, 'rgba(220, 242, 255, 0.12)');
  grad.addColorStop(1.0, 'rgba(210, 238, 255, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 16, 128);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Builds a pre-allocated reusable multi-segment tubular cable BufferGeometry (zero per-frame GC).
 */
function createDynamicCableGeometry(segments = CABLE_SEGMENTS, radialSides = CABLE_RADIAL_SIDES) {
  const ringCount = segments + 1;
  const vertCount = ringCount * radialSides;
  const positions = new Float32Array(vertCount * 3);
  const normals = new Float32Array(vertCount * 3);
  const uvs = new Float32Array(vertCount * 2);

  for (let i = 0; i <= segments; i++) {
    const v = i / segments;
    for (let j = 0; j < radialSides; j++) {
      const idx = i * radialSides + j;
      uvs[idx * 2] = j / radialSides;
      uvs[idx * 2 + 1] = v;
    }
  }

  const indices = new Uint16Array(segments * radialSides * 6);
  let ptr = 0;
  for (let i = 0; i < segments; i++) {
    const row0 = i * radialSides;
    const row1 = (i + 1) * radialSides;
    for (let j = 0; j < radialSides; j++) {
      const jNext = (j + 1) % radialSides;
      const a = row0 + j;
      const b = row1 + j;
      const c = row1 + jNext;
      const d = row0 + jNext;
      indices[ptr++] = a;
      indices[ptr++] = b;
      indices[ptr++] = d;
      indices[ptr++] = b;
      indices[ptr++] = c;
      indices[ptr++] = d;
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  return geo;
}

// Precompute unit circle offsets for fast zero-allocation tubular ring extrusion
const RING_COS = new Float32Array(CABLE_RADIAL_SIDES);
const RING_SIN = new Float32Array(CABLE_RADIAL_SIDES);
for (let j = 0; j < CABLE_RADIAL_SIDES; j++) {
  const ang = (j / CABLE_RADIAL_SIDES) * Math.PI * 2;
  RING_COS[j] = Math.cos(ang);
  RING_SIN[j] = Math.sin(ang);
}

// ---------------------------------------------------------------------------
// Main TruckRig Class
// ---------------------------------------------------------------------------

export class TruckRig {
  /**
   * @param {THREE.Object3D} truckRoot Loaded GLB TruckRoot (or scene root containing TruckRoot)
   * @param {object|null} tslController Returned by upgradeTruckMaterialsToTSL()
   * @param {object|null} sharedUniforms Optional TSL shared uniforms from createTSLSharedUniforms()
   * @param {object} options Optional { scene, getTerrainHeight }
   */
  constructor(truckRoot, tslController = null, sharedUniforms = null, options = {}) {
    this.tslController = tslController || null;
    this.uniforms = sharedUniforms || tslController?.uniforms || null;
    this._scene = options?.scene || null;
    this._getTerrainHeight =
      typeof options?.getTerrainHeight === 'function'
        ? options.getTerrainHeight
        : defaultGetTerrainHeight;

    // Resolve TruckRoot if caller passed gltf.scene wrapper
    this.root = truckRoot || new THREE.Group();
    const innerRoot = this._findDescendantExact(this.root, 'TruckRoot');
    this.truckRoot = innerRoot || this.root;

    // Resolve world scene automatically if truckRoot is already attached to scene
    if (!this._scene && this.root.parent) {
      this._scene = this.root.parent;
    }

    // Index all descendants for resilient lookup
    this._exactMap = new Map();
    this._lowerMap = new Map();
    this._cleanMap = new Map();
    this._allNodes = [];
    this._buildLookupIndex();

    // Cache TruckRoot world basis at rest for parent-space axis precomputation & dynamic GLB measurement
    this.root.updateMatrixWorld(true);
    this._restRootWorldQuat = new THREE.Quaternion();
    this._restRootWorldMatrix = new THREE.Matrix4();
    this._invRestRootWorldMatrix = new THREE.Matrix4();
    this.truckRoot.getWorldQuaternion(this._restRootWorldQuat);
    this._restRootWorldMatrix.copy(this.truckRoot.matrixWorld);
    this._invRestRootWorldMatrix.copy(this._restRootWorldMatrix).invert();

    // Indexed assembly nodes & cached rest poses
    this.nodes = {};
    this.restPoses = new Map();

    // Runtime render-style tracking (hides volumetric beams & flares in Wireframe CAD)
    this._renderStyle = 'pbr';

    // Pre-allocate scratch objects before building subsystems
    this._v1 = new THREE.Vector3();
    this._v2 = new THREE.Vector3();
    this._v3 = new THREE.Vector3();
    this._v4 = new THREE.Vector3();
    this._v5 = new THREE.Vector3();
    this._v6 = new THREE.Vector3();
    this._q1 = new THREE.Quaternion();
    this._q2 = new THREE.Quaternion();
    this._m1 = new THREE.Matrix4();

    this._indexAllAssemblies();
    this._initAnnotationAnchors();
    this._buildLights();
    this._buildProceduralWinchRig();

    // State variables (targets & smoothly damped runtime values)
    this.inspectionMode = 'exterior';
    this.focusedSubsystem = null;

    this.explodeTarget = 0;
    this.explodeCurrent = 0;

    this.doorsOpenTarget = 0;
    this.doorsOpenCurrent = 0;
    this._doorsPriorToInterior = 0;
    this._interiorAutoOpenedDoors = false;

    this.hatchesOpenTarget = 0;
    this.hatchesOpenCurrent = 0;

    this.headlightsOn = true;
    this._headlightRampLinear = 1.0;
    this.headlightLevel = 1.0;
    this._brakeLevel = 0.0;
    this._reverseLevel = 0.0;
    this._manualBrakeOverride = null;
    this._manualReverseOverride = null;

    // Winch state machine
    this.winchActive = false;
    this.winchPhase = 'stowed'; // 'stowed' | 'deploying' | 'deployed' | 'tensioning' | 'anchored' | 'reeling'
    this.winchProgress = 0;
    this.winchCableMeters = 0;
    this.winchTensionNorm = 0;
    this.winchDrumSpeedNorm = 0;
    this._winchMode = 'studio'; // 'studio' | 'drive'
    this._winchPhaseTimer = 0;
    this._winchDrumAngle = 0;
    this._winchExtMeters = 0;
    this._winchSagCurrent = 0;
    this._winchVibPhase = 0;
    this._winchDeployStartPos = new THREE.Vector3();
    this._winchStakeWorldPos = new THREE.Vector3();
    this._winchHookWorldPos = new THREE.Vector3();
    this._winchReelStartPos = new THREE.Vector3();
    this._winchAnchorExposed = null; // THREE.Vector3 | null when hauling
    this._winchStakeExposed = null;  // THREE.Vector3 | null when stake is planted

    this.suspensionDemoEnabled = true;
    this._demoTime = 0;
    this._fanAngle = 0;
    this._driveshaftAngle = 0;
    this._drivingActive = false;

    // Per-group smooth opacity state
    this._groupOpacityCurrent = {};
    this._groupOpacityTarget = {};
    for (const g of ALL_GROUPS) {
      this._groupOpacityCurrent[g] = 1.0;
      this._groupOpacityTarget[g] = 1.0;
    }

    // Live driving kinematics buffer (populated by applyPhysicsState or suspension demo)
    this._drive = {
      steerAvg: 0,
      steerLeft: 0,
      steerRight: 0,
      speedMs: 0,
      rpmNorm: 0.16,
      throttle: 0,
      braking: false,
      brakeAmount: 0,
      reverse: false,
      gear: 'N',
      wheelCompression: [0, 0, 0, 0, 0, 0],
      wheelSpin: [0, 0, 0, 0, 0, 0],
      wheelSpinVel: [0, 0, 0, 0, 0, 0],
    };

    this._anchorOutputs = {};
    for (const key of Object.keys(SUBSYSTEM_ANCHOR_SPECS)) {
      this._anchorOutputs[key] = new THREE.Vector3();
    }

    // Apply clean initial rest state
    this.setHeadlights(true);
    this._updateLights(0.016);
    this._applyMechanicalPose();
  }

  /**
   * Optional late-binding of world scene / terrain height sampler (for Drive winch anchor stake).
   */
  setEnvironmentContext({ scene, getTerrainHeight } = {}) {
    if (scene) {
      this._scene = scene;
      if (this._winchWorldGroup && this._winchWorldGroup.parent !== scene) {
        scene.add(this._winchWorldGroup);
      }
    }
    if (typeof getTerrainHeight === 'function') {
      this._getTerrainHeight = getTerrainHeight;
    }
  }

  /**
   * Attach or update shared TSL uniforms if constructed before uniforms were bound.
   */
  setSharedUniforms(uniforms) {
    this.uniforms = uniforms || null;
    if (this.uniforms) {
      if (this.uniforms.uHeadlights) this.uniforms.uHeadlights.value = this.headlightLevel;
      if (this.uniforms.uHeadlightRamp) this.uniforms.uHeadlightRamp.value = this.headlightLevel;
      if (this.uniforms.uBraking) this.uniforms.uBraking.value = this._brakeLevel;
      if (this.uniforms.uReverse) this.uniforms.uReverse.value = this._reverseLevel;
    }
  }

  /**
   * Sync active render style ('pbr' | 'wire_tech' | 'wire_blueprint' | 'wire_mesh').
   * Automatically suppresses volumetric headlight cones & lens flares in Wireframe CAD modes.
   */
  setRenderStyle(style) {
    this._renderStyle = String(style || 'pbr').toLowerCase();
  }

  // -------------------------------------------------------------------------
  // Resilient Node Discovery, Rest-Pose Caching & Exact GLB Bounds Measurement
  // -------------------------------------------------------------------------

  _findDescendantExact(root, name) {
    if (!root) return null;
    if (root.name === name) return root;
    let found = null;
    root.traverse((obj) => {
      if (!found && obj.name === name) found = obj;
    });
    return found;
  }

  _buildLookupIndex() {
    this.truckRoot.traverse((obj) => {
      if (!obj.name) return;
      this._allNodes.push(obj);
      if (!this._exactMap.has(obj.name)) {
        this._exactMap.set(obj.name, obj);
      }
      const low = obj.name.toLowerCase();
      if (!this._lowerMap.has(low)) {
        this._lowerMap.set(low, obj);
      }
      const cleaned = stripBlenderSuffix(obj.name).toLowerCase();
      if (!this._cleanMap.has(cleaned)) {
        this._cleanMap.set(cleaned, obj);
      }
    });
  }

  findNode(name, fallbackSubstrings = []) {
    if (!name) return null;
    if (this._exactMap.has(name)) return this._exactMap.get(name);
    const low = name.toLowerCase();
    if (this._lowerMap.has(low)) return this._lowerMap.get(low);
    const cleaned = stripBlenderSuffix(low);
    if (this._cleanMap.has(cleaned)) return this._cleanMap.get(cleaned);

    const needles = [low, ...fallbackSubstrings.map((s) => s.toLowerCase())];
    for (const needle of needles) {
      for (let i = 0; i < this._allNodes.length; i++) {
        if (this._allNodes[i].name.toLowerCase().includes(needle)) {
          return this._allNodes[i];
        }
      }
    }
    return null;
  }

  /**
   * Measures a node's exact rest-pose bounding box in canonical TruckRoot space (+X Fwd, +Y Up, +Z Right).
   */
  _measureNodeBoundsInRoot(node) {
    if (!node) return null;
    const box = new THREE.Box3();
    const tmpBox = new THREE.Box3();
    const relMat = new THREE.Matrix4();
    let hasGeo = false;

    node.traverse((obj) => {
      if (!obj.isMesh || !obj.geometry) return;
      if (!obj.geometry.boundingBox) obj.geometry.computeBoundingBox();
      if (!obj.geometry.boundingBox || obj.geometry.boundingBox.isEmpty()) return;
      relMat.multiplyMatrices(this._invRestRootWorldMatrix, obj.matrixWorld);
      tmpBox.copy(obj.geometry.boundingBox).applyMatrix4(relMat);
      box.union(tmpBox);
      hasGeo = true;
    });

    if (!hasGeo || box.isEmpty()) return null;
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(size);
    return { box, min: box.min.clone(), max: box.max.clone(), center, size };
  }

  /**
   * Converts a canonical TruckRoot rest coordinate (x, y, z) into `targetParent`'s local space.
   */
  _rootPointToParentLocal(targetParent, x, y, z) {
    const worldPt = new THREE.Vector3(x, y, z).applyMatrix4(this._restRootWorldMatrix);
    return targetParent.worldToLocal(worldPt);
  }

  _cacheRestPose(node) {
    if (!node || this.restPoses.has(node)) return this.restPoses.get(node) || null;

    const parent = node.parent || this.truckRoot;
    const parentWorldQuat = new THREE.Quaternion();
    const parentWorldScale = new THREE.Vector3(1, 1, 1);
    const parentWorldPos = new THREE.Vector3();
    parent.matrixWorld.decompose(parentWorldPos, parentWorldQuat, parentWorldScale);

    const rootToParentQuat = parentWorldQuat.clone().invert().multiply(this._restRootWorldQuat);

    const invParentScale = new THREE.Vector3(
      Math.abs(parentWorldScale.x) > 1e-5 ? 1 / parentWorldScale.x : 1,
      Math.abs(parentWorldScale.y) > 1e-5 ? 1 / parentWorldScale.y : 1,
      Math.abs(parentWorldScale.z) > 1e-5 ? 1 / parentWorldScale.z : 1
    );

    const axisX = new THREE.Vector3(1, 0, 0).applyQuaternion(rootToParentQuat).normalize();
    const axisY = new THREE.Vector3(0, 1, 0).applyQuaternion(rootToParentQuat).normalize();
    const axisZ = new THREE.Vector3(0, 0, 1).applyQuaternion(rootToParentQuat).normalize();
    const axisNegZ = axisZ.clone().negate();

    const restRotAngle = 2 * Math.acos(THREE.MathUtils.clamp(node.quaternion.w, -1, 1));

    const entry = {
      position: node.position.clone(),
      quaternion: node.quaternion.clone(),
      scale: node.scale.clone(),
      rootToParentQuat,
      invParentScale,
      axisX,
      axisY,
      axisZ,
      axisNegZ,
      restRotAngle,
    };
    this.restPoses.set(node, entry);
    return entry;
  }

  _indexAllAssemblies() {
    const namesToIndex = [
      'Chassis',
      'RearBody',
      'EquipmentHatches',
      'Hatch_Left_Main',
      'Hatch_Right_Main',
      'Hatch_Rear_Service',
      'Cabin',
      'CabinShell',
      'CabinInterior',
      'SteeringWheel',
      'Doors',
      'Door_Left',
      'Door_Right',
      'FrontBumper',
      'WinchDrum_L',
      'WinchDrum_R',
      'Tusks',
      'RooftopEquipment',
      'Lights',
      'Light_Headlight_L',
      'Light_Headlight_R',
      'Light_RoofPods',
      'Light_ArchMarkers',
      'Light_Brake_L',
      'Light_Brake_R',
      'Powertrain',
      'CoolingFan_L',
      'CoolingFan_R',
      'Drivetrain',
      'Driveshaft_Front',
      'Driveshaft_Mid',
      'Driveshaft_Rear',
      'FrontAxle',
      'MiddleAxle',
      'RearAxle',
      'SteeringSystem',
      'SteeringRack_Assembly',
      'TieRod_Front',
      'SteerKnuckle_FL',
      'SteerKnuckle_FR',
      'SuspensionAssemblies',
      'SwayBars_Assembly',
    ];

    for (const id of WHEEL_IDS) {
      namesToIndex.push(
        `Wheel_${id}`,
        `BrakeCaliper_${id}`,
        `Susp_${id}`,
        `ControlArm_${id}`,
        `Spring_${id}`,
        `Damper_${id}`
      );
    }

    for (const key of namesToIndex) {
      const node = this.findNode(key);
      this.nodes[key] = node;
      if (node) this._cacheRestPose(node);
    }

    this._wheelNestedFL = Boolean(
      this.nodes.Wheel_FL &&
      this.nodes.SteerKnuckle_FL &&
      this._isDescendantOf(this.nodes.Wheel_FL, this.nodes.SteerKnuckle_FL)
    );
    this._wheelNestedFR = Boolean(
      this.nodes.Wheel_FR &&
      this.nodes.SteerKnuckle_FR &&
      this._isDescendantOf(this.nodes.Wheel_FR, this.nodes.SteerKnuckle_FR)
    );
    this._caliperNestedFL = Boolean(
      this.nodes.BrakeCaliper_FL &&
      this.nodes.SteerKnuckle_FL &&
      this._isDescendantOf(this.nodes.BrakeCaliper_FL, this.nodes.SteerKnuckle_FL)
    );
    this._caliperNestedFR = Boolean(
      this.nodes.BrakeCaliper_FR &&
      this.nodes.SteerKnuckle_FR &&
      this._isDescendantOf(this.nodes.BrakeCaliper_FR, this.nodes.SteerKnuckle_FR)
    );

    // Precompute SteeringWheel spin axis
    this._steeringWheelLocalSpin = false;
    this._steeringWheelAxis = new THREE.Vector3(
      Math.cos(THREE.MathUtils.degToRad(28)),
      -Math.sin(THREE.MathUtils.degToRad(28)),
      0
    ).normalize();
    if (this.nodes.SteeringWheel) {
      const rest = this.restPoses.get(this.nodes.SteeringWheel);
      if (rest && rest.restRotAngle > 0.08) {
        this._steeringWheelLocalSpin = true;
      } else if (rest) {
        this._steeringWheelAxis.applyQuaternion(rest.rootToParentQuat).normalize();
      }
    }

    // Precompute Driveshaft spin axes
    this._driveshaftAxes = {};
    for (const dsKey of ['Driveshaft_Front', 'Driveshaft_Mid', 'Driveshaft_Rear']) {
      const dsNode = this.nodes[dsKey];
      if (!dsNode) continue;
      const rest = this.restPoses.get(dsNode);
      if (rest && rest.restRotAngle > 0.05) {
        this._driveshaftAxes[dsKey] = { local: true, axis: new THREE.Vector3(1, 0, 0) };
      } else if (rest) {
        this._driveshaftAxes[dsKey] = { local: false, axis: rest.axisX.clone() };
      }
    }

    // Precompute list of explodable nodes
    this._explodeEntries = [];
    this._registerExplode('Chassis', EXPLODE_VECTORS.Chassis);
    this._registerExplode('SteeringRack_Assembly', EXPLODE_VECTORS.SteeringRack_Assembly);
    this._registerExplode('SwayBars_Assembly', EXPLODE_VECTORS.SwayBars_Assembly);
    this._registerExplode('RooftopEquipment', EXPLODE_VECTORS.RooftopEquipment);
    this._registerExplode('RearBody', EXPLODE_VECTORS.RearBody);
    this._registerExplode('Hatch_Left_Main', EXPLODE_VECTORS.Hatch_Left_Main);
    this._registerExplode('Hatch_Right_Main', EXPLODE_VECTORS.Hatch_Right_Main);
    this._registerExplode('Hatch_Rear_Service', EXPLODE_VECTORS.Hatch_Rear_Service);
    this._registerExplode('CabinShell', EXPLODE_VECTORS.CabinShell);
    this._registerExplode('CabinInterior', EXPLODE_VECTORS.CabinInterior);
    this._registerExplode('Door_Left', EXPLODE_VECTORS.Door_Left);
    this._registerExplode('Door_Right', EXPLODE_VECTORS.Door_Right);
    this._registerExplode('FrontBumper', EXPLODE_VECTORS.FrontBumper);
    this._registerExplode('Tusks', EXPLODE_VECTORS.Tusks);
    this._registerExplode('Powertrain', EXPLODE_VECTORS.Powertrain);
    this._registerExplode('Drivetrain', EXPLODE_VECTORS.Drivetrain);
    this._registerExplode('FrontAxle', EXPLODE_VECTORS.FrontAxle);
    this._registerExplode('MiddleAxle', EXPLODE_VECTORS.MiddleAxle);
    this._registerExplode('RearAxle', EXPLODE_VECTORS.RearAxle);
    this._registerExplode('TieRod_Front', EXPLODE_VECTORS.TieRod_Front);
    this._registerExplode('SteerKnuckle_FL', EXPLODE_VECTORS.SteerKnuckle_FL);
    this._registerExplode('SteerKnuckle_FR', EXPLODE_VECTORS.SteerKnuckle_FR);
    this._registerExplode(
      'Wheel_FL',
      this._wheelNestedFL ? EXPLODE_VECTORS.Wheel_FL_child : EXPLODE_VECTORS.Wheel_FL_root
    );
    this._registerExplode(
      'Wheel_FR',
      this._wheelNestedFR ? EXPLODE_VECTORS.Wheel_FR_child : EXPLODE_VECTORS.Wheel_FR_root
    );
    this._registerExplode('Wheel_ML', EXPLODE_VECTORS.Wheel_ML);
    this._registerExplode('Wheel_MR', EXPLODE_VECTORS.Wheel_MR);
    this._registerExplode('Wheel_RL', EXPLODE_VECTORS.Wheel_RL);
    this._registerExplode('Wheel_RR', EXPLODE_VECTORS.Wheel_RR);
    this._registerExplode('BrakeCaliper_ML', EXPLODE_VECTORS.BrakeCaliper_ML);
    this._registerExplode('BrakeCaliper_MR', EXPLODE_VECTORS.BrakeCaliper_MR);
    this._registerExplode('BrakeCaliper_RL', EXPLODE_VECTORS.BrakeCaliper_RL);
    this._registerExplode('BrakeCaliper_RR', EXPLODE_VECTORS.BrakeCaliper_RR);
    for (const id of WHEEL_IDS) {
      this._registerExplode(`Susp_${id}`, EXPLODE_VECTORS[`Susp_${id}`]);
    }
    this._registerExplode('Light_Headlight_L', EXPLODE_VECTORS.Light_Headlight_L);
    this._registerExplode('Light_Headlight_R', EXPLODE_VECTORS.Light_Headlight_R);
    this._registerExplode('Light_RoofPods', EXPLODE_VECTORS.Light_RoofPods);
    this._registerExplode('Light_ArchMarkers', EXPLODE_VECTORS.Light_ArchMarkers);
    this._registerExplode('Light_Brake_L', EXPLODE_VECTORS.Light_Brake_L);
    this._registerExplode('Light_Brake_R', EXPLODE_VECTORS.Light_Brake_R);

    this._explodeByKey = new Map();
    for (const e of this._explodeEntries) {
      this._explodeByKey.set(e.key, e.vecParent);
    }
  }

  _isDescendantOf(node, ancestor) {
    let cur = node?.parent;
    while (cur) {
      if (cur === ancestor) return true;
      cur = cur.parent;
    }
    return false;
  }

  _registerExplode(key, vecRoot) {
    const node = this.nodes[key];
    if (!node || !vecRoot) return;
    const rest = this.restPoses.get(node);
    if (!rest) return;
    const vecParent = vecRoot
      .clone()
      .applyQuaternion(rest.rootToParentQuat)
      .multiply(rest.invParentScale);
    this._explodeEntries.push({ key, node, rest, vecParent });
  }

  _initAnnotationAnchors() {
    this._anchorBindings = {};
    for (const [id, spec] of Object.entries(SUBSYSTEM_ANCHOR_SPECS)) {
      const targetNode = this.nodes[spec.nodeKey] || this.truckRoot;
      const worldPt = spec.rootPos.clone().applyMatrix4(this._restRootWorldMatrix);
      const localPt = targetNode.worldToLocal(worldPt);
      this._anchorBindings[id] = { node: targetNode, localOffset: localPt };
    }
  }

  // -------------------------------------------------------------------------
  // Engineering-Grade Automotive Lighting System
  //   - Exact millimeter-aligned positions read dynamically from V2 GLB light nodes
  //   - Dual Headlight SpotLights + Wide Roof Flood SpotLight
  //   - Subtle Volumetric Optical Light Shafts + Radial Optical Lens Halo Flares
  //   - Rear Crimson Brake Bounce PointLight + Crisp White Reverse Backup Lamps
  // -------------------------------------------------------------------------

  _buildLights() {
    const frontParent = this.nodes.CabinShell || this.nodes.FrontBumper || this.truckRoot;
    const rearParent = this.nodes.RearBody || this.truckRoot;

    // Dynamically measure exact V2 light geometry bounds in TruckRoot space
    const bHeadL = this._measureNodeBoundsInRoot(this.nodes.Light_Headlight_L);
    const bHeadR = this._measureNodeBoundsInRoot(this.nodes.Light_Headlight_R);
    const bRoof = this._measureNodeBoundsInRoot(this.nodes.Light_RoofPods);
    const bBrakeL = this._measureNodeBoundsInRoot(this.nodes.Light_Brake_L);
    const bBrakeR = this._measureNodeBoundsInRoot(this.nodes.Light_Brake_R);

    // Outer primary circular headlights & inner fog lamps (exact V2 defaults if missing)
    const headFrontX = bHeadL ? bHeadL.max.x : 4.285;
    const headY = bHeadL ? bHeadL.center.y : 1.830;
    const headMainZL = bHeadL ? THREE.MathUtils.lerp(bHeadL.min.z, bHeadL.max.z, 0.25) : -0.990;
    const headMainZR = bHeadR ? THREE.MathUtils.lerp(bHeadR.min.z, bHeadR.max.z, 0.75) : +0.990;
    const headFogZL = bHeadL ? THREE.MathUtils.lerp(bHeadL.min.z, bHeadL.max.z, 0.80) : -0.610;
    const headFogZR = bHeadR ? THREE.MathUtils.lerp(bHeadR.min.z, bHeadR.max.z, 0.20) : +0.610;

    // Front roof lightbar pod cluster
    const roofFrontX = bRoof ? bRoof.max.x : 3.968;
    const roofY = bRoof ? THREE.MathUtils.lerp(bRoof.min.y, bRoof.max.y, 0.28) : 3.555;

    // Rear brake lamps
    const brakeBackX = bBrakeL ? bBrakeL.min.x : -5.074;
    const brakeY = bBrakeL ? bBrakeL.center.y : 1.700;
    const brakeZL = bBrakeL ? bBrakeL.center.z : -1.080;
    const brakeZR = bBrakeR ? bBrakeR.center.z : +1.080;

    // Container groups
    this._headlightGroup = new THREE.Group();
    this._headlightGroup.name = 'Rig_HeadlightSystem';
    frontParent.add(this._headlightGroup);

    this._volumetricGroup = new THREE.Group();
    this._volumetricGroup.name = 'Rig_HeadlightVolumetricBeams';
    this._headlightGroup.add(this._volumetricGroup);

    this._flareGroup = new THREE.Group();
    this._flareGroup.name = 'Rig_HeadlightLensFlares';
    this._headlightGroup.add(this._flareGroup);

    this._rearLightsGroup = new THREE.Group();
    this._rearLightsGroup.name = 'Rig_RearLightingSystem';
    rearParent.add(this._rearLightsGroup);

    // Helper: create an oriented SpotLight in TruckRoot coords mapped into attach parent
    const makeSpot = (name, color, intensity, distance, angle, penumbra, origin, target) => {
      const spot = new THREE.SpotLight(color, intensity, distance, angle, penumbra, 1.45);
      spot.name = name;
      spot.castShadow = false; // Preserve single crisp shadow map budget for key sunlight
      spot.position.copy(this._rootPointToParentLocal(frontParent, origin[0], origin[1], origin[2]));
      const tgtObj = new THREE.Object3D();
      tgtObj.position.copy(this._rootPointToParentLocal(frontParent, target[0], target[1], target[2]));
      this._headlightGroup.add(tgtObj);
      spot.target = tgtObj;
      this._headlightGroup.add(spot);
      return spot;
    };

    // Dual primary cool cyan-white headlights angled -8.2° downward onto road & moguls
    this._baseSpotIntensity = 96;
    this._spotLeft = makeSpot(
      'SpotLight_Headlight_L',
      0xd6f4ff,
      this._baseSpotIntensity,
      58,
      0.48,
      0.48,
      [headFrontX + 0.04, headY, headMainZL],
      [headFrontX + 18.5, headY - 2.65, headMainZL * 1.18]
    );
    this._spotRight = makeSpot(
      'SpotLight_Headlight_R',
      0xd6f4ff,
      this._baseSpotIntensity,
      58,
      0.48,
      0.48,
      [headFrontX + 0.04, headY, headMainZR],
      [headFrontX + 18.5, headY - 2.65, headMainZR * 1.18]
    );

    // Secondary wide roof-pod flood SpotLight illuminating crests ahead
    this._baseRoofSpotIntensity = 72;
    this._spotRoof = makeSpot(
      'SpotLight_RoofFlood',
      0xc8eeff,
      this._baseRoofSpotIntensity,
      62,
      0.66,
      0.56,
      [roofFrontX + 0.05, roofY, 0.0],
      [roofFrontX + 20.5, roofY - 3.95, 0.0]
    );

    // Volumetric light shaft materials (TSL createVolumetricBeamMaterial with clean fallback!)
    const fallbackBeamTex = createAxialBeamFallbackTexture();
    const createBeamMat = (colorHex, baseOpacity, useHeadlightRamp = true) => {
      if (useHeadlightRamp && typeof TSLMaterials.createVolumetricBeamMaterial === 'function') {
        try {
          const mat = TSLMaterials.createVolumetricBeamMaterial(this.uniforms, colorHex, {
            nearAtTop: true,
            opacity: baseOpacity,
          });
          if (mat) {
            mat.userData = mat.userData || {};
            mat.userData._baseOpacity = baseOpacity;
            return mat;
          }
        } catch (err) {
          // Graceful fallback to additive gradient material
        }
      }
      const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        map: fallbackBeamTex || null,
        transparent: true,
        opacity: baseOpacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      mat.userData = { _baseOpacity: baseOpacity, _isFallbackBeam: true };
      return mat;
    };

    // Helper: build a tapered volumetric light cone starting at (ox, oy, oz) extending forward (+X) pitched down
    this._headBeamMats = [];
    const frontParentQuat = this._computeRootToParentQuat(frontParent);

    const addForwardBeam = (name, origin, rNear, rFar, length, pitchDownDeg, colorHex, opacity) => {
      const geo = new THREE.CylinderGeometry(rNear, rFar, length, 24, 1, true);
      // Cylinder top (+Y = +length/2, uv.y=1) is rNear -> shift so lamp apex sits at (0,0,0), extends along -Y
      geo.translate(0, -length * 0.5, 0);
      const mat = createBeamMat(colorHex, opacity, true);
      this._headBeamMats.push(mat);

      const mesh = new THREE.Mesh(geo, mat);
      mesh.name = name;
      mesh.castShadow = false;
      mesh.receiveShadow = false;
      mesh.renderOrder = 6;
      mesh.userData.isRigFX = true;
      mesh.position.copy(this._rootPointToParentLocal(frontParent, origin[0], origin[1], origin[2]));

      // Rotate -Y to +X pitched downward by pitchDownDeg around TruckRoot +Z
      const rotZ = Math.PI * 0.5 - THREE.MathUtils.degToRad(pitchDownDeg);
      const qBeam = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rotZ);
      mesh.quaternion.copy(frontParentQuat).multiply(qBeam);
      this._volumetricGroup.add(mesh);
      return mesh;
    };

    // Primary headlight optical cones (~9.2 m reach) — calibrated against Fresnel + axial decay
    addForwardBeam('VolBeam_Headlight_L', [headFrontX + 0.01, headY, headMainZL], 0.17, 1.42, 9.2, 8.0, 0x7ee4ff, 0.34);
    addForwardBeam('VolBeam_Headlight_R', [headFrontX + 0.01, headY, headMainZR], 0.17, 1.42, 9.2, 8.0, 0x7ee4ff, 0.34);
    // Inner fog lamp soft cones (~5.4 m reach)
    addForwardBeam('VolBeam_Fog_L', [headFrontX + 0.01, headY - 0.005, headFogZL], 0.11, 0.84, 5.4, 10.5, 0x70dcff, 0.24);
    addForwardBeam('VolBeam_Fog_R', [headFrontX + 0.01, headY - 0.005, headFogZR], 0.11, 0.84, 5.4, 10.5, 0x70dcff, 0.24);
    // Roof-pod wide flood cones (~6.8 m reach)
    addForwardBeam('VolBeam_Roof_L', [roofFrontX + 0.01, roofY, -0.64], 0.15, 1.50, 6.8, 11.5, 0x72ddff, 0.22);
    addForwardBeam('VolBeam_Roof_R', [roofFrontX + 0.01, roofY, +0.64], 0.15, 1.50, 6.8, 11.5, 0x72ddff, 0.22);

    // Crisp radial optical lens halo flares (16 mm proud of lenses)
    this._flareTexture = createRadialFlareTexture();
    const flareGeo = new THREE.PlaneGeometry(1, 1);

    this._headFlareMat = new THREE.MeshBasicMaterial({
      color: 0xa2f0ff,
      map: this._flareTexture || null,
      transparent: true,
      opacity: 0.84,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const qFacePosX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI * 0.5);
    const addFrontFlare = (name, pos, size) => {
      const m = new THREE.Mesh(flareGeo, this._headFlareMat);
      m.name = name;
      m.scale.set(size, size, 1);
      m.position.copy(this._rootPointToParentLocal(frontParent, pos[0], pos[1], pos[2]));
      m.quaternion.copy(frontParentQuat).multiply(qFacePosX);
      m.castShadow = false;
      m.receiveShadow = false;
      m.renderOrder = 7;
      m.userData.isRigFX = true;
      this._flareGroup.add(m);
      return m;
    };

    const flareX = headFrontX + 0.016;
    addFrontFlare('Flare_Headlight_L', [flareX, headY, headMainZL], 0.82);
    addFrontFlare('Flare_Headlight_R', [flareX, headY, headMainZR], 0.82);
    addFrontFlare('Flare_Fog_L', [flareX, headY - 0.004, headFogZL], 0.50);
    addFrontFlare('Flare_Fog_R', [flareX, headY - 0.004, headFogZR], 0.50);
    const roofFlareX = roofFrontX + 0.016;
    addFrontFlare('Flare_Roof_LL', [roofFlareX, roofY, -0.76], 0.44);
    addFrontFlare('Flare_Roof_LC', [roofFlareX, roofY, -0.26], 0.44);
    addFrontFlare('Flare_Roof_RC', [roofFlareX, roofY, +0.26], 0.44);
    addFrontFlare('Flare_Roof_RR', [roofFlareX, roofY, +0.76], 0.44);

    // --- Rear Brake Lights Ground-Bounce PointLight & Crimson Lens Flares ---
    const rearParentQuat = this._computeRootToParentQuat(rearParent);
    const qFaceNegX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI * 0.5);

    this._rearBrakeLight = new THREE.PointLight(0xff2418, 0, 12.5, 1.55);
    this._rearBrakeLight.name = 'PointLight_RearBrakeBounce';
    this._rearBrakeLight.castShadow = false;
    this._rearBrakeLight.position.copy(
      this._rootPointToParentLocal(rearParent, brakeBackX - 0.32, brakeY - 0.22, 0.0)
    );
    this._rearLightsGroup.add(this._rearBrakeLight);

    this._brakeFlareMat = new THREE.MeshBasicMaterial({
      color: 0xff281c,
      map: this._flareTexture || null,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this._brakeFlareGroup = new THREE.Group();
    this._brakeFlareGroup.name = 'Rig_RearBrakeFlares';
    this._rearLightsGroup.add(this._brakeFlareGroup);

    for (const [tag, zPos] of [['L', brakeZL], ['R', brakeZR]]) {
      const bf = new THREE.Mesh(flareGeo, this._brakeFlareMat);
      bf.name = `Flare_Brake_${tag}`;
      bf.scale.set(0.74, 0.46, 1);
      bf.position.copy(this._rootPointToParentLocal(rearParent, brakeBackX - 0.016, brakeY, zPos));
      bf.quaternion.copy(rearParentQuat).multiply(qFaceNegX);
      bf.castShadow = false;
      bf.receiveShadow = false;
      bf.renderOrder = 7;
      bf.userData.isRigFX = true;
      this._brakeFlareGroup.add(bf);
    }

    // --- Crisp White Reverse Backup Lamps + White Rear Ground-Bounce PointLight ---
    this._rearReverseLight = new THREE.PointLight(0xeef6ff, 0, 14.5, 1.5);
    this._rearReverseLight.name = 'PointLight_RearReverseBounce';
    this._rearReverseLight.castShadow = false;
    this._rearReverseLight.position.copy(
      this._rootPointToParentLocal(rearParent, brakeBackX - 0.34, brakeY - 0.16, 0.0)
    );
    this._rearLightsGroup.add(this._rearReverseLight);

    this._reverseLensMat = new THREE.MeshStandardMaterial({
      color: 0xc8d4e0,
      emissive: new THREE.Color(0xf0f8ff),
      emissiveIntensity: 0.0,
      roughness: 0.22,
      metalness: 0.12,
      name: 'mat_reverse_backup_lens',
    });
    const revHousingMat = new THREE.MeshStandardMaterial({
      color: 0x20262e,
      roughness: 0.44,
      metalness: 0.78,
      name: 'mat_reverse_backup_housing',
    });

    this._reverseFlareMat = new THREE.MeshBasicMaterial({
      color: 0xf2f8ff,
      map: this._flareTexture || null,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this._reverseBeamMat = createBeamMat(0xeef6ff, 0.22, false);
    this._reverseBeamMat.opacity = 0.0;

    this._reverseFXGroup = new THREE.Group();
    this._reverseFXGroup.name = 'Rig_RearReverseFX';
    this._reverseFXGroup.visible = false;
    this._rearLightsGroup.add(this._reverseFXGroup);

    const revHousingGeo = new THREE.BoxGeometry(0.045, 0.115, 0.19);
    const revLensGeo = new THREE.PlaneGeometry(0.155, 0.085);
    const revConeGeo = new THREE.CylinderGeometry(0.06, 0.72, 3.4, 18, 1, true);
    revConeGeo.translate(0, -1.7, 0);
    // Point -Y rearward (-X) pitched -15° downward: rotate Z by -(PI/2 - 15°)
    const qRevCone = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 0, 1),
      -(Math.PI * 0.5 - THREE.MathUtils.degToRad(15))
    );

    const revPositions = [
      ['L', Math.sign(brakeZL) * (Math.abs(brakeZL) - 0.34)],
      ['R', Math.sign(brakeZR) * (Math.abs(brakeZR) - 0.34)],
    ];

    this._reverseModulesGroup = new THREE.Group();
    this._reverseModulesGroup.name = 'Rig_RearReverseModules';
    this._rearLightsGroup.add(this._reverseModulesGroup);

    for (const [tag, revZ] of revPositions) {
      // Sculpted compact LED backup module seated right inboard of brake cluster
      const housing = new THREE.Mesh(revHousingGeo, revHousingMat);
      housing.name = `ReverseLamp_Housing_${tag}`;
      housing.position.copy(this._rootPointToParentLocal(rearParent, brakeBackX + 0.01, brakeY, revZ));
      housing.quaternion.copy(rearParentQuat);
      this._reverseModulesGroup.add(housing);

      const lens = new THREE.Mesh(revLensGeo, this._reverseLensMat);
      lens.name = `ReverseLamp_Lens_${tag}`;
      lens.position.copy(this._rootPointToParentLocal(rearParent, brakeBackX - 0.015, brakeY, revZ));
      lens.quaternion.copy(rearParentQuat).multiply(qFaceNegX);
      this._reverseModulesGroup.add(lens);

      const flare = new THREE.Mesh(flareGeo, this._reverseFlareMat);
      flare.name = `Flare_Reverse_${tag}`;
      flare.scale.set(0.56, 0.42, 1);
      flare.position.copy(this._rootPointToParentLocal(rearParent, brakeBackX - 0.024, brakeY, revZ));
      flare.quaternion.copy(rearParentQuat).multiply(qFaceNegX);
      flare.renderOrder = 7;
      flare.userData.isRigFX = true;
      this._reverseFXGroup.add(flare);

      const cone = new THREE.Mesh(revConeGeo, this._reverseBeamMat);
      cone.name = `VolBeam_Reverse_${tag}`;
      cone.position.copy(this._rootPointToParentLocal(rearParent, brakeBackX - 0.02, brakeY, revZ));
      cone.quaternion.copy(rearParentQuat).multiply(qRevCone);
      cone.castShadow = false;
      cone.receiveShadow = false;
      cone.renderOrder = 6;
      cone.userData.isRigFX = true;
      this._reverseFXGroup.add(cone);
    }
  }

  _computeRootToParentQuat(parentNode) {
    const pwq = new THREE.Quaternion();
    const pws = new THREE.Vector3();
    const pwp = new THREE.Vector3();
    parentNode.matrixWorld.decompose(pwp, pwq, pws);
    return pwq.invert().multiply(this._restRootWorldQuat);
  }

  _updateLights(dt) {
    // 1. Smooth ~0.18 s LED/HID headlight ramp
    const targetHL = this.headlightsOn ? 1.0 : 0.0;
    const stepHL = dt / HEADLIGHT_RAMP_DURATION;
    if (Math.abs(targetHL - this._headlightRampLinear) > 1e-4) {
      this._headlightRampLinear = THREE.MathUtils.clamp(
        this._headlightRampLinear + Math.sign(targetHL - this._headlightRampLinear) * Math.min(Math.abs(targetHL - this._headlightRampLinear), stepHL),
        0,
        1
      );
    } else {
      this._headlightRampLinear = targetHL;
    }
    this.headlightLevel = smoothstep01(this._headlightRampLinear);

    // 2. Smooth brake & reverse ramp
    const targetBrake =
      this._manualBrakeOverride !== null
        ? this._manualBrakeOverride
        : this._drive.braking
        ? Math.max(0.82, this._drive.brakeAmount)
        : 0.0;
    this._brakeLevel += (targetBrake - this._brakeLevel) * dampAlpha(18.0, dt);
    if (Math.abs(targetBrake - this._brakeLevel) < 0.002) this._brakeLevel = targetBrake;

    const targetRev =
      this._manualReverseOverride !== null
        ? this._manualReverseOverride
        : this._drivingActive && this._drive.reverse
        ? 1.0
        : 0.0;
    this._reverseLevel += (targetRev - this._reverseLevel) * dampAlpha(15.0, dt);
    if (Math.abs(targetRev - this._reverseLevel) < 0.002) this._reverseLevel = targetRev;

    // 3. Push live values to shared TSL uniforms
    if (this.uniforms) {
      if (this.uniforms.uHeadlightRamp) this.uniforms.uHeadlightRamp.value = this.headlightLevel;
      if (this.uniforms.uHeadlights) this.uniforms.uHeadlights.value = this.headlightLevel;
      if (this.uniforms.uBraking) this.uniforms.uBraking.value = this._brakeLevel;
      if (this.uniforms.uReverse) this.uniforms.uReverse.value = this._reverseLevel;
    }

    // 4. Determine whether optical cones/flares should be visible (hidden cleanly in Wireframe CAD!)
    const activeStyle =
      this.tslController?.getRenderStyle?.() || this._renderStyle || 'pbr';
    const isPbr = activeStyle === 'pbr';
    const lightsAlpha = this._groupOpacityCurrent?.Lights ?? 1.0;

    // Drive mode gets slightly punchier volumetric cones against outdoor sky/gravel; Studio stays crisp & refined
    const envBeamBoost = (this._drivingActive ? 1.05 : 0.88) * lightsAlpha;
    const spotScale = this.headlightLevel * (this._drivingActive ? 1.18 : 0.88) * lightsAlpha;

    // IMPORTANT: Keep all Light nodes `.visible = true` at all times (drive `.intensity = 0` instead)
    // so Three.js WebGPU/WebGL2 active light count NEVER changes (zero runtime shader recompiles!).
    this._spotLeft.intensity = this._baseSpotIntensity * spotScale;
    this._spotRight.intensity = this._baseSpotIntensity * spotScale;
    this._spotRoof.intensity = this._baseRoofSpotIntensity * spotScale;
    this._headlightGroup.visible = true;

    const showFrontOptical = isPbr && this.headlightLevel > 0.01 && lightsAlpha > 0.25;
    this._volumetricGroup.visible = showFrontOptical;
    this._flareGroup.visible = showFrontOptical;

    if (showFrontOptical) {
      for (let i = 0; i < this._headBeamMats.length; i++) {
        const m = this._headBeamMats[i];
        const baseOp = m.userData?._baseOpacity ?? 0.24;
        if (m.userData?.uBeamOpacity) {
          m.userData.uBeamOpacity.value = baseOp * envBeamBoost;
        } else {
          m.opacity = baseOp * this.headlightLevel * envBeamBoost;
        }
      }
      this._headFlareMat.opacity = 0.84 * this.headlightLevel * lightsAlpha;
    }

    // 5. Rear crimson brake ground-bounce & flares
    const brakeGlow = Math.max(this.headlightLevel * 0.12, this._brakeLevel);
    const rearBrakeIntensity =
      (this.headlightLevel * 3.8 + this._brakeLevel * 30.0) * (isPbr ? lightsAlpha : 0.0);
    this._rearBrakeLight.intensity = rearBrakeIntensity;
    this._brakeFlareGroup.visible = isPbr && brakeGlow > 0.02 && lightsAlpha > 0.25;
    this._brakeFlareMat.opacity = THREE.MathUtils.clamp(
      (this.headlightLevel * 0.24 + this._brakeLevel * 0.86) * lightsAlpha,
      0,
      1
    );

    // 6. Rear white reverse backup lamps + white ground-bounce light
    const rearRevIntensity = this._reverseLevel * 36.0 * (isPbr ? lightsAlpha : 0.0);
    this._rearReverseLight.intensity = rearRevIntensity;
    this._reverseLensMat.emissiveIntensity = this._reverseLevel * 4.4;
    if (this._reverseModulesGroup) {
      this._reverseModulesGroup.visible = isPbr && lightsAlpha > 0.35;
    }
    if (this._fairleadGroup) {
      const bumperAlpha = this._groupOpacityCurrent?.FrontBumper ?? 1.0;
      this._fairleadGroup.visible = isPbr && bumperAlpha > 0.35;
    }
    const showRevFX = isPbr && this._reverseLevel > 0.01 && lightsAlpha > 0.25;
    this._reverseFXGroup.visible = showRevFX;
    if (showRevFX) {
      this._reverseFlareMat.opacity = 0.86 * this._reverseLevel * lightsAlpha;
      this._reverseBeamMat.opacity = 0.28 * this._reverseLevel * lightsAlpha;
    }
  }

  // -------------------------------------------------------------------------
  // Mechanical Twin-Drum Recovery Winch (Dynamic 20-Seg Catenary Cables + Stake)
  // -------------------------------------------------------------------------

  _buildProceduralWinchRig() {
    const bumperParent = this.nodes.FrontBumper || this.truckRoot;

    // Dynamically measure exact V2 WinchDrum_L & WinchDrum_R centers and radius
    const bDrumL = this._measureNodeBoundsInRoot(this.nodes.WinchDrum_L);
    const bDrumR = this._measureNodeBoundsInRoot(this.nodes.WinchDrum_R);

    const drumCtrL = bDrumL ? bDrumL.center : new THREE.Vector3(4.251, 0.900, -0.540);
    const drumCtrR = bDrumR ? bDrumR.center : new THREE.Vector3(4.251, 0.900, +0.540);
    const measuredRadius = bDrumL
      ? THREE.MathUtils.clamp(0.5 * bDrumL.size.y, 0.12, 0.30)
      : WINCH_DEFAULT_DRUM_RADIUS;
    this._winchDrumRadius = measuredRadius;

    // Exact bottom-front tangent exit on both spinning orange drums!
    const exitDx = measuredRadius * 0.62;
    const exitDy = -measuredRadius * 0.72;
    const drumExitRootL = new THREE.Vector3(drumCtrL.x + exitDx, drumCtrL.y + exitDy, drumCtrL.z);
    const drumExitRootR = new THREE.Vector3(drumCtrR.x + exitDx, drumCtrR.y + exitDy, drumCtrR.z);

    // Roller fairlead ports on the front bumper fascia (clean horizontal alignment ahead of drums)
    const fairleadRootL = new THREE.Vector3(4.52, drumCtrL.y - 0.02, drumCtrL.z * 0.88);
    const fairleadRootR = new THREE.Vector3(4.52, drumCtrR.y - 0.02, drumCtrR.z * 0.88);
    const cradleRoot = new THREE.Vector3(4.58, drumCtrL.y - 0.02, 0.0);

    // Store bumper-local reference markers so world-space cable ends track bumper seamlessly in Studio, Exploded & Drive!
    this._bumperParent = bumperParent;
    this._drumExitLocalL = this._rootPointToParentLocal(bumperParent, drumExitRootL.x, drumExitRootL.y, drumExitRootL.z);
    this._drumExitLocalR = this._rootPointToParentLocal(bumperParent, drumExitRootR.x, drumExitRootR.y, drumExitRootR.z);
    this._fairleadLocalL = this._rootPointToParentLocal(bumperParent, fairleadRootL.x, fairleadRootL.y, fairleadRootL.z);
    this._fairleadLocalR = this._rootPointToParentLocal(bumperParent, fairleadRootR.x, fairleadRootR.y, fairleadRootR.z);
    this._cradleLocal = this._rootPointToParentLocal(bumperParent, cradleRoot.x, cradleRoot.y, cradleRoot.z);

    // Build compact dual gunmetal steel roller fairlead brackets on FrontBumper
    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x262d36,
      roughness: 0.36,
      metalness: 0.86,
      name: 'mat_winch_steel_hardware',
    });
    const rollerMat = new THREE.MeshStandardMaterial({
      color: 0x6f7b88,
      roughness: 0.28,
      metalness: 0.90,
      name: 'mat_winch_fairlead_roller',
    });
    const cableMat = new THREE.MeshStandardMaterial({
      color: 0xd9751c,
      roughness: 0.38,
      metalness: 0.68,
      name: 'mat_winch_braided_cable',
    });
    const hookMat = new THREE.MeshStandardMaterial({
      color: 0xf47812,
      roughness: 0.30,
      metalness: 0.74,
      name: 'mat_winch_forged_hook',
    });

    this._fairleadGroup = new THREE.Group();
    this._fairleadGroup.name = 'Rig_BumperRollerFairleads';
    const fairleadGroup = this._fairleadGroup;
    const bumperQuat = this._computeRootToParentQuat(bumperParent);
    const frameGeo = new THREE.BoxGeometry(0.06, 0.14, 0.26);
    const hRollerGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.22, 10);
    hRollerGeo.rotateX(Math.PI * 0.5); // cylinder aligned along Z
    const vRollerGeo = new THREE.CylinderGeometry(0.020, 0.020, 0.12, 10);

    for (const [tag, fLocal] of [['L', this._fairleadLocalL], ['R', this._fairleadLocalR]]) {
      const fl = new THREE.Group();
      fl.name = `WinchFairlead_${tag}`;
      fl.position.copy(fLocal);
      fl.quaternion.copy(bumperQuat);

      const base = new THREE.Mesh(frameGeo, steelMat);
      base.position.set(-0.025, 0, 0);
      const rTop = new THREE.Mesh(hRollerGeo, rollerMat);
      rTop.position.set(0.01, +0.052, 0);
      const rBot = new THREE.Mesh(hRollerGeo, rollerMat);
      rBot.position.set(0.01, -0.052, 0);
      const rIn = new THREE.Mesh(vRollerGeo, rollerMat);
      rIn.position.set(0.01, 0, -0.105);
      const rOut = new THREE.Mesh(vRollerGeo, rollerMat);
      rOut.position.set(0.01, 0, +0.105);

      fl.add(base, rTop, rBot, rIn, rOut);
      fairleadGroup.add(fl);
    }
    bumperParent.add(fairleadGroup);

    // World-space container for dynamic catenary cables, Y-equalizer forged hook, and Drive anchor stake
    this._winchWorldGroup = new THREE.Group();
    this._winchWorldGroup.name = 'Rig_WinchWorldSystem';
    this._winchWorldGroup.visible = false;
    if (this._scene) {
      this._scene.add(this._winchWorldGroup);
    }

    // Dynamic 20-segment tubular braided cables (zero GC per-frame update)
    this._cableGeoL = createDynamicCableGeometry(CABLE_SEGMENTS, CABLE_RADIAL_SIDES);
    this._cableGeoR = createDynamicCableGeometry(CABLE_SEGMENTS, CABLE_RADIAL_SIDES);
    this._cableMeshL = new THREE.Mesh(this._cableGeoL, cableMat);
    this._cableMeshR = new THREE.Mesh(this._cableGeoR, cableMat);
    this._cableMeshL.name = 'WinchCable_L';
    this._cableMeshR.name = 'WinchCable_R';
    this._cableMeshL.castShadow = true;
    this._cableMeshR.castShadow = true;
    this._cableMeshL.frustumCulled = false;
    this._cableMeshR.frustumCulled = false;
    this._winchWorldGroup.add(this._cableMeshL, this._cableMeshR);

    // Sculpted Y-Equalizer Shackle + Heavy Forged Steel Recovery Hook with Safety Latch
    // Local convention: -X faces back toward truck drums, +X extends out through the hook jaw!
    this._hookAssembly = new THREE.Group();
    this._hookAssembly.name = 'Winch_ForgedHookAssembly';

    // Dual swaged cable thimble sleeves at (-0.12, 0, ±0.085)
    const thimbleGeo = new THREE.CylinderGeometry(0.026, 0.030, 0.085, 10);
    thimbleGeo.rotateZ(Math.PI * 0.5);
    const thimbleL = new THREE.Mesh(thimbleGeo, steelMat);
    thimbleL.position.set(-0.12, 0, -0.085);
    const thimbleR = new THREE.Mesh(thimbleGeo, steelMat);
    thimbleR.position.set(-0.12, 0, +0.085);

    // Forged Y-equalizer bridle plate + twin cross-pin bolts
    const bridleBar = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.075, 0.24), steelMat);
    bridleBar.position.set(-0.04, 0, 0);
    const bridleNeck = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.085, 0.11), steelMat);
    bridleNeck.position.set(+0.04, 0, 0);
    const clevisPin = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.145, 10), rollerMat);
    clevisPin.rotation.x = Math.PI * 0.5;
    clevisPin.position.set(+0.065, 0, 0);

    // Heavy forged high-vis orange J-hook shank + curved throat + tip + spring safety latch
    const hookShank = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.036, 0.09, 10), hookMat);
    hookShank.rotation.z = Math.PI * 0.5;
    hookShank.position.set(+0.11, 0, 0);

    const hookCurve = new THREE.Mesh(
      new THREE.TorusGeometry(0.095, 0.030, 12, 22, Math.PI * 1.48),
      hookMat
    );
    hookCurve.position.set(+0.20, -0.01, 0);
    hookCurve.rotation.z = -Math.PI * 0.28;

    const hookTip = new THREE.Mesh(new THREE.SphereGeometry(0.032, 10, 8), hookMat);
    hookTip.position.set(+0.255, +0.055, 0);

    const safetyLatch = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.020, 0.026), rollerMat);
    safetyLatch.position.set(+0.185, +0.056, 0);
    safetyLatch.rotation.z = -0.24;

    this._hookAssembly.add(
      thimbleL,
      thimbleR,
      bridleBar,
      bridleNeck,
      clevisPin,
      hookShank,
      hookCurve,
      hookTip,
      safetyLatch
    );
    this._hookAssembly.traverse((obj) => {
      if (obj.isMesh) obj.castShadow = true;
    });
    this._winchWorldGroup.add(this._hookAssembly);

    // Local thimble lug anchor offsets on _hookAssembly where L & R cables terminate cleanly
    this._hookLugLocalL = new THREE.Vector3(-0.155, 0, -0.085);
    this._hookLugLocalR = new THREE.Vector3(-0.155, 0, +0.085);

    // Compact Forged Steel & High-Vis Orange Ground-Anchor Stake (for Off-Road Drive recovery haul!)
    this._stakeAssembly = new THREE.Group();
    this._stakeAssembly.name = 'Winch_TerrainAnchorStake';
    this._stakeAssembly.visible = false;

    const stakePivot = new THREE.Group();
    // Lean stake 26° away from pull (+X in stake local space = away from truck) so it resists load authentically!
    stakePivot.rotation.z = -THREE.MathUtils.degToRad(26);

    const spikeShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.018, 0.72, 10), steelMat);
    spikeShaft.position.set(0, 0.16, 0);
    const driveCap = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.048, 0.08, 10), hookMat);
    driveCap.position.set(0, 0.52, 0);
    const eyeRing = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.022, 10, 18), hookMat);
    eyeRing.position.set(-0.07, 0.19, 0);
    const basePlate = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.24, 0.045, 12), steelMat);
    basePlate.position.set(0, 0.02, 0);

    stakePivot.add(spikeShaft, driveCap, eyeRing);
    this._stakeAssembly.add(basePlate, stakePivot);
    this._stakeAssembly.traverse((obj) => {
      if (obj.isMesh) obj.castShadow = true;
    });
    this._winchWorldGroup.add(this._stakeAssembly);

    // Reusable winch scratch vectors (zero GC!)
    this._wDrumL = new THREE.Vector3();
    this._wDrumR = new THREE.Vector3();
    this._wFairL = new THREE.Vector3();
    this._wFairR = new THREE.Vector3();
    this._wFairMid = new THREE.Vector3();
    this._wCradle = new THREE.Vector3();
    this._wHookLugL = new THREE.Vector3();
    this._wHookLugR = new THREE.Vector3();
    this._wFwdHoriz = new THREE.Vector3();
    this._wPullDir = new THREE.Vector3();
    this._wPt = new THREE.Vector3();
    this._wNextPt = new THREE.Vector3();
    this._wTan = new THREE.Vector3();
    this._wSide = new THREE.Vector3();
    this._wBinorm = new THREE.Vector3();
    this._wUp = new THREE.Vector3(0, 1, 0);
    this._wAltUp = new THREE.Vector3(1, 0, 0);
    this._wQuat = new THREE.Quaternion();
  }

  /**
   * Ensures `_winchWorldGroup` is attached to the world scene (handles deferred scene.add(truckRoot)).
   */
  _ensureWinchWorldAttached() {
    if (!this._winchWorldGroup) return;
    if (!this._scene && this.root.parent) {
      this._scene = this.root.parent;
    }
    if (this._scene && this._winchWorldGroup.parent !== this._scene) {
      this._scene.add(this._winchWorldGroup);
    }
  }

  /**
   * Safe terrain height lookup for cable floor/ground clamping and Drive stake placement.
   */
  _sampleWinchGroundY(x, z, mode) {
    if (mode === 'studio') return 0.0;
    if (typeof this._getTerrainHeight === 'function') {
      const y = this._getTerrainHeight(x, z, 'offroad');
      if (Number.isFinite(y)) return y;
    }
    return 0.0;
  }

  /**
   * Writes a 20-segment smooth tubular braided cable from `pDrum` -> `pFairlead` -> `pLug`
   * with true gravity catenary sag (strictly clamped above local floor/terrain!) directly into
   * pre-allocated BufferAttributes (zero GC allocations).
   */
  _updateCableTube(mesh, pDrum, pFairlead, pLug, sagMeters, envMode, vibAmp = 0) {
    const geo = mesh.geometry;
    const posAttr = geo.getAttribute('position');
    const normAttr = geo.getAttribute('normal');
    const posArr = posAttr.array;
    const normArr = normAttr.array;

    const segs = CABLE_SEGMENTS;
    const sides = CABLE_RADIAL_SIDES;
    const rad = CABLE_RADIUS;

    // Evaluate centerline point at index i (i=0 at drum exit, i=1 at bumper fairlead, i=2..segs along catenary!)
    const evalPoint = (i, out) => {
      if (i <= 0) {
        out.copy(pDrum);
        return;
      }
      if (i === 1) {
        out.copy(pFairlead);
        return;
      }
      const t = (i - 1) / (segs - 1);
      out.lerpVectors(pFairlead, pLug, t);
      // True catenary-like parabolic gravity drape: 4 * t * (1 - t) peaks at t = 0.5
      const arch = 4.0 * t * (1.0 - t);
      out.y -= sagMeters * arch;

      // Subtle high-tension mechanical strand hum when pulling heavy 18t load
      if (vibAmp > 1e-5) {
        out.y += Math.sin(this._winchVibPhase + t * Math.PI * 5.0) * vibAmp * arch;
      }

      // Hard ground/floor keep-out: braided steel cable rests cleanly ON floor/terrain, never clips underneath!
      const gY = this._sampleWinchGroundY(out.x, out.z, envMode);
      if (out.y < gY + 0.022) {
        out.y = gY + 0.022;
      }
    };

    for (let i = 0; i <= segs; i++) {
      evalPoint(i, this._wPt);
      if (i < segs) {
        evalPoint(i + 1, this._wNextPt);
        this._wTan.subVectors(this._wNextPt, this._wPt);
      } else {
        evalPoint(i - 1, this._wNextPt);
        this._wTan.subVectors(this._wPt, this._wNextPt);
      }

      const tanLenSq = this._wTan.lengthSq();
      if (tanLenSq > 1e-8) {
        this._wTan.divideScalar(Math.sqrt(tanLenSq));
      } else {
        this._wTan.set(1, 0, 0);
      }

      // Build stable orthonormal cross-section frame (side, binorm)
      const refUp = Math.abs(this._wTan.y) > 0.94 ? this._wAltUp : this._wUp;
      this._wSide.crossVectors(refUp, this._wTan).normalize();
      this._wBinorm.crossVectors(this._wTan, this._wSide).normalize();

      const baseVert = i * sides;
      for (let j = 0; j < sides; j++) {
        const cs = RING_COS[j];
        const sn = RING_SIN[j];
        const nx = this._wSide.x * cs + this._wBinorm.x * sn;
        const ny = this._wSide.y * cs + this._wBinorm.y * sn;
        const nz = this._wSide.z * cs + this._wBinorm.z * sn;

        const vOff = (baseVert + j) * 3;
        posArr[vOff] = this._wPt.x + nx * rad;
        posArr[vOff + 1] = this._wPt.y + ny * rad;
        posArr[vOff + 2] = this._wPt.z + nz * rad;
        normArr[vOff] = nx;
        normArr[vOff + 1] = ny;
        normArr[vOff + 2] = nz;
      }
    }

    posAttr.needsUpdate = true;
    normAttr.needsUpdate = true;
  }

  /**
   * Computes a real forward terrain anchor stake position in Off-Road Drive mode.
   */
  _computeDriveAnchorTarget() {
    this.truckRoot.updateMatrixWorld(true);
    this._wCradle.copy(this._cradleLocal);
    this._bumperParent.localToWorld(this._wCradle);

    // Truck horizontal forward unit vector (+X in TruckRoot transformed to world)
    this._wFwdHoriz.set(1, 0, 0).applyQuaternion(this.truckRoot.quaternion);
    this._wFwdHoriz.y = 0;
    if (this._wFwdHoriz.lengthSq() < 1e-4) {
      this._wFwdHoriz.set(1, 0, 0);
    } else {
      this._wFwdHoriz.normalize();
    }

    let ax = this._wCradle.x + this._wFwdHoriz.x * WINCH_DRIVE_ANCHOR_DIST;
    let az = this._wCradle.z + this._wFwdHoriz.z * WINCH_DRIVE_ANCHOR_DIST;

    // Keep stake safely inside traversable proving ground bounds
    const r = Math.hypot(ax, az);
    if (r > WINCH_ARENA_SAFE_RADIUS) {
      const scale = WINCH_ARENA_SAFE_RADIUS / r;
      ax *= scale;
      az *= scale;
    }

    const ay = this._sampleWinchGroundY(ax, az, 'offroad');
    this._winchStakeWorldPos.set(ax, ay, az);
  }

  _updateProceduralWinch(dt) {
    this._ensureWinchWorldAttached();
    this._winchVibPhase += dt * 42.0;

    // Refresh world coordinates of spinning drum tangents, bumper fairleads, and stow cradle
    this.truckRoot.updateMatrixWorld(true);
    this._wDrumL.copy(this._drumExitLocalL);
    this._bumperParent.localToWorld(this._wDrumL);
    this._wDrumR.copy(this._drumExitLocalR);
    this._bumperParent.localToWorld(this._wDrumR);
    this._wFairL.copy(this._fairleadLocalL);
    this._bumperParent.localToWorld(this._wFairL);
    this._wFairR.copy(this._fairleadLocalR);
    this._bumperParent.localToWorld(this._wFairR);
    this._wFairMid.copy(this._wFairL).add(this._wFairR).multiplyScalar(0.5);
    this._wCradle.copy(this._cradleLocal);
    this._bumperParent.localToWorld(this._wCradle);

    // Handle stowed idle state quickly
    if (this.winchPhase === 'stowed') {
      this.winchProgress = 0;
      this.winchCableMeters = 0;
      this.winchTensionNorm = 0;
      this.winchDrumSpeedNorm = 0;
      this._winchAnchorExposed = null;
      this._winchStakeExposed = null;
      this._winchWorldGroup.visible = false;
      this._stakeAssembly.visible = false;
      return;
    }

    const prevCableMeters = this.winchCableMeters;
    const isDrive = this._winchMode === 'drive' && this._drivingActive;
    const envMode = isDrive ? 'offroad' : 'studio';

    // If switched out of Drive mode while Drive winch was active, smoothly reel in
    if (this._winchMode === 'drive' && !this._drivingActive && this.winchPhase !== 'reeling') {
      this._winchAnchorExposed = null;
      this._winchStakeExposed = null;
      this.winchActive = false;
      this.winchPhase = 'reeling';
      this._winchPhaseTimer = 0;
      this._winchReelStartPos.copy(this._winchHookWorldPos);
    }

    if (!isDrive) {
      // =====================================================================
      // STUDIO / INSPECT MODE: Realistic Floor-Seated Recovery Cable Demo
      //   stowed -> deploying (floor landing + slack drape) -> deployed
      //          -> tensioning (slack snaps taut!) -> reeling (floor drag -> cradle lift) -> stowed
      // =====================================================================
      this._winchAnchorExposed = null;
      this._winchStakeExposed = null;
      this._stakeAssembly.visible = false;

      // Truck forward horizontal direction in world space
      this._wFwdHoriz.set(1, 0, 0).applyQuaternion(this.truckRoot.quaternion);
      this._wFwdHoriz.y = 0;
      if (this._wFwdHoriz.lengthSq() < 1e-4) this._wFwdHoriz.set(1, 0, 0);
      else this._wFwdHoriz.normalize();

      const studioRate = WINCH_STUDIO_EXT / 2.05; // ~2.24 m/s smooth mechanical payout/reel

      if (this.winchPhase === 'deploying') {
        this._winchExtMeters = Math.min(WINCH_STUDIO_EXT, this._winchExtMeters + studioRate * dt);
        this.winchProgress = this._winchExtMeters / WINCH_STUDIO_EXT;
        this.winchTensionNorm = THREE.MathUtils.lerp(0.28, 0.08, this.winchProgress);
        this.winchDrumSpeedNorm = 0.78;
        const targetSag = THREE.MathUtils.lerp(0.05, 0.34, smoothstep01(this.winchProgress));
        this._winchSagCurrent += (targetSag - this._winchSagCurrent) * dampAlpha(8.0, dt);

        if (this._winchExtMeters >= WINCH_STUDIO_EXT - 1e-3) {
          this._winchExtMeters = WINCH_STUDIO_EXT;
          this.winchProgress = 1.0;
          this.winchPhase = 'deployed';
          this._winchPhaseTimer = 0;
        }
      } else if (this.winchPhase === 'deployed') {
        this._winchExtMeters = WINCH_STUDIO_EXT;
        this.winchProgress = 1.0;
        this.winchTensionNorm = 0.06;
        this.winchDrumSpeedNorm = 0.0;
        this._winchSagCurrent += (0.36 - this._winchSagCurrent) * dampAlpha(6.0, dt);
      } else if (this.winchPhase === 'tensioning') {
        // Brief tension take-up before hook drags: slack catenary visibly SNAPS TAUT!
        this._winchPhaseTimer += dt;
        const tNorm = THREE.MathUtils.clamp(this._winchPhaseTimer / 0.38, 0, 1);
        this.winchTensionNorm = THREE.MathUtils.lerp(0.12, 0.88, smoothstep01(tNorm));
        this.winchDrumSpeedNorm = 0.48 * (1.0 - 0.3 * tNorm);
        this._winchSagCurrent = THREE.MathUtils.lerp(this._winchSagCurrent, 0.018, dampAlpha(18.0, dt));
        // Subtle drum take-up rotation as slack pulls out
        this._winchDrumAngle -= (0.45 * dt) / this._winchDrumRadius;

        if (this._winchPhaseTimer >= 0.38) {
          this.winchPhase = 'reeling';
          this._winchPhaseTimer = 0;
        }
      } else if (this.winchPhase === 'reeling') {
        const reelRate = WINCH_STUDIO_EXT / 1.85;
        this._winchExtMeters = Math.max(0.0, this._winchExtMeters - reelRate * dt);
        this.winchProgress = this._winchExtMeters / WINCH_STUDIO_EXT;
        this.winchTensionNorm = 0.74;
        this.winchDrumSpeedNorm = 0.84;
        this._winchSagCurrent += (0.022 - this._winchSagCurrent) * dampAlpha(14.0, dt);

        if (this._winchExtMeters <= 0.04) {
          this._winchExtMeters = 0;
          this.winchProgress = 0;
          this.winchPhase = 'stowed';
          this.winchActive = false;
          this._winchWorldGroup.visible = false;
          return;
        }
      }

      // Physically grounded hook trajectory:
      //   - Leaves bumper cradle (Y ~ 0.88 m)
      //   - Smooth parabolic gravity drop onto studio floor (Y = HOOK_FLOOR_Y = 0.072 m) by ext = 1.95 m
      //   - Rests & drags cleanly flat ON the studio floor from ext = 1.95 m..4.60 m!
      const ext = this._winchExtMeters;
      const dropFrac = smoothstep01(ext / 1.95);
      const hookY = THREE.MathUtils.lerp(this._wCradle.y, HOOK_FLOOR_Y, dropFrac);

      this._winchHookWorldPos
        .copy(this._wCradle)
        .addScaledVector(this._wFwdHoriz, ext);
      this._winchHookWorldPos.y = Math.max(HOOK_FLOOR_Y, hookY);

      // Orient hook cleanly along forward travel vector, leveling flat onto floor when grounded!
      const yaw = Math.atan2(-this._wFwdHoriz.z, this._wFwdHoriz.x);
      const hangingPitch = -0.44 * Math.sin(dropFrac * Math.PI); // dips nose while airborne, flat 0° on floor!
      this._hookAssembly.position.copy(this._winchHookWorldPos);
      this._hookAssembly.rotation.set(0, yaw, hangingPitch);
    } else {
      // =====================================================================
      // OFF-ROAD DRIVE MODE: Functional Terrain-Anchoring Recovery Winch!
      //   stowed -> deploying (fast grapple shoot to forward stake)
      //          -> tensioning (cable snaps razor-taut)
      //          -> anchored (HAULS 18-ton truck up steep slopes while drums reel in!)
      //          -> reeling (auto-detach at < 2.45m or user toggle -> stow in bumper)
      // =====================================================================
      const stakeEyeY = this._winchStakeWorldPos.y + 0.19;

      if (this.winchPhase === 'deploying') {
        this._winchPhaseTimer += dt;
        const t = THREE.MathUtils.clamp(this._winchPhaseTimer / 0.56, 0, 1);
        const ease = smoothstep01(t);

        this._winchHookWorldPos.lerpVectors(this._wCradle, this._winchStakeWorldPos, ease);
        // Realistic ballistic arc during grapple launch before seating onto stake eye
        this._winchHookWorldPos.y =
          THREE.MathUtils.lerp(this._wCradle.y, stakeEyeY, ease) + Math.sin(t * Math.PI) * 0.42;

        const gY = this._sampleWinchGroundY(this._winchHookWorldPos.x, this._winchHookWorldPos.z, 'offroad');
        if (this._winchHookWorldPos.y < gY + HOOK_FLOOR_Y) {
          this._winchHookWorldPos.y = gY + HOOK_FLOOR_Y;
        }

        this._stakeAssembly.visible = t > 0.35;
        this._winchStakeExposed = this._stakeAssembly.visible ? this._winchStakeWorldPos : null;
        this._winchAnchorExposed = null;
        this.winchProgress = ease;
        this.winchTensionNorm = 0.25;
        this.winchDrumSpeedNorm = 1.0;
        this._winchSagCurrent = 0.22 * (1.0 - ease * 0.4);

        if (t >= 1.0) {
          this.winchPhase = 'tensioning';
          this._winchPhaseTimer = 0;
        }
      } else if (this.winchPhase === 'tensioning') {
        this._winchPhaseTimer += dt;
        const t = THREE.MathUtils.clamp(this._winchPhaseTimer / 0.28, 0, 1);
        this._winchHookWorldPos.set(
          this._winchStakeWorldPos.x,
          stakeEyeY,
          this._winchStakeWorldPos.z
        );
        this._stakeAssembly.visible = true;
        this._winchStakeExposed = this._winchStakeWorldPos;
        this._winchAnchorExposed = null;
        this.winchProgress = 1.0;
        this.winchTensionNorm = THREE.MathUtils.lerp(0.32, 0.96, smoothstep01(t));
        this.winchDrumSpeedNorm = 0.65;
        this._winchSagCurrent = THREE.MathUtils.lerp(0.14, 0.018, smoothstep01(t));
        this._winchDrumAngle -= (0.65 * dt) / this._winchDrumRadius;

        if (t >= 1.0) {
          this.winchPhase = 'anchored';
          this._winchPhaseTimer = 0;
        }
      } else if (this.winchPhase === 'anchored') {
        this._winchHookWorldPos.set(
          this._winchStakeWorldPos.x,
          stakeEyeY,
          this._winchStakeWorldPos.z
        );
        this._stakeAssembly.visible = true;
        this._winchStakeExposed = this._winchStakeWorldPos;
        this._winchAnchorExposed = this._winchStakeWorldPos;

        const liveDist = this._wFairMid.distanceTo(this._winchHookWorldPos);
        this.winchProgress = THREE.MathUtils.clamp(liveDist / WINCH_DRIVE_ANCHOR_DIST, 0, 1);
        this.winchTensionNorm = 0.96;
        this._winchSagCurrent = 0.022;

        // Auto-detach cleanly once truck reaches the stake (< 2.45 m) or if teleported far away (> 28 m)
        if (liveDist <= WINCH_DRIVE_DETACH_DIST || liveDist > 28.0) {
          this.winchActive = false;
          this._winchAnchorExposed = null;
          this._winchStakeExposed = null;
          this.winchPhase = 'reeling';
          this._winchPhaseTimer = 0;
          this._winchReelStartPos.copy(this._winchHookWorldPos);
        }
      } else if (this.winchPhase === 'reeling') {
        this._winchPhaseTimer += dt;
        const t = THREE.MathUtils.clamp(this._winchPhaseTimer / 0.58, 0, 1);
        const ease = smoothstep01(t);

        this._winchHookWorldPos.lerpVectors(this._winchReelStartPos, this._wCradle, ease);
        const gY = this._sampleWinchGroundY(this._winchHookWorldPos.x, this._winchHookWorldPos.z, 'offroad');
        if (this._winchHookWorldPos.y < gY + HOOK_FLOOR_Y) {
          this._winchHookWorldPos.y = gY + HOOK_FLOOR_Y;
        }

        this._stakeAssembly.visible = false;
        this._winchStakeExposed = null;
        this._winchAnchorExposed = null;
        this.winchProgress = 1.0 - ease;
        this.winchTensionNorm = 0.58 * (1.0 - ease);
        this.winchDrumSpeedNorm = 0.92;
        this._winchSagCurrent = 0.03;

        if (t >= 1.0) {
          this.winchPhase = 'stowed';
          this.winchActive = false;
          this.winchProgress = 0;
          this.winchCableMeters = 0;
          this.winchTensionNorm = 0;
          this.winchDrumSpeedNorm = 0;
          this._winchWorldGroup.visible = false;
          return;
        }
      }

      // Position & orient ground anchor stake facing cleanly away from the bumper
      this._wPullDir.subVectors(this._winchStakeWorldPos, this._wFairMid);
      const pullYaw = Math.atan2(-this._wPullDir.z, this._wPullDir.x);
      this._stakeAssembly.position.copy(this._winchStakeWorldPos);
      this._stakeAssembly.rotation.set(0, pullYaw, 0);

      // Seat forged J-hook throat cleanly around stake eye ring during tensioning & anchored haul
      if (this.winchPhase === 'tensioning' || this.winchPhase === 'anchored') {
        const horizLen = Math.hypot(this._wPullDir.x, this._wPullDir.z);
        if (horizLen > 0.1) {
          this._winchHookWorldPos.x -= (this._wPullDir.x / horizLen) * 0.24;
          this._winchHookWorldPos.z -= (this._wPullDir.z / horizLen) * 0.24;
        }
      }

      // Orient forged hook straight along the taut pull line into the stake eye
      this._wPullDir.subVectors(this._winchHookWorldPos, this._wFairMid);
      const pullHoriz = Math.hypot(this._wPullDir.x, this._wPullDir.z);
      const pullPitch = Math.atan2(this._wPullDir.y, Math.max(0.1, pullHoriz));
      this._hookAssembly.position.copy(this._winchHookWorldPos);
      this._hookAssembly.rotation.set(0, pullYaw, pullPitch);
    }

    // Update exact live cable length & spin WinchDrum_L/R at exact physical dTheta = dLength / R_drum!
    this._hookAssembly.updateMatrixWorld(true);
    this._wHookLugL.copy(this._hookLugLocalL).applyMatrix4(this._hookAssembly.matrixWorld);
    this._wHookLugR.copy(this._hookLugLocalR).applyMatrix4(this._hookAssembly.matrixWorld);

    const lenL = this._wDrumL.distanceTo(this._wFairL) + this._wFairL.distanceTo(this._wHookLugL);
    const lenR = this._wDrumR.distanceTo(this._wFairR) + this._wFairR.distanceTo(this._wHookLugR);
    this.winchCableMeters = 0.5 * (lenL + lenR);

    if (prevCableMeters > 0.001 && dt > 1e-5) {
      const dLen = this.winchCableMeters - prevCableMeters;
      this._winchDrumAngle += dLen / this._winchDrumRadius;
      if (this.winchPhase === 'anchored') {
        // Real live drum reel-in speed proportional to truck haul rate!
        const cableSpeedMs = Math.abs(dLen) / dt;
        this.winchDrumSpeedNorm = THREE.MathUtils.clamp(cableSpeedMs / 3.8, 0.14, 1.0);
      }
    }

    // Update both dynamic 20-segment tubular braided cables in world space (zero GC)
    const vibAmp = this.winchPhase === 'anchored' ? 0.0045 : this.winchPhase === 'tensioning' ? 0.003 : 0.0;
    this._updateCableTube(this._cableMeshL, this._wDrumL, this._wFairL, this._wHookLugL, this._winchSagCurrent, envMode, vibAmp);
    this._updateCableTube(this._cableMeshR, this._wDrumR, this._wFairR, this._wHookLugR, this._winchSagCurrent, envMode, vibAmp);
    this._winchWorldGroup.visible = true;
  }

  // -------------------------------------------------------------------------
  // Public Engineering Inspection & Mechanical Controls API
  // -------------------------------------------------------------------------

  setInspectionMode(mode) {
    const normalized = String(mode || 'exterior').toLowerCase();
    const valid = MODE_OPACITIES[normalized] ? normalized : 'exterior';
    const prevMode = this.inspectionMode;
    const changed = valid !== prevMode;
    this.inspectionMode = valid;

    const table = MODE_OPACITIES[valid];
    for (const g of ALL_GROUPS) {
      this._groupOpacityTarget[g] = table[g] ?? 1.0;
    }

    if (changed) {
      if (valid === 'exploded') {
        this.explodeTarget = 1.0;
      } else {
        this.explodeTarget = 0.0;
      }

      if (prevMode === 'interior' && valid !== 'interior' && this._interiorAutoOpenedDoors) {
        this.doorsOpenTarget = this._doorsPriorToInterior;
        this._interiorAutoOpenedDoors = false;
      }

      if (valid === 'interior' && this.doorsOpenTarget < 0.5) {
        this._doorsPriorToInterior = this.doorsOpenTarget;
        this._interiorAutoOpenedDoors = true;
        this.doorsOpenTarget = 1.0;
      }
    }

    if (this.tslController?.setElectricalHighlight) {
      this.tslController.setElectricalHighlight(valid === 'electrical');
    }

    if (this.uniforms?.uPowerOn) {
      this.uniforms.uPowerOn.value = valid === 'interior' || valid === 'electrical' ? 1.15 : 1.0;
    }

    return this.inspectionMode;
  }

  setExplodeAmount(amount) {
    this.explodeTarget = THREE.MathUtils.clamp(Number(amount) || 0, 0, 1);
    return this.explodeTarget;
  }

  focusSubsystem(idOrNull) {
    const next = idOrNull ? String(idOrNull).toLowerCase() : null;
    this.focusedSubsystem = next && SUBSYSTEM_ANCHOR_SPECS[next] ? next : null;
    if (this.tslController?.setSelectedGroup) {
      this.tslController.setSelectedGroup(this.focusedSubsystem);
    }
    return this.focusedSubsystem;
  }

  getAnnotationAnchors() {
    this.truckRoot.updateMatrixWorld(true);
    for (const [id, binding] of Object.entries(this._anchorBindings)) {
      const out = this._anchorOutputs[id];
      out.copy(binding.localOffset);
      binding.node.localToWorld(out);
    }
    return this._anchorOutputs;
  }

  setDoorsOpen(open) {
    const next = Boolean(open);
    if (!(this.inspectionMode === 'interior' && this._interiorAutoOpenedDoors && next)) {
      this._interiorAutoOpenedDoors = false;
    }
    this.doorsOpenTarget = next ? 1.0 : 0.0;
    return next;
  }

  toggleDoors() {
    return this.setDoorsOpen(this.doorsOpenTarget < 0.5);
  }

  setHatchesOpen(open) {
    this.hatchesOpenTarget = open ? 1.0 : 0.0;
    return Boolean(open);
  }

  toggleHatches() {
    return this.setHatchesOpen(this.hatchesOpenTarget < 0.5);
  }

  setHeadlights(on) {
    this.headlightsOn = Boolean(on);
    return this.headlightsOn;
  }

  toggleHeadlights() {
    return this.setHeadlights(!this.headlightsOn);
  }

  setBraking(braking, amount = null) {
    if (braking === null || braking === undefined) {
      this._manualBrakeOverride = null;
    } else {
      this._manualBrakeOverride = braking ? (Number.isFinite(amount) ? THREE.MathUtils.clamp(amount, 0, 1) : 1.0) : 0.0;
    }
  }

  setReverse(isReverse) {
    if (isReverse === null || isReverse === undefined) {
      this._manualReverseOverride = null;
    } else {
      this._manualReverseOverride = isReverse ? 1.0 : 0.0;
    }
  }

  /**
   * Deploy or retract the twin mechanical recovery winch.
   * - In Studio / Inspect: smoothly spools out ~4.6 m onto the studio floor with catenary drape;
   *   retracting first tensions slack taut, then drags & lifts the hook cleanly into the bumper cradle.
   * - In Off-Road Drive: launches & plants a forged steel ground-anchor stake ~11.5 m ahead on the
   *   terrain, pulls twin cables razor-taut, and exposes `winchAnchorWorld` to haul the 18-ton truck!
   */
  setWinchActive(active) {
    const next = Boolean(active);
    this.winchActive = next;

    if (next) {
      this._winchMode = this._drivingActive ? 'drive' : 'studio';
      if (this._winchMode === 'drive') {
        if (this.winchPhase === 'stowed' || this.winchPhase === 'reeling') {
          this._computeDriveAnchorTarget();
          this.winchPhase = 'deploying';
          this._winchPhaseTimer = 0;
          this._winchAnchorExposed = null;
          this._winchStakeExposed = null;
        }
      } else {
        if (
          this.winchPhase === 'stowed' ||
          this.winchPhase === 'reeling' ||
          this.winchPhase === 'tensioning'
        ) {
          this.winchPhase = 'deploying';
          this._winchPhaseTimer = 0;
        }
      }
    } else {
      this._winchAnchorExposed = null;
      if (this.winchPhase === 'stowed') return false;

      if (this._winchMode === 'drive') {
        this._winchStakeExposed = null;
        this._winchReelStartPos.copy(this._winchHookWorldPos);
        this.winchPhase = 'reeling';
        this._winchPhaseTimer = 0;
      } else {
        // Studio retract: brief tension take-up if extended so slack visibly snaps taut before drag!
        if (this._winchExtMeters > 0.65 && (this.winchPhase === 'deployed' || this.winchPhase === 'deploying')) {
          this.winchPhase = 'tensioning';
          this._winchPhaseTimer = 0;
        } else {
          this.winchPhase = 'reeling';
          this._winchPhaseTimer = 0;
        }
      }
    }
    return this.winchActive;
  }

  toggleWinch() {
    return this.setWinchActive(!this.winchActive);
  }

  isAnimating() {
    if (this._drivingActive) return true;
    if (Math.abs((this.explodeTarget || 0) - (this.explodeCurrent || 0)) > 0.0008) return true;
    if (Math.abs((this.doorsOpen ? 1 : 0) - (this.doorsProgress || 0)) > 0.0008) return true;
    if (Math.abs((this.hatchesOpen ? 1 : 0) - (this.hatchesProgress || 0)) > 0.0008) return true;
    if (this.winchPhase && this.winchPhase !== 'stowed' && this.winchPhase !== 'deployed') return true;
    if (Math.abs((this.headlightsOn ? 1 : 0) - (this._headlightRampLinear || 0)) > 0.002) return true;
    if (this._brakeLevel > 0.002 || this._reverseLevel > 0.002) return true;
    if (this.inspectionMode === 'powertrain') return true;
    if (this.inspectionMode === 'suspension' && this.suspensionDemoEnabled) return true;
    if (this._groupOpacityCurrent && this._groupOpacityTarget) {
      for (const g in this._groupOpacityTarget) {
        if (Math.abs((this._groupOpacityCurrent[g] ?? 1) - (this._groupOpacityTarget[g] ?? 1)) > 0.001) {
          return true;
        }
      }
    }
    return false;
  }

  hasGeometryMotion() {
    if (this._drivingActive) return true;
    if (Math.abs((this.explodeTarget || 0) - (this.explodeCurrent || 0)) > 0.0008) return true;
    if (Math.abs((this.doorsOpen ? 1 : 0) - (this.doorsProgress || 0)) > 0.0008) return true;
    if (Math.abs((this.hatchesOpen ? 1 : 0) - (this.hatchesProgress || 0)) > 0.0008) return true;
    if (this.winchPhase && this.winchPhase !== 'stowed' && this.winchPhase !== 'deployed') return true;
    if (this.inspectionMode === 'suspension' && this.suspensionDemoEnabled) return true;
    if (this._groupOpacityCurrent && this._groupOpacityTarget) {
      for (const g in this._groupOpacityTarget) {
        if (Math.abs((this._groupOpacityCurrent[g] ?? 1) - (this._groupOpacityTarget[g] ?? 1)) > 0.001) {
          return true;
        }
      }
    }
    return false;
  }

  setSuspensionDemoEnabled(enabled) {
    this.suspensionDemoEnabled = Boolean(enabled);
  }

  /**
   * Reset TruckRoot chassis transform, driving kinematics & any active Drive winch cleanly when returning to Studio.
   */
  resetDrivingPose() {
    this._drivingActive = false;
    this.truckRoot.position.set(0, 0, 0);
    this.truckRoot.quaternion.identity();
    this._drive.steerAvg = 0;
    this._drive.steerLeft = 0;
    this._drive.steerRight = 0;
    this._drive.speedMs = 0;
    this._drive.rpmNorm = 0.16;
    this._drive.throttle = 0;
    this._drive.braking = false;
    this._drive.brakeAmount = 0;
    this._drive.reverse = false;
    this._drive.gear = 'N';
    for (let i = 0; i < 6; i++) {
      this._drive.wheelCompression[i] = 0;
      this._drive.wheelSpinVel[i] = 0;
    }

    // Immediately stow any Drive-anchored winch stake so it never lingers in Studio
    if (this._winchMode === 'drive' || this._winchStakeExposed || this._winchAnchorExposed) {
      this.winchActive = false;
      this.winchPhase = 'stowed';
      this.winchProgress = 0;
      this.winchCableMeters = 0;
      this.winchTensionNorm = 0;
      this.winchDrumSpeedNorm = 0;
      this._winchExtMeters = 0;
      this._winchAnchorExposed = null;
      this._winchStakeExposed = null;
      if (this._winchWorldGroup) this._winchWorldGroup.visible = false;
      if (this._stakeAssembly) this._stakeAssembly.visible = false;
    }

    this._brakeLevel = 0;
    this._reverseLevel = 0;
    if (this.uniforms?.uBraking) this.uniforms.uBraking.value = 0;
    if (this.uniforms?.uReverse) this.uniforms.uReverse.value = 0;
    if (this.uniforms?.uSpeed) this.uniforms.uSpeed.value = 0;

    this._updateLights(0.016);
    this._applyMechanicalPose();
  }

  /**
   * Returns rich diagnostic & integration telemetry for app.js, audio.js, and verification hooks.
   */
  getState() {
    return {
      inspectionMode: this.inspectionMode,
      focusedSubsystem: this.focusedSubsystem,
      explodeAmount: this.explodeCurrent,
      explodeTarget: this.explodeTarget,
      doorsOpen: this.doorsOpenTarget > 0.5,
      doorsOpenProgress: this.doorsOpenCurrent,
      hatchesOpen: this.hatchesOpenTarget > 0.5,
      hatchesOpenProgress: this.hatchesOpenCurrent,
      headlightsOn: this.headlightsOn,
      headlightRamp: this.headlightLevel,
      brakingActive: this._brakeLevel > 0.08,
      reverseActive: this._reverseLevel > 0.08,
      winchActive: this.winchActive,
      winchPhase: this.winchPhase,
      winchProgress: this.winchProgress,
      winchCableMeters: this.winchCableMeters,
      winchTensionNorm: this.winchTensionNorm,
      winchDrumSpeedNorm: this.winchDrumSpeedNorm,
      winchAnchorWorld: this._winchAnchorExposed,
      winchStakeWorld: this._winchStakeExposed,
      drivingActive: this._drivingActive,
      maxSafeWheelUp: {
        frontStraight: VEHICLE_CONSTANTS.MAX_UP_OFFSET_FRONT,
        frontFullLock:
          VEHICLE_CONSTANTS.MAX_UP_OFFSET_FRONT -
          VEHICLE_CONSTANTS.MAX_UP_OFFSET_FRONT_STEER_CUT,
        midRear: VEHICLE_CONSTANTS.MAX_UP_OFFSET_REAR_MID,
      },
      indexedNodes: Object.keys(this.nodes).filter((k) => Boolean(this.nodes[k])).length,
    };
  }

  // -------------------------------------------------------------------------
  // Live 6×6 Physics Synchronization & Per-Frame Update
  // -------------------------------------------------------------------------

  applyPhysicsState(state, dt = 0.016) {
    if (!state) return;
    this._drivingActive = Boolean(state.active);

    if (state.position) {
      this.truckRoot.position.copy(state.position);
    }
    if (state.quaternion) {
      this.truckRoot.quaternion.copy(state.quaternion);
    }

    this._drive.steerAvg = Number(state.steerAngle) || 0;
    this._drive.steerLeft = Number(state.steerLeft) || 0;
    this._drive.steerRight = Number(state.steerRight) || 0;
    this._drive.speedMs = Number(state.speedMs) || 0;
    this._drive.rpmNorm = Number(state.rpmNorm) || 0.16;
    this._drive.throttle = Number(state.throttle) || 0;
    this._drive.braking = Boolean(state.braking);
    this._drive.brakeAmount =
      state.brakeAmount !== undefined ? Number(state.brakeAmount) : state.braking ? 1.0 : 0.0;
    this._drive.gear = String(state.gear || 'N');
    this._drive.reverse = Boolean(state.reverse || state.gear === 'R');

    const wheels = state.wheelStates;
    let avgWheelSpinVel = 0;
    if (Array.isArray(wheels)) {
      for (let i = 0; i < 6 && i < wheels.length; i++) {
        const w = wheels[i];
        const steerForWheel = i === 0 ? this._drive.steerLeft : i === 1 ? this._drive.steerRight : 0;
        // Double-enforce strict zero-clipping safety clamp directly on incoming offsets!
        this._drive.wheelCompression[i] = this._clampSafeWheelOffset(
          i,
          Number(w.compressionOffset) || 0,
          steerForWheel
        );
        this._drive.wheelSpin[i] = Number(w.spinAngle) || 0;
        this._drive.wheelSpinVel[i] = Number(w.spinVel) || 0;
        avgWheelSpinVel += this._drive.wheelSpinVel[i];
      }
      avgWheelSpinVel /= 6;
    }

    const safeDt = Math.min(Math.max(dt || 0, 0), 0.05);
    if (this._drivingActive) {
      this._driveshaftAngle += avgWheelSpinVel * 3.4 * safeDt;
    }

    if (this.uniforms?.uSpeed) {
      this.uniforms.uSpeed.value = Math.abs(this._drive.speedMs);
    }

    this._applyMechanicalPose();
  }

  /**
   * Per-frame damped rig animation update (call every frame in both Studio & Driving modes!).
   */
  update(dt = 0.016, context = null) {
    const safeDt = Math.min(Math.max(Number.isFinite(dt) ? dt : 0.016, 0), 0.05);
    if (context?.renderStyle) {
      this._renderStyle = String(context.renderStyle).toLowerCase();
    }

    // 1. Smoothly damp explode factor, doors, and hatches
    const aSlow = dampAlpha(6.2, safeDt);
    const aMed = dampAlpha(8.5, safeDt);

    this.explodeCurrent += (this.explodeTarget - this.explodeCurrent) * aSlow;
    if (Math.abs(this.explodeTarget - this.explodeCurrent) < 1e-4) {
      this.explodeCurrent = this.explodeTarget;
    }

    this.doorsOpenCurrent += (this.doorsOpenTarget - this.doorsOpenCurrent) * aMed;
    this.hatchesOpenCurrent += (this.hatchesOpenTarget - this.hatchesOpenCurrent) * aMed;

    // 2. Smoothly update automotive lighting (LED ramp, volumetric shafts, flares, brake & reverse bounce)
    this._updateLights(safeDt);

    // 3. Smoothly damp per-group inspection opacities
    const aOpac = dampAlpha(9.5, safeDt);
    for (let i = 0; i < ALL_GROUPS.length; i++) {
      const g = ALL_GROUPS[i];
      const cur = this._groupOpacityCurrent[g];
      const tgt = this._groupOpacityTarget[g];
      if (Math.abs(tgt - cur) > 0.001) {
        const next = cur + (tgt - cur) * aOpac;
        this._groupOpacityCurrent[g] = Math.abs(tgt - next) < 0.002 ? tgt : next;
        this._applyGroupOpacity(g, this._groupOpacityCurrent[g]);
      }
    }

    // 4. Spin Cooling Fans & Powertrain Inspection Driveshafts
    let fanSpeed = 2.8;
    if (this._drivingActive) {
      fanSpeed = 7.5 + this._drive.rpmNorm * 18.0 + this._drive.throttle * 8.0;
    } else if (this.inspectionMode === 'powertrain' || this.inspectionMode === 'exploded') {
      fanSpeed = 11.5;
    }
    this._fanAngle += fanSpeed * safeDt;

    if (!this._drivingActive) {
      if (this.inspectionMode === 'powertrain' || this.inspectionMode === 'exploded') {
        this._driveshaftAngle += 4.2 * safeDt;
      }

      // Zero-clipping suspension-articulation demo when parked in 'suspension' mode
      // Oscillates strictly in [-0.21 m, +0.01 m] so tires never clip upward into arches!
      if (this.inspectionMode === 'suspension' && this.suspensionDemoEnabled && this.explodeCurrent < 0.15) {
        this._demoTime += safeDt;
        const w = this._demoTime * 1.55;
        const phases = [0.0, Math.PI * 0.85, 1.35, Math.PI * 0.85 + 1.35, 2.55, Math.PI * 0.85 + 2.55];
        const targetSteer = Math.sin(this._demoTime * 0.92) * THREE.MathUtils.degToRad(18);
        this._drive.steerAvg += (targetSteer - this._drive.steerAvg) * aMed;
        this._drive.steerLeft = this._drive.steerAvg * (this._drive.steerAvg >= 0 ? 1.08 : 0.92);
        this._drive.steerRight = this._drive.steerAvg * (this._drive.steerAvg >= 0 ? 0.92 : 1.08);
        for (let i = 0; i < 6; i++) {
          const rawTarget = -0.10 + Math.sin(w + phases[i]) * 0.11;
          const steerRad = i === 0 ? this._drive.steerLeft : i === 1 ? this._drive.steerRight : 0;
          const safeTarget = this._clampSafeWheelOffset(i, rawTarget, steerRad);
          this._drive.wheelCompression[i] += (safeTarget - this._drive.wheelCompression[i]) * aMed;
        }
      } else {
        for (let i = 0; i < 6; i++) {
          this._drive.wheelCompression[i] += (0 - this._drive.wheelCompression[i]) * aMed;
        }
        this._drive.steerAvg += (0 - this._drive.steerAvg) * aMed;
        this._drive.steerLeft += (0 - this._drive.steerLeft) * aMed;
        this._drive.steerRight += (0 - this._drive.steerRight) * aMed;
      }
    }

    // 5. Apply combined exploded + mechanical + driving transforms BEFORE reading world bumper matrix for winch!
    this._applyMechanicalPose();

    // 6. Update mechanical twin-drum winch cables, hook, ground stake & synchronized drum spin
    this._updateProceduralWinch(safeDt);

    // Refresh winch drum rotation immediately after winch step so visual drum spin is frame-exact
    this._applyRootAxisRotation('WinchDrum_L', 'axisZ', +this._winchDrumAngle);
    this._applyRootAxisRotation('WinchDrum_R', 'axisZ', +this._winchDrumAngle);
  }

  // -------------------------------------------------------------------------
  // Hard Kinematic Zero-Clipping Safety Guard & Deterministic Pose Application
  // -------------------------------------------------------------------------

  _clampSafeWheelOffset(wheelIdx, offsetY, steerRad = 0) {
    const isSteerable = wheelIdx === 0 || wheelIdx === 1;
    const maxUp = computeSafeMaxUpOffset(isSteerable, steerRad);
    return THREE.MathUtils.clamp(offsetY, -VEHICLE_CONSTANTS.MAX_DROOP, maxUp);
  }

  _applyGroupOpacity(groupKey, alpha) {
    if (this.tslController?.setGroupOpacity) {
      this.tslController.setGroupOpacity(groupKey, alpha);
      return;
    }
    for (const [nodeKey, grp] of Object.entries(NODE_GROUP_KEYS)) {
      if (grp !== groupKey) continue;
      const node = this.nodes[nodeKey];
      if (!node) continue;
      node.traverse((obj) => {
        if (!obj.isMesh || !obj.material) return;
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
        for (const m of mats) {
          if (m.userData?._origTransparent === undefined) {
            m.userData._origTransparent = Boolean(m.transparent);
            m.userData._origOpacity = m.opacity ?? 1.0;
          }
          const wantTrans = m.userData._origTransparent || alpha < 0.985;
          m.transparent = wantTrans;
          m.opacity = m.userData._origOpacity * alpha;
          m.depthWrite = !wantTrans;
        }
      });
    }
  }

  _applyMechanicalPose() {
    const ex = this.explodeCurrent;
    const exEase = ex * ex * (3 - 2 * ex);
    const suspBlend = 1.0 - THREE.MathUtils.clamp(exEase * 1.4, 0, 1);

    // 1. Apply baseline Exploded-View translations to all registered subsystems
    for (let i = 0; i < this._explodeEntries.length; i++) {
      const e = this._explodeEntries[i];
      e.node.position.copy(e.rest.position).addScaledVector(e.vecParent, exEase);
    }

    // 2. Hinged Cabin Doors
    this._applyRootAxisRotation('Door_Left', 'axisY', -this.doorsOpenCurrent * DOOR_OPEN_ANGLE);
    this._applyRootAxisRotation('Door_Right', 'axisY', +this.doorsOpenCurrent * DOOR_OPEN_ANGLE);

    // 3. Hinged Service Hatches
    this._applyRootAxisRotation('Hatch_Left_Main', 'axisX', +this.hatchesOpenCurrent * HATCH_SIDE_OPEN_ANGLE);
    this._applyRootAxisRotation('Hatch_Right_Main', 'axisX', -this.hatchesOpenCurrent * HATCH_SIDE_OPEN_ANGLE);
    this._applyRootAxisRotation('Hatch_Rear_Service', 'axisY', -this.hatchesOpenCurrent * HATCH_REAR_OPEN_ANGLE);

    // 4. Winch Drums (+axisZ pays bottom cable tangent forward +X; -axisZ reels cable in!)
    this._applyRootAxisRotation('WinchDrum_L', 'axisZ', +this._winchDrumAngle);
    this._applyRootAxisRotation('WinchDrum_R', 'axisZ', +this._winchDrumAngle);

    // 5. Cooling Fans
    this._applyRootAxisRotation('CoolingFan_L', 'axisX', this._fanAngle);
    this._applyRootAxisRotation('CoolingFan_R', 'axisX', -this._fanAngle);

    // 6. Driveshafts
    for (const dsKey of ['Driveshaft_Front', 'Driveshaft_Mid', 'Driveshaft_Rear']) {
      const node = this.nodes[dsKey];
      const info = this._driveshaftAxes[dsKey];
      if (!node || !info) continue;
      const rest = this.restPoses.get(node);
      if (!rest) continue;
      this._q1.setFromAxisAngle(info.axis, this._driveshaftAngle);
      if (info.local) {
        node.quaternion.copy(rest.quaternion).multiply(this._q1);
      } else {
        node.quaternion.copy(this._q1).multiply(rest.quaternion);
      }
    }

    // 7. Compute hard-clamped wheel offsets (MATHEMATICAL ZERO-CLIPPING GUARANTEE!)
    const rawComp = this._drive.wheelCompression;
    const spin = this._drive.wheelSpin;
    const steerL = this._drive.steerLeft * suspBlend;
    const steerR = this._drive.steerRight * suspBlend;
    const steerAvg = this._drive.steerAvg * suspBlend;

    const c0 = this._clampSafeWheelOffset(0, rawComp[0] * suspBlend, steerL);
    const c1 = this._clampSafeWheelOffset(1, rawComp[1] * suspBlend, steerR);
    const c2 = this._clampSafeWheelOffset(2, rawComp[2] * suspBlend, 0);
    const c3 = this._clampSafeWheelOffset(3, rawComp[3] * suspBlend, 0);
    const c4 = this._clampSafeWheelOffset(4, rawComp[4] * suspBlend, 0);
    const c5 = this._clampSafeWheelOffset(5, rawComp[5] * suspBlend, 0);
    const safeComp = [c0, c1, c2, c3, c4, c5];

    // SteerKnuckle_FL & SteerKnuckle_FR
    this._applyWheelCarrier('SteerKnuckle_FL', c0, steerL);
    this._applyWheelCarrier('SteerKnuckle_FR', c1, steerR);

    // TieRod_Front
    if (this.nodes.TieRod_Front) {
      const rest = this.restPoses.get(this.nodes.TieRod_Front);
      if (rest) {
        const frontAvg = 0.5 * (c0 + c1);
        const latShift = -Math.sin(steerAvg) * 0.28;
        const foreShift = -0.32 * (1 - Math.cos(steerAvg));
        this.nodes.TieRod_Front.position
          .addScaledVector(rest.axisX, foreShift * rest.invParentScale.x)
          .addScaledVector(rest.axisY, frontAvg * 0.72 * rest.invParentScale.y)
          .addScaledVector(rest.axisZ, latShift * rest.invParentScale.z);
      }
    }

    // Cabin SteeringWheel
    if (this.nodes.SteeringWheel) {
      const rest = this.restPoses.get(this.nodes.SteeringWheel);
      if (rest) {
        const swAngle = -steerAvg * 2.8;
        if (this._steeringWheelLocalSpin) {
          this._v1.set(1, 0, 0);
          this._q1.setFromAxisAngle(this._v1, swAngle);
          this.nodes.SteeringWheel.quaternion.copy(rest.quaternion).multiply(this._q1);
        } else {
          this._q1.setFromAxisAngle(this._steeringWheelAxis, swAngle);
          this.nodes.SteeringWheel.quaternion.copy(this._q1).multiply(rest.quaternion);
        }
      }
    }

    // 8. All 6 Wheels & Brake Calipers
    this._applyWheelSpinOnly('Wheel_FL', spin[0], !this._wheelNestedFL ? c0 : 0, !this._wheelNestedFL ? steerL : 0);
    this._applyWheelSpinOnly('Wheel_FR', spin[1], !this._wheelNestedFR ? c1 : 0, !this._wheelNestedFR ? steerR : 0);
    if (!this._caliperNestedFL) this._applyWheelCarrier('BrakeCaliper_FL', c0, steerL);
    if (!this._caliperNestedFR) this._applyWheelCarrier('BrakeCaliper_FR', c1, steerR);

    const rearIds = ['ML', 'MR', 'RL', 'RR'];
    for (let r = 0; r < rearIds.length; r++) {
      const id = rearIds[r];
      const idx = r + 2;
      const c = safeComp[idx];
      this._applyWheelSpinOnly(`Wheel_${id}`, spin[idx], c, 0);
      this._applyVerticalOffset(`BrakeCaliper_${id}`, c);
    }

    // 9. Portal Axles (heave + L/R articulation tilt across full hydropneumatic range)
    this._applyAxleArticulation('FrontAxle', c0, c1);
    this._applyAxleArticulation('MiddleAxle', c2, c3);
    this._applyAxleArticulation('RearAxle', c4, c5);

    // 10. Suspension Assemblies — Smooth Coilover Compression, Damper Stroke & Control Arm Pivot
    for (let i = 0; i < 6; i++) {
      const id = WHEEL_IDS[i];
      const c = safeComp[i];
      const side = WHEEL_SIDES[id]; // -1 Left (-Z), +1 Right (+Z)

      const springNode = this.nodes[`Spring_${id}`];
      if (springNode) {
        const rest = this.restPoses.get(springNode);
        if (rest) {
          const scaleY = THREE.MathUtils.clamp(1.0 - c / SPRING_FREE_LEN, 0.48, 1.56);
          springNode.scale.set(rest.scale.x, rest.scale.y * scaleY, rest.scale.z);
        }
      }

      const damperNode = this.nodes[`Damper_${id}`];
      if (damperNode) {
        const rest = this.restPoses.get(damperNode);
        if (rest) {
          const scaleY = THREE.MathUtils.clamp(1.0 - c / DAMPER_FREE_LEN, 0.50, 1.52);
          damperNode.scale.set(rest.scale.x, rest.scale.y * scaleY, rest.scale.z);
        }
      }

      const armAngle = -side * Math.atan2(c, CONTROL_ARM_LEN);
      this._applyRootAxisRotation(`ControlArm_${id}`, 'axisX', armAngle);
    }
  }

  _applyRootAxisRotation(nodeKey, axisProp, angle) {
    const node = this.nodes[nodeKey];
    if (!node) return;
    const rest = this.restPoses.get(node);
    if (!rest) return;
    this._q1.setFromAxisAngle(rest[axisProp], angle);
    node.quaternion.copy(this._q1).multiply(rest.quaternion);
  }

  _applyVerticalOffset(nodeKey, offsetY) {
    const node = this.nodes[nodeKey];
    if (!node || Math.abs(offsetY) < 1e-6) return;
    const rest = this.restPoses.get(node);
    if (!rest) return;
    node.position.addScaledVector(rest.axisY, offsetY * rest.invParentScale.y);
  }

  _applyWheelCarrier(nodeKey, offsetY, steerRad) {
    const node = this.nodes[nodeKey];
    if (!node) return;
    const rest = this.restPoses.get(node);
    if (!rest) return;
    if (Math.abs(offsetY) > 1e-6) {
      node.position.addScaledVector(rest.axisY, offsetY * rest.invParentScale.y);
    }
    this._q1.setFromAxisAngle(rest.axisY, steerRad);
    node.quaternion.copy(this._q1).multiply(rest.quaternion);
  }

  _applyWheelSpinOnly(nodeKey, spinAngle, extraOffsetY, extraSteerRad) {
    const node = this.nodes[nodeKey];
    if (!node) return;
    const rest = this.restPoses.get(node);
    if (!rest) return;

    if (Math.abs(extraOffsetY) > 1e-6) {
      node.position.addScaledVector(rest.axisY, extraOffsetY * rest.invParentScale.y);
    }

    this._q1.setFromAxisAngle(rest.axisNegZ, spinAngle);
    if (Math.abs(extraSteerRad) > 1e-6) {
      this._q2.setFromAxisAngle(rest.axisY, extraSteerRad);
      this._q2.multiply(this._q1);
      node.quaternion.copy(this._q2).multiply(rest.quaternion);
    } else {
      node.quaternion.copy(this._q1).multiply(rest.quaternion);
    }
  }

  _applyAxleArticulation(axleKey, compL, compR) {
    const node = this.nodes[axleKey];
    if (!node) return;
    const rest = this.restPoses.get(node);
    if (!rest) return;

    const avgY = 0.5 * (compL + compR) * 0.72;
    if (Math.abs(avgY) > 1e-6) {
      node.position.addScaledVector(rest.axisY, avgY * rest.invParentScale.y);
    }
    const tilt = Math.atan2(compL - compR, TRACK_WIDTH) * 0.78;
    this._q1.setFromAxisAngle(rest.axisX, tilt);
    node.quaternion.copy(this._q1).multiply(rest.quaternion);
  }
}

export default TruckRig;
