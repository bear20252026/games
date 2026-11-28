/**
 * TITAN 6X6 ("AT-08") — Heavy 6×6 Rigid-Body & Zero-Clipping Hydropneumatic Suspension Physics
 *
 * Canonical Three.js (+Y Up) Vehicle Coordinate System:
 *   +X = Forward (nose / tusks)
 *   +Y = Up (ground plane Y = 0)
 *   +Z = Right (Starboard, reference side)
 *   -Z = Left (Port)
 *
 * Engineering Guarantees (verified against exact titan_truck.glb mesh bounds):
 *   - Tire radius R = 1.02 m (diameter 2.04 m), rest axle center AXLE_Y = 1.02 m -> rest tire top Y = 2.040 m.
 *   - Measured inner wheel-arch ceiling (Chassis_WheelArches):
 *       * Front (FL/FR):   Y = 2.105 m
 *       * Mid/Rear (ML-RR): Y = 2.083 m (RearBody_ArmorShell >= 2.130 m, RearBody_OrangeSkirts >= 2.180 m)
 *   - Hydropneumatic Off-Road Ride-Height Lift:
 *       * Studio ('studio'):  rideLift = 0.00 m (exact reference stance, tires flush at Y = 0.00 m).
 *       * Drive  ('offroad'): rideLift = +0.16 m (chassis rides +0.16 m higher on flat ground while wheels
 *                             sit at local Y = 0.86 m -> tires stay 100% flush on ground Y = 0.00 m, opening
 *                             0.180–0.195 m of real upward bump travel + 0.20 m droop = 0.38 m articulation!).
 *   - Strict Hard Bump Stops (guaranteed >= 23 mm clearance below arch ceiling at EVERY compression & steer lock):
 *       * Mid/Rear max upward local offset: +0.020 m (tire top <= 2.060 m vs 2.083 m arch ceiling).
 *       * Front straight max upward offset: +0.035 m (tire top <= 2.075 m vs 2.105 m arch ceiling),
 *         progressively tightened down to -0.015 m at full steering lock so turned tire shoulders never clip arches.
 *   - Functional Twin Recovery Winch Haul Force (`setWinchAnchor(worldPos | null)`):
 *       * Real ~118 kN forward hydraulic recovery pull toward the planted ground stake at controlled ~11–13 km/h crawl.
 */

import * as THREE from 'three';
import {
  getTerrainHeight,
  getTerrainNormal,
  getSurfaceGrip,
  getObstacleColliders,
} from './terrain.js';

// ---------------------------------------------------------------------------
// Canonical Vehicle Dimensions & Physical Constants (Measured from titan_truck.glb)
// ---------------------------------------------------------------------------

export const VEHICLE_CONSTANTS = Object.freeze({
  WHEEL_RADIUS: 1.02,
  AXLE_Y: 1.02,
  X_FRONT: 2.18,
  X_MID: -1.36,
  X_REAR: -3.58,
  TRACK_HALF: 1.39,
  TRACK_WIDTH: 2.78,
  WHEELBASE: 4.65, // X_FRONT (2.18) - tandem bogie midpoint (-2.47)
  MASS: 18000, // kg
  GRAVITY: 9.81, // m/s^2

  // Exact GLB-measured wheel-arch ceilings & strict zero-clipping bump stops
  DRIVE_RIDE_LIFT: 0.16, // m hydropneumatic chassis lift in Off-Road Drive mode
  ARCH_CEILING_FRONT: 2.105, // m measured Chassis_WheelArches inner ceiling above FL/FR
  ARCH_CEILING_REAR_MID: 2.083, // m measured Chassis_WheelArches inner ceiling above ML/MR/RL/RR
  ARCH_SAFETY_MARGIN: 0.023, // m guaranteed minimum gap below arch ceiling
  MAX_UP_OFFSET_FRONT: 0.035, // m max local upward wheel travel straight ahead (tire top <= 2.075 m)
  MAX_UP_OFFSET_FRONT_STEER_CUT: 0.050, // m bump-stop tightening at full steering lock -> -0.015 m
  MAX_UP_OFFSET_REAR_MID: 0.020, // m max local upward wheel travel on ML/MR/RL/RR (tire top <= 2.060 m)
  MAX_COMPRESSION: 0.035, // canonical upper ceiling alias
  MAX_DROOP: 0.36, // m max local downward wheel droop (-0.36 m => 0.20 m droop below Drive equilibrium)
  DROOP_BELOW_EQ: 0.20, // m droop stroke below current ride-height equilibrium

  SUSP_TOP_OFFSET: 0.50, // ray origin above studio axle center (local Y = 1.52)
  TOP_SPEED_FWD_MS: 19.0, // ~68.4 km/h
  TOP_SPEED_REV_MS: 6.2, // ~22.3 km/h
  MAX_STEER_LOW_RAD: THREE.MathUtils.degToRad(26), // crisp turning + clean front wheel-well clearance
  MAX_STEER_HIGH_RAD: THREE.MathUtils.degToRad(13),

  // Twin hydraulic recovery winch parameters
  WINCH_MAX_FORCE_N: 118000, // ~12 metric tons line pull — hauls 18t truck up 30°+ slopes
  WINCH_TARGET_SPEED_MS: 3.5, // ~12.6 km/h steady heavy recovery haul speed
  WINCH_DETACH_DIST: 2.25, // m fairlead-to-stake cutoff distance
});

// Center of mass in TruckRoot local frame:
// Mean X of the 6 wheels is (2.18 - 1.36 - 3.58) / 3 = -0.92 m,
// giving exact static pitch balance (zero nose-dip on flat studio/launch pad).
const COM_LOCAL = new THREE.Vector3(-0.92, 1.78, 0.0);

// Front bumper roller fairlead center in TruckRoot local space (where recovery winch force acts)
const WINCH_FAIRLEAD_LOCAL = new THREE.Vector3(4.50, 0.88, 0.0);

// Diagonal principal inertia tensor in chassis local space (kg·m^2)
// Heavy armored 18 t hull (approx 8.2m x 2.8m x 2.6m)
const INV_INERTIA_LOCAL = new THREE.Vector3(
  1 / 28500, // Roll (around +X)
  1 / 122000, // Yaw (around +Y)
  1 / 118000 // Pitch (around +Z)
);

const REST_RAY_LEN = VEHICLE_CONSTANTS.SUSP_TOP_OFFSET + VEHICLE_CONSTANTS.WHEEL_RADIUS; // 1.52 m
const MAX_RAY_LEN = REST_RAY_LEN + VEHICLE_CONSTANTS.MAX_DROOP; // 1.88 m
const STATIC_WHEEL_LOAD = (VEHICLE_CONSTANTS.MASS * VEHICLE_CONSTANTS.GRAVITY) / 6; // 29,430 N

// Asymmetric heavy 6×6 hydropneumatic suspension tuning (~1.04 Hz natural frequency)
const SPRING_STIFFNESS = 128000; // N/m
const DAMPER_BUMP = 16500; // N·s/m (compliant on compression so wheels articulate vividly)
const DAMPER_REBOUND = 27500; // N·s/m (heavy hydraulic rebound control — zero pogo bounce)
const ANTI_ROLL_STIFFNESS = 42000; // N/m across each axle's L/R pair

// Progressive exponential rubber bump stop (engages above 65% of upward bump stroke)
const BUMP_STOP_START_FRAC = 0.65;
const BUMP_STOP_EXP_GAIN = 13500; // N (ramps cleanly to ~135 kN at full bump!)
const BUMP_STOP_EXP_RATE = 2.45;
const BUMP_STOP_EXTRA_DAMP = 34000; // N·s/m additional hydraulic squeeze damping near stop

// Hard hydraulic end-stop above maxAllowedUp (1/120s unconditionally stable on 3t corner mass)
const HARD_STOP_STIFFNESS = 1350000; // N/m
const HARD_STOP_DAMP = 58000; // N·s/m
const HARD_STOP_FORCE_CAP = 340000; // N per wheel numerical safety ceiling

const STEER_GUARD_START_RAD = THREE.MathUtils.degToRad(10);
const STEER_GUARD_SPAN_RAD = THREE.MathUtils.degToRad(16);

// 3-point tire arc footprint offsets (2.04 m diameter tire rolls smoothly up ledges)
const TIRE_ARC_DX = 0.46;
const TIRE_ARC_RISE =
  VEHICLE_CONSTANTS.WHEEL_RADIUS -
  Math.sqrt(VEHICLE_CONSTANTS.WHEEL_RADIUS ** 2 - TIRE_ARC_DX ** 2); // ~0.1095 m

