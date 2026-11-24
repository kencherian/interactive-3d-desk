import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CAMERA_PRESETS,
  HOTSPOT_ORDER,
  dampValue,
  dampVec3,
  filterProjects,
  getAdjacentHotspot,
  getCameraPreset,
  getLightingPreset,
  isHotspotId,
  validateContactForm,
  vec3Distance,
} from './cameraLogic';

test('camera presets exist for overview and all 5 hotspots', () => {
  assert.equal(HOTSPOT_ORDER.length, 5);
  assert.equal(getCameraPreset('overview').id, 'overview');
  for (const id of HOTSPOT_ORDER) {
    const preset = getCameraPreset(id);
    assert.equal(preset.id, id);
    assert.ok(preset.position.y > 0);
    assert.ok(vec3Distance(preset.position, preset.target) > 0.4);
  }
  assert.equal(isHotspotId('projects'), true);
  assert.equal(isHotspotId('unknown'), false);
  assert.ok(CAMERA_PRESETS.projects.label.length > 0);
});

test('adjacent hotspot cycling wraps cleanly in both directions', () => {
  assert.equal(getAdjacentHotspot('projects', 'next'), 'skills');
  assert.equal(getAdjacentHotspot('contact', 'next'), 'projects');
  assert.equal(getAdjacentHotspot('projects', 'prev'), 'contact');
  assert.equal(getAdjacentHotspot('about', 'prev'), 'skills');
});

test('exponential damping converges smoothly toward target without overshoot', () => {
  let current = 0;
  const target = 10;
  for (let i = 0; i < 60; i++) {
    current = dampValue(current, target, 6, 1 / 60);
    assert.ok(current >= 0 && current <= target);
  }
  assert.ok(Math.abs(target - current) < 0.05);

  const v = dampVec3({ x: 0, y: 0, z: 0 }, { x: 4, y: 2, z: -2 }, 10, 0.5);
  assert.ok(v.x > 3.9 && v.x < 4.0);
  assert.ok(v.y > 1.95 && v.y < 2.0);
});

test('lighting presets configure warm #FFB347 lamp and cool #64748B rim', () => {
  const day = getLightingPreset('day');
  const night = getLightingPreset('night');

  assert.equal(day.lampSpotHex, '#FFB347');
  assert.equal(night.lampSpotHex, '#FFB347');
  assert.equal(day.rimColorHex, '#64748B');
  assert.equal(night.rimColorHex, '#64748B');

  assert.ok(night.lampSpotIntensity > day.lampSpotIntensity);
  assert.ok(night.monitorBacklightIntensity > day.monitorBacklightIntensity);
  assert.ok(day.keyIntensity > night.keyIntensity);
});

test('project category filter returns matching items', () => {
  const all = filterProjects('All');
  const webgl = filterProjects('WebGL & 3D');
  assert.ok(all.length >= 4);
  assert.ok(webgl.length >= 2);
  assert.ok(webgl.every((p) => p.category === 'WebGL & 3D'));
});

test('contact form validation rejects incomplete inputs and accepts valid submissions', () => {
  const bad = validateContactForm({ name: 'A', email: 'invalid', message: 'hi' });
  assert.equal(bad.valid, false);
  assert.ok(bad.errors.name);
  assert.ok(bad.errors.email);
  assert.ok(bad.errors.message);

  const good = validateContactForm({
    name: 'Jordan Lee',
    email: 'jordan@studio.dev',
    message: 'Would love to collaborate on a spatial product build.',
  });
  assert.equal(good.valid, true);
  assert.deepEqual(good.errors, {});
});
