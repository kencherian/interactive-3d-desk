import * as THREE from 'three';

export interface ProceduralTextureSet {
  walnutAlbedo: THREE.CanvasTexture;
  walnutBump: THREE.CanvasTexture;
  deskMatAlbedo: THREE.CanvasTexture;
  deskMatBump: THREE.CanvasTexture;
  frameArt: THREE.CanvasTexture;
  notebookPage: THREE.CanvasTexture;
  brutalistArt: THREE.CanvasTexture;
  brutalistBump: THREE.CanvasTexture;
  rugAlbedo: THREE.CanvasTexture;
  rugBump: THREE.CanvasTexture;
  clockDial: THREE.CanvasTexture;
  contactShadow: THREE.CanvasTexture;
  steamSprite: THREE.CanvasTexture;
  monitorScreen: {
    texture: THREE.CanvasTexture;
    update: (elapsed: number, isNight: boolean, activeSection: string) => void;
    dispose: () => void;
  };
  dispose: () => void;
}

function makeCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to acquire 2D context for procedural texture');
  }
  return [canvas, ctx];
}

function createWalnutTextures(maxAnisotropy: number): {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const w = 1024;
  const h = 512;
  const [albedoCanvas, ctx] = makeCanvas(w, h);
  const [bumpCanvas, bCtx] = makeCanvas(w, h);

  // Rich warm American walnut base
  ctx.fillStyle = '#5c3a24';
  ctx.fillRect(0, 0, w, h);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, w, h);

  // Layered wood grain bands
  for (let i = 0; i < 240; i++) {
    const y = (i / 240) * h;
    const waveAmp = 4 + Math.sin(i * 0.27) * 5;
    const waveFreq = 0.008 + (i % 7) * 0.0012;
    const phase = i * 0.43;
    const tone = (Math.sin(i * 0.19) + 1) * 0.5;

    const r = Math.round(74 + tone * 34);
    const g = Math.round(45 + tone * 24);
    const b = Math.round(26 + tone * 14);
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.42)`;
    ctx.lineWidth = 1.6 + (i % 4) * 0.7;

    const bVal = Math.round(110 + tone * 36);
    bCtx.strokeStyle = `rgba(${bVal}, ${bVal}, ${bVal}, 0.5)`;
    bCtx.lineWidth = 1.4;

    ctx.beginPath();
    bCtx.beginPath();
    for (let x = 0; x <= w; x += 16) {
      const dy = Math.sin(x * waveFreq + phase) * waveAmp;
      if (x === 0) {
        ctx.moveTo(x, y + dy);
        bCtx.moveTo(x, y + dy);
      } else {
        ctx.lineTo(x, y + dy);
        bCtx.lineTo(x, y + dy);
      }
    }
    ctx.stroke();
    bCtx.stroke();
  }

  // Subtle plank seam lines
  const plankRows = [128, 256, 384];
  for (const py of plankRows) {
    ctx.fillStyle = 'rgba(34, 18, 10, 0.35)';
    ctx.fillRect(0, py, w, 2);
    bCtx.fillStyle = 'rgba(40, 40, 40, 0.75)';
    bCtx.fillRect(0, py, w, 2);
  }

  // Fine pore streaks
  for (let i = 0; i < 650; i++) {
    const px = (i * 197) % w;
    const py = (i * 89) % h;
    const len = 14 + (i % 28);
    ctx.fillStyle = 'rgba(32, 18, 10, 0.18)';
    ctx.fillRect(px, py, len, 1);
    bCtx.fillStyle = 'rgba(70, 70, 70, 0.35)';
    bCtx.fillRect(px, py, len, 1);
  }

  const albedo = new THREE.CanvasTexture(albedoCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS = THREE.RepeatWrapping;
  bump.wrapT = THREE.RepeatWrapping;
  bump.anisotropy = maxAnisotropy;

  return { albedo, bump };
}

function createDeskMatTextures(maxAnisotropy: number): {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 256;
  const [albedoCanvas, ctx] = makeCanvas(w, h);
  const [bumpCanvas, bCtx] = makeCanvas(w, h);

  ctx.fillStyle = '#1b1f27';
  ctx.fillRect(0, 0, w, h);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, w, h);

  // Subtle felt/neoprene micro-weave
  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 4) {
      const v = ((x * 13 + y * 29) % 19) - 9;
      ctx.fillStyle = v > 0 ? 'rgba(255,255,255,0.022)' : 'rgba(0,0,0,0.035)';
      ctx.fillRect(x, y, 2, 2);
      const bv = 128 + v * 2;
      bCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bCtx.fillRect(x, y, 2, 2);
    }
  }

  // Perimeter stitched edge detail
  ctx.strokeStyle = '#333b48';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(10, 10, w - 20, h - 20);
  ctx.setLineDash([]);

  const albedo = new THREE.CanvasTexture(albedoCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.anisotropy = maxAnisotropy;

  return { albedo, bump };
}

function createFrameArtTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 640;
  const [canvas, ctx] = makeCanvas(w, h);

  // Warm museum paper mat
  ctx.fillStyle = '#f2ede4';
  ctx.fillRect(0, 0, w, h);

  // Inner gallery print area
  ctx.fillStyle = '#171b22';
  ctx.fillRect(54, 62, w - 108, h - 144);

  // Architectural geometric emblem
  const cx = w / 2;
  const cy = 260;
  ctx.strokeStyle = '#e5a94c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 86, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(242, 237, 228, 0.65)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 64, 0, Math.PI * 2);
  ctx.stroke();

  // Isometric wireframe diamond inside emblem
  ctx.strokeStyle = '#f2ede4';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 52);
  ctx.lineTo(cx + 46, cy);
  ctx.lineTo(cx, cy + 52);
  ctx.lineTo(cx - 46, cy);
  ctx.closePath();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx - 46, cy);
  ctx.lineTo(cx + 46, cy);
  ctx.moveTo(cx, cy - 52);
  ctx.lineTo(cx, cy + 52);
  ctx.stroke();

  // Typography
  ctx.fillStyle = '#f2ede4';
  ctx.textAlign = 'center';
  ctx.font = '600 22px system-ui, sans-serif';
  ctx.fillText('SPATIAL GRAPHICS LAB', cx, 412);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '500 14px monospace';
  ctx.fillText('PBR · SHADERS · KINEMATICS', cx, 444);

  ctx.fillStyle = '#e5a94c';
  ctx.fillRect(cx - 32, 466, 64, 2);

  ctx.fillStyle = '#475569';
  ctx.font = '500 15px system-ui, sans-serif';
  ctx.fillText('PUBLICATIONS & R&D ARCHIVE', cx, 578);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createNotebookPageTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const w = 512;
  const h = 640;
  const [canvas, ctx] = makeCanvas(w, h);

  // Cream archival paper
  ctx.fillStyle = '#f6f1e6';
  ctx.fillRect(0, 0, w, h);

  // Ruled lines
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.22)';
  ctx.lineWidth = 1;
  for (let y = 74; y < h - 36; y += 26) {
    ctx.beginPath();
    ctx.moveTo(36, y);
    ctx.lineTo(w - 36, y);
    ctx.stroke();
  }

  // Subtle vertical margin
  ctx.strokeStyle = 'rgba(180, 83, 60, 0.35)';
  ctx.beginPath();
  ctx.moveTo(86, 36);
  ctx.lineTo(86, h - 36);
  ctx.stroke();

  // Header & sketch notes
  ctx.fillStyle = '#1e293b';
  ctx.font = '600 20px Georgia, serif';
  ctx.fillText('Field Notes — Spatial UI', 104, 66);

  ctx.fillStyle = '#475569';
  ctx.font = 'italic 15px Georgia, serif';
  ctx.fillText('01. Tactile camera choreography', 104, 120);
  ctx.fillText('02. Frame-paced WebGL ergonomics', 104, 146);
  ctx.fillText('03. Warm walnut / cool slate contrast', 104, 172);

  // Small geometric sketch on lower half of page
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.6;
  ctx.strokeRect(120, 240, 220, 130);
  ctx.beginPath();
  ctx.arc(230, 305, 42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(120, 370);
  ctx.lineTo(340, 240);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const [canvas, ctx] = makeCanvas(size, size);
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.48,
  );
  grad.addColorStop(0, 'rgba(8, 10, 14, 0.62)');
  grad.addColorStop(0.55, 'rgba(8, 10, 14, 0.24)');
  grad.addColorStop(1, 'rgba(8, 10, 14, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSteamTexture(): THREE.CanvasTexture {
  const size = 128;
  const [canvas, ctx] = makeCanvas(size, size);
  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    2,
    size / 2,
    size / 2,
    size * 0.46,
  );
  grad.addColorStop(0, 'rgba(255, 250, 242, 0.55)');
  grad.addColorStop(0.5, 'rgba(255, 250, 242, 0.18)');
  grad.addColorStop(1, 'rgba(255, 250, 242, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createMonitorScreen(maxAnisotropy: number) {
  const w = 1024;
  const h = 440;
  const [canvas, ctx] = makeCanvas(w, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = maxAnisotropy;

  let lastDrawTime = -1;

  const draw = (elapsed: number, isNight: boolean, activeSection: string) => {
    // Throttle canvas redraws (~15fps max) to keep CPU texture uploads featherlight
    if (lastDrawTime >= 0 && elapsed - lastDrawTime < 0.065) {
      return;
    }
    lastDrawTime = elapsed;

    const bg = isNight ? '#0d1118' : '#141923';
    const panel = isNight ? '#151c28' : '#1c2432';
    const border = 'rgba(148, 163, 184, 0.18)';
    const textMain = '#f1f5f9';
    const textMuted = '#94a3b8';
    const accent = '#ffb347';

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Top window chrome
    ctx.fillStyle = '#111620';
    ctx.fillRect(0, 0, w, 34);
    ctx.fillStyle = border;
    ctx.fillRect(0, 34, w, 1);

    // Subtle traffic dots (static window controls)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(20, 17, 4.5, 0, Math.PI * 2);
    ctx.arc(36, 17, 4.5, 0, Math.PI * 2);
    ctx.arc(52, 17, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = textMuted;
    ctx.font = '500 12px monospace';
    ctx.fillText('atelier-spatial — helios-cad-viewer.ts', 78, 21);

    ctx.fillStyle = accent;
    ctx.textAlign = 'right';
    ctx.fillText(`FOCUS: ${activeSection.toUpperCase()}`, w - 22, 21);
    ctx.textAlign = 'left';

    // Left sidebar: project modules
    ctx.fillStyle = panel;
    ctx.fillRect(14, 48, 196, h - 62);
    ctx.strokeStyle = border;
    ctx.strokeRect(14, 48, 196, h - 62);

    ctx.fillStyle = textMuted;
    ctx.font = '600 11px monospace';
    ctx.fillText('WORKSPACE', 28, 72);

    const files = [
      '01. Helios CAD',
      '02. Sonora Studio',
      '03. Vellum Tokens',
      '04. Meridian UI',
      'shader_pbr.glsl',
      'camera_rig.ts',
    ];
    files.forEach((f, idx) => {
      const fy = 100 + idx * 30;
      if (idx === 0) {
        ctx.fillStyle = 'rgba(255, 179, 71, 0.14)';
        ctx.fillRect(22, fy - 15, 180, 24);
        ctx.fillStyle = accent;
      } else {
        ctx.fillStyle = '#cbd5e1';
      }
      ctx.font = '400 13px monospace';
      ctx.fillText(f, 30, fy);
    });

    // Center code pane
    ctx.fillStyle = panel;
    ctx.fillRect(224, 48, 410, h - 62);
    ctx.strokeStyle = border;
    ctx.strokeRect(224, 48, 410, h - 62);

    const codeLines = [
      { n: '01', c: '#94a3b8', t: 'import { dampVec3 } from "./cameraLogic";' },
      { n: '02', c: '#f8fafc', t: '' },
      { n: '03', c: '#ffb347', t: 'export function stepStudioRig(state, dt) {' },
      { n: '04', c: '#cbd5e1', t: '  const target = PRESETS[state.active];' },
      { n: '05', c: '#cbd5e1', t: '  state.pos = dampVec3(state.pos, target, 5.2, dt);' },
      { n: '06', c: '#7dd3fc', t: '  material.roughness = 0.28;' },
      { n: '07', c: '#7dd3fc', t: '  spotLight.color.set("#FFB347");' },
      { n: '08', c: '#cbd5e1', t: '  return renderFrame(scene, camera);' },
      { n: '09', c: '#ffb347', t: '}' },
    ];
    codeLines.forEach((line, idx) => {
      const ly = 84 + idx * 28;
      ctx.fillStyle = '#475569';
      ctx.font = '400 12px monospace';
      ctx.fillText(line.n, 238, ly);
      ctx.fillStyle = line.c;
      ctx.fillText(line.t, 268, ly);
    });

    // Gentle blinking cursor in code editor
    if (Math.floor(elapsed * 2) % 2 === 0) {
      ctx.fillStyle = accent;
      ctx.fillRect(268, 330, 8, 16);
    }

    // Audio / frame pacing waveform strip at bottom of code pane
    ctx.strokeStyle = 'rgba(255, 179, 71, 0.55)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let x = 0; x <= 370; x += 6) {
      const amp = Math.sin(x * 0.05 + elapsed * 2.2) * 10 + Math.cos(x * 0.11 - elapsed) * 6;
      const px = 244 + x;
      const py = 382 + amp;
      if (x === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Right 3D viewport preview pane
    ctx.fillStyle = '#0f141d';
    ctx.fillRect(648, 48, 362, h - 62);
    ctx.strokeStyle = border;
    ctx.strokeRect(648, 48, 362, h - 62);

    ctx.fillStyle = textMain;
    ctx.font = '600 12px monospace';
    ctx.fillText('REAL-TIME PREVIEW', 666, 72);

    // Rotating wireframe sphere projection in right viewport
    const cx = 829;
    const cy = 232;
    const radius = 84;
    const angle = elapsed * 0.55;

    ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    for (let r = -2; r <= 2; r++) {
      const yOff = r * 26;
      const rx = Math.sqrt(Math.max(0, radius * radius - yOff * yOff));
      ctx.strokeStyle = r === 0 ? accent : 'rgba(148, 163, 184, 0.45)';
      ctx.beginPath();
      ctx.ellipse(cx, cy + yOff, rx, rx * 0.28, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    for (let m = 0; m < 4; m++) {
      const rot = angle + (m * Math.PI) / 4;
      const rx = Math.abs(Math.cos(rot)) * radius;
      ctx.strokeStyle = m === 0 ? 'rgba(255, 179, 71, 0.78)' : 'rgba(148, 163, 184, 0.36)';
      ctx.beginPath();
      ctx.ellipse(cx, cy, Math.max(4, rx), radius, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = textMuted;
    ctx.font = '400 11px monospace';
    ctx.fillText('Click monitor to inspect Projects', 666, 404);

    texture.needsUpdate = true;
  };

  draw(0, true, 'overview');

  return {
    texture,
    update: draw,
    dispose: () => texture.dispose(),
  };
}

function createBrutalistPaintingTextures(maxAnisotropy: number): {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const w = 640;
  const h = 820;
  const [canvas, ctx] = makeCanvas(w, h);
  const [bumpCanvas, bCtx] = makeCanvas(w, h);

  // Raw mineral plaster ground
  ctx.fillStyle = '#e5ddd0';
  ctx.fillRect(0, 0, w, h);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, w, h);

  // Subtle raw linen & plaster trowel passes
  for (let i = 0; i < 420; i++) {
    const px = (i * 173) % w;
    const py = (i * 251) % h;
    const pw = 24 + (i % 70);
    const ph = 4 + (i % 14);
    ctx.fillStyle =
      i % 2 === 0 ? 'rgba(180, 170, 154, 0.22)' : 'rgba(255, 250, 242, 0.24)';
    ctx.fillRect(px, py, pw, ph);

    const bVal = i % 2 === 0 ? 114 : 144;
    bCtx.fillStyle = `rgba(${bVal}, ${bVal}, ${bVal}, 0.35)`;
    bCtx.fillRect(px, py, pw, ph);
  }

  // Monumental slate concrete mass (left architectural column)
  ctx.fillStyle = '#47505c';
  ctx.fillRect(58, 72, 236, 510);
  bCtx.fillStyle = '#a8a8a8';
  bCtx.fillRect(58, 72, 236, 510);

  // Heavy ink-black cantilevered monolith (upper-right to center)
  ctx.fillStyle = '#15181e';
  ctx.fillRect(190, 148, 384, 240);
  bCtx.fillStyle = '#c8c8c8';
  bCtx.fillRect(190, 148, 384, 240);

  // Brutalist palette-knife texture ridges on black block
  for (let y = 152; y < 384; y += 6) {
    ctx.fillStyle = y % 12 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.22)';
    ctx.fillRect(194, y, 376, 3);
    bCtx.fillStyle = y % 12 === 0 ? '#dcdcdc' : '#b2b2b2';
    bCtx.fillRect(194, y, 376, 3);
  }

  // Stark raw plaster negative-space notch cutting into black monolith
  ctx.fillStyle = '#eae3d6';
  ctx.fillRect(256, 206, 98, 124);
  bCtx.fillStyle = '#707070';
  bCtx.fillRect(256, 206, 98, 124);

  // Burnt terracotta / ochre geometric tension slab (lower center-right)
  ctx.fillStyle = '#bf5a36';
  ctx.fillRect(242, 424, 290, 224);
  bCtx.fillStyle = '#bcbcbc';
  bCtx.fillRect(242, 424, 290, 224);

  // Warm ochre sub-block overlay
  ctx.fillStyle = '#d4943a';
  ctx.fillRect(368, 424, 164, 108);
  bCtx.fillStyle = '#d0d0d0';
  bCtx.fillRect(368, 424, 164, 108);

  // Heavy charcoal base lintel
  ctx.fillStyle = '#1d2128';
  ctx.fillRect(58, 668, 516, 78);
  bCtx.fillStyle = '#c2c2c2';
  bCtx.fillRect(58, 668, 516, 78);

  // Bold circular void / architectural tension disc
  ctx.fillStyle = '#15181e';
  ctx.beginPath();
  ctx.arc(462, 268, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e5ddd0';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(462, 268, 54, 0, Math.PI * 2);
  ctx.stroke();

  // Sharp structural cross-lines
  ctx.strokeStyle = '#15181e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(58, 408);
  ctx.lineTo(574, 408);
  ctx.moveTo(190, 72);
  ctx.lineTo(190, 746);
  ctx.stroke();

  // Fine mineral grit flecks across whole painting
  for (let i = 0; i < 900; i++) {
    const gx = (i * 313) % w;
    const gy = (i * 197) % h;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(20,20,20,0.12)' : 'rgba(255,255,255,0.12)';
    ctx.fillRect(gx, gy, 2, 2);
  }

  const albedo = new THREE.CanvasTexture(canvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.anisotropy = maxAnisotropy;

  return { albedo, bump };
}

function createRugTextures(maxAnisotropy: number): {
  albedo: THREE.CanvasTexture;
  bump: THREE.CanvasTexture;
} {
  const w = 512;
  const h = 320;
  const [canvas, ctx] = makeCanvas(w, h);
  const [bumpCanvas, bCtx] = makeCanvas(w, h);

  // Warm charcoal-oatmeal woven heather base
  ctx.fillStyle = '#2e3138';
  ctx.fillRect(0, 0, w, h);

  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, w, h);

  // Subtle woven yarn cross-hatch
  for (let y = 0; y < h; y += 4) {
    for (let x = 0; x < w; x += 6) {
      const weave = ((x / 6 + y / 4) % 2 === 0);
      const jitter = ((x * 17 + y * 31) % 15) - 7;
      ctx.fillStyle = weave
        ? `rgba(218, 210, 196, ${0.06 + Math.abs(jitter) * 0.005})`
        : `rgba(18, 20, 24, ${0.14 + Math.abs(jitter) * 0.006})`;
      ctx.fillRect(x, y, 5, 3);

      const bv = weave ? 152 + jitter * 2 : 104 + jitter * 2;
      bCtx.fillStyle = `rgb(${bv},${bv},${bv})`;
      bCtx.fillRect(x, y, 5, 3);
    }
  }

  // Subtle oatmeal border weave
  ctx.strokeStyle = 'rgba(216, 206, 188, 0.24)';
  ctx.lineWidth = 10;
  ctx.strokeRect(18, 18, w - 36, h - 36);

  ctx.strokeStyle = 'rgba(216, 206, 188, 0.14)';
  ctx.lineWidth = 2;
  ctx.strokeRect(32, 32, w - 64, h - 64);

  const albedo = new THREE.CanvasTexture(canvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.anisotropy = maxAnisotropy;

  const bump = new THREE.CanvasTexture(bumpCanvas);
  bump.anisotropy = maxAnisotropy;

  return { albedo, bump };
}

function createClockDialTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const size = 512;
  const [canvas, ctx] = makeCanvas(size, size);
  const cx = size / 2;
  const cy = size / 2;

  ctx.fillStyle = '#191d24';
  ctx.fillRect(0, 0, size, size);

  // Subtle concentric chapter ring
  ctx.strokeStyle = 'rgba(217, 168, 78, 0.22)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 204, 0, Math.PI * 2);
  ctx.stroke();

  // 60 minute ticks + 12 bold brass hour markers
  for (let i = 0; i < 60; i++) {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const isHour = i % 5 === 0;
    const rOuter = 212;
    const rInner = isHour ? 178 : 198;
    ctx.strokeStyle = isHour ? '#d9a84e' : 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = isHour ? 6 : 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * rInner, cy + Math.sin(a) * rInner);
    ctx.lineTo(cx + Math.cos(a) * rOuter, cy + Math.sin(a) * rOuter);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = maxAnisotropy;
  return tex;
}

export function createProceduralTextures(maxAnisotropy: number): ProceduralTextureSet {
  const walnut = createWalnutTextures(maxAnisotropy);
  const deskMat = createDeskMatTextures(maxAnisotropy);
  const frameArt = createFrameArtTexture(maxAnisotropy);
  const notebookPage = createNotebookPageTexture(maxAnisotropy);
  const brutalist = createBrutalistPaintingTextures(maxAnisotropy);
  const rug = createRugTextures(maxAnisotropy);
  const clockDial = createClockDialTexture(maxAnisotropy);
  const contactShadow = createContactShadowTexture();
  const steamSprite = createSteamTexture();
  const monitorScreen = createMonitorScreen(maxAnisotropy);

  return {
    walnutAlbedo: walnut.albedo,
    walnutBump: walnut.bump,
    deskMatAlbedo: deskMat.albedo,
    deskMatBump: deskMat.bump,
    frameArt,
    notebookPage,
    brutalistArt: brutalist.albedo,
    brutalistBump: brutalist.bump,
    rugAlbedo: rug.albedo,
    rugBump: rug.bump,
    clockDial,
    contactShadow,
    steamSprite,
    monitorScreen,
    dispose: () => {
      walnut.albedo.dispose();
      walnut.bump.dispose();
      deskMat.albedo.dispose();
      deskMat.bump.dispose();
      frameArt.dispose();
      notebookPage.dispose();
      brutalist.albedo.dispose();
      brutalist.bump.dispose();
      rug.albedo.dispose();
      rug.bump.dispose();
      clockDial.dispose();
      contactShadow.dispose();
      steamSprite.dispose();
      monitorScreen.dispose();
    },
  };
}
