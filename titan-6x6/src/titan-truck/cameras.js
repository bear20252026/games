import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CAMERA_VIEWPOINTS } from './storytelling.js';

export const CAMERA_MODES = [
  {
    id: 'chase',
    label: 'Chase',
    shortLabel: 'Chase',
    description: 'Dynamic trailing view with velocity look-ahead',
  },
  {
    id: 'low_front',
    label: 'Low Front',
    shortLabel: 'Low Front',
    description: 'Hero low-angle showcase of tusks & twin winches',
  },
  {
    id: 'side',
    label: 'Side',
    shortLabel: 'Side',
    description: 'Lateral tracking view of 6-wheel bogie articulation',
  },
  {
    id: 'cabin',
    label: 'Cabin',
    shortLabel: 'Cabin',
    description: 'Driver eye-height view past steering wheel & cyan HUD',
  },
  {
    id: 'undercarriage',
    label: 'Undercarriage',
    shortLabel: 'Undercarriage',
    description: 'Ground-skimming view of portal axles, driveshafts & coils',
  },
  {
    id: 'orbit',
    label: 'Orbit',
    shortLabel: 'Orbit',
    description: 'Free 360° damped inspection orbit',
  },
];

export const STUDIO_VIEWPOINTS = CAMERA_VIEWPOINTS.studio;

// Reference 3/4 Starboard-Front Hero Frame (+X Forward, +Y Up, +Z Starboard)
// Centered horizontally (lookAt.x = -0.15) with calibrated slight upward truck framing
// (lookAt.y = 1.72) so TITAN 6X6 sits majestically in the spacious center-upper studio
// canvas with generous clear margin above the centered bottom floating control dock!
export const HERO_PRESET = {
  pos: new THREE.Vector3(8.5, 2.58, 16.0),
  lookAt: new THREE.Vector3(-0.62, 1.92, 0.0),
  fov: 34,
};

const _vPos = new THREE.Vector3();
const _vTarget = new THREE.Vector3();
const _vFwd = new THREE.Vector3();
const _vLocalPos = new THREE.Vector3();
const _vLocalLook = new THREE.Vector3();
const _vDelta = new THREE.Vector3();
const _vPrevTruck = new THREE.Vector3();
const _quatHeading = new THREE.Quaternion();
const _eulerHeading = new THREE.Euler(0, 0, 0, 'YXZ');

function dampFactor(lambda, dt) {
  return 1 - Math.exp(-lambda * Math.min(Math.max(dt, 0), 0.1));
}

function easeOutCubic(t) {
  const k = 1 - Math.min(Math.max(t, 0), 1);
  return 1 - k * k * k;
}