// Canonical 6-wheel specification (TruckRoot local space)
export const WHEEL_SPECS = Object.freeze([
  {
    id: 'FL', axle: 'front', axleIndex: 0, side: -1, steerable: true,
    x: VEHICLE_CONSTANTS.X_FRONT, y: VEHICLE_CONSTANTS.AXLE_Y, z: -VEHICLE_CONSTANTS.TRACK_HALF,
    archCeilingY: VEHICLE_CONSTANTS.ARCH_CEILING_FRONT,
    baseMaxUp: VEHICLE_CONSTANTS.MAX_UP_OFFSET_FRONT,
  },
  {
    id: 'FR', axle: 'front', axleIndex: 0, side: +1, steerable: true,
    x: VEHICLE_CONSTANTS.X_FRONT, y: VEHICLE_CONSTANTS.AXLE_Y, z: +VEHICLE_CONSTANTS.TRACK_HALF,
    archCeilingY: VEHICLE_CONSTANTS.ARCH_CEILING_FRONT,
    baseMaxUp: VEHICLE_CONSTANTS.MAX_UP_OFFSET_FRONT,
  },
  {
    id: 'ML', axle: 'mid', axleIndex: 1, side: -1, steerable: false,
    x: VEHICLE_CONSTANTS.X_MID, y: VEHICLE_CONSTANTS.AXLE_Y, z: -VEHICLE_CONSTANTS.TRACK_HALF,
    archCeilingY: VEHICLE_CONSTANTS.ARCH_CEILING_REAR_MID,
    baseMaxUp: VEHICLE_CONSTANTS.MAX_UP_OFFSET_REAR_MID,
  },
  {
    id: 'MR', axle: 'mid', axleIndex: 1, side: +1, steerable: false,
    x: VEHICLE_CONSTANTS.X_MID, y: VEHICLE_CONSTANTS.AXLE_Y, z: +VEHICLE_CONSTANTS.TRACK_HALF,
    archCeilingY: VEHICLE_CONSTANTS.ARCH_CEILING_REAR_MID,
    baseMaxUp: VEHICLE_CONSTANTS.MAX_UP_OFFSET_REAR_MID,
  },
  {
    id: 'RL', axle: 'rear', axleIndex: 2, side: -1, steerable: false,
    x: VEHICLE_CONSTANTS.X_REAR, y: VEHICLE_CONSTANTS.AXLE_Y, z: -VEHICLE_CONSTANTS.TRACK_HALF,
    archCeilingY: VEHICLE_CONSTANTS.ARCH_CEILING_REAR_MID,
    baseMaxUp: VEHICLE_CONSTANTS.MAX_UP_OFFSET_REAR_MID,
  },
  {
    id: 'RR', axle: 'rear', axleIndex: 2, side: +1, steerable: false,
    x: VEHICLE_CONSTANTS.X_REAR, y: VEHICLE_CONSTANTS.AXLE_Y, z: +VEHICLE_CONSTANTS.TRACK_HALF,
    archCeilingY: VEHICLE_CONSTANTS.ARCH_CEILING_REAR_MID,
    baseMaxUp: VEHICLE_CONSTANTS.MAX_UP_OFFSET_REAR_MID,
  },
]);

// Underbody skid-plate, armor keel & wheel-arch terrain keep-out probes (TruckRoot local space,
// calibrated against measured titan_truck.glb FrontBumper/HazardBoxes/RearBody/WheelArches bounds)
const KEEL_POINTS = [
  new THREE.Vector3(4.38, 0.72, 0.0),   // Front bumper bash plate (minY 0.631)
  new THREE.Vector3(3.85, 0.78, -1.12), // Front-left bumper corner / frame horn
  new THREE.Vector3(3.85, 0.78, +1.12), // Front-right bumper corner / frame horn
  new THREE.Vector3(0.35, 0.74, -1.36), // Mid-left hazard box keel (minY 0.665)
  new THREE.Vector3(0.35, 0.74, +1.36), // Mid-right hazard box keel
  new THREE.Vector3(-2.47, 0.88, -1.28), // Tandem-gap underbody belly skid L
  new THREE.Vector3(-2.47, 0.88, +1.28), // Tandem-gap underbody belly skid R
  new THREE.Vector3(-5.05, 1.36, -1.12), // Rear-left bumper / backpack skid (minY 1.300)
  new THREE.Vector3(-5.05, 1.36, +1.12), // Rear-right bumper / backpack skid
  // Wheel-arch crown keep-out probes (prevent sharp terrain ridges poking into dark wheel arches)
  new THREE.Vector3(2.18, 1.78, -1.42),  // FL arch crown probe
  new THREE.Vector3(2.18, 1.78, +1.42),  // FR arch crown probe
  new THREE.Vector3(-1.36, 1.76, -1.42), // ML arch crown probe
  new THREE.Vector3(-1.36, 1.76, +1.42), // MR arch crown probe
  new THREE.Vector3(-3.58, 1.76, -1.42), // RL arch crown probe
  new THREE.Vector3(-3.58, 1.76, +1.42), // RR arch crown probe
];

// Spine collision spheres for horizontal boulder / obstacle collisions (TruckRoot local X)
const HULL_SPHERES = [
  { x: 2.85, y: 1.65, radius: 1.62 }, // Front cabin + bumper
  { x: -0.45, y: 1.75, radius: 1.68 }, // Central chassis + equipment bay
  { x: -3.45, y: 1.85, radius: 1.68 }, // Rear tandem hull + backpack
];

// 6-speed auto-gear shift points (km/h)
const GEAR_THRESHOLDS_KMH = [0, 14, 25, 37, 49, 59, 75];

const SUBSTEP_DT = 1 / 120;
const MAX_FRAME_DT = 0.05;
const MAX_SUBSTEPS = 8;
const ARENA_SOFT_RADIUS = 104.0;
const ARENA_HARD_RADIUS = 114.0;

// ---------------------------------------------------------------------------
// Safe Terrain Wrappers & Helpers
// ---------------------------------------------------------------------------

function safeTerrainHeight(x, z, mode) {
  if (typeof getTerrainHeight === 'function') {
    const h = getTerrainHeight(x, z, mode);
    return Number.isFinite(h) ? h : 0;
  }
  return 0;
}

function safeTerrainNormal(x, z, mode, target) {
  if (typeof getTerrainNormal === 'function') {
    const res = getTerrainNormal(x, z, mode, target);
    if (res && res !== target) target.copy(res);
    if (target.lengthSq() > 1e-6) return target.normalize();
  }
  return target.set(0, 1, 0);
}

function safeSurfaceGrip(x, z, mode) {
  if (typeof getSurfaceGrip === 'function') {
    const info = getSurfaceGrip(x, z, mode);
    if (info && typeof info === 'object') {
      return {
        grip: Number.isFinite(info.grip) ? info.grip : 0.95,
        surface: info.surface || (mode === 'studio' ? 'concrete' : 'gravel'),
      };
    }
    if (typeof info === 'number' && Number.isFinite(info)) {
      return { grip: info, surface: mode === 'studio' ? 'concrete' : 'gravel' };
    }
  }
  return { grip: 0.95, surface: mode === 'studio' ? 'concrete' : 'gravel' };
}

function safeObstacleColliders() {
  if (typeof getObstacleColliders === 'function') {
    const list = getObstacleColliders();
    if (Array.isArray(list)) return list;
  }
  return [];
}

/**
 * Computes mathematically guaranteed safe upward local wheel offset for any wheel & steer angle.
 * Exported so truckRig.js and verification telemetry share the EXACT same safety envelope.
 */
export function computeSafeMaxUpOffset(isSteerable, steerAngleRad = 0) {
  if (!isSteerable) return VEHICLE_CONSTANTS.MAX_UP_OFFSET_REAR_MID;
  const absSteer = Math.abs(steerAngleRad || 0);
  const t = THREE.MathUtils.clamp(
    (absSteer - STEER_GUARD_START_RAD) / STEER_GUARD_SPAN_RAD,
    0,
    1
  );
  const smooth = t * t * (3 - 2 * t);
  return (
    VEHICLE_CONSTANTS.MAX_UP_OFFSET_FRONT -
    VEHICLE_CONSTANTS.MAX_UP_OFFSET_FRONT_STEER_CUT * smooth
  );
}

// ---------------------------------------------------------------------------
// Main Physics Class
// ---------------------------------------------------------------------------

