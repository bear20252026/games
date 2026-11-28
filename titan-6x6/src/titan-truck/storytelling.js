import * as THREE from 'three';

// ============================================================================
// TITAN 6X6 (AT-08) — TECHNICAL ANNOTATIONS, INSPECTION & CAMERA METADATA
//   Clean data & 3D->2D callout projection module (zero scroll-story code).
// ============================================================================

export const ANNOTATIONS = [
  {
    index: 1,
    code: '01',
    id: 'body',
    label: 'ARMORED BODY',
    fullLabel: '01 / ARMORED BODY',
    architectureTag: 'Reconstructed Exterior',
    summary:
      'Beveled alabaster composite AT-08 armored enclosure with integrated amber perimeter light bars, hinged service hatches, and aft hydraulic utility pack.',
    specs: ['Composite Armor Hull', 'AT-08 Markings', 'Service Hatches'],
    preferredMode: 'exterior',
    fallbackLocalAnchor: new THREE.Vector3(-2.15, 3.65, 1.48),
    cameraFocus: { pos: [-6.6, 3.95, 8.2], lookAt: [-1.85, 2.75, 0.0], fov: 37 },
  },
  {
    index: 2,
    code: '02',
    id: 'chassis',
    label: 'STRUCTURAL CHASSIS',
    fullLabel: '02 / STRUCTURAL CHASSIS',
    architectureTag: 'Inferred Architecture',
    summary:
      'Signature electric-blue Z-stepped outer exoskeleton bolted onto an inferred heavy-section box-steel ladder frame and cross-braced undercarriage.',
    specs: ['Z-Stepped Exoskeleton', 'Box-Steel Ladder Frame', 'High-Clearance Keel'],
    preferredMode: 'chassis',
    fallbackLocalAnchor: new THREE.Vector3(0.45, 2.15, 1.42),
    cameraFocus: { pos: [4.85, 2.8, 10.9], lookAt: [-0.25, 1.65, 0.0], fov: 37 },
  },
  {
    index: 3,
    code: '03',
    id: 'drivetrain',
    label: '6X6 DRIVETRAIN',
    fullLabel: '03 / 6X6 DRIVETRAIN',
    architectureTag: 'Inferred Architecture',
    summary:
      'Inferred central transfer case, articulated front-mid-rear steel driveshafts, and three heavy portal axles delivering full-time six-wheel traction.',
    specs: ['Full-Time 6WD', 'Portal Drop Hubs', 'Triple Driveshafts'],
    preferredMode: 'powertrain',
    fallbackLocalAnchor: new THREE.Vector3(-0.35, 1.08, 0.35),
    cameraFocus: { pos: [5.1, 1.35, 5.8], lookAt: [-0.75, 0.95, 0.0], fov: 40 },
  },
  {
    index: 4,
    code: '04',
    id: 'suspension',
    label: 'INDEPENDENT SUSPENSION',
    fullLabel: '04 / INDEPENDENT SUSPENSION',
    architectureTag: 'Inferred Architecture',
    summary:
      'Inferred long-travel orange coilover springs, hydraulic dampers, and tubular control arms pairing front Ackermann steer knuckles with a tandem rear bogie.',
    specs: ['680mm Articulation', 'Orange Coilovers', 'Tandem Rear Bogie'],
    preferredMode: 'suspension',
    fallbackLocalAnchor: new THREE.Vector3(-2.45, 1.32, 1.48),
    cameraFocus: { pos: [-1.15, 1.55, 7.6], lookAt: [-1.45, 1.08, 0.45], fov: 38 },
  },
  {
    index: 5,
    code: '05',
    id: 'powertrain',
    label: 'POWER MODULE',
    fullLabel: '05 / POWER MODULE',
    architectureTag: 'Inferred Architecture',
    summary:
      'Inferred series hybrid diesel-electric V8 generator, dual high-voltage traction battery packs, power distribution unit, and twin radiator cooling fans.',
    specs: ['Hybrid V8-E Generator', 'HV Battery Banks', 'Dual Cooling Fans'],
    preferredMode: 'powertrain',
    fallbackLocalAnchor: new THREE.Vector3(-1.15, 2.38, 0.55),
    cameraFocus: { pos: [-0.45, 3.85, 8.95], lookAt: [-1.15, 2.02, 0.0], fov: 38 },
  },
  {
    index: 6,
    code: '06',
    id: 'cabin',
    label: 'CABIN SYSTEM',
    fullLabel: '06 / CABIN SYSTEM',
    architectureTag: 'Inferred Architecture',
    summary:
      'Low-profile armored cockpit pairing reconstructed cyan-tinted glazing and circular optical porthole with inferred hinged doors, suspension seats, and digital HUD.',
    specs: ['Cyan Armored Glass', 'Hinged Entry Doors', 'Emissive Cockpit HUD'],
    preferredMode: 'interior',
    fallbackLocalAnchor: new THREE.Vector3(2.85, 2.88, 1.28),
    cameraFocus: { pos: [5.45, 2.95, 4.95], lookAt: [2.65, 2.38, 0.0], fov: 37 },
  },
  {
    index: 7,
    code: '07',
    id: 'recovery',
    label: 'FRONT RECOVERY ASSEMBLY',
    fullLabel: '07 / FRONT RECOVERY ASSEMBLY',
    architectureTag: 'Reconstructed Exterior',
    summary:
      'Reinforced gunmetal bullbar mounting four curved ivory impact tusks, twin orange coiled recovery winches, forged tow hooks, and lower axle skid plate.',
    specs: ['Quad Ivory Tusks', 'Dual Coiled Winches', 'Forged Tow Hooks'],
    preferredMode: 'exterior',
    fallbackLocalAnchor: new THREE.Vector3(4.55, 1.48, 0.92),
    cameraFocus: { pos: [8.45, 1.75, 4.75], lookAt: [3.95, 1.28, 0.08], fov: 36 },
  },
  {
    index: 8,
    code: '08',
    id: 'comms',
    label: 'COMMUNICATIONS',
    fullLabel: '08 / COMMUNICATIONS',
    architectureTag: 'Reconstructed Exterior',
    summary:
      'Rooftop armored radar dome, electro-optical scanner pod, and tall aft/mid whip antenna mast array engineered for remote expedition telemetry.',
    specs: ['Armored Radar Dome', 'Multi-Band Whips', 'Satellite Telemetry'],
    preferredMode: 'exterior',
    fallbackLocalAnchor: new THREE.Vector3(-0.95, 4.88, 0.35),
    cameraFocus: { pos: [-4.85, 6.25, 7.65], lookAt: [-1.45, 4.25, 0.0], fov: 37 },
  },
];