export class CameraDirector {
  constructor(camera, domElement, options = {}) {
    this.camera = camera;
    this.domElement = domElement;
    this.getTerrainHeight = options.getTerrainHeight || (() => 0);

    this.mode = 'orbit';
    this.studioViewpointId = 'hero';
    this.appMode = 'inspect'; // 'inspect' | 'wireframe' | 'drive'
    this.envMode = 'studio'; // 'studio' | 'offroad'

    // OrbitControls setup — active immediately on frame 1!
    this.controls = new OrbitControls(this.camera, this.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.065;
    this.controls.rotateSpeed = 0.72;
    this.controls.zoomSpeed = 0.85;
    this.controls.panSpeed = 0.65;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 72.0;
    this.controls.minPolarAngle = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.496;
    this.controls.target.copy(HERO_PRESET.lookAt);

    // Smooth camera state
    this.currentLookAt = HERO_PRESET.lookAt.clone();

    // Preset fly-to animation (for viewpoints, inspection modes & subsystem focus)
    this.presetTransition = {
      active: false,
      preserveOrbit: true,
      pos: new THREE.Vector3(),
      target: new THREE.Vector3(),
      fov: HERO_PRESET.fov,
      lambda: 6.5,
    };

    // Subtle ~0.95s opening hero settle (non-blocking — cancels on any pointer/wheel/control)
    const initAspectScale = this._getAspectDistanceScale();
    const settledPos = this._adaptPosForAspect(HERO_PRESET.pos, HERO_PRESET.lookAt, initAspectScale);
    const introStartPos = settledPos.clone().add(
      new THREE.Vector3(1.45, 0.48, 2.05).multiplyScalar(initAspectScale)
    );

    this.intro = {
      active: true,
      elapsed: 0,
      duration: 0.95,
      startPos: introStartPos,
      startTarget: HERO_PRESET.lookAt.clone().add(new THREE.Vector3(-0.22, 0.16, 0.0)),
      startFov: 38,
    };

    // Track truck world motion so orbit mode follows moving truck smoothly
    this.lastTruckPos = new THREE.Vector3();
    this.hasLastTruckPos = false;
    this.smoothedYaw = 0;
    this.hasSmoothedYaw = false;
    this._winchChaseBlend = 0;
    this.userDragging = false;
    this.onUserInteract = options.onUserInteract || null;

    // Set initial opening camera pose
    this.camera.position.copy(this.intro.startPos);
    this.camera.fov = this.intro.startFov;
    this._syncCameraClipPlanes();
    this.camera.updateProjectionMatrix();
    this.currentLookAt.copy(this.intro.startTarget);
    this.camera.lookAt(this.currentLookAt);
    this.controls.target.copy(this.currentLookAt);
    this.controls.enabled = true;

    this._onControlStart = () => {
      this.userDragging = true;
      this.cancelIntro();
      if (this.presetTransition.active && this.presetTransition.preserveOrbit) {
        this.presetTransition.active = false;
      }
      if (this.onUserInteract) this.onUserInteract('orbit');
    };
    this._onControlEnd = () => {
      this.userDragging = false;
    };
    this.controls.addEventListener('start', this._onControlStart);
    this.controls.addEventListener('end', this._onControlEnd);
  }

  cancelIntro() {
    if (!this.intro.active) return;
    this.intro.active = false;
    const prevDamp = this.controls.enableDamping;
    this.controls.enableDamping = false;
    this.controls.target.copy(this.currentLookAt);
    this.controls.update();
    this.controls.enableDamping = prevDamp;
  }

  setAppContext(appMode, envMode) {
    this.appMode = appMode;
    this.envMode = envMode;
    this._syncControlsEnabled();
  }

  _syncCameraClipPlanes() {
    // Keep near >= 0.35 everywhere exterior (0.25 only inside cabin) and far = 400
    // for razor-sharp 24-bit depth buffer precision across the truck (zero Z-fighting!).
    const desiredNear = this.mode === 'cabin' ? 0.25 : 0.35;
    const desiredFar = 400;
    if (
      Math.abs(this.camera.near - desiredNear) > 0.001 ||
      Math.abs(this.camera.far - desiredFar) > 0.5
    ) {
      this.camera.near = desiredNear;
      this.camera.far = desiredFar;
      this.camera.updateProjectionMatrix();
    }
  }

  _syncControlsEnabled() {
    const isStudio = this.appMode === 'inspect' || this.appMode === 'wireframe';
    const canOrbit =
      (isStudio && this.mode === 'orbit') ||
      (this.appMode === 'drive' && this.mode === 'orbit');
    this.controls.enabled = canOrbit;
    this.controls.maxPolarAngle = isStudio ? Math.PI * 0.496 : Math.PI * 0.485;
  }

  getMode() {
    return this.mode;
  }

  getModeMeta(modeId = this.mode) {
    return CAMERA_MODES.find((m) => m.id === modeId) || CAMERA_MODES[CAMERA_MODES.length - 1];
  }

  getStudioViewpointId() {
    return this.studioViewpointId;
  }

  getStudioViewpointMeta(viewpointId = this.studioViewpointId) {
    return STUDIO_VIEWPOINTS.find((v) => v.id === viewpointId) || STUDIO_VIEWPOINTS[0];
  }

  setStudioViewpoint(viewpointId, options = {}) {
    const vp = STUDIO_VIEWPOINTS.find((v) => v.id === viewpointId);
    if (!vp) return this.getStudioViewpointMeta();
    this.studioViewpointId = vp.id;
    if (this.mode !== 'orbit') {
      this.setMode('orbit', { keepPreset: true });
    }
    this.setPresetTarget(vp.pos, vp.lookAt, vp.fov, {
      preserveOrbit: true,
      aspectAdapt: true,
      immediate: Boolean(options.immediate),
      lambda: options.lambda || 6.4,
    });
    return vp;
  }

  cycleStudioViewpoint() {
    const idx = STUDIO_VIEWPOINTS.findIndex((v) => v.id === this.studioViewpointId);
    const next = STUDIO_VIEWPOINTS[(idx + 1) % STUDIO_VIEWPOINTS.length];
    return this.setStudioViewpoint(next.id);
  }

  setMode(modeId, options = {}) {
    const meta = CAMERA_MODES.find((m) => m.id === modeId);
    if (!meta) return this.getModeMeta();
    this.cancelIntro();
    const prevMode = this.mode;
    this.mode = meta.id;
    this._syncCameraClipPlanes();
    this._syncControlsEnabled();

    if (this.mode === 'orbit') {
      if (!options.keepPreset) {
        this.presetTransition.active = false;
      }
      this.controls.target.copy(this.currentLookAt);
      this.controls.update();
      if (prevMode === 'cabin') {
        const truckPos = this.lastTruckPos;
        const pos = truckPos.clone().add(new THREE.Vector3(6.8, 3.1, 12.2));
        const tgt = truckPos.clone().add(new THREE.Vector3(0.1, 2.0, 0.0));
        this.setPresetTarget(pos, tgt, 38, { preserveOrbit: true, lambda: 5.5 });
      }
    } else {
      this.presetTransition.active = false;
    }

    if (options.immediate) {
      this._snapNext = true;
    }
    return meta;
  }

  cycleMode() {
    const idx = CAMERA_MODES.findIndex((m) => m.id === this.mode);
    const next = CAMERA_MODES[(idx + 1) % CAMERA_MODES.length];
    return this.setMode(next.id);
  }

  /**
   * Smoothly transitions camera & orbit target to a specific framing preset
   * (for viewpoints, inspection modes, or subsystem focus) while preserving user orbit!
   */
  setPresetTarget(pos, lookAt, fov = 36, options = {}) {
    this.cancelIntro();
    const preserveOrbit = options.preserveOrbit !== false;
    const aspectBoost = options.aspectAdapt ? this._getAspectDistanceScale() : 1.0;

    const targetVec =
      lookAt instanceof THREE.Vector3 ? lookAt.clone() : new THREE.Vector3(...lookAt);
    const posVec = pos instanceof THREE.Vector3 ? pos.clone() : new THREE.Vector3(...pos);

    // On tablet/mobile portrait viewports (aspect < 1.18), center horizontal lookAt cleanly
    // so the truck sits dead-center beneath the compact responsive hero title instead of offset right!
    const aspect = this.camera.aspect || 16 / 9;
    if (options.aspectAdapt && aspect < 1.18 && targetVec.x < -0.35) {
      const recenterShift = -0.12 - targetVec.x;
      targetVec.x += recenterShift;
      posVec.x += recenterShift;
    }

    if (aspectBoost > 1.001) {
      _vDelta.subVectors(posVec, targetVec).multiplyScalar(aspectBoost);
      posVec.copy(targetVec).add(_vDelta);
    }

    if (options.immediate) {
      this.camera.position.copy(posVec);
      this.currentLookAt.copy(targetVec);
      this.controls.target.copy(targetVec);
      this.camera.fov = fov;
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(this.currentLookAt);
      this.presetTransition.active = false;
      const prevDamp = this.controls.enableDamping;
      this.controls.enableDamping = false;
      this.controls.update();
      this.controls.enableDamping = prevDamp;
      return;
    }

    this.presetTransition.active = true;
    this.presetTransition.preserveOrbit = preserveOrbit;
    this.presetTransition.pos.copy(posVec);
    this.presetTransition.target.copy(targetVec);
    this.presetTransition.fov = fov;
    this.presetTransition.lambda = options.lambda || 6.4;
  }

  _adaptPosForAspect(pos, lookAt, scale) {
    const out = pos.clone();
    if (scale > 1.001) {
      _vDelta.subVectors(out, lookAt).multiplyScalar(scale);
      out.copy(lookAt).add(_vDelta);
    }
    return out;
  }

  _getAspectDistanceScale() {
    const aspect = this.camera.aspect || 16 / 9;
    if (aspect >= 1.48) return 1.0;
    // Scale smoothly on 4:3 laptops (1024x768) through narrow portrait phones (390x844)
    // so the full 10.7m TITAN 6X6 (rear AT-08 through front tusks) fits with clean margins!
    return Math.min(2.85, Math.max(1.0, 1.48 / Math.max(0.45, aspect)));
  }

  _getPortraitBoost(maxBoost = 0.45) {
    const aspect = this.camera.aspect || 16 / 9;
    if (aspect >= 0.95) return 1.0;
    return 1.0 + THREE.MathUtils.clamp((0.95 - aspect) * 0.85, 0, maxBoost);
  }

  _extractHeadingQuat(truckQuat, dt, immediate = false) {
    _vFwd.set(1, 0, 0).applyQuaternion(truckQuat);
    const yaw = Math.atan2(-_vFwd.z, _vFwd.x);

    if (!this.hasSmoothedYaw || immediate) {
      this.smoothedYaw = yaw;
      this.hasSmoothedYaw = true;
    } else {
      let diff = yaw - this.smoothedYaw;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.smoothedYaw += diff * dampFactor(5.5, dt);
    }

    _eulerHeading.set(0, this.smoothedYaw, 0, 'YXZ');
    _quatHeading.setFromEuler(_eulerHeading);
    return _quatHeading;
  }

  _clampAboveGround(pos, minClearance = 0.45) {
    const groundY = this.getTerrainHeight(pos.x, pos.z, this.envMode) || 0;
    if (pos.y < groundY + minClearance) {
      pos.y = groundY + minClearance;
    }
    return pos;
  }

  update(dt, truckState = null) {
    const safeDt = Math.min(Math.max(dt, 0.001), 0.05);
    const truckPos = truckState?.position || _vPrevTruck.set(0, 0, 0);
    const truckQuat = truckState?.quaternion || null;
    const speedMs = truckState?.speedMs || 0;
    const steerAngle = truckState?.steerAngle || 0;

    if (!this.hasLastTruckPos) {
      this.lastTruckPos.copy(truckPos);
      this.hasLastTruckPos = true;
    }
    _vDelta.subVectors(truckPos, this.lastTruckPos);
    this.lastTruckPos.copy(truckPos);

    // ----------------------------------------------------------------------
    // 1. OPENING HERO SETTLE (Studio Inspect / Wireframe — non-blocking)
    // ----------------------------------------------------------------------
    if (this.intro.active && this.mode === 'orbit' && this.appMode !== 'drive') {
      this.intro.elapsed += safeDt;
      const u = easeOutCubic(this.intro.elapsed / this.intro.duration);
      const aspectScale = this._getAspectDistanceScale();
      _vTarget.copy(HERO_PRESET.lookAt);
      _vPos.copy(HERO_PRESET.pos);
      if (aspectScale > 1.001) {
        _vLocalPos.subVectors(_vPos, _vTarget).multiplyScalar(aspectScale);
        _vPos.copy(_vTarget).add(_vLocalPos);
      }

      this.camera.position.lerpVectors(this.intro.startPos, _vPos, u);
      this.currentLookAt.lerpVectors(this.intro.startTarget, _vTarget, u);
      this.camera.fov = THREE.MathUtils.lerp(this.intro.startFov, HERO_PRESET.fov, u);
      this.camera.updateProjectionMatrix();
      this.camera.lookAt(this.currentLookAt);
      this.controls.target.copy(this.currentLookAt);

      if (this.intro.elapsed >= this.intro.duration) {
        this.cancelIntro();
      }
      return;
    }

    // ----------------------------------------------------------------------
    // 2. ORBIT MODE (Inspect, Wireframe, or Free-Orbit Drive)
    // ----------------------------------------------------------------------
    if (this.mode === 'orbit') {
      if (_vDelta.lengthSq() > 1e-8) {
        this.camera.position.add(_vDelta);
        this.controls.target.add(_vDelta);
        if (this.presetTransition.active) {
          this.presetTransition.pos.add(_vDelta);
          this.presetTransition.target.add(_vDelta);
        }
      }

      if (this.presetTransition.active) {
        const a = dampFactor(this.presetTransition.lambda, safeDt);
        this.camera.position.lerp(this.presetTransition.pos, a);
        this.controls.target.lerp(this.presetTransition.target, a);
        if (Math.abs(this.camera.fov - this.presetTransition.fov) > 0.01) {
          this.camera.fov += (this.presetTransition.fov - this.camera.fov) * a;
          this.camera.updateProjectionMatrix();
        }
        this._clampAboveGround(this.camera.position, 0.28);
        this.camera.lookAt(this.controls.target);
        this.currentLookAt.copy(this.controls.target);

        const posDist = this.camera.position.distanceTo(this.presetTransition.pos);
        const tgtDist = this.controls.target.distanceTo(this.presetTransition.target);
        if (posDist < 0.04 && tgtDist < 0.04) {
          this.presetTransition.active = false;
          const prevDamp = this.controls.enableDamping;
          this.controls.enableDamping = false;
          this.controls.update();
          this.controls.enableDamping = prevDamp;
        }
        return;
      }

      this.controls.update();
      this._clampAboveGround(this.camera.position, 0.28);
      this.currentLookAt.copy(this.controls.target);
      return;
    }

    // ----------------------------------------------------------------------
    // 3. VEHICLE-LOCKED CAMERA MODES (chase, low_front, side, cabin, undercarriage)
    // ----------------------------------------------------------------------
    const qTruck = truckQuat || _quatHeading.identity();
    const immediate = Boolean(this._snapNext);
    this._snapNext = false;

    const qHeading = this._extractHeadingQuat(qTruck, safeDt, immediate);
    let posLambda = 6.5;
    let lookLambda = 9.0;
    let targetFov = 42;
    let minGround = 0.55;

    const portraitBoost = this._getPortraitBoost(0.42);

    if (this.mode === 'chase') {
      const speedNorm = THREE.MathUtils.clamp(Math.abs(speedMs) / 18, 0, 1);
      const lookAhead = THREE.MathUtils.clamp(speedMs * 0.26, -1.8, 4.6);
      const steerLeadZ = -steerAngle * 2.2 * speedNorm;

      // When recovery winch is active in Drive, smoothly shift to an unobstructed
      // rear-starboard 3/4 angle so twin taut cables & ground stake stay clearly visible!
      const winchTarget = truckState?.winchActive ? 1.0 : 0.0;
      if (immediate) {
        this._winchChaseBlend = winchTarget;
      } else {
        this._winchChaseBlend += (winchTarget - this._winchChaseBlend) * dampFactor(4.2, safeDt);
        if (Math.abs(winchTarget - this._winchChaseBlend) < 0.002) {
          this._winchChaseBlend = winchTarget;
        }
      }
      const wb = this._winchChaseBlend;

      const trailDist = (16.2 - wb * 1.4 + speedNorm * 1.8) * portraitBoost;
      const trailHeight = (6.2 + wb * 0.55 + speedNorm * 0.45) * (1 + (portraitBoost - 1) * 0.5);
      const sideOffsetZ = steerLeadZ * 0.5 + wb * 5.2 * portraitBoost;

      _vLocalPos.set(-trailDist, trailHeight, sideOffsetZ);
      _vLocalPos.applyQuaternion(qHeading).add(truckPos);

      _vLocalLook.set(3.2 + lookAhead + wb * 2.4, 2.35 - wb * 0.65, steerLeadZ * 0.35 + wb * 0.2);
      _vLocalLook.applyQuaternion(qHeading).add(truckPos);

      posLambda = 5.4;
      lookLambda = 8.8;
      targetFov = 46 + speedNorm * 5.0 + wb * 1.5;
      minGround = 1.1;
    } else if (this.mode === 'low_front') {
      _vLocalPos.set(9.4 * portraitBoost, 1.65, 4.8 * portraitBoost);
      _vLocalPos.applyQuaternion(qHeading).add(truckPos);

      _vLocalLook.set(2.65, 1.88, 0.0);
      _vLocalLook.applyQuaternion(qHeading).add(truckPos);

      posLambda = 6.5;
      lookLambda = 9.5;
      targetFov = 38;
      minGround = 0.52;
    } else if (this.mode === 'side') {
      _vLocalPos.set(-0.55, 1.68, 9.6 * portraitBoost);
      _vLocalPos.applyQuaternion(qHeading).add(truckPos);

      _vLocalLook.set(-0.55, 1.38, 0.25);
      _vLocalLook.applyQuaternion(qHeading).add(truckPos);

      posLambda = 7.0;
      lookLambda = 10.0;
      targetFov = 38;
      minGround = 0.55;
    } else if (this.mode === 'cabin') {
      _vLocalPos.set(2.46, 2.86, -0.58);
      _vLocalPos.applyQuaternion(qTruck).add(truckPos);

      _vLocalLook.set(9.8, 2.28, -0.42);
      _vLocalLook.applyQuaternion(qTruck).add(truckPos);

      posLambda = 18.0;
      lookLambda = 18.0;
      targetFov = 58;
      minGround = 0.25;
    } else if (this.mode === 'undercarriage') {
      _vLocalPos.set(-5.85, 0.52, 0.72);
      _vLocalPos.applyQuaternion(qHeading).add(truckPos);

      _vLocalLook.set(0.25, 1.05, -0.12);
      _vLocalLook.applyQuaternion(qHeading).add(truckPos);

      posLambda = 7.8;
      lookLambda = 10.5;
      targetFov = 52;
      minGround = 0.3;
    }

    this._clampAboveGround(_vLocalPos, minGround);

    if (immediate) {
      this.camera.position.copy(_vLocalPos);
      this.currentLookAt.copy(_vLocalLook);
      this.camera.fov = targetFov;
      this.camera.updateProjectionMatrix();
    } else {
      this.camera.position.lerp(_vLocalPos, dampFactor(posLambda, safeDt));
      this.currentLookAt.lerp(_vLocalLook, dampFactor(lookLambda, safeDt));
      if (Math.abs(this.camera.fov - targetFov) > 0.01) {
        this.camera.fov += (targetFov - this.camera.fov) * dampFactor(6.0, safeDt);
        this.camera.updateProjectionMatrix();
      }
    }

    this.camera.lookAt(this.currentLookAt);
    this.controls.target.copy(this.currentLookAt);
  }

  dispose() {
    this.controls.removeEventListener('start', this._onControlStart);
    this.controls.removeEventListener('end', this._onControlEnd);
    this.controls.dispose();
  }
}