export class TitanVehiclePhysics {
  constructor() {
    this.active = false;
    this.envMode = 'studio';
    this.rideLift = 0.0;

    // Rigid body world state (tracked at Center of Mass)
    this.comPos = new THREE.Vector3();
    this.rootPos = new THREE.Vector3();
    this.quaternion = new THREE.Quaternion();
    this.velocity = new THREE.Vector3();
    this.angularVelocity = new THREE.Vector3();

    // Control & powertrain state
    this.steerAngle = 0; // +Left (-Z), -Right (+Z)
    this.steerLeft = 0;
    this.steerRight = 0;
    this.throttle = 0;
    this.brakeAmount = 0;
    this.braking = false;
    this.handbrake = false;
    this.reverseMode = false;
    this._reverseDelayTimer = 0;

    // Functional off-road recovery winch state
    this._winchAnchored = false;
    this._winchAnchorPos = new THREE.Vector3();
    this._winchMaxForceN = VEHICLE_CONSTANTS.WINCH_MAX_FORCE_N;
    this._winchTargetSpeedMs = VEHICLE_CONSTANTS.WINCH_TARGET_SPEED_MS;
    this.winchPullForceN = 0;
    this.winchAnchorDistance = 0;

    // Telemetry
    this.speedMs = 0;
    this.absSpeedMs = 0;
    this.speedKmh = 0;
    this.gear = 'N';
    this._forwardGearNum = 1;
    this.rpmNorm = 0.16;
    this.chassisPitch = 0;
    this.chassisRoll = 0;
    this.maxSuspImpulse = 0;
    this.groundedCount = 6;
    this.surface = 'concrete';
    this.minArchClearance = VEHICLE_CONSTANTS.ARCH_CEILING_REAR_MID - (VEHICLE_CONSTANTS.AXLE_Y + VEHICLE_CONSTANTS.WHEEL_RADIUS);

    // Fixed-timestep accumulator
    this._accumulator = 0;

    // 6-wheel runtime state
    this.wheelStates = WHEEL_SPECS.map((spec) => ({
      id: spec.id,
      axle: spec.axle,
      axleIndex: spec.axleIndex,
      side: spec.side,
      steerable: spec.steerable,
      mountRoot: new THREE.Vector3(spec.x, spec.y + VEHICLE_CONSTANTS.SUSP_TOP_OFFSET, spec.z),
      hubRestRoot: new THREE.Vector3(spec.x, spec.y, spec.z),
      archCeilingY: spec.archCeilingY,
      maxAllowedUp: spec.baseMaxUp,
      compressionOffset: 0,
      prevCompression: 0,
      _prevRawComp: 0,
      chassisLocalWheelY: spec.y,
      tireTopLocalY: spec.y + VEHICLE_CONSTANTS.WHEEL_RADIUS,
      archClearance: spec.archCeilingY - (spec.y + VEHICLE_CONSTANTS.WHEEL_RADIUS),
      compressionNorm: 0.5,
      compressionVel: 0,
      spinAngle: 0,
      spinVel: 0,
      steerAngle: 0,
      grounded: true,
      normalForce: STATIC_WHEEL_LOAD,
      slipRatio: 0,
      slip: 0,
      surface: 'concrete',
      contactPoint: new THREE.Vector3(spec.x, 0, spec.z),
      contactNormal: new THREE.Vector3(0, 1, 0),
      // Scratch per-substep solver fields
      _rayOriginWorld: new THREE.Vector3(),
      _leverArm: new THREE.Vector3(),
      _wheelFwd: new THREE.Vector3(1, 0, 0),
      _wheelRight: new THREE.Vector3(0, 0, 1),
      _suspForceY: 0,
    }));

    // Reusable scratch vectors & quaternions (zero GC during simulation!)
    this._vFwd = new THREE.Vector3();
    this._vUp = new THREE.Vector3();
    this._vDown = new THREE.Vector3();
    this._vRight = new THREE.Vector3();
    this._vForce = new THREE.Vector3();
    this._vTorque = new THREE.Vector3();
    this._vTmp1 = new THREE.Vector3();
    this._vTmp2 = new THREE.Vector3();
    this._vTmp3 = new THREE.Vector3();
    this._vFairlead = new THREE.Vector3();
    this._vContactVel = new THREE.Vector3();
    this._vLocalAngVel = new THREE.Vector3();
    this._vLocalTorque = new THREE.Vector3();
    this._vWorldAlpha = new THREE.Vector3();
    this._qInv = new THREE.Quaternion();
    this._qDelta = new THREE.Quaternion();
    this._qSteer = new THREE.Quaternion();
    this._yAxis = new THREE.Vector3(0, 1, 0);

    // Public state view object (updated in-place for zero GC)
    this._stateView = {
      active: false,
      position: this.rootPos,
      quaternion: this.quaternion,
      comPosition: this.comPos,
      velocity: this.velocity,
      angularVelocity: this.angularVelocity,
      speedKmh: 0,
      speedMs: 0,
      absSpeedMs: 0,
      gear: 'N',
      reverse: false,
      rpmNorm: 0.16,
      throttle: 0,
      braking: false,
      brakeAmount: 0,
      handbrake: false,
      steerAngle: 0,
      steerLeft: 0,
      steerRight: 0,
      wheelStates: this.wheelStates,
      chassisPitch: 0,
      chassisRoll: 0,
      maxSuspImpulse: 0,
      suspensionImpulse: 0,
      groundedCount: 6,
      onGround: true,
      surface: 'concrete',
      rideLift: 0,
      minArchClearance: this.minArchClearance,
      winchAnchored: false,
      winchPullForceN: 0,
      winchAnchorDistance: 0,
    };

    this.reset(new THREE.Vector3(0, 0, 0), 0, 'studio');
  }

  /**
   * Enable or disable live rigid-body integration.
   * When re-activating after inspection, clears residual velocities cleanly.
   */
  setActive(active) {
    const next = Boolean(active);
    if (next && !this.active) {
      this._accumulator = 0;
      this.maxSuspImpulse = 0;
    }
    if (!next) {
      this.setWinchAnchor(null);
    }
    this.active = next;
    this._stateView.active = next;
  }

  /**
   * Set or clear the live world-space recovery winch anchor point (Off-Road Drive Mode).
   * Pass a world-space THREE.Vector3 (or {x, y, z}) while anchored to engage smooth ~118 kN
   * hydraulic winch haul force; pass null to release cleanly.
   */
  setWinchAnchor(worldPosOrNull, options = {}) {
    if (
      worldPosOrNull &&
      Number.isFinite(worldPosOrNull.x) &&
      Number.isFinite(worldPosOrNull.y) &&
      Number.isFinite(worldPosOrNull.z)
    ) {
      this._winchAnchorPos.set(worldPosOrNull.x, worldPosOrNull.y, worldPosOrNull.z);
      this._winchAnchored = options.active !== false;
      this._winchMaxForceN = Number.isFinite(options.maxForceN)
        ? Math.max(0, options.maxForceN)
        : VEHICLE_CONSTANTS.WINCH_MAX_FORCE_N;
      this._winchTargetSpeedMs = Number.isFinite(options.targetSpeedMs)
        ? Math.max(0.5, options.targetSpeedMs)
        : VEHICLE_CONSTANTS.WINCH_TARGET_SPEED_MS;
    } else {
      this._winchAnchored = false;
      this.winchPullForceN = 0;
      this.winchAnchorDistance = 0;
    }
    this._stateView.winchAnchored = this._winchAnchored;
    this._stateView.winchPullForceN = this.winchPullForceN;
    this._stateView.winchAnchorDistance = this.winchAnchorDistance;
    return this._winchAnchored;
  }

  /**
   * Reset vehicle upright onto terrain at given (x, y, z) and yaw (radians around +Y).
   * Studio mode resets to exact 0.00 m reference stance; Off-Road mode engages +0.16 m
   * hydropneumatic ride-height lift with all 6 tires resting 100% flush on terrain.
   */
  reset(pos = null, yaw = 0, envMode = this.envMode) {
    this.envMode = envMode || this.envMode || 'offroad';
    this.rideLift = this.envMode === 'offroad' ? VEHICLE_CONSTANTS.DRIVE_RIDE_LIFT : 0.0;

    const x = pos ? pos.x : 0;
    const z = pos ? pos.z : 0;
    const terrainY = safeTerrainHeight(x, z, this.envMode);
    const baseGroundY = pos && Number.isFinite(pos.y) ? Math.max(pos.y, terrainY) : terrainY;
    const y = baseGroundY + this.rideLift;

    this.rootPos.set(x, y, z);
    this.quaternion.setFromAxisAngle(this._yAxis, Number.isFinite(yaw) ? yaw : 0);

    // Compute exact CoM world position from TruckRoot origin
    this._vTmp1.copy(COM_LOCAL).applyQuaternion(this.quaternion);
    this.comPos.copy(this.rootPos).add(this._vTmp1);

    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);

    this.steerAngle = 0;
    this.steerLeft = 0;
    this.steerRight = 0;
    this.throttle = 0;
    this.brakeAmount = 0;
    this.braking = false;
    this.handbrake = false;
    this.reverseMode = false;
    this._reverseDelayTimer = 0;

    this._winchAnchored = false;
    this.winchPullForceN = 0;
    this.winchAnchorDistance = 0;