export const INSPECTION_MODES = [
  {
    id: 'exterior',
    code: '01',
    label: 'Exterior',
    camera: { pos: [8.5, 2.58, 16.0], lookAt: [-0.62, 1.92, 0.0], fov: 34 },
  },
  {
    id: 'chassis',
    code: '02',
    label: 'Chassis',
    camera: { pos: [6.5, 3.05, 13.6], lookAt: [-0.15, 1.68, 0.0], fov: 36 },
  },
  {
    id: 'powertrain',
    code: '03',
    label: 'Powertrain',
    camera: { pos: [-3.1, 4.35, 10.6], lookAt: [-1.15, 2.05, 0.0], fov: 37 },
  },
  {
    id: 'suspension',
    code: '04',
    label: 'Suspension',
    camera: { pos: [-1.15, 1.55, 8.3], lookAt: [-1.15, 1.12, 0.45], fov: 38 },
  },
  {
    id: 'interior',
    code: '05',
    label: 'Interior',
    camera: { pos: [5.45, 2.95, 4.85], lookAt: [2.65, 2.38, 0.0], fov: 37 },
  },
  {
    id: 'electrical',
    code: '06',
    label: 'Electrical',
    camera: { pos: [-3.3, 4.15, 11.4], lookAt: [-0.85, 2.1, 0.0], fov: 37 },
  },
  {
    id: 'exploded',
    code: '07',
    label: 'Exploded',
    camera: { pos: [11.6, 6.35, 19.6], lookAt: [0.2, 2.85, 0.0], fov: 40 },
  },
];

