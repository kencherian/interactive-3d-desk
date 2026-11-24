import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildDeskScene, BuiltDeskScene } from '../desk/buildDeskScene';
import {
  dampValue,
  getCameraPreset,
  getLightingPreset,
} from '../desk/cameraLogic';
import {
  CameraSectionId,
  HotspotId,
  LightingMode,
} from '../desk/portfolioData';
import { createProceduralTextures } from '../desk/proceduralTextures';

interface DeskCanvasProps {
  activeSection: CameraSectionId;
  lightingMode: LightingMode;
  onSelectHotspot: (id: HotspotId) => void;
  onLoadProgress: (progress: number, ready: boolean) => void;
  onContextError: () => void;
}

interface TooltipState {
  id: HotspotId;
  label: string;
  subtitle: string;
  x: number;
  y: number;
}

// Pre-allocated scratch helpers outside render loop (zero GC churn)
const _scratchVec = new THREE.Vector3();
const _scratchColor = new THREE.Color();
const _scratchBgColor = new THREE.Color();
const _scratchHemiSky = new THREE.Color();
const _scratchHemiGround = new THREE.Color();
const _scratchKeyColor = new THREE.Color();
const _scratchBackdropColor = new THREE.Color();
const _hoverHighlightColor = new THREE.Color(0x473114);
const _zeroColor = new THREE.Color(0x000000);

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export function DeskCanvas({
  activeSection,
  lightingMode,
  onSelectHotspot,
  onLoadProgress,
  onContextError,
}: DeskCanvasProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredTooltip, setHoveredTooltip] = useState<TooltipState | null>(null);

  // Store reactive props & callbacks in refs so WebGL mounts once
  const activeSectionRef = useRef<CameraSectionId>(activeSection);
  const lightingModeRef = useRef<LightingMode>(lightingMode);
  const onSelectHotspotRef = useRef(onSelectHotspot);
  const onLoadProgressRef = useRef(onLoadProgress);
  const onContextErrorRef = useRef(onContextError);

  // Camera tween state ref triggered when activeSection prop changes
  const tweenTargetRef = useRef<{
    active: boolean;
    section: CameraSectionId;
  }>({
    active: false,
    section: activeSection,
  });

  useEffect(() => {
    activeSectionRef.current = activeSection;
    tweenTargetRef.current = { active: true, section: activeSection };
  }, [activeSection]);

  useEffect(() => {
    lightingModeRef.current = lightingMode;
  }, [lightingMode]);

  useEffect(() => {
    onSelectHotspotRef.current = onSelectHotspot;
    onLoadProgressRef.current = onLoadProgress;
    onContextErrorRef.current = onContextError;
  }, [onSelectHotspot, onLoadProgress, onContextError]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    document.documentElement.classList.toggle('software-gl', isSoftwareGl);

    onLoadProgressRef.current(18, false);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      onContextErrorRef.current();
      return;
    }

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    renderer.setPixelRatio(
      isSoftwareGl ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const canvas = renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    canvas.setAttribute('data-testid', 'desk-webgl-canvas');
    container.appendChild(canvas);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      onContextErrorRef.current();
    };
    canvas.addEventListener('webglcontextlost', onContextLost);

    onLoadProgressRef.current(40, false);

    const scene = new THREE.Scene();
    const initialLight = getLightingPreset(lightingModeRef.current);
    scene.background = new THREE.Color(initialLight.backgroundHex);
    scene.fog = new THREE.FogExp2(initialLight.fogHex, initialLight.fogDensity);

    // Procedural Studio IBL reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmremGenerator.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = initialLight.envIntensity;
    roomEnv.dispose();
    pmremGenerator.dispose();

    onLoadProgressRef.current(62, false);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 45);
    const initialPreset = getCameraPreset(activeSectionRef.current);
    camera.position.set(
      initialPreset.position.x,
      initialPreset.position.y,
      initialPreset.position.z,
    );

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(
      initialPreset.target.x,
      initialPreset.target.y,
      initialPreset.target.z,
    );
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 0.85;
    controls.maxDistance = 6.2;
    controls.minPolarAngle = Math.PI * 0.14;
    controls.maxPolarAngle = Math.PI * 0.47;
    controls.minAzimuthAngle = -Math.PI * 0.42;
    controls.maxAzimuthAngle = Math.PI * 0.42;
    controls.enablePan = true;
    controls.panSpeed = 0.65;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    controls.addEventListener('start', () => {
      // Cancel scripted camera transition immediately when user interacts
      tweenTargetRef.current.active = false;
    });

    const maxAnisotropy = isSoftwareGl
      ? 1
      : Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const textures = createProceduralTextures(maxAnisotropy);
    const builtDesk: BuiltDeskScene = buildDeskScene(textures, isSoftwareGl);
    scene.add(builtDesk.root);

    onLoadProgressRef.current(86, false);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Raycasting setup (restricted to simplified proxy meshes on layer 1)
    const raycaster = new THREE.Raycaster();
    raycaster.layers.set(1);
    const pointerNdc = new THREE.Vector2();
    let hoveredId: HotspotId | null = null;
    let lastRaycastMs = 0;
    let pointerDownPos = { x: 0, y: 0 };

    const updatePointerNdc = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const projectTooltip = (id: HotspotId): TooltipState | null => {
      const hotspot = builtDesk.hotspots[id];
      if (!hotspot) return null;
      const rect = canvas.getBoundingClientRect();
      _scratchVec.copy(hotspot.tooltipAnchor).project(camera);
      if (_scratchVec.z > 1) return null;
      const sx = ((_scratchVec.x + 1) / 2) * rect.width;
      const sy = (-(_scratchVec.y - 1) / 2) * rect.height;
      return {
        id,
        label: hotspot.label,
        subtitle: hotspot.subtitle,
        x: Math.max(110, Math.min(rect.width - 110, sx)),
        y: Math.max(76, Math.min(rect.height - 96, sy)),
      };
    };

    const pickHotspot = (clientX: number, clientY: number): HotspotId | null => {
      updatePointerNdc(clientX, clientY);
      raycaster.setFromCamera(pointerNdc, camera);
      const hits = raycaster.intersectObjects(builtDesk.hitMeshes, false);
      if (hits.length === 0) return null;
      const hid = hits[0].object.userData.hotspotId as HotspotId | undefined;
      return hid ?? null;
    };

    const onPointerMove = (e: PointerEvent) => {
      const now = performance.now();
      if (now - lastRaycastMs < 40) return;
      lastRaycastMs = now;

      const hit = pickHotspot(e.clientX, e.clientY);
      if (hit !== hoveredId) {
        hoveredId = hit;
        canvas.style.cursor = hit ? 'pointer' : 'grab';
      }
      if (hit) {
        setHoveredTooltip(projectTooltip(hit));
      } else {
        setHoveredTooltip((prev) => (prev ? null : prev));
      }
    };

    const onPointerDown = (e: PointerEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
      if (!hoveredId) canvas.style.cursor = 'grabbing';
    };

    const onPointerUp = (e: PointerEvent) => {
      const dx = e.clientX - pointerDownPos.x;
      const dy = e.clientY - pointerDownPos.y;
      const moved = Math.hypot(dx, dy);
      canvas.style.cursor = hoveredId ? 'pointer' : 'grab';

      // Only trigger hotspot click if pointer didn't drag to orbit
      if (moved < 6) {
        const hit = pickHotspot(e.clientX, e.clientY);
        if (hit) {
          setHoveredTooltip(null);
          onSelectHotspotRef.current(hit);
        }
      }
    };

    const onPointerLeave = () => {
      hoveredId = null;
      canvas.style.cursor = 'default';
      setHoveredTooltip(null);
    };

    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);

    const onResize = () => {
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Track current smoothly interpolated lighting values
    let currentLampIntensity = initialLight.lampSpotIntensity;
    let currentBulbIntensity = initialLight.lampBulbEmissiveIntensity;
    let currentKeyIntensity = initialLight.keyIntensity;
    let currentRimIntensity = initialLight.rimIntensity;
    let currentHemiIntensity = initialLight.hemiIntensity;
    let currentBacklightIntensity = initialLight.monitorBacklightIntensity;
    let currentSlatBiasIntensity = initialLight.slatBiasIntensity;
    let currentSlatBiasEmissive = initialLight.slatBiasEmissiveIntensity;
    let currentEnvIntensity = initialLight.envIntensity;
    let currentExposure = initialLight.exposure;
    let currentFogDensity = initialLight.fogDensity;

    // Apply initial backdrop tint
    builtDesk.materials.studioBackdrop.color.set(
      lightingModeRef.current === 'night' ? '#161b24' : '#cfc7bb',
    );

    const startTimeMs = performance.now();
    let prevTimeMs = startTimeMs;
    let frameId = 0;
    let disposed = false;

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 85);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    let firstFrameRendered = false;

    const tick = () => {
      if (disposed) return;

      const nowMs = performance.now();
      const dt = Math.min((nowMs - prevTimeMs) / 1000, 0.1);
      prevTimeMs = nowMs;
      const elapsed = (nowMs - startTimeMs) / 1000;
      const isNight = lightingModeRef.current === 'night';
      const targetLight = getLightingPreset(lightingModeRef.current);

      // 1. Smoothly damp camera toward active preset if tweening
      if (tweenTargetRef.current.active) {
        const preset = getCameraPreset(tweenTargetRef.current.section);
        const lambda = isSoftwareGl ? 14 : 6.2;
        camera.position.x = dampValue(camera.position.x, preset.position.x, lambda, dt);
        camera.position.y = dampValue(camera.position.y, preset.position.y, lambda, dt);
        camera.position.z = dampValue(camera.position.z, preset.position.z, lambda, dt);

        controls.target.x = dampValue(controls.target.x, preset.target.x, lambda, dt);
        controls.target.y = dampValue(controls.target.y, preset.target.y, lambda, dt);
        controls.target.z = dampValue(controls.target.z, preset.target.z, lambda, dt);

        const posDist = Math.hypot(
          camera.position.x - preset.position.x,
          camera.position.y - preset.position.y,
          camera.position.z - preset.position.z,
        );
        const tgtDist = Math.hypot(
          controls.target.x - preset.target.x,
          controls.target.y - preset.target.y,
          controls.target.z - preset.target.z,
        );
        if (posDist < 0.008 && tgtDist < 0.008) {
          camera.position.set(preset.position.x, preset.position.y, preset.position.z);
          controls.target.set(preset.target.x, preset.target.y, preset.target.z);
          tweenTargetRef.current.active = false;
        }
      } else if (
        !isSoftwareGl &&
        activeSectionRef.current === 'overview'
      ) {
        // Subtle idle breathing on overview (GPU only, never fights controls)
        const breath = Math.sin(elapsed * 0.7) * 0.0005;
        camera.position.y += breath;
      }

      controls.update();

      // 2. Smoothly transition Day / Night lighting & atmosphere
      const lightLambda = isSoftwareGl ? 16 : 4.8;
      currentLampIntensity = dampValue(
        currentLampIntensity,
        targetLight.lampSpotIntensity,
        lightLambda,
        dt,
      );
      currentBulbIntensity = dampValue(
        currentBulbIntensity,
        targetLight.lampBulbEmissiveIntensity,
        lightLambda,
        dt,
      );
      currentKeyIntensity = dampValue(
        currentKeyIntensity,
        targetLight.keyIntensity,
        lightLambda,
        dt,
      );
      currentRimIntensity = dampValue(
        currentRimIntensity,
        targetLight.rimIntensity,
        lightLambda,
        dt,
      );
      currentHemiIntensity = dampValue(
        currentHemiIntensity,
        targetLight.hemiIntensity,
        lightLambda,
        dt,
      );
      currentBacklightIntensity = dampValue(
        currentBacklightIntensity,
        targetLight.monitorBacklightIntensity,
        lightLambda,
        dt,
      );
      currentSlatBiasIntensity = dampValue(
        currentSlatBiasIntensity,
        targetLight.slatBiasIntensity,
        lightLambda,
        dt,
      );
      currentSlatBiasEmissive = dampValue(
        currentSlatBiasEmissive,
        targetLight.slatBiasEmissiveIntensity,
        lightLambda,
        dt,
      );
      currentEnvIntensity = dampValue(
        currentEnvIntensity,
        targetLight.envIntensity,
        lightLambda,
        dt,
      );
      currentExposure = dampValue(
        currentExposure,
        targetLight.exposure,
        lightLambda,
        dt,
      );
      currentFogDensity = dampValue(
        currentFogDensity,
        targetLight.fogDensity,
        lightLambda,
        dt,
      );

      builtDesk.lights.lampSpot.intensity = currentLampIntensity;
      builtDesk.materials.lampBulb.emissiveIntensity = currentBulbIntensity;
      builtDesk.lights.key.intensity = currentKeyIntensity;
      builtDesk.lights.rim.intensity = currentRimIntensity;
      builtDesk.lights.hemi.intensity = currentHemiIntensity;
      builtDesk.lights.monitorBacklight.intensity = currentBacklightIntensity;
      builtDesk.lights.slatBias.intensity = currentSlatBiasIntensity;
      builtDesk.materials.slatBiasStrip.emissiveIntensity = currentSlatBiasEmissive;
      scene.environmentIntensity = currentEnvIntensity;
      renderer.toneMappingExposure = currentExposure;

      const colorLerpAlpha = Math.min(1, 1 - Math.exp(-lightLambda * dt));
      _scratchBgColor.set(targetLight.backgroundHex);
      if (scene.background instanceof THREE.Color) {
        scene.background.lerp(_scratchBgColor, colorLerpAlpha);
      }
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(_scratchBgColor, colorLerpAlpha);
        scene.fog.density = currentFogDensity;
      }

      _scratchHemiSky.set(targetLight.hemiSkyHex);
      _scratchHemiGround.set(targetLight.hemiGroundHex);
      builtDesk.lights.hemi.color.lerp(_scratchHemiSky, colorLerpAlpha);
      builtDesk.lights.hemi.groundColor.lerp(_scratchHemiGround, colorLerpAlpha);

      _scratchKeyColor.set(targetLight.keyColorHex);
      builtDesk.lights.key.color.lerp(_scratchKeyColor, colorLerpAlpha);

      _scratchBackdropColor.set(isNight ? '#161b24' : '#cfc7bb');
      builtDesk.materials.studioBackdrop.color.lerp(
        _scratchBackdropColor,
        colorLerpAlpha,
      );

      // 3. Hover emissive highlight on interactive objects
      const hotspotList = Object.values(builtDesk.hotspots);
      for (const h of hotspotList) {
        const isHovered = hoveredId === h.id || activeSectionRef.current === h.id;
        _scratchColor.copy(isHovered ? _hoverHighlightColor : _zeroColor);
        for (const mat of h.emissiveMaterials) {
          mat.emissive.lerp(_scratchColor, Math.min(1, dt * 10));
        }
      }

      // 4. Gentle monitor screen live pulse & canvas update
      textures.monitorScreen.update(elapsed, isNight, activeSectionRef.current);
      builtDesk.materials.monitorScreen.emissiveIntensity =
        (isNight ? 0.85 : 0.62) + Math.sin(elapsed * 1.4) * 0.04;

      // 5. Rising coffee steam particles
      for (const p of builtDesk.steamParticles) {
        const cycle = (elapsed * p.speed + p.phase) % 1;
        p.sprite.position.y = 0.175 + cycle * 0.24;
        p.sprite.position.x = p.baseX + Math.sin(elapsed * 1.8 + p.phase) * 0.016;
        p.sprite.position.z = p.baseZ + Math.cos(elapsed * 1.5 + p.phase) * 0.012;
        const fade = Math.sin(cycle * Math.PI);
        (p.sprite.material as THREE.SpriteMaterial).opacity = fade * 0.28;
        p.sprite.scale.setScalar(0.065 + cycle * 0.075);
      }

      renderer.render(scene, camera);

      if (!firstFrameRendered) {
        firstFrameRendered = true;
        onLoadProgressRef.current(100, true);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    };

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointerleave', onPointerLeave);

      controls.dispose();
      builtDesk.dispose();
      textures.dispose();
      envTarget.dispose();
      renderer.dispose();
      if (canvas.parentElement === container) {
        container.removeChild(canvas);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div
        ref={mountRef}
        className="w-full h-full"
        aria-label="Interactive 3D Developer Desk Workspace"
      />
      {hoveredTooltip && (
        <div
          className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-xl px-3.5 py-2 glass-surface transition-opacity duration-150"
          style={{
            left: `${hoveredTooltip.x}px`,
            top: `${hoveredTooltip.y}px`,
          }}
        >
          <p className="font-display text-xs font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
            {hoveredTooltip.label}
          </p>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
            {hoveredTooltip.subtitle}
          </p>
        </div>
      )}
    </div>
  );
}