    this.speedMs = 0;
    this.absSpeedMs = 0;
    this.speedKmh = 0;
    this.gear = 'N';
    this._forwardGearNum = 1;
    this.rpmNorm = 0.16;
    this.chassisPitch = 0;
    this.chassisRoll = 0;
    this.maxSuspImpulse = 0;
    this.groundedCount = 6;
    this._accumulator = 0;

    // Align wheel contact points & hydropneumatic equilibrium cleanly to reset surface
    const eqComp = -this.rideLift;
    let minClear = 99;
    for (let i = 0; i < this.wheelStates.length; i++) {
      const w = this.wheelStates[i];
      const maxUp = computeSafeMaxUpOffset(w.steerable, 0);
      w.maxAllowedUp = maxUp;
      w.compressionOffset = eqComp;
      w.prevCompression = eqComp;
      w._prevRawComp = eqComp;
      w.chassisLocalWheelY = VEHICLE_CONSTANTS.AXLE_Y + eqComp;
      w.tireTopLocalY = w.chassisLocalWheelY + VEHICLE_CONSTANTS.WHEEL_RADIUS;
      w.archClearance = w.archCeilingY - w.tireTopLocalY;
      if (w.archClearance < minClear) minClear = w.archClearance;
      w.compressionNorm = 0.5;
      w.compressionVel = 0;
      w.spinVel = 0;
      w.steerAngle = 0;
      w.grounded = true;
      w.normalForce = STATIC_WHEEL_LOAD;
      w.slipRatio = 0;
      w.slip = 0;
      this._vTmp2.copy(w.hubRestRoot).applyQuaternion(this.quaternion).add(this.rootPos);
      const wy = safeTerrainHeight(this._vTmp2.x, this._vTmp2.z, this.envMode);
      w.contactPoint.set(this._vTmp2.x, wy, this._vTmp2.z);
      safeTerrainNormal(this._vTmp2.x, this._vTmp2.z, this.envMode, w.contactNormal);
      const gripInfo = safeSurfaceGrip(this._vTmp2.x, this._vTmp2.z, this.envMode);
      w.surface = gripInfo.surface;
    }