export const WIREFRAME_STYLES = [
  {
    id: 'wire_tech',
    label: 'Technical CAD',
    shortLabel: 'Tech CAD',
    theme: 'alabaster',
    description: 'Matte architectural clay with semantic charcoal, cyan & amber CAD edges',
  },
  {
    id: 'wire_blueprint',
    label: 'Blueprint X-Ray',
    shortLabel: 'Blueprint',
    theme: 'blueprint',
    description: 'Translucent deep-navy blueprint hull exposing full internal CAD systems',
  },
  {
    id: 'wire_mesh',
    label: 'Pure Mesh',
    shortLabel: 'Pure Mesh',
    theme: 'alabaster',
    description: 'Full triangulated topology wireframe with semantic subsystem tinting',
  },
];

export const CAMERA_VIEWPOINTS = {
  studio: [
    {
      id: 'hero',
      label: 'Hero 3/4',
      shortLabel: 'Hero 3/4',
      description: 'Balanced architectural 3/4 front-starboard showcase',
      pos: [8.5, 2.58, 16.0],
      lookAt: [-0.62, 1.92, 0.0],
      fov: 34,
    },
    {
      id: 'front_tusks',
      label: 'Front Tusks',
      shortLabel: 'Front Tusks',
      description: 'Low dramatic framing of bullbar tusks & twin winches',
      pos: [8.6, 1.78, 4.55],
      lookAt: [3.45, 1.32, 0.0],
      fov: 36,
    },
    {
      id: 'side_profile',
      label: 'Side Profile',
      shortLabel: 'Side Profile',
      description: 'Orthographic-style starboard elevation of 6×6 silhouette',
      pos: [-0.15, 2.15, 16.4],
      lookAt: [-0.15, 1.62, 0.0],
      fov: 34,
    },
    {
      id: 'cabin_interior',
      label: 'Cabin Interior',
      shortLabel: 'Cabin Interior',
      description: 'Close sightline into cockpit seating & telemetry HUD',
      pos: [5.45, 2.95, 4.85],
      lookAt: [2.65, 2.38, 0.0],
      fov: 37,
    },
    {
      id: 'undercarriage',
      label: 'Undercarriage',
      shortLabel: 'Undercarriage',
      description: 'Low longitudinal view of portal axles, shafts & coilovers',
      pos: [-6.4, 0.72, 2.55],
      lookAt: [0.15, 1.02, 0.0],
      fov: 44,
    },
    {
      id: 'top_roof',
      label: 'Top Roof',
      shortLabel: 'Top Roof',
      description: 'High overhead architectural plan of HVAC, dome & masts',
      pos: [1.6, 14.4, 6.4],
      lookAt: [-0.35, 2.1, 0.0],
      fov: 38,
    },
  ],
  drive: [
    {
      id: 'chase',
      label: 'Chase',
      shortLabel: 'Chase',
      description: 'Dynamic trailing camera with velocity look-ahead',
    },
    {
      id: 'low_front',
      label: 'Low Front',
      shortLabel: 'Low Front',
      description: 'Hero low-angle view of tusks & winches in motion',
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
      description: 'Driver eye-height cockpit view through armored glass',
    },
    {
      id: 'undercarriage',
      label: 'Undercarriage',
      shortLabel: 'Undercarriage',
      description: 'Ground-skimming portal axle & suspension crawler view',
    },
    {
      id: 'orbit',
      label: 'Orbit',
      shortLabel: 'Orbit',
      description: 'Free 360° damped orbit tracking moving vehicle',
    },
  ],
};

// ============================================================================
// 3D -> 2D CALLOUT PROJECTION WITH SAFE-ZONE CLAMPING & ANTI-OVERLAP
// ============================================================================

