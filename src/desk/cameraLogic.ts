import {
  CameraSectionId,
  HotspotId,
  LightingMode,
  PROJECTS_DATA,
  ProjectItem,
} from './portfolioData';

export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface CameraPreset {
  id: CameraSectionId;
  label: string;
  objectName: string;
  hint: string;
  position: Vec3Tuple;
  target: Vec3Tuple;
}

export interface LightingPreset {
  mode: LightingMode;
  backgroundHex: string;
  fogHex: string;
  fogDensity: number;
  hemiSkyHex: string;
  hemiGroundHex: string;
  hemiIntensity: number;
  keyColorHex: string;
  keyIntensity: number;
  rimColorHex: string;
  rimIntensity: number;
  lampSpotHex: string;
  lampSpotIntensity: number;
  lampBulbEmissiveIntensity: number;
  monitorBacklightIntensity: number;
  slatBiasIntensity: number;
  slatBiasEmissiveIntensity: number;
  envIntensity: number;
  exposure: number;
}

export const HOTSPOT_ORDER: HotspotId[] = [
  'projects',
  'skills',
  'about',
  'labs',
  'contact',
];

export const CAMERA_PRESETS: Record<CameraSectionId, CameraPreset> = {
  overview: {
    id: 'overview',
    label: 'Overview',
    objectName: 'Workspace Overview',
    hint: 'Drag to orbit · Scroll to zoom · Click any desk object',
    position: { x: 0.35, y: 2.35, z: 3.75 },
    target: { x: 0, y: 0.42, z: -0.1 },
  },
  projects: {
    id: 'projects',
    label: 'Projects',
    objectName: 'Ultrawide Monitor',
    hint: 'Selected Engineering & 3D Work',
    position: { x: 0.48, y: 1.12, z: 1.65 },
    target: { x: 0.42, y: 0.86, z: -0.62 },
  },
  skills: {
    id: 'skills',
    label: 'Skills',
    objectName: '75% Mechanical Keyboard',
    hint: 'Technical Stack & Systems',
    position: { x: 0.26, y: 0.94, z: 1.38 },
    target: { x: 0.3, y: 0.06, z: 0.32 },
  },
  about: {
    id: 'about',
    label: 'About',
    objectName: 'Leather Notebook & Pen',
    hint: 'Biography, Experience & Education',
    position: { x: -0.95, y: 0.92, z: 1.25 },
    target: { x: -0.82, y: 0.06, z: 0.25 },
  },
  labs: {
    id: 'labs',
    label: 'Labs',
    objectName: 'Framed Achievement Plaque',
    hint: 'Publications, Certifications & R&D',
    position: { x: -0.84, y: 0.82, z: 0.75 },
    target: { x: -0.98, y: 0.36, z: -0.55 },
  },
  contact: {
    id: 'contact',
    label: 'Contact',
    objectName: 'Desk Phone & Espresso',
    hint: 'Get in Touch & Social Links',
    position: { x: 1.56, y: 0.94, z: 1.32 },
    target: { x: 1.44, y: 0.16, z: 0.22 },
  },
};

export const LIGHTING_PRESETS: Record<LightingMode, LightingPreset> = {
  day: {
    mode: 'day',
    backgroundHex: '#DDD6CC',
    fogHex: '#DDD6CC',
    fogDensity: 0.035,
    hemiSkyHex: '#F8FAFC',
    hemiGroundHex: '#8C735B',
    hemiIntensity: 1.05,
    keyColorHex: '#FFF6E8',
    keyIntensity: 2.35,
    rimColorHex: '#64748B',
    rimIntensity: 0.85,
    lampSpotHex: '#FFB347',
    lampSpotIntensity: 2.4,
    lampBulbEmissiveIntensity: 0.65,
    monitorBacklightIntensity: 0.45,
    slatBiasIntensity: 0.3,
    slatBiasEmissiveIntensity: 0.14,
    envIntensity: 0.95,
    exposure: 1.06,
  },
  night: {
    mode: 'night',
    backgroundHex: '#0F131A',
    fogHex: '#0F131A',
    fogDensity: 0.048,
    hemiSkyHex: '#334155',
    hemiGroundHex: '#1C1917',
    hemiIntensity: 0.48,
    keyColorHex: '#94A3B8',
    keyIntensity: 0.55,
    rimColorHex: '#64748B',
    rimIntensity: 1.45,
    lampSpotHex: '#FFB347',
    lampSpotIntensity: 12.5,
    lampBulbEmissiveIntensity: 3.4,
    monitorBacklightIntensity: 2.1,
    slatBiasIntensity: 4.8,
    slatBiasEmissiveIntensity: 2.4,
    envIntensity: 0.45,
    exposure: 1.12,
  },
};

export function isHotspotId(value: string): value is HotspotId {
  return (HOTSPOT_ORDER as string[]).includes(value);
}

export function getCameraPreset(id: CameraSectionId): CameraPreset {
  return CAMERA_PRESETS[id] ?? CAMERA_PRESETS.overview;
}

export function getLightingPreset(mode: LightingMode): LightingPreset {
  return LIGHTING_PRESETS[mode];
}

export function getAdjacentHotspot(
  current: HotspotId,
  direction: 'next' | 'prev',
): HotspotId {
  const idx = HOTSPOT_ORDER.indexOf(current);
  if (idx === -1) return HOTSPOT_ORDER[0];
  const offset = direction === 'next' ? 1 : -1;
  return HOTSPOT_ORDER[(idx + offset + HOTSPOT_ORDER.length) % HOTSPOT_ORDER.length];
}

/**
 * Frame-rate independent exponential damping interpolation.
 * Approaches `target` smoothly without overshooting.
 */
export function dampValue(
  current: number,
  target: number,
  lambda: number,
  deltaSeconds: number,
): number {
  if (deltaSeconds <= 0) return current;
  const factor = 1 - Math.exp(-lambda * deltaSeconds);
  return current + (target - current) * factor;
}

export function dampVec3(
  current: Vec3Tuple,
  target: Vec3Tuple,
  lambda: number,
  deltaSeconds: number,
): Vec3Tuple {
  return {
    x: dampValue(current.x, target.x, lambda, deltaSeconds),
    y: dampValue(current.y, target.y, lambda, deltaSeconds),
    z: dampValue(current.z, target.z, lambda, deltaSeconds),
  };
}

export function vec3Distance(a: Vec3Tuple, b: Vec3Tuple): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export type ProjectCategoryFilter = 'All' | ProjectItem['category'];

export function filterProjects(
  category: ProjectCategoryFilter,
  items: ProjectItem[] = PROJECTS_DATA,
): ProjectItem[] {
  if (category === 'All') return items;
  return items.filter((p) => p.category === category);
}

export interface ContactFormInput {
  name: string;
  email: string;
  message: string;
}

export interface ContactValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ContactFormInput, string>>;
}

export function validateContactForm(
  input: ContactFormInput,
): ContactValidationResult {
  const errors: Partial<Record<keyof ContactFormInput, string>> = {};
  const trimmedName = input.name.trim();
  const trimmedEmail = input.email.trim();
  const trimmedMessage = input.message.trim();

  if (trimmedName.length < 2) {
    errors.name = 'Please enter your name (at least 2 characters).';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Please enter a valid email address.';
  }
  if (trimmedMessage.length < 10) {
    errors.message = 'Please include a short message (at least 10 characters).';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