    this.minArchClearance = minClear;
    this.surface = this.wheelStates[0].surface;
    this._syncStateView();
    return this.getState();
  }

  /**
   * Advance vehicle simulation by `dt` seconds with fixed 1/120 s substepping.
   *
   * @param {number} dt Frame delta seconds
   * @param {object} inputs { forward, backward, left, right, handbrake } (bools or 0..1)
   * @param {string} envMode 'studio' | 'offroad'
   */
  step(dt, inputs = {}, envMode = 'offroad') {
    this.envMode = envMode || 'offroad';
    const clampedDt = Math.min(Math.max(Number.isFinite(dt) ? dt : 0, 0), MAX_FRAME_DT);

    if (!this.active || clampedDt <= 0) {
      this._syncStateView();
      return this._stateView;
    }

    // Parse flexible input schema (booleans or analog floats)
    const rawFwd = Number(inputs.forward ?? inputs.throttle ?? 0);
    const rawBack = Number(inputs.backward ?? inputs.brake ?? 0);
    const rawLeft = Number(inputs.left ?? 0);
    const rawRight = Number(inputs.right ?? 0);
    const analogSteer = inputs.steer !== undefined ? Number(inputs.steer) : rawLeft - rawRight;
    const handbrakeInput = Boolean(inputs.handbrake);

    const parsed = {
      fwd: THREE.MathUtils.clamp(rawFwd, 0, 1),
      back: THREE.MathUtils.clamp(rawBack, 0, 1),
      steerInput: THREE.MathUtils.clamp(analogSteer, -1, 1), // +1 Left, -1 Right
      handbrake: handbrakeInput,
    };

    this.maxSuspImpulse = 0;
    this._accumulator += clampedDt;

    let steps = 0;
    while (this._accumulator >= SUBSTEP_DT && steps < MAX_SUBSTEPS) {
      this._stepSubstep(SUBSTEP_DT, parsed);
      this._accumulator -= SUBSTEP_DT;
      steps++;
    }
    // Prevent spiral of death if tab was backgrounded
    if (this._accumulator > SUBSTEP_DT * 2) {
      this._accumulator = 0;
    }

    this._updateTelemetry(clampedDt);
    this._syncStateView();
    return this._stateView;
  }

  /**
   * Single fixed 1/120 s physics substep.
   */
  _stepSubstep(dt, inp) {
    // Smoothly regulate hydropneumatic off-road ride-height lift
    const targetLift = this.envMode === 'offroad' ? VEHICLE_CONSTANTS.DRIVE_RIDE_LIFT : 0.0;
    if (Math.abs(targetLift - this.rideLift) > 1e-4) {
      const liftStep = Math.sign(targetLift - this.rideLift) * Math.min(Math.abs(targetLift - this.rideLift), 0.36 * dt);
      this.rideLift += liftStep;
    } else {
      this.rideLift = targetLift;
    }
    const eqOffset = -this.rideLift;
    const maxDroopLocal = Math.max(
      -VEHICLE_CONSTANTS.MAX_DROOP,
      eqOffset - VEHICLE_CONSTANTS.DROOP_BELOW_EQ
    );

    const q = this.quaternion;
    this._vFwd.set(1, 0, 0).applyQuaternion(q).normalize();
    this._vUp.set(0, 1, 0).applyQuaternion(q).normalize();
    this._vDown.copy(this._vUp).negate();
    this._vRight.set(0, 0, 1).applyQuaternion(q).normalize();

    // Recover TruckRoot origin from CoM world position
    this._vTmp1.copy(COM_LOCAL).applyQuaternion(q);
    this.rootPos.copy(this.comPos).sub(this._vTmp1);

    // Current signed forward speed along chassis +X
    const vFwd = this.velocity.dot(this._vFwd);
    const absVFwd = Math.abs(vFwd);

    // 1. Update speed-sensitive Ackermann steering
    const speedRatio = THREE.MathUtils.clamp(absVFwd / VEHICLE_CONSTANTS.TOP_SPEED_FWD_MS, 0, 1);
    const maxSteer = THREE.MathUtils.lerp(
      VEHICLE_CONSTANTS.MAX_STEER_LOW_RAD,
      VEHICLE_CONSTANTS.MAX_STEER_HIGH_RAD,
      Math.pow(speedRatio, 0.85)
    );
    const targetSteer = inp.steerInput * maxSteer;
    const steerRate = Math.abs(inp.steerInput) > 0.01 ? 2.35 : 3.25;
    const maxDelta = steerRate * dt;
    this.steerAngle += THREE.MathUtils.clamp(targetSteer - this.steerAngle, -maxDelta, maxDelta);

    this._computeAckermann(this.steerAngle);

    // 2. Resolve throttle, service braking, and reverse state cleanly
    let driveCmd = 0; // -1..+1 signed drive intent
    let serviceBrake = 0;

    if (inp.handbrake) {
      this.handbrake = true;
      serviceBrake = 0.35;
      driveCmd = 0;
    } else {
      this.handbrake = false;
      if (inp.fwd > 0.02 && inp.back <= 0.02) {
        this._reverseDelayTimer = 0;
        if (vFwd < -0.55) {
          serviceBrake = inp.fwd;
          this.reverseMode = true;
        } else {
          this.reverseMode = false;
          driveCmd = inp.fwd;
        }
      } else if (inp.back > 0.02 && inp.fwd <= 0.02) {
        if (vFwd > 0.55) {
          // Moving forward: apply progressive service braking
          serviceBrake = inp.back;
          this.reverseMode = false;
          this._reverseDelayTimer = 0.16;
        } else if (this._reverseDelayTimer > 0) {
          // Brief standstill settle after full brake before reverse engages
          serviceBrake = 0.85;
          this._reverseDelayTimer = Math.max(0, this._reverseDelayTimer - dt);
        } else {
          this.reverseMode = true;
          driveCmd = -inp.back;
        }
      } else if (inp.fwd > 0.02 && inp.back > 0.02) {
        serviceBrake = 1.0;
        driveCmd = 0;
      } else {
        this._reverseDelayTimer = 0;
        if (absVFwd < 0.2) this.reverseMode = false;
      }
    }

    // Smooth heavy throttle response (no instant teleport twitch)
    const targetThrottle = Math.abs(driveCmd);
    const throttleRate = targetThrottle > this.throttle ? 4.2 : 6.5;
    this.throttle += (targetThrottle - this.throttle) * Math.min(1, throttleRate * dt);
    this.brakeAmount += (serviceBrake - this.brakeAmount) * Math.min(1, 10.0 * dt);
    this.braking = this.brakeAmount > 0.08 || this.handbrake;

    // 3. Accumulate gravity force & zero torque
    this._vForce.set(0, -VEHICLE_CONSTANTS.MASS * VEHICLE_CONSTANTS.GRAVITY, 0);
    this._vTorque.set(0, 0, 0);

    // 4. Phase A — Raycast all 6 wheels & compute hydropneumatic spring + progressive bump-stop + damper
    let groundedCount = 0;
    let minArchClearance = 99.0;
    const surfaceCounts = { concrete: 0, dirt: 0, gravel: 0, rock: 0 };

    for (let i = 0; i < 6; i++) {
      const w = this.wheelStates[i];
      w.steerAngle = i === 0 ? this.steerLeft : i === 1 ? this.steerRight : 0;

      // Exact mathematically guaranteed max upward offset for this wheel & steer angle
      const maxAllowedUp = computeSafeMaxUpOffset(w.steerable, w.steerAngle);
      w.maxAllowedUp = maxAllowedUp;

      // World raycast origin (upper suspension tower on chassis)
      w._rayOriginWorld.copy(w.mountRoot).applyQuaternion(q).add(this.rootPos);

      // Compute wheel steered forward & right directions in world space
      if (w.steerable && Math.abs(w.steerAngle) > 1e-5) {
        this._qSteer.setFromAxisAngle(this._vUp, w.steerAngle);
        w._wheelFwd.copy(this._vFwd).applyQuaternion(this._qSteer).normalize();
        w._wheelRight.copy(this._vRight).applyQuaternion(this._qSteer).normalize();
      } else {
        w._wheelFwd.copy(this._vFwd);
        w._wheelRight.copy(this._vRight);
      }

      // 3-iteration ray intersection with 3-point tire arc footprint along chassis down vector
      const downY = Math.min(-0.25, this._vDown.y);
      let rayT = REST_RAY_LEN - eqOffset;
      let hitX = w._rayOriginWorld.x;
      let hitZ = w._rayOriginWorld.z;
      let groundY = 0;

      for (let iter = 0; iter < 3; iter++) {
        hitX = w._rayOriginWorld.x + this._vDown.x * rayT;
        hitZ = w._rayOriginWorld.z + this._vDown.z * rayT;
        groundY = this._sampleTireFootprintHeight(hitX, hitZ, w._wheelFwd, this.envMode);
        rayT = (groundY - w._rayOriginWorld.y) / downY;
      }

      const rawComp = REST_RAY_LEN - rayT;
      const rawCompVel = THREE.MathUtils.clamp((rawComp - w._prevRawComp) / dt, -7.0, 7.0);
      w._prevRawComp = rawComp;
      w.prevCompression = w.compressionOffset;

      const totalStroke = Math.max(0.08, maxAllowedUp - maxDroopLocal);

      if (rawComp >= maxDroopLocal && this._vUp.y > 0.25) {
        w.grounded = true;
        groundedCount++;

        // Strict kinematic ceiling clamp: tire can NEVER penetrate into wheel arch or upper body!
        const clampedComp = THREE.MathUtils.clamp(rawComp, maxDroopLocal, maxAllowedUp);
        const compVel = THREE.MathUtils.clamp((clampedComp - w.prevCompression) / dt, -7.0, 7.0);
        w.compressionVel = compVel;
        w.compressionOffset = clampedComp;
        w.compressionNorm = THREE.MathUtils.clamp(
          (clampedComp - maxDroopLocal) / totalStroke,
          0,
          1
        );

        // Track peak impact impulse for suspension audio thump
        const impactVel = Math.max(compVel, rawCompVel);
        if (impactVel > 0.35) {
          const impulse = THREE.MathUtils.clamp((impactVel - 0.35) * 0.48, 0, 1);
          if (impulse > this.maxSuspImpulse) this.maxSuspImpulse = impulse;
        }

        // Contact point & terrain surface normal
        w.contactPoint.set(hitX, groundY, hitZ);
        safeTerrainNormal(hitX, hitZ, this.envMode, w.contactNormal);

        const gripInfo = safeSurfaceGrip(hitX, hitZ, this.envMode);
        w.surface = gripInfo.surface;
        if (surfaceCounts[w.surface] !== undefined) surfaceCounts[w.surface]++;

        // Hydropneumatic spring force referenced to active ride-height equilibrium (`travel = 0` on flat ground!)
        const travel = clampedComp - eqOffset;
        const availBump = Math.max(0.04, maxAllowedUp - eqOffset);
        let fSpring = STATIC_WHEEL_LOAD + SPRING_STIFFNESS * travel;
        if (fSpring < 0) fSpring = 0;

        // Progressive exponential rubber bump-stop engaging above 65% of upward bump stroke
        // (launches & lifts heavy 18t chassis dynamically over steep moguls & landings!)
        let extraStopDamp = 0;
        const bumpRatio = travel / availBump;
        if (bumpRatio > BUMP_STOP_START_FRAC) {
          const bumpFrac = THREE.MathUtils.clamp(
            (bumpRatio - BUMP_STOP_START_FRAC) / (1.0 - BUMP_STOP_START_FRAC),
            0,
            1
          );
          fSpring += BUMP_STOP_EXP_GAIN * (Math.exp(BUMP_STOP_EXP_RATE * bumpFrac) - 1.0);
          extraStopDamp = BUMP_STOP_EXTRA_DAMP * bumpFrac;
        }

        // Hard hydraulic bump-stop guard if terrain pushes past maxAllowedUp
        if (rawComp > maxAllowedUp) {
          const pen = rawComp - maxAllowedUp;
          const fHard = Math.min(
            HARD_STOP_FORCE_CAP,
            HARD_STOP_STIFFNESS * pen + HARD_STOP_DAMP * Math.max(0, rawCompVel)
          );
          fSpring += fHard;
        }

        // Asymmetric hydraulic shock damper (softer bump, firmer rebound + progressive bump-stop squeeze)
        const cDamp = (compVel >= 0 ? DAMPER_BUMP : DAMPER_REBOUND) + (rawCompVel > 0 ? extraStopDamp : 0);
        const fSusp = fSpring + cDamp * (rawComp > maxAllowedUp ? Math.max(compVel, rawCompVel) : compVel);

        // Project onto ground contact normal alignment (prevent pushing down on steep overhang)
        const cosAlign = Math.max(0.38, this._vUp.dot(w.contactNormal));
        w._suspForceY = Math.max(0, fSusp * cosAlign);
      } else {
        // Wheel airborne: smoothly droop toward maxDroopLocal
        w.grounded = false;
        const nextComp =
          w.compressionOffset + (maxDroopLocal - w.compressionOffset) * Math.min(1, 9.0 * dt);
        const clampedAir = THREE.MathUtils.clamp(nextComp, maxDroopLocal, maxAllowedUp);
        w.compressionVel = (clampedAir - w.compressionOffset) / dt;
        w.compressionOffset = clampedAir;
        w.compressionNorm = THREE.MathUtils.clamp(
          (clampedAir - maxDroopLocal) / totalStroke,
          0,
          1
        );
        w.normalForce = 0;
        w._suspForceY = 0;
        w.slipRatio = 0;
        w.slip = 0;
        w.contactPoint
          .copy(w._rayOriginWorld)
          .addScaledVector(this._vDown, Math.min(MAX_RAY_LEN, REST_RAY_LEN - maxDroopLocal));
        w.contactNormal.set(0, 1, 0);
      }

      // Live wheel-arch clearance telemetry (mathematically guaranteed >= +0.023 m!)
      w.chassisLocalWheelY = VEHICLE_CONSTANTS.AXLE_Y + w.compressionOffset;
      w.tireTopLocalY = w.chassisLocalWheelY + VEHICLE_CONSTANTS.WHEEL_RADIUS;
      w.archClearance = w.archCeilingY - w.tireTopLocalY;
      if (w.archClearance < minArchClearance) minArchClearance = w.archClearance;
    }

    this.groundedCount = groundedCount;
    this.minArchClearance = minArchClearance;

    // Dominant surface name for audio/dust
    let domSurface = this.envMode === 'studio' ? 'concrete' : 'gravel';
    let bestCount = 0;
    for (const key in surfaceCounts) {
      if (surfaceCounts[key] > bestCount) {
        bestCount = surfaceCounts[key];
        domSurface = key;
      }
    }
    this.surface = domSurface;

    // 5. Phase B — Anti-Roll Bar Coupling across each axle's Left/Right wheels
    for (let axle = 0; axle < 3; axle++) {
      const wL = this.wheelStates[axle * 2];
      const wR = this.wheelStates[axle * 2 + 1];
      if (wL.grounded && wR.grounded) {
        const diff = wL.compressionOffset - wR.compressionOffset;
        const fArb = ANTI_ROLL_STIFFNESS * diff;
        wL._suspForceY = Math.max(0, wL._suspForceY + fArb);
        wR._suspForceY = Math.max(0, wR._suspForceY - fArb);
      }
    }

    // 6. Phase C — Apply Suspension, 6WD Traction, Braking & Non-Slide Lateral Tire Forces
    const totalTractiveForce = this._computeTotalDriveForce(driveCmd, vFwd);
    const activeGrounded = Math.max(groundedCount, 1);
    const wheelDriveShare = totalTractiveForce / activeGrounded;
    const effWheelMass = VEHICLE_CONSTANTS.MASS / Math.max(groundedCount, 2);
    const winchHaulingNow = this._winchAnchored && this.envMode !== 'studio' && !this.handbrake;

    for (let i = 0; i < 6; i++) {
      const w = this.wheelStates[i];
      if (!w.grounded) {
        // Airborne wheel free-spin dynamics
        const targetSpin = Math.abs(driveCmd) > 0.02
          ? Math.sign(driveCmd) * 8.5
          : w.spinVel * Math.max(0, 1 - 1.8 * dt);
        w.spinVel += (targetSpin - w.spinVel) * Math.min(1, 3.0 * dt);
        if (this.handbrake && !w.steerable) w.spinVel = 0;
        w.spinAngle += w.spinVel * dt;
        continue;
      }

      const fNormal = w._suspForceY;
      w.normalForce = fNormal;

      // Lever arm from CoM to tire contact patch
      w._leverArm.copy(w.contactPoint).sub(this.comPos);

      // Apply suspension normal force along chassis up / blended terrain normal
      this._vTmp1.copy(this._vUp).lerp(w.contactNormal, 0.35).normalize();
      this._vTmp2.copy(this._vTmp1).multiplyScalar(fNormal);
      this._vForce.add(this._vTmp2);

      // Suspension torque around CoM
      this._vTmp3.crossVectors(w._leverArm, this._vTmp2);
      this._vTorque.add(this._vTmp3);

      // Contact patch velocity: v_contact = v_com + omega x r
      this._vTmp1.crossVectors(this.angularVelocity, w._leverArm);
      this._vContactVel.copy(this.velocity).add(this._vTmp1);

      // Project wheel forward & right vectors cleanly onto ground tangent plane
      const nDotF = w._wheelFwd.dot(w.contactNormal);
      this._vTmp1.copy(w._wheelFwd).addScaledVector(w.contactNormal, -nDotF).normalize(); // tangentFwd
      const nDotR = w._wheelRight.dot(w.contactNormal);
      this._vTmp2.copy(w._wheelRight).addScaledVector(w.contactNormal, -nDotR).normalize(); // tangentRight

      const vLong = this._vContactVel.dot(this._vTmp1);
      const vLat = this._vContactVel.dot(this._vTmp2);

      const gripInfo = safeSurfaceGrip(w.contactPoint.x, w.contactPoint.z, this.envMode);
      const surfaceGrip = gripInfo.grip;

      // --- Lateral Cornering Force (planted, zero-overshoot, 6x6 tandem-friendly) ---
      const isRearTandem = !w.steerable;
      const steerFactor = Math.abs(this.steerAngle) / VEHICLE_CONSTANTS.MAX_STEER_LOW_RAD;
      const tandemRelief = isRearTandem ? 1.0 - 0.16 * steerFactor * (1.0 - speedRatio) : 1.08;
      const muLat = 1.18 * surfaceGrip * tandemRelief;
      const maxLatForce = muLat * fNormal;

      // Exact zero-overshoot impulse ceiling to stop lateral velocity cleanly
      const stopLatForce = (effWheelMass * Math.abs(vLat)) / dt * 0.78;

      let fLat;
      if (Math.abs(vLong) > 1.1) {
        const slipAngle = Math.atan2(vLat, Math.max(Math.abs(vLong), 1.4));
        const stiffness = (w.steerable ? 13.0 : 10.5) * fNormal * surfaceGrip;
        const pacejka = -stiffness * Math.sin(1.38 * Math.atan(2.1 * slipAngle));
        const limit = Math.min(maxLatForce, stopLatForce + 0.15 * maxLatForce);
        fLat = THREE.MathUtils.clamp(pacejka, -limit, limit);
      } else {
        const dampLat = -vLat * effWheelMass * 24.0;
        const limit = Math.min(maxLatForce, stopLatForce);
        fLat = THREE.MathUtils.clamp(dampLat, -limit, limit);
      }

      // --- Longitudinal Drive, Service Brake, Handbrake & Rolling Resistance ---
      const muLong = 1.14 * surfaceGrip;
      const maxLongForce = muLong * fNormal;
      const stopLongForce = (effWheelMass * Math.abs(vLong)) / dt * 0.82;

      let fLong = 0;

      // Apply 6WD hybrid drive force (front 30%, mid 35%, rear 35% feel)
      const torqueBias = w.steerable ? 0.92 : 1.04;
      fLong += wheelDriveShare * torqueBias;

      // Rolling resistance (heavy 2m knobby tires)
      const rollingDrag = -Math.sign(vLong) * Math.min(Math.abs(vLong) * 1400, 0.022 * fNormal);
      fLong += rollingDrag;

      // Service braking (all 6 wheels) & Handbrake (heavy lock on rear 4 tandem wheels)
      const brakeStrength =
        this.brakeAmount * 22500 + (this.handbrake && !w.steerable ? 36000 : this.handbrake ? 14000 : 0);

      if (brakeStrength > 1) {
        if (Math.abs(vLong) > 0.04) {
          fLong += -Math.sign(vLong) * Math.min(brakeStrength, stopLongForce);
        } else {
          fLong += THREE.MathUtils.clamp(-vLong * effWheelMass * 32.0, -brakeStrength, brakeStrength);
        }
      } else if (!winchHaulingNow && Math.abs(driveCmd) < 0.02 && Math.abs(vLong) < 0.35) {
        // Gentle automatic park/hill-hold damping when coasting to a stop (released while winch is hauling!)
        const holdLimit = 0.55 * fNormal;
        fLong += THREE.MathUtils.clamp(-vLong * effWheelMass * 12.0, -holdLimit, holdLimit);
      }

      // Combined traction circle (preserving lateral stability priority)
      const muCombined = 1.24 * surfaceGrip * fNormal;
      const fLatClamped = THREE.MathUtils.clamp(fLat, -muCombined * 0.96, muCombined * 0.96);
      const availLong = Math.sqrt(Math.max(0, muCombined * muCombined - fLatClamped * fLatClamped));
      const fLongClamped = THREE.MathUtils.clamp(
        fLong,
        -Math.min(maxLongForce, availLong),
        Math.min(maxLongForce, availLong)
      );

      // Tire slip ratio estimate (for gravel dust emission)
      const totalTangential = Math.hypot(fLongClamped, fLatClamped);
      const gripUtil = muCombined > 1 ? totalTangential / muCombined : 0;
      const latSlip = Math.min(1, Math.abs(vLat) / 4.0);
      w.slipRatio = THREE.MathUtils.clamp(
        Math.max(latSlip, Math.max(0, gripUtil - 0.52) * 1.6),
        0,
        1
      );
      w.slip = w.slipRatio;

      // Apply horizontal tire force vector
      this._vTmp3
        .copy(this._vTmp1)
        .multiplyScalar(fLongClamped)
        .addScaledVector(this._vTmp2, fLatClamped);
      this._vForce.add(this._vTmp3);

      // Apply pitch/roll/yaw torque at slightly damped effective tire lever height
      const origArmY = w._leverArm.y;
      w._leverArm.y = origArmY * 0.72;
      this._vTmp1.crossVectors(w._leverArm, this._vTmp3);
      w._leverArm.y = origArmY;
      this._vTorque.add(this._vTmp1);

      // Exact Wheel Spin Synchronization (strictly proportional to vLong / R!)
      const wheelLocked = this.handbrake && !w.steerable && Math.abs(vLong) < 3.5;
      if (wheelLocked) {
        w.spinVel = 0;
      } else {
        w.spinVel = vLong / VEHICLE_CONSTANTS.WHEEL_RADIUS;
        w.spinAngle += w.spinVel * dt;
      }
    }

    // 7. Functional Twin Recovery Winch Haul Force (when anchored in Drive mode)
    this._applyWinchHaulForce();

    // 8. Aerodynamic drag + structural angular damping
    const speedSq = this.velocity.lengthSq();
    if (speedSq > 1e-4) {
      const speed = Math.sqrt(speedSq);
      const aeroDrag = 0.5 * 1.225 * 1.15 * 9.5 * speedSq;
      this._vForce.addScaledVector(this.velocity, -aeroDrag / speed);
    }

    this._qInv.copy(q).invert();
    this._vLocalAngVel.copy(this.angularVelocity).applyQuaternion(this._qInv);
    this._vLocalTorque.set(
      -this._vLocalAngVel.x * 7200,
      -this._vLocalAngVel.y * 14500,
      -this._vLocalAngVel.z * 10800
    );

    // Subtle anti-capsize righting guard ONLY if tilt exceeds 42 degrees
    if (this._vUp.y < 0.74) {
      const tiltSeverity = THREE.MathUtils.clamp((0.74 - this._vUp.y) / 0.5, 0, 1);
      this._vTmp1.set(0, 1, 0);
      this._vTmp2.crossVectors(this._vUp, this._vTmp1);
      this._vTorque.addScaledVector(this._vTmp2, 260000 * tiltSeverity);
    }

    this._vTmp1.copy(this._vLocalTorque).applyQuaternion(q);
    this._vTorque.add(this._vTmp1);

    // 9. Underbody Keel / Skid-Plate & Wheel-Arch Terrain Keep-Out Check
    this._resolveKeelContacts(dt);

    // 10. Semi-Implicit Euler Linear & Angular Integration
    const invMass = 1 / VEHICLE_CONSTANTS.MASS;
    this.velocity.addScaledVector(this._vForce, invMass * dt);

    this._vLocalTorque.copy(this._vTorque).applyQuaternion(this._qInv);
    this._vLocalTorque.multiply(INV_INERTIA_LOCAL);
    this._vWorldAlpha.copy(this._vLocalTorque).applyQuaternion(q);
    this.angularVelocity.addScaledVector(this._vWorldAlpha, dt);

    // Clamp extreme angular velocities for numerical safety
    const angSpeed = this.angularVelocity.length();
    if (angSpeed > 3.2) {
      this.angularVelocity.multiplyScalar(3.2 / angSpeed);
    }

    // Integrate position & orientation quaternion
    this.comPos.addScaledVector(this.velocity, dt);

    const omegaMag = this.angularVelocity.length();
    if (omegaMag > 1e-7) {
      this._vTmp1.copy(this.angularVelocity).divideScalar(omegaMag);
      this._qDelta.setFromAxisAngle(this._vTmp1, omegaMag * dt);
      this.quaternion.premultiply(this._qDelta).normalize();
    }

    // 11. Resolve Horizontal Boulder / Obstacle Collisions & Arena Bounds
    this._resolveObstacleCollisions();
    this._resolveArenaBounds(dt);

    // Update final TruckRoot world position after collisions
    this._vTmp1.copy(COM_LOCAL).applyQuaternion(this.quaternion);
    this.rootPos.copy(this.comPos).sub(this._vTmp1);
  }

  /**
   * Real twin-drum hydraulic winch recovery haul force toward planted terrain anchor stake.
   * Smoothly regulates haul speed to ~11–13 km/h even up steep 30° alpine grades.
   */
  _applyWinchHaulForce() {
    if (!this._winchAnchored || this.envMode === 'studio') {
      this.winchPullForceN = 0;
      this.winchAnchorDistance = 0;
      return;
    }

    // World position of front bumper roller fairlead
    this._vFairlead.copy(WINCH_FAIRLEAD_LOCAL).applyQuaternion(this.quaternion).add(this.rootPos);
    this._vTmp1.copy(this._winchAnchorPos).sub(this._vFairlead);
    const dist = this._vTmp1.length();
    this.winchAnchorDistance = dist;

    if (dist <= VEHICLE_CONSTANTS.WINCH_DETACH_DIST || this.handbrake || this.brakeAmount > 0.45) {
      this.winchPullForceN = 0;
      return;
    }

    // Unit pull direction along taut cables
    this._vTmp1.divideScalar(dist);
    const vAlongCable = this.velocity.dot(this._vTmp1);

    // Gently taper target speed as truck nears the stake so arrival feels heavy and controlled
    const approachTaper = THREE.MathUtils.clamp(
      (dist - VEHICLE_CONSTANTS.WINCH_DETACH_DIST) / 1.8,
      0.32,
      1.0
    );
    const targetSpeed = this._winchTargetSpeedMs * approachTaper;

    // Hydraulic motor speed-regulated haul force (smoothly overcomes 30° slopes & rock steps)
    const speedErr = targetSpeed - vAlongCable;
    let fHaul = 46000 + speedErr * 52000;
    fHaul = THREE.MathUtils.clamp(fHaul, 0, this._winchMaxForceN);
    this.winchPullForceN = fHaul;

    if (fHaul <= 1) return;

    // Apply primary haul force along cable vector
    this._vTmp2.copy(this._vTmp1).multiplyScalar(fHaul);
    this._vForce.add(this._vTmp2);

    // Apply gentle nose-aligning yaw/pitch moment at fairlead (damped vertical arm prevents nose-dive)
    this._vTmp3.copy(this._vFairlead).sub(this.comPos);
    this._vTmp3.y *= 0.22;
    this._vTmp1.crossVectors(this._vTmp3, this._vTmp2);
    this._vTorque.addScaledVector(this._vTmp1, 0.35);
  }

  /**
   * 3-point tire-arc terrain height sampler along wheel rolling direction.
   * Accounts for wheel pitch (`wheelFwd.y`) and chassis up (`_vUp.y`) so smooth slopes
   * have zero bias while sharp rock ledges / moguls lift the 2.04 m tire smoothly.
   */
  _sampleTireFootprintHeight(cx, cz, wheelFwd, envMode) {
    const hCenter = safeTerrainHeight(cx, cz, envMode);
    if (envMode === 'studio') return hCenter;

    const fx = wheelFwd.x * TIRE_ARC_DX;
    const fz = wheelFwd.z * TIRE_ARC_DX;
    const dySlope = wheelFwd.y * TIRE_ARC_DX;
    const dyArc = Math.max(0.2, this._vUp.y) * TIRE_ARC_RISE;

    const hFront = safeTerrainHeight(cx + fx, cz + fz, envMode) - (dySlope + dyArc);
    const hBack = safeTerrainHeight(cx - fx, cz - fz, envMode) - (-dySlope + dyArc);
    return Math.max(hCenter, hFront, hBack);
  }

  /**
   * True Ackermann geometry split for front steerable wheels (FL=-Z, FR=+Z).
   */
  _computeAckermann(steerAvg) {
    if (Math.abs(steerAvg) < 1e-4) {
      this.steerLeft = 0;
      this.steerRight = 0;
      return;
    }
    const sign = Math.sign(steerAvg);
    const absSteer = Math.abs(steerAvg);
    const L = VEHICLE_CONSTANTS.WHEELBASE;
    const halfTrack = VEHICLE_CONSTANTS.TRACK_HALF;
    const turnRadius = L / Math.tan(absSteer);

    const inner = Math.atan(L / Math.max(1.2, turnRadius - halfTrack));
    const outer = Math.atan(L / (turnRadius + halfTrack));

    if (sign > 0) {
      // Turning LEFT (-Z): FL is inner (sharper), FR is outer
      this.steerLeft = inner;
      this.steerRight = outer;
    } else {
      // Turning RIGHT (+Z): FR is inner (sharper), FL is outer
      this.steerLeft = -outer;
      this.steerRight = -inner;
    }
  }

  /**
   * Hybrid diesel-electric 6WD tractive force curve.
   * Massive low-end torque for rock crawling & 30-deg hills, tapering cleanly to ~68 km/h.
   */
  _computeTotalDriveForce(driveCmd, vFwd) {
    if (Math.abs(driveCmd) < 1e-4) return 0;

    if (driveCmd > 0) {
      const top = VEHICLE_CONSTANTS.TOP_SPEED_FWD_MS;
      if (vFwd >= top) return 0;
      const frac = THREE.MathUtils.clamp(Math.max(0, vFwd) / top, 0, 1);
      const curve = Math.pow(1 - frac, 0.72) * (1.0 - 0.32 * Math.min(1, Math.max(0, vFwd) / 6.0));
      return this.throttle * 102000 * Math.max(0, curve);
    } else {
      const topRev = VEHICLE_CONSTANTS.TOP_SPEED_REV_MS;
      if (-vFwd >= topRev) return 0;
      const frac = THREE.MathUtils.clamp(Math.max(0, -vFwd) / topRev, 0, 1);
      return -this.throttle * 68000 * Math.pow(1 - frac, 0.75);
    }
  }

  /**
   * Underbody armored skid-plate & wheel-arch perimeter terrain safety contacts
   * so steep ridges lift the rigid-body chassis before terrain can penetrate body or arches.
   */
  _resolveKeelContacts(dt) {
    const q = this.quaternion;
    for (let i = 0; i < KEEL_POINTS.length; i++) {
      this._vTmp1.copy(KEEL_POINTS[i]).applyQuaternion(q).add(this.rootPos);
      const groundY = safeTerrainHeight(this._vTmp1.x, this._vTmp1.z, this.envMode);
      const clearance = this._vTmp1.y - (groundY + 0.08);
      if (clearance < 0) {
        const pen = -clearance;
        this._vTmp2.copy(this._vTmp1).sub(this.comPos); // lever arm
        this._vTmp3.crossVectors(this.angularVelocity, this._vTmp2).add(this.velocity);
        const vy = this._vTmp3.y;

        const fUp = Math.min(360000, Math.max(0, 420000 * pen - 34000 * Math.min(0, vy)));
        this._vForce.y += fUp;
        this._vTmp3.set(0, fUp, 0);
        this._vTmp1.crossVectors(this._vTmp2, this._vTmp3);
        this._vTorque.add(this._vTmp1);

        // Mild belly scrape friction
        this._vForce.x -= this.velocity.x * 16000 * Math.min(1, pen * 4);
        this._vForce.z -= this.velocity.z * 16000 * Math.min(1, pen * 4);
      }
    }
  }

  /**
   * Horizontal solid-rock / pillar obstacle collisions from terrain.js.
   */
  _resolveObstacleCollisions() {
    if (this.envMode === 'studio') return;
    const obstacles = safeObstacleColliders();
    if (!obstacles || obstacles.length === 0) return;

    const q = this.quaternion;
    this._vTmp1.copy(COM_LOCAL).applyQuaternion(q);
    this.rootPos.copy(this.comPos).sub(this._vTmp1);

    for (let s = 0; s < HULL_SPHERES.length; s++) {
      const hs = HULL_SPHERES[s];
      this._vTmp1.set(hs.x, hs.y, 0).applyQuaternion(q).add(this.rootPos);

      for (let o = 0; o < obstacles.length; o++) {
        const obs = obstacles[o];
        if (!obs || !Number.isFinite(obs.radius)) continue;

        const obsBottom = Number.isFinite(obs.y) ? obs.y : safeTerrainHeight(obs.x, obs.z, this.envMode);
        const obsTop = obsBottom + (Number.isFinite(obs.height) ? obs.height : obs.radius * 1.4);

        if (obsTop < this._vTmp1.y - 1.15) continue;
        if (obsBottom > this._vTmp1.y + 2.6) continue;

        const dx = this._vTmp1.x - obs.x;
        const dz = this._vTmp1.z - obs.z;
        const minDist = hs.radius + obs.radius;
        const distSq = dx * dx + dz * dz;

        if (distSq < minDist * minDist && distSq > 1e-8) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const nz = dz / dist;
          const overlap = minDist - dist;

          this.comPos.x += nx * overlap * 0.85;
          this.comPos.z += nz * overlap * 0.85;

          const vn = this.velocity.x * nx + this.velocity.z * nz;
          if (vn < 0) {
            const restitution = 0.14;
            const j = -(1 + restitution) * vn;
            this.velocity.x += nx * j;
            this.velocity.z += nz * j;

            const rx = this._vTmp1.x - this.comPos.x;
            const rz = this._vTmp1.z - this.comPos.z;
            const yawKick = (rz * nx - rx * nz) * j * 0.12;
            this.angularVelocity.y += THREE.MathUtils.clamp(yawKick, -0.6, 0.6);

            const impact = THREE.MathUtils.clamp(-vn * 0.18, 0, 1);
            if (impact > this.maxSuspImpulse) this.maxSuspImpulse = impact;
          }
        }
      }
    }
  }

  /**
   * Soft boundary containment near the outer edge of the 240×240 m proving ground.
   */
  _resolveArenaBounds(dt) {
    if (this.envMode === 'studio') return;
    const dist = Math.hypot(this.comPos.x, this.comPos.z);
    if (dist <= ARENA_SOFT_RADIUS) return;

    const nx = this.comPos.x / dist;
    const nz = this.comPos.z / dist;
    const excess = dist - ARENA_SOFT_RADIUS;

    const pushBack = Math.min(excess * 14.0, 40.0) * dt;
    this.velocity.x -= nx * pushBack;
    this.velocity.z -= nz * pushBack;

    if (dist > ARENA_HARD_RADIUS) {
      this.comPos.x = nx * ARENA_HARD_RADIUS;
      this.comPos.z = nz * ARENA_HARD_RADIUS;
      const vOut = this.velocity.x * nx + this.velocity.z * nz;
      if (vOut > 0) {
        this.velocity.x -= nx * vOut * 1.1;
        this.velocity.z -= nz * vOut * 1.1;
      }
    }
  }

  /**
   * Compute human-readable HUD telemetry: speed, auto-gear, RPM, chassis pitch/roll.
   */
  _updateTelemetry(dt) {
    const q = this.quaternion;
    this._vFwd.set(1, 0, 0).applyQuaternion(q).normalize();
    this._vRight.set(0, 0, 1).applyQuaternion(q).normalize();

    this.speedMs = this.velocity.dot(this._vFwd);
    this.absSpeedMs = Math.abs(this.speedMs);
    this.speedKmh = this.absSpeedMs * 3.6;

    // Chassis pitch (+nose up) & roll (+lean right) from basis vectors
    this.chassisPitch = Math.asin(THREE.MathUtils.clamp(this._vFwd.y, -1, 1));
    this.chassisRoll = -Math.asin(THREE.MathUtils.clamp(this._vRight.y, -1, 1));

    // 6-speed auto-gear selector with smooth hysteresis
    if (this.reverseMode && (this.speedMs < -0.15 || this.throttle > 0.05)) {
      this.gear = 'R';
    } else if (this.speedKmh < 0.8 && this.throttle < 0.04 && !this._winchAnchored) {
      this.gear = 'N';
      this._forwardGearNum = 1;
    } else if (this._winchAnchored && this.throttle < 0.04) {
      this.gear = '1';
      this._forwardGearNum = 1;
    } else {
      let g = this._forwardGearNum;
      while (g < 6 && this.speedKmh > GEAR_THRESHOLDS_KMH[g] + 1.5) g++;
      while (g > 1 && this.speedKmh < GEAR_THRESHOLDS_KMH[g - 1] - 2.0) g--;
      this._forwardGearNum = g;
      this.gear = String(g);
    }

    // Smooth hybrid diesel-electric generator + traction motor normalized RPM (0.14..0.96)
    let targetRpm = 0.16;
    if (this.gear === 'N') {
      targetRpm = 0.16 + this.throttle * 0.25;
    } else if (this.gear === 'R') {
      targetRpm = 0.22 + THREE.MathUtils.clamp(this.speedKmh / 24, 0, 0.65) + this.throttle * 0.14;
    } else {
      const gIdx = this._forwardGearNum;
      const gLow = GEAR_THRESHOLDS_KMH[gIdx - 1];
      const gHigh = GEAR_THRESHOLDS_KMH[gIdx];
      const inGear = THREE.MathUtils.clamp((this.speedKmh - gLow) / Math.max(1, gHigh - gLow), 0, 1);
      targetRpm = 0.28 + inGear * 0.56 + this.throttle * 0.14;
    }
    if (this._winchAnchored && this.winchPullForceN > 1000) {
      targetRpm = Math.max(targetRpm, 0.42 + (this.winchPullForceN / VEHICLE_CONSTANTS.WINCH_MAX_FORCE_N) * 0.18);
    }
    targetRpm = THREE.MathUtils.clamp(targetRpm, 0.14, 0.96);
    this.rpmNorm += (targetRpm - this.rpmNorm) * Math.min(1, 7.5 * dt);
  }

  _syncStateView() {
    const s = this._stateView;
    s.active = this.active;
    s.speedKmh = this.speedKmh;
    s.speedMs = this.speedMs;
    s.absSpeedMs = this.absSpeedMs;
    s.gear = this.gear;
    s.reverse = this.gear === 'R';
    s.rpmNorm = this.rpmNorm;
    s.throttle = this.throttle;
    s.braking = this.braking;
    s.brakeAmount = this.brakeAmount;
    s.handbrake = this.handbrake;
    s.steerAngle = this.steerAngle;
    s.steerLeft = this.steerLeft;
    s.steerRight = this.steerRight;
    s.chassisPitch = this.chassisPitch;
    s.chassisRoll = this.chassisRoll;
    s.maxSuspImpulse = this.maxSuspImpulse;
    s.suspensionImpulse = this.maxSuspImpulse;
    s.groundedCount = this.groundedCount;
    s.onGround = this.groundedCount > 0;
    s.surface = this.surface;
    s.rideLift = this.rideLift;
    s.minArchClearance = this.minArchClearance;
    s.winchAnchored = this._winchAnchored;
    s.winchPullForceN = this.winchPullForceN;
    s.winchAnchorDistance = this.winchAnchorDistance;
  }

  /**
   * Returns live vehicle telemetry & wheel states snapshot.
   */
  getState() {
    return this._stateView;
  }
}

export default TitanVehiclePhysics;