const _projVec = new THREE.Vector3();
const _camDir = new THREE.Vector3();
const _toAnchor = new THREE.Vector3();
const _tmpWorld = new THREE.Vector3();

export function projectAnnotations(
  camera,
  anchorsMap,
  truckRoot,
  viewportW,
  viewportH,
  safeInsets = null
) {
  camera.getWorldDirection(_camDir);
  const results = [];
  const padLeft = Math.min(viewportW * 0.42, safeInsets?.left ?? 88);
  const padRight = Math.min(viewportW * 0.42, safeInsets?.right ?? 88);
  const padTop = safeInsets?.top ?? 86;
  const padBottom = safeInsets?.bottom ?? 144;

  for (const ann of ANNOTATIONS) {
    let worldPos = null;
    if (anchorsMap && anchorsMap[ann.id]) {
      const raw = anchorsMap[ann.id];
      if (raw instanceof THREE.Vector3) {
        worldPos = _tmpWorld.copy(raw);
      } else if (Array.isArray(raw)) {
        worldPos = _tmpWorld.set(raw[0], raw[1], raw[2]);
      } else if (raw && typeof raw.x === 'number') {
        worldPos = _tmpWorld.set(raw.x, raw.y, raw.z);
      }
    }

    if (!worldPos) {
      worldPos = _tmpWorld.copy(ann.fallbackLocalAnchor);
      if (truckRoot) {
        truckRoot.localToWorld(worldPos);
      }
    }

    _toAnchor.subVectors(worldPos, camera.position);
    const inFront = _toAnchor.dot(_camDir) > 0.35;

    _projVec.copy(worldPos).project(camera);
    const inClip =
      inFront &&
      _projVec.z >= -1 &&
      _projVec.z <= 1 &&
      Math.abs(_projVec.x) <= 1.04 &&
      Math.abs(_projVec.y) <= 1.04;

    const anchorX = (_projVec.x * 0.5 + 0.5) * viewportW;
    const anchorY = (-_projVec.y * 0.5 + 0.5) * viewportH;

    const dirX = anchorX >= viewportW * 0.5 ? 1 : -1;
    const dirY = anchorY <= viewportH * 0.44 ? -1 : 1;
    const maxX = Math.max(padLeft, viewportW - padRight);
    const maxY = Math.max(padTop, viewportH - padBottom);
    const pillX = THREE.MathUtils.clamp(anchorX + dirX * 46, padLeft, maxX);
    const pillY = THREE.MathUtils.clamp(anchorY + dirY * 26, padTop, maxY);

    results.push({
      id: ann.id,
      code: ann.code,
      label: ann.label,
      visible: inClip,
      anchorX,
      anchorY,
      pillX,
      pillY,
      depth: _projVec.z,
    });
  }

  // Gentle iterative 2D separation pass so callout pills never collide visually
  const visible = results.filter((r) => r.visible);
  const minDistX = 152;
  const minDistY = 34;
  const maxX = Math.max(padLeft, viewportW - padRight);
  const maxY = Math.max(padTop, viewportH - padBottom);

  for (let iter = 0; iter < 5; iter++) {
    for (let i = 0; i < visible.length; i++) {
      for (let j = i + 1; j < visible.length; j++) {
        const a = visible[i];
        const b = visible[j];
        const dx = b.pillX - a.pillX;
        const dy = b.pillY - a.pillY;
        const overlapX = minDistX - Math.abs(dx);
        const overlapY = minDistY - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          const pushY = (dy >= 0 ? 1 : -1) * (overlapY * 0.54 + 1.5);
          const pushX = (dx >= 0 ? 1 : -1) * (overlapX * 0.14);
          a.pillY = THREE.MathUtils.clamp(a.pillY - pushY, padTop, maxY);
          b.pillY = THREE.MathUtils.clamp(b.pillY + pushY, padTop, maxY);
          a.pillX = THREE.MathUtils.clamp(a.pillX - pushX, padLeft, maxX);
          b.pillX = THREE.MathUtils.clamp(b.pillX + pushX, padLeft, maxX);
        }
      }
    }
  }

  return results;
}
