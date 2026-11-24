import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { HotspotId } from './portfolioData';
import { ProceduralTextureSet } from './proceduralTextures';

export interface HotspotRig {
  id: HotspotId;
  label: string;
  subtitle: string;
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  emissiveMaterials: THREE.MeshStandardMaterial[];
  tooltipAnchor: THREE.Vector3;
}

export interface SteamParticle {
  sprite: THREE.Sprite;
  baseX: number;
  baseZ: number;
  phase: number;
  speed: number;
}

export interface BuiltDeskScene {
  root: THREE.Group;
  hotspots: Record<HotspotId, HotspotRig>;
  hitMeshes: THREE.Mesh[];
  lights: {
    hemi: THREE.HemisphereLight;
    key: THREE.DirectionalLight;
    rim: THREE.DirectionalLight;
    lampSpot: THREE.SpotLight;
    monitorBacklight: THREE.PointLight;
    slatBias: THREE.PointLight;
  };
  materials: {
    lampBulb: THREE.MeshStandardMaterial;
    monitorScreen: THREE.MeshStandardMaterial;
    studioBackdrop: THREE.MeshStandardMaterial;
    slatBiasStrip: THREE.MeshStandardMaterial;
  };
  steamParticles: SteamParticle[];
  monitorGroup: THREE.Group;
  dispose: () => void;
}

export function buildDeskScene(
  textures: ProceduralTextureSet,
  isSoftwareGl: boolean,
): BuiltDeskScene {
  const root = new THREE.Group();
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.Material[] = [];

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    materials.push(m);
    return m;
  };

  // Helper: subtle contact shadow disc under props
  const addContactShadow = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    scaleX: number,
    scaleZ: number,
    opacity = 0.42,
  ) => {
    const geo = trackGeo(new THREE.CircleGeometry(0.5, 24));
    const mat = trackMat(
      new THREE.MeshBasicMaterial({
        map: textures.contactShadow,
        transparent: true,
        opacity,
        depthWrite: false,
      }),
    );
    const disc = new THREE.Mesh(geo, mat);
    disc.rotation.x = -Math.PI / 2;
    disc.position.set(x, y, z);
    disc.scale.set(scaleX, scaleZ, 1);
    disc.renderOrder = 1;
    parent.add(disc);
  };

  // --------------------------------------------------------------------------
  // 1. Studio Backdrop & Architectural Acoustic Slat Wall
  // --------------------------------------------------------------------------
  const studioBackdropMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x161b24,
      roughness: 0.92,
      metalness: 0.02,
    }),
  );

  // Seamless floor studio plane
  const floorGeo = trackGeo(new THREE.CircleGeometry(18, 48));
  const floorMesh = new THREE.Mesh(floorGeo, studioBackdropMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = -0.82;
  floorMesh.receiveShadow = !isSoftwareGl;
  root.add(floorMesh);

  // Low-pile woven studio area rug beneath the desk legs
  const rugGeo = trackGeo(new RoundedBoxGeometry(4.4, 0.014, 2.55, 2, 0.006));
  const rugMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.rugAlbedo,
      bumpMap: textures.rugBump,
      bumpScale: 0.008,
      color: 0xffffff,
      roughness: 0.94,
      metalness: 0.01,
    }),
  );
  const rugMesh = new THREE.Mesh(rugGeo, rugMat);
  rugMesh.position.set(0, -0.813, 0.08);
  rugMesh.receiveShadow = !isSoftwareGl;
  root.add(rugMesh);

  // Rear architectural wall + subtle warm wood slat accent
  const wallGeo = trackGeo(new THREE.BoxGeometry(11, 5.4, 0.16));
  const wallMesh = new THREE.Mesh(wallGeo, studioBackdropMat);
  wallMesh.position.set(0, 1.85, -1.55);
  wallMesh.receiveShadow = !isSoftwareGl;
  root.add(wallMesh);

  // Warm #FFB347 LED bias light strips tucked behind the outer slat edges
  const slatBiasMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffe4b5,
      emissive: 0xffb347,
      emissiveIntensity: 2.4,
      roughness: 0.3,
    }),
  );
  const biasStripGeo = trackGeo(new THREE.BoxGeometry(0.025, 2.38, 0.018));
  for (const bx of [-1.77, 1.77]) {
    const strip = new THREE.Mesh(biasStripGeo, slatBiasMat);
    strip.position.set(bx, 0.95, -1.464);
    root.add(strip);
  }

  // Acoustic walnut slats behind desk (InstancedMesh)
  const slatCount = 26;
  const slatGeo = trackGeo(new THREE.BoxGeometry(0.055, 2.5, 0.04));
  const slatMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.walnutAlbedo,
      color: 0xffffff,
      roughness: 0.68,
      metalness: 0.04,
    }),
  );
  const slatInstances = new THREE.InstancedMesh(slatGeo, slatMat, slatCount);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < slatCount; i++) {
    const sx = -1.75 + i * 0.14;
    dummy.position.set(sx, 0.95, -1.445);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    slatInstances.setMatrixAt(i, dummy.matrix);
  }
  slatInstances.instanceMatrix.needsUpdate = true;
  slatInstances.computeBoundingSphere();
  root.add(slatInstances);

  // Brutalist wall painting on back wall, left side beside the walnut slats
  const paintingGroup = new THREE.Group();
  paintingGroup.position.set(-2.3, 1.02, -1.46);

  const paintingFrameMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x161920,
      roughness: 0.42,
      metalness: 0.58,
    }),
  );
  // Outer shadow-box frame
  const paintingFrame = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.88, 1.12, 0.045, 2, 0.008)),
    paintingFrameMat,
  );
  paintingFrame.position.z = 0.022;
  paintingFrame.castShadow = !isSoftwareGl;
  paintingFrame.receiveShadow = !isSoftwareGl;
  paintingGroup.add(paintingFrame);

  // Recessed shadow-gap backing plate
  const paintingRecess = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.83, 1.07, 0.03)),
    trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x0b0d11,
        roughness: 0.9,
      }),
    ),
  );
  paintingRecess.position.z = 0.032;
  paintingGroup.add(paintingRecess);

  // Stretched canvas stretcher block + raw canvas sides
  const canvasBlock = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.79, 1.03, 0.028)),
    trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xd6cfc2,
        roughness: 0.85,
      }),
    ),
  );
  canvasBlock.position.z = 0.039;
  paintingGroup.add(canvasBlock);

  // Impasto brutalist painted surface
  const brutalistCanvasMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.brutalistArt,
      bumpMap: textures.brutalistBump,
      bumpScale: 0.014,
      color: 0xffffff,
      roughness: 0.72,
      metalness: 0.03,
    }),
  );
  const paintingSurface = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.79, 1.03)),
    brutalistCanvasMat,
  );
  paintingSurface.position.z = 0.054;
  paintingSurface.receiveShadow = !isSoftwareGl;
  paintingGroup.add(paintingSurface);

  // Top & bottom subtle brass corner splines
  const paintingBrassMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xc89a45,
      roughness: 0.28,
      metalness: 0.85,
    }),
  );
  for (const [cx, cy] of [
    [-0.42, 0.54],
    [0.42, 0.54],
    [-0.42, -0.54],
    [0.42, -0.54],
  ]) {
    const corner = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.035, 0.035, 0.048)),
      paintingBrassMat,
    );
    corner.position.set(cx, cy, 0.022);
    paintingGroup.add(corner);
  }
  root.add(paintingGroup);

  // Right Back Wall: Floating Walnut Shelf + Minimalist Analog Clock
  // (Mirrors the brutalist painting on the left side)
  const rightWallGroup = new THREE.Group();
  const shelfY = 0.72;
  const shelfTopY = shelfY + 0.018;

  const shelfSlab = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.92, 0.036, 0.24, 3, 0.008)),
    trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.walnutAlbedo,
        bumpMap: textures.walnutBump,
        bumpScale: 0.006,
        color: 0xffffff,
        roughness: 0.54,
        metalness: 0.03,
      }),
    ),
  );
  shelfSlab.position.set(2.3, shelfY, -1.35);
  shelfSlab.castShadow = !isSoftwareGl;
  shelfSlab.receiveShadow = !isSoftwareGl;
  rightWallGroup.add(shelfSlab);

  // Concealed dark steel shelf brackets underneath
  const bracketMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1c2028,
      roughness: 0.45,
      metalness: 0.7,
    }),
  );
  for (const bx of [1.98, 2.62]) {
    const bracket = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.032, 0.065, 0.16)),
      bracketMat,
    );
    bracket.position.set(bx, shelfY - 0.048, -1.38);
    rightWallGroup.add(bracket);
  }

  // 3 upright design/architecture hardcover books on left side of shelf
  const bookSpecs = [
    { x: 1.98, w: 0.042, h: 0.24, d: 0.17, color: 0x262c36, band: 0xd9a84e },
    { x: 2.026, w: 0.038, h: 0.21, d: 0.16, color: 0xb85a3a, band: 0xe6dfd3 },
    { x: 2.072, w: 0.046, h: 0.255, d: 0.175, color: 0xd6cfc2, band: 0x2b303a },
  ];
  for (const b of bookSpecs) {
    const coverMat = trackMat(
      new THREE.MeshStandardMaterial({
        color: b.color,
        roughness: 0.72,
        metalness: 0.03,
      }),
    );
    const book = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(b.w, b.h, b.d, 2, 0.004)),
      coverMat,
    );
    book.position.set(b.x, shelfTopY + b.h / 2, -1.35);
    book.castShadow = !isSoftwareGl;
    rightWallGroup.add(book);

    const spineBand = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(b.w + 0.002, 0.018, 0.01)),
      trackMat(
        new THREE.MeshStandardMaterial({
          color: b.band,
          roughness: 0.35,
          metalness: 0.65,
        }),
      ),
    );
    spineBand.position.set(b.x, shelfTopY + b.h * 0.72, -1.35 + b.d / 2);
    rightWallGroup.add(spineBand);
  }

  // Small matte-black geometric sculpture + brass sphere on shelf center
  const sculptureGroup = new THREE.Group();
  sculptureGroup.position.set(2.3, shelfTopY, -1.35);
  const plinth = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.11, 0.022, 0.11, 2, 0.004)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x2f3540, roughness: 0.68 })),
  );
  plinth.position.y = 0.011;
  sculptureGroup.add(plinth);

  const sculpRing = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.056, 0.012, 14, 28)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x15181e, roughness: 0.35, metalness: 0.45 })),
  );
  sculpRing.position.set(0, 0.082, 0);
  sculpRing.rotation.y = 0.35;
  sculptureGroup.add(sculpRing);

  const sculpSphere = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.028, 18, 18)),
    trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xd9a84e,
        metalness: 0.92,
        roughness: 0.2,
      }),
    ),
  );
  sculpSphere.position.set(0, 0.05, 0);
  sculptureGroup.add(sculpSphere);
  rightWallGroup.add(sculptureGroup);

  // Trailing pothos plant on right side of floating shelf
  const pothosGroup = new THREE.Group();
  pothosGroup.position.set(2.58, shelfTopY, -1.34);
  const pothosPotProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.055, 0),
    new THREE.Vector2(0.068, 0.024),
    new THREE.Vector2(0.07, 0.115),
    new THREE.Vector2(0.064, 0.12),
    new THREE.Vector2(0.058, 0.112),
    new THREE.Vector2(0, 0.1),
  ];
  const pothosPot = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(pothosPotProfile, 24)),
    trackMat(
      new THREE.MeshPhysicalMaterial({
        color: 0xe6dfd3,
        roughness: 0.36,
        clearcoat: 0.4,
      }),
    ),
  );
  pothosPot.castShadow = !isSoftwareGl;
  pothosGroup.add(pothosPot);

  const pothosSoil = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.058, 0.056, 0.01, 18)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.96 })),
  );
  pothosSoil.position.y = 0.105;
  pothosGroup.add(pothosSoil);

  const pothosLeafShape = new THREE.Shape();
  pothosLeafShape.moveTo(0, 0);
  pothosLeafShape.bezierCurveTo(0.028, 0.018, 0.032, 0.055, 0, 0.085);
  pothosLeafShape.bezierCurveTo(-0.032, 0.055, -0.028, 0.018, 0, 0);
  const pothosLeafGeo = trackGeo(
    new THREE.ExtrudeGeometry(pothosLeafShape, {
      depth: 0.003,
      bevelEnabled: true,
      bevelThickness: 0.0015,
      bevelSize: 0.0015,
      bevelSegments: 1,
    }),
  );
  const pothosLeafMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x41744e,
      roughness: 0.44,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );
  const pothosDarkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2e583b,
      roughness: 0.48,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );

  // Crown leaves + two trailing pothos vines draping over the shelf front edge
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.2;
    const crownLeaf = new THREE.Mesh(
      pothosLeafGeo,
      i % 2 === 0 ? pothosLeafMat : pothosDarkMat,
    );
    crownLeaf.position.set(Math.cos(a) * 0.028, 0.125, Math.sin(a) * 0.028);
    crownLeaf.rotation.set(0.65, -a + Math.PI / 2, 0.2);
    crownLeaf.scale.setScalar(0.82);
    pothosGroup.add(crownLeaf);
  }
  const vinePaths = [
    [
      new THREE.Vector3(-0.02, 0.11, 0.03),
      new THREE.Vector3(-0.03, 0.13, 0.09),
      new THREE.Vector3(-0.02, 0.02, 0.13),
      new THREE.Vector3(-0.04, -0.13, 0.14),
      new THREE.Vector3(-0.03, -0.24, 0.12),
    ],
    [
      new THREE.Vector3(0.02, 0.11, 0.03),
      new THREE.Vector3(0.04, 0.12, 0.085),
      new THREE.Vector3(0.05, 0.0, 0.125),
      new THREE.Vector3(0.06, -0.1, 0.135),
    ],
  ];
  for (const pts of vinePaths) {
    const vCurve = new THREE.CatmullRomCurve3(pts);
    const vineMesh = new THREE.Mesh(
      trackGeo(new THREE.TubeGeometry(vCurve, 20, 0.004, 6, false)),
      pothosDarkMat,
    );
    pothosGroup.add(vineMesh);
    for (const t of [0.35, 0.62, 0.88, 0.99]) {
      const p = vCurve.getPoint(t);
      const leaf = new THREE.Mesh(pothosLeafGeo, pothosLeafMat);
      leaf.position.copy(p);
      leaf.rotation.set(1.15, (t - 0.5) * 1.4, 0.25);
      leaf.scale.setScalar(0.75);
      pothosGroup.add(leaf);
    }
  }
  rightWallGroup.add(pothosGroup);

  // Minimalist Analog Studio Wall Clock above the shelf
  const clockGroup = new THREE.Group();
  clockGroup.position.set(2.3, 1.34, -1.45);
  const clockBezelMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xd4a44a,
      metalness: 0.92,
      roughness: 0.24,
      clearcoat: 0.3,
    }),
  );
  const clockCase = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.22, 0.22, 0.045, 32)),
    clockBezelMat,
  );
  clockCase.rotation.x = Math.PI / 2;
  clockCase.castShadow = !isSoftwareGl;
  clockGroup.add(clockCase);

  const clockFace = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(0.2, 32)),
    trackMat(
      new THREE.MeshStandardMaterial({
        map: textures.clockDial,
        color: 0xffffff,
        roughness: 0.58,
        metalness: 0.05,
      }),
    ),
  );
  clockFace.position.z = 0.024;
  clockGroup.add(clockFace);

  // Brass hour & minute hands + terracotta second hand (10:10 aesthetic angle)
  const hourHand = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.012, 0.105, 0.006)),
    clockBezelMat,
  );
  hourHand.position.set(-0.032, 0.026, 0.029);
  hourHand.rotation.z = 0.92;
  clockGroup.add(hourHand);

  const minuteHand = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.008, 0.15, 0.006)),
    clockBezelMat,
  );
  minuteHand.position.set(0.042, 0.044, 0.031);
  minuteHand.rotation.z = -0.82;
  clockGroup.add(minuteHand);

  const centerPin = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.01, 14)),
    trackMat(new THREE.MeshStandardMaterial({ color: 0xc2410c, roughness: 0.45 })),
  );
  centerPin.rotation.x = Math.PI / 2;
  centerPin.position.z = 0.033;
  clockGroup.add(centerPin);

  // Subtle architectural wall sconce bar beneath clock washing shelf warmly
  const sconceHousing = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.32, 0.024, 0.045, 2, 0.006)),
    bracketMat,
  );
  sconceHousing.position.set(2.3, 1.04, -1.445);
  rightWallGroup.add(sconceHousing);

  const sconceGlow = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.28, 0.008, 0.028)),
    slatBiasMat,
  );
  sconceGlow.position.set(2.3, 1.026, -1.442);
  rightWallGroup.add(sconceGlow);

  rightWallGroup.add(clockGroup);
  root.add(rightWallGroup);

  // --------------------------------------------------------------------------
  // 2. Walnut Desk Slab, Steel Trestle Legs & Matte Desk Mat
  // --------------------------------------------------------------------------
  const deskGroup = new THREE.Group();
  const deskSlabGeo = trackGeo(new RoundedBoxGeometry(3.65, 0.09, 1.85, 4, 0.02));
  const walnutMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.walnutAlbedo,
      bumpMap: textures.walnutBump,
      bumpScale: 0.008,
      color: 0xffffff,
      roughness: 0.52,
      metalness: 0.03,
    }),
  );
  const deskSlab = new THREE.Mesh(deskSlabGeo, walnutMat);
  deskSlab.position.set(0, -0.045, 0);
  deskSlab.receiveShadow = !isSoftwareGl;
  deskSlab.castShadow = !isSoftwareGl;
  deskGroup.add(deskSlab);

  // Matte black steel edge trim & trestle legs
  const steelMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1e222a,
      roughness: 0.42,
      metalness: 0.72,
    }),
  );
  const legGeo = trackGeo(new RoundedBoxGeometry(0.06, 0.76, 0.06, 2, 0.008));
  const crossbarGeo = trackGeo(new RoundedBoxGeometry(0.05, 0.05, 1.48, 2, 0.008));
  const legOffsets: Array<[number, number]> = [
    [-1.58, -0.68],
    [-1.58, 0.68],
    [1.58, -0.68],
    [1.58, 0.68],
  ];
  for (const [lx, lz] of legOffsets) {
    const leg = new THREE.Mesh(legGeo, steelMat);
    leg.position.set(lx, -0.45, lz);
    deskGroup.add(leg);
  }
  for (const cx of [-1.58, 1.58]) {
    const bar = new THREE.Mesh(crossbarGeo, steelMat);
    bar.position.set(cx, -0.76, 0);
    deskGroup.add(bar);
  }

  // Dark matte desk mat (offset on Y to avoid coplanar z-fighting)
  const matGeo = trackGeo(new RoundedBoxGeometry(1.96, 0.012, 0.86, 3, 0.005));
  const deskMatMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.deskMatAlbedo,
      bumpMap: textures.deskMatBump,
      bumpScale: 0.004,
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  const deskMatMesh = new THREE.Mesh(matGeo, deskMatMaterial);
  deskMatMesh.position.set(0, 0.006, 0.25);
  deskMatMesh.receiveShadow = !isSoftwareGl;
  deskGroup.add(deskMatMesh);
  root.add(deskGroup);

  // Shared materials for props
  const brushedAluminumMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xb8c0cc,
      metalness: 0.88,
      roughness: 0.26,
      clearcoat: 0.2,
    }),
  );
  const anodizedDarkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x222731,
      metalness: 0.76,
      roughness: 0.34,
    }),
  );
  const brassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xd9a84e,
      metalness: 0.92,
      roughness: 0.22,
      clearcoat: 0.35,
    }),
  );

  // --------------------------------------------------------------------------
  // 3. Articulated Architect Desk Lamp (Back-Right)
  // --------------------------------------------------------------------------
  const lampGroup = new THREE.Group();
  lampGroup.position.set(1.36, 0, -0.54);

  const castIronMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1b1e24,
      roughness: 0.62,
      metalness: 0.55,
    }),
  );
  addContactShadow(lampGroup, 0, 0.004, 0, 0.42, 0.42, 0.45);

  const lampBase = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.14, 0.16, 0.032, 28)),
    castIronMat,
  );
  lampBase.position.y = 0.016;
  lampBase.castShadow = !isSoftwareGl;
  lampGroup.add(lampBase);

  const lampSwivel = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.028, 0.032, 0.08, 16)),
    brassMat,
  );
  lampSwivel.position.y = 0.065;
  lampGroup.add(lampSwivel);

  // Lower arm
  const lowerArm = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.014, 0.014, 0.64, 12)),
    castIronMat,
  );
  lowerArm.position.set(-0.08, 0.38, 0.06);
  lowerArm.rotation.z = 0.24;
  lowerArm.rotation.x = 0.16;
  lowerArm.castShadow = !isSoftwareGl;
  lampGroup.add(lowerArm);

  // Brass elbow joint
  const elbow = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.028, 16, 16)),
    brassMat,
  );
  elbow.position.set(-0.16, 0.68, 0.12);
  lampGroup.add(elbow);

  // Upper arm reaching toward desk center
  const upperArm = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.56, 12)),
    castIronMat,
  );
  upperArm.position.set(-0.34, 0.88, 0.25);
  upperArm.rotation.z = 0.68;
  upperArm.rotation.x = 0.42;
  upperArm.castShadow = !isSoftwareGl;
  lampGroup.add(upperArm);

  // Spun-metal flared lamp shade (LatheGeometry)
  const shadeProfile = [
    new THREE.Vector2(0.028, 0.16),
    new THREE.Vector2(0.055, 0.14),
    new THREE.Vector2(0.11, 0.06),
    new THREE.Vector2(0.135, 0),
    new THREE.Vector2(0.128, 0),
    new THREE.Vector2(0.05, 0.13),
    new THREE.Vector2(0.025, 0.15),
  ];
  const shadeGeo = trackGeo(new THREE.LatheGeometry(shadeProfile, 28));
  const shadeGroup = new THREE.Group();
  shadeGroup.position.set(-0.52, 1.03, 0.36);
  shadeGroup.rotation.set(0.32, 0.28, -0.32);

  const shadeMesh = new THREE.Mesh(shadeGeo, castIronMat);
  shadeMesh.castShadow = !isSoftwareGl;
  shadeGroup.add(shadeMesh);

  const lampBulbMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffe2b0,
      emissive: 0xffb347,
      emissiveIntensity: 3.4,
      roughness: 0.25,
    }),
  );
  const bulbMesh = new THREE.Mesh(
    trackGeo(new THREE.SphereGeometry(0.042, 16, 16)),
    lampBulbMat,
  );
  bulbMesh.position.y = 0.045;
  shadeGroup.add(bulbMesh);
  lampGroup.add(shadeGroup);
  root.add(lampGroup);

  // --------------------------------------------------------------------------
  // 3b. Walnut Desk Shelf / Monitor Riser (grounded at y = 0, top at y = 0.10)
  // --------------------------------------------------------------------------
  const riserGroup = new THREE.Group();
  riserGroup.position.set(0, 0, -0.62);
  addContactShadow(riserGroup, -0.5, 0.004, 0, 0.14, 0.38, 0.36);
  addContactShadow(riserGroup, 0.5, 0.004, 0, 0.14, 0.38, 0.36);

  const riserTop = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(1.18, 0.024, 0.34, 3, 0.006)),
    walnutMat,
  );
  riserTop.position.set(0, 0.088, 0);
  riserTop.castShadow = !isSoftwareGl;
  riserTop.receiveShadow = !isSoftwareGl;
  riserGroup.add(riserTop);

  for (const rx of [-0.52, 0.52]) {
    const rLeg = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(0.028, 0.078, 0.3, 2, 0.004)),
      anodizedDarkMat,
    );
    rLeg.position.set(rx, 0.039, 0);
    rLeg.castShadow = !isSoftwareGl;
    riserGroup.add(rLeg);
  }
  root.add(riserGroup);

  // --------------------------------------------------------------------------
  // 3c. Compact Studio Monitor Speakers (Flanking the Ultrawide Screen)
  // --------------------------------------------------------------------------
  const speakerConesMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x22262e,
      roughness: 0.66,
      metalness: 0.08,
    }),
  );
  const speakerSurroundMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x101216,
      roughness: 0.88,
      metalness: 0.02,
    }),
  );
  const speakerBaffleMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x15181e,
      roughness: 0.8,
      metalness: 0.05,
    }),
  );
  const copperTrimMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xb86f47,
      metalness: 0.86,
      roughness: 0.3,
      clearcoat: 0.22,
    }),
  );

  for (const side of [-1, 1] as const) {
    const spkGroup = new THREE.Group();
    spkGroup.position.set(side * 1.0, 0, -0.64);
    spkGroup.rotation.y = side * -0.24;
    addContactShadow(spkGroup, 0, 0.004, 0, 0.24, 0.28, 0.44);

    // Angled matte-black acoustic isolation foam base
    const isoPad = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(0.174, 0.02, 0.206, 2, 0.004)),
      speakerSurroundMat,
    );
    isoPad.position.y = 0.01;
    isoPad.receiveShadow = !isSoftwareGl;
    spkGroup.add(isoPad);

    // Unified tilted speaker chassis (4° upward acoustic alignment)
    const chassisGroup = new THREE.Group();
    chassisGroup.position.y = 0.02;
    chassisGroup.rotation.x = -0.07;

    // Walnut speaker enclosure
    const cabinet = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(0.172, 0.276, 0.2, 3, 0.01)),
      walnutMat,
    );
    cabinet.position.y = 0.138;
    cabinet.castShadow = !isSoftwareGl;
    cabinet.receiveShadow = !isSoftwareGl;
    chassisGroup.add(cabinet);

    // Matte-black front acoustic baffle
    const baffle = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(0.15, 0.252, 0.014, 2, 0.004)),
      speakerBaffleMat,
    );
    baffle.position.set(0, 0.138, 0.097);
    chassisGroup.add(baffle);

    // Lower front-firing slot bass-reflex port
    const bassPort = new THREE.Mesh(
      trackGeo(new RoundedBoxGeometry(0.088, 0.011, 0.01, 2, 0.003)),
      speakerSurroundMat,
    );
    bassPort.position.set(0, 0.032, 0.101);
    chassisGroup.add(bassPort);

    // Matte-black woofer rubber surround, cone & dust cap
    const wooferSurround = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.051, 0.0065, 10, 26)),
      speakerSurroundMat,
    );
    wooferSurround.position.set(0, 0.106, 0.104);
    chassisGroup.add(wooferSurround);

    const wooferCone = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.047, 0.019, 0.018, 24)),
      speakerConesMat,
    );
    wooferCone.rotation.x = Math.PI / 2;
    wooferCone.position.set(0, 0.106, 0.098);
    chassisGroup.add(wooferCone);

    const wooferCap = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.016, 16, 10)),
      speakerSurroundMat,
    );
    wooferCap.scale.set(1, 1, 0.55);
    wooferCap.position.set(0, 0.106, 0.095);
    chassisGroup.add(wooferCap);

    // Upper tweeter waveguide plate + subtle copper-colored trim ring + silk dome
    const tweeterPlate = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.029, 0.029, 0.006, 24)),
      speakerBaffleMat,
    );
    tweeterPlate.rotation.x = Math.PI / 2;
    tweeterPlate.position.set(0, 0.214, 0.103);
    chassisGroup.add(tweeterPlate);

    const tweeterRing = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.0215, 0.0026, 12, 28)),
      copperTrimMat,
    );
    tweeterRing.position.set(0, 0.214, 0.106);
    chassisGroup.add(tweeterRing);

    const tweeterDome = new THREE.Mesh(
      trackGeo(new THREE.SphereGeometry(0.0155, 18, 14)),
      speakerConesMat,
    );
    tweeterDome.scale.set(1, 1, 0.65);
    tweeterDome.position.set(0, 0.214, 0.104);
    chassisGroup.add(tweeterDome);

    // Subtle warm power indicator pin on the primary right monitor
    if (side === 1) {
      const powerLed = new THREE.Mesh(
        trackGeo(new THREE.SphereGeometry(0.0028, 10, 10)),
        trackMat(
          new THREE.MeshStandardMaterial({
            color: 0xffd89e,
            emissive: 0xffb347,
            emissiveIntensity: 0.9,
            roughness: 0.3,
          }),
        ),
      );
      powerLed.position.set(0.058, 0.032, 0.105);
      chassisGroup.add(powerLed);
    }

    spkGroup.add(chassisGroup);
    root.add(spkGroup);
  }

  // --------------------------------------------------------------------------
  // 4. Hotspot 1: Ultrawide Monitor ("projects") — seated on walnut riser
  // --------------------------------------------------------------------------
  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(0, 0.1, -0.62);
  addContactShadow(monitorGroup, 0, 0.004, 0.04, 0.64, 0.34, 0.4);

  const monBase = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.56, 0.022, 0.28, 3, 0.008)),
    brushedAluminumMat,
  );
  monBase.position.set(0, 0.011, 0.02);
  monBase.castShadow = !isSoftwareGl;
  monBase.receiveShadow = !isSoftwareGl;
  monitorGroup.add(monBase);

  const monNeck = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.09, 0.44, 0.045, 2, 0.01)),
    brushedAluminumMat,
  );
  monNeck.position.set(0, 0.24, -0.06);
  monNeck.rotation.x = -0.08;
  monNeck.castShadow = !isSoftwareGl;
  monitorGroup.add(monNeck);

  // Monitor chassis & bezel
  const monChassisMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x161a22,
      roughness: 0.38,
      metalness: 0.52,
      emissive: 0x000000,
      emissiveIntensity: 0,
    }),
  );
  const monChassis = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(1.72, 0.76, 0.05, 4, 0.016)),
    monChassisMat,
  );
  monChassis.position.set(0, 0.74, 0.01);
  monChassis.castShadow = !isSoftwareGl;
  monitorGroup.add(monChassis);

  // Live procedural canvas screen plane
  const monitorScreenMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.monitorScreen.texture,
      emissiveMap: textures.monitorScreen.texture,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.72,
      roughness: 0.22,
      metalness: 0.04,
    }),
  );
  const screenMesh = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(1.64, 0.69)),
    monitorScreenMat,
  );
  screenMesh.position.set(0, 0.74, 0.037);
  monitorGroup.add(screenMesh);

  // Top lightbar & webcam accent
  const lightbar = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.58, 0.028, 0.045, 2, 0.01)),
    anodizedDarkMat,
  );
  lightbar.position.set(0, 1.135, 0.03);
  monitorGroup.add(lightbar);

  const monHitMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(1.78, 0.84, 0.2)),
    trackMat(new THREE.MeshBasicMaterial({ visible: false })),
  );
  monHitMesh.position.set(0, 0.74, 0.02);
  monHitMesh.layers.set(1);
  monHitMesh.userData.hotspotId = 'projects';
  monitorGroup.add(monHitMesh);
  root.add(monitorGroup);

  // --------------------------------------------------------------------------
  // 5. Hotspot 2: 75% Mechanical Keyboard & Mouse ("skills")
  // --------------------------------------------------------------------------
  const keyboardGroup = new THREE.Group();
  keyboardGroup.position.set(-0.08, 0.012, 0.34);

  const kbCaseMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2a303c,
      roughness: 0.3,
      metalness: 0.78,
      emissive: 0x000000,
    }),
  );
  // Sloped 75% aluminum chassis
  const kbCase = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.68, 0.036, 0.26, 3, 0.008)),
    kbCaseMat,
  );
  kbCase.position.set(0, 0.018, 0);
  kbCase.rotation.x = 0.06;
  kbCase.castShadow = !isSoftwareGl;
  kbCase.receiveShadow = !isSoftwareGl;
  keyboardGroup.add(kbCase);

  // Brass badge on top-right of keyboard
  const kbBadge = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.055, 0.008, 0.018, 2, 0.003)),
    brassMat,
  );
  kbBadge.position.set(0.28, 0.036, -0.095);
  kbBadge.rotation.x = 0.06;
  keyboardGroup.add(kbBadge);

  // Instanced sculpted keycaps (5 rows x 14 cols)
  const rows = 5;
  const cols = 14;
  const keyCount = rows * cols;
  const keyGeo = trackGeo(new RoundedBoxGeometry(0.036, 0.018, 0.034, 2, 0.004));
  const keyMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.65,
      metalness: 0.04,
    }),
  );
  const keysInstanced = new THREE.InstancedMesh(keyGeo, keyMat, keyCount);
  const keyColor = new THREE.Color();
  let kIdx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const kx = -0.295 + c * 0.045;
      const kz = -0.088 + r * 0.043;
      const ky = 0.042 - kz * Math.sin(0.06);
      const isSpaceArea = r === 4 && c >= 4 && c <= 8;
      if (isSpaceArea) {
        // Hide individual keys under the dedicated sculpted spacebar
        dummy.position.set(kx, -10, kz);
        dummy.scale.set(0.001, 0.001, 0.001);
      } else {
        dummy.position.set(kx, ky, kz);
        dummy.rotation.set(0.06, 0, 0);
        dummy.scale.set(1, 1, 1);
      }
      dummy.updateMatrix();
      keysInstanced.setMatrixAt(kIdx, dummy.matrix);

      if (r === 0 && c === 0) {
        keyColor.setHex(0xe07a38); // Terracotta Esc key
      } else if (r === 2 && c === 13) {
        keyColor.setHex(0xefb045); // Amber Enter key
      } else if (c === 0 || c === 13 || r === 4) {
        keyColor.setHex(0x3a4250); // Slate modifier keys
      } else {
        keyColor.setHex(0xdad6ce); // Warm PBT cream alpha keys
      }
      keysInstanced.setColorAt(kIdx, keyColor);
      kIdx++;
    }
  }
  keysInstanced.instanceMatrix.needsUpdate = true;
  if (keysInstanced.instanceColor) keysInstanced.instanceColor.needsUpdate = true;
  keysInstanced.computeBoundingSphere();
  keysInstanced.castShadow = !isSoftwareGl;
  keyboardGroup.add(keysInstanced);

  // Dedicated 6.25u sculpted spacebar
  const spacebar = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.22, 0.018, 0.036, 2, 0.005)),
    trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xdad6ce,
        roughness: 0.62,
        metalness: 0.04,
      }),
    ),
  );
  spacebar.position.set(-0.025, 0.037, 0.084);
  spacebar.rotation.x = 0.06;
  spacebar.castShadow = !isSoftwareGl;
  keyboardGroup.add(spacebar);

  // Anodized USB-C connector collar & coiled cable routed cleanly behind monitor stand
  const usbCollar = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.024, 0.016, 0.036, 2, 0.004)),
    brassMat,
  );
  usbCollar.position.set(-0.18, 0.022, -0.142);
  keyboardGroup.add(usbCollar);

  const cablePoints: THREE.Vector3[] = [
    new THREE.Vector3(-0.18, 0.018, -0.16),
    new THREE.Vector3(-0.18, 0.014, -0.22),
  ];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28;
    const angle = t * Math.PI * 8;
    cablePoints.push(
      new THREE.Vector3(
        -0.18 + t * 0.24,
        0.018 + Math.sin(angle) * 0.011,
        -0.25 + Math.cos(angle) * 0.013,
      ),
    );
  }
  cablePoints.push(new THREE.Vector3(0.08, 0.01, -0.34));
  cablePoints.push(new THREE.Vector3(0.09, 0.006, -0.62));
  cablePoints.push(new THREE.Vector3(0.08, 0.006, -0.96));

  const cableCurve = new THREE.CatmullRomCurve3(cablePoints);
  const cableMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(cableCurve, 64, 0.006, 8, false)),
    trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x3b4252,
        roughness: 0.72,
        metalness: 0.08,
      }),
    ),
  );
  keyboardGroup.add(cableMesh);

  // Wireless ergonomic mouse next to keyboard
  const mouseMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x252a34,
      roughness: 0.45,
      metalness: 0.15,
    }),
  );
  const mouseBody = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.11, 0.048, 0.17, 4, 0.022)),
    mouseMat,
  );
  mouseBody.position.set(0.54, 0.024, 0.02);
  mouseBody.castShadow = !isSoftwareGl;
  keyboardGroup.add(mouseBody);

  const scrollWheel = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.012, 0.012, 0.014, 16)),
    brassMat,
  );
  scrollWheel.rotation.z = Math.PI / 2;
  scrollWheel.position.set(0.54, 0.046, -0.032);
  keyboardGroup.add(scrollWheel);

  const kbHitMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.95, 0.14, 0.36)),
    trackMat(new THREE.MeshBasicMaterial({ visible: false })),
  );
  kbHitMesh.position.set(0.1, 0.05, 0);
  kbHitMesh.layers.set(1);
  kbHitMesh.userData.hotspotId = 'skills';
  keyboardGroup.add(kbHitMesh);
  root.add(keyboardGroup);

  // --------------------------------------------------------------------------
  // 5b. Knurled Brass Rotary Macro Knob (Left Edge of Desk Mat)
  // --------------------------------------------------------------------------
  const knobGroup = new THREE.Group();
  knobGroup.position.set(-0.68, 0.012, 0.38);

  const knobBase = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.105, 0.018, 0.105, 3, 0.006)),
    anodizedDarkMat,
  );
  knobBase.position.y = 0.009;
  knobBase.castShadow = !isSoftwareGl;
  knobGroup.add(knobBase);

  const knobLedRing = new THREE.Mesh(
    trackGeo(new THREE.RingGeometry(0.036, 0.041, 24)),
    slatBiasMat,
  );
  knobLedRing.rotation.x = -Math.PI / 2;
  knobLedRing.position.y = 0.019;
  knobGroup.add(knobLedRing);

  const knobDial = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.035, 0.037, 0.026, 28)),
    brassMat,
  );
  knobDial.position.y = 0.031;
  knobDial.castShadow = !isSoftwareGl;
  knobGroup.add(knobDial);

  const knobNotch = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.005, 0.004, 0.014)),
    anodizedDarkMat,
  );
  knobNotch.position.set(0, 0.045, -0.018);
  knobGroup.add(knobNotch);
  root.add(knobGroup);

  // --------------------------------------------------------------------------
  // 6. Hotspot 3: Leather Notebook & Machined Brass Pen ("about")
  // --------------------------------------------------------------------------
  const notebookGroup = new THREE.Group();
  notebookGroup.position.set(-1.16, 0, 0.25);
  notebookGroup.rotation.y = 0.22;
  addContactShadow(notebookGroup, 0, 0.004, 0, 0.56, 0.68, 0.44);

  const leatherMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x6b3a24,
      roughness: 0.68,
      metalness: 0.04,
      emissive: 0x000000,
    }),
  );
  const leatherCover = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.42, 0.026, 0.56, 3, 0.008)),
    leatherMat,
  );
  leatherCover.position.y = 0.013;
  leatherCover.castShadow = !isSoftwareGl;
  leatherCover.receiveShadow = !isSoftwareGl;
  notebookGroup.add(leatherCover);

  // Paper block
  const paperMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.notebookPage,
      color: 0xffffff,
      roughness: 0.88,
      metalness: 0,
    }),
  );
  const paperBlock = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.38, 0.022, 0.52, 2, 0.004)),
    paperMat,
  );
  paperBlock.position.set(0.006, 0.024, 0);
  paperBlock.receiveShadow = !isSoftwareGl;
  notebookGroup.add(paperBlock);

  // Bookmark ribbon
  const ribbonMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xc2410c,
      roughness: 0.78,
    }),
  );
  const ribbon = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.018, 0.004, 0.58)),
    ribbonMat,
  );
  ribbon.position.set(0.07, 0.037, 0.03);
  notebookGroup.add(ribbon);

  // Machined brass fountain pen resting diagonally
  const penGroup = new THREE.Group();
  penGroup.position.set(0.09, 0.045, 0.02);
  penGroup.rotation.set(0, -0.45, Math.PI / 2);

  const penBarrel = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.011, 0.009, 0.34, 16)),
    brassMat,
  );
  penBarrel.castShadow = !isSoftwareGl;
  penGroup.add(penBarrel);

  const penCap = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.0125, 0.012, 0.11, 16)),
    anodizedDarkMat,
  );
  penCap.position.y = 0.12;
  penGroup.add(penCap);

  const penNib = new THREE.Mesh(
    trackGeo(new THREE.ConeGeometry(0.009, 0.035, 14)),
    brushedAluminumMat,
  );
  penNib.position.y = -0.185;
  penNib.rotation.x = Math.PI;
  penGroup.add(penNib);
  notebookGroup.add(penGroup);

  const nbHitMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.52, 0.14, 0.64)),
    trackMat(new THREE.MeshBasicMaterial({ visible: false })),
  );
  nbHitMesh.position.y = 0.05;
  nbHitMesh.layers.set(1);
  nbHitMesh.userData.hotspotId = 'about';
  notebookGroup.add(nbHitMesh);
  root.add(notebookGroup);

  // --------------------------------------------------------------------------
  // 6b. Small Walnut & Leather Valet / Catchall Tray (between Plaque & Notebook)
  // --------------------------------------------------------------------------
  const valetGroup = new THREE.Group();
  valetGroup.position.set(-1.18, 0, -0.2);
  valetGroup.rotation.y = 0.12;
  addContactShadow(valetGroup, 0, 0.004, 0, 0.28, 0.2, 0.38);

  const trayOuter = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.24, 0.022, 0.16, 3, 0.006)),
    walnutMat,
  );
  trayOuter.position.y = 0.011;
  trayOuter.castShadow = !isSoftwareGl;
  trayOuter.receiveShadow = !isSoftwareGl;
  valetGroup.add(trayOuter);

  const trayLiner = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.21, 0.006, 0.13, 2, 0.003)),
    leatherMat,
  );
  trayLiner.position.y = 0.021;
  valetGroup.add(trayLiner);

  // Tiny studio props inside tray: lens cap, 2 SD cards, and brass clip
  const lensCap = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.032, 0.032, 0.01, 20)),
    anodizedDarkMat,
  );
  lensCap.position.set(-0.045, 0.029, 0.005);
  valetGroup.add(lensCap);

  const sdCardGeo = trackGeo(new RoundedBoxGeometry(0.028, 0.004, 0.036, 1, 0.001));
  const sdCard1 = new THREE.Mesh(sdCardGeo, anodizedDarkMat);
  sdCard1.position.set(0.038, 0.026, -0.018);
  sdCard1.rotation.y = 0.22;
  valetGroup.add(sdCard1);

  const sdCard2 = new THREE.Mesh(sdCardGeo, copperTrimMat);
  sdCard2.position.set(0.056, 0.029, 0.014);
  sdCard2.rotation.y = -0.35;
  valetGroup.add(sdCard2);
  root.add(valetGroup);

  // --------------------------------------------------------------------------
  // 7. Hotspot 4: Framed Achievement Plaque ("labs")
  // --------------------------------------------------------------------------
  const frameGroup = new THREE.Group();
  frameGroup.position.set(-1.32, 0, -0.54);
  frameGroup.rotation.y = 0.34;
  addContactShadow(frameGroup, 0, 0.004, 0.04, 0.54, 0.34, 0.42);

  const frameAssembly = new THREE.Group();
  frameAssembly.position.set(0, 0.31, 0);
  frameAssembly.rotation.x = -0.18;

  const frameBodyMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x3b2618,
      roughness: 0.48,
      metalness: 0.08,
      emissive: 0x000000,
    }),
  );
  const frameOuter = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.46, 0.58, 0.036, 3, 0.008)),
    frameBodyMat,
  );
  frameOuter.castShadow = !isSoftwareGl;
  frameAssembly.add(frameOuter);

  // Brass inner trim bezel
  const innerTrim = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.41, 0.53, 0.04, 2, 0.004)),
    brassMat,
  );
  frameAssembly.add(innerTrim);

  // Printed gallery certificate artwork
  const artMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: textures.frameArt,
      color: 0xffffff,
      roughness: 0.42,
      metalness: 0.04,
    }),
  );
  const artPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.38, 0.5)),
    artMat,
  );
  artPlane.position.z = 0.022;
  frameAssembly.add(artPlane);

  // Glass reflection sheet (no expensive extra pass on software WebGL)
  const glassMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.06,
      metalness: 0,
      transparent: true,
      opacity: isSoftwareGl ? 0.14 : 0.22,
      clearcoat: 1.0,
      depthWrite: false,
    }),
  );
  const glassPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(0.385, 0.505)),
    glassMat,
  );
  glassPlane.position.z = 0.025;
  glassPlane.renderOrder = 2;
  frameAssembly.add(glassPlane);

  // Rear easel kickstand
  const kickstand = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.12, 0.42, 0.02)),
    anodizedDarkMat,
  );
  kickstand.position.set(0, -0.07, -0.1);
  kickstand.rotation.x = 0.46;
  frameAssembly.add(kickstand);

  frameGroup.add(frameAssembly);

  const frameHitMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.54, 0.64, 0.26)),
    trackMat(new THREE.MeshBasicMaterial({ visible: false })),
  );
  frameHitMesh.position.set(0, 0.32, 0);
  frameHitMesh.layers.set(1);
  frameHitMesh.userData.hotspotId = 'labs';
  frameGroup.add(frameHitMesh);
  root.add(frameGroup);

  // --------------------------------------------------------------------------
  // 7b. Decorative Botanical Vignette: Two Small Potted Plants (Back-Left)
  // --------------------------------------------------------------------------
  const plantsGroup = new THREE.Group();

  const soilMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2b1d14,
      roughness: 0.96,
      metalness: 0,
    }),
  );
  const leafDarkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x2f5a3d,
      roughness: 0.48,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );
  const leafLightMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x457b52,
      roughness: 0.44,
      metalness: 0.02,
      side: THREE.DoubleSide,
    }),
  );
  const succulentMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x5c8a6c,
      roughness: 0.4,
      metalness: 0.02,
    }),
  );

  // Reusable sculpted leaf shape (ExtrudeGeometry with subtle bevel)
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, 0);
  leafShape.bezierCurveTo(0.028, 0.024, 0.032, 0.072, 0, 0.105);
  leafShape.bezierCurveTo(-0.032, 0.072, -0.028, 0.024, 0, 0);
  const leafGeo = trackGeo(
    new THREE.ExtrudeGeometry(leafShape, {
      depth: 0.004,
      bevelEnabled: true,
      bevelThickness: 0.002,
      bevelSize: 0.002,
      bevelSegments: 2,
    }),
  );

  // Pot 1: Matte Terracotta Planter + Leafy Stems (closer to back wall)
  const pot1Group = new THREE.Group();
  pot1Group.position.set(-1.66, 0, -0.68);
  addContactShadow(pot1Group, 0, 0.004, 0, 0.24, 0.24, 0.42);

  const terracottaMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xb86443,
      roughness: 0.82,
      metalness: 0.02,
    }),
  );
  const saucer1 = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.088, 0.078, 0.016, 24)),
    terracottaMat,
  );
  saucer1.position.y = 0.008;
  saucer1.receiveShadow = !isSoftwareGl;
  pot1Group.add(saucer1);

  const pot1Profile = [
    new THREE.Vector2(0, 0.014),
    new THREE.Vector2(0.062, 0.014),
    new THREE.Vector2(0.082, 0.132),
    new THREE.Vector2(0.088, 0.136),
    new THREE.Vector2(0.088, 0.152),
    new THREE.Vector2(0.074, 0.152),
    new THREE.Vector2(0.07, 0.128),
    new THREE.Vector2(0, 0.128),
  ];
  const pot1Body = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(pot1Profile, 26)),
    terracottaMat,
  );
  pot1Body.castShadow = !isSoftwareGl;
  pot1Body.receiveShadow = !isSoftwareGl;
  pot1Group.add(pot1Body);

  const soil1 = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.071, 0.068, 0.012, 20)),
    soilMat,
  );
  soil1.position.y = 0.132;
  pot1Group.add(soil1);

  const stemSpecs = [
    { angle: 0.1, tilt: 0.26, height: 0.11, scale: 1.0, light: false },
    { angle: 1.15, tilt: 0.34, height: 0.125, scale: 1.08, light: true },
    { angle: 2.2, tilt: 0.28, height: 0.1, scale: 0.92, light: false },
    { angle: 3.3, tilt: 0.38, height: 0.115, scale: 1.02, light: true },
    { angle: 4.35, tilt: 0.22, height: 0.135, scale: 0.96, light: true },
    { angle: 5.4, tilt: 0.32, height: 0.095, scale: 0.88, light: false },
  ];
  const stemGeo = trackGeo(new THREE.CylinderGeometry(0.004, 0.006, 1, 8));
  for (const spec of stemSpecs) {
    const branch = new THREE.Group();
    branch.position.set(0, 0.132, 0);
    branch.rotation.y = spec.angle;

    const stem = new THREE.Mesh(stemGeo, leafDarkMat);
    stem.scale.y = spec.height;
    stem.position.set(Math.sin(spec.tilt) * spec.height * 0.5, spec.height * 0.45, 0);
    stem.rotation.z = -spec.tilt;
    branch.add(stem);

    const leaf = new THREE.Mesh(leafGeo, spec.light ? leafLightMat : leafDarkMat);
    leaf.position.set(Math.sin(spec.tilt) * spec.height, spec.height * 0.88, 0);
    leaf.rotation.set(0.55, Math.PI / 2, -spec.tilt - 0.35);
    leaf.scale.setScalar(spec.scale);
    leaf.castShadow = !isSoftwareGl;
    branch.add(leaf);

    pot1Group.add(branch);
  }
  plantsGroup.add(pot1Group);

  // Pot 2: Glazed Cream Stoneware Planter + Succulent Rosette
  const pot2Group = new THREE.Group();
  pot2Group.position.set(-1.6, 0, -0.4);
  addContactShadow(pot2Group, 0, 0.004, 0, 0.2, 0.2, 0.4);

  const stonewareMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0xe6dfd3,
      roughness: 0.34,
      metalness: 0.02,
      clearcoat: 0.45,
      clearcoatRoughness: 0.25,
    }),
  );
  const pot2Profile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.056, 0),
    new THREE.Vector2(0.068, 0.03),
    new THREE.Vector2(0.068, 0.105),
    new THREE.Vector2(0.062, 0.11),
    new THREE.Vector2(0.058, 0.105),
    new THREE.Vector2(0.056, 0.09),
    new THREE.Vector2(0, 0.09),
  ];
  const pot2Body = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(pot2Profile, 26)),
    stonewareMat,
  );
  pot2Body.castShadow = !isSoftwareGl;
  pot2Body.receiveShadow = !isSoftwareGl;
  pot2Group.add(pot2Body);

  // Dark accent band near pot base
  const pot2Band = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.063, 0.059, 0.016, 24)),
    anodizedDarkMat,
  );
  pot2Band.position.y = 0.014;
  pot2Group.add(pot2Band);

  const soil2 = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.058, 0.056, 0.01, 20)),
    soilMat,
  );
  soil2.position.y = 0.095;
  pot2Group.add(soil2);

  // Two concentric rings of sculpted succulent petals
  const petalGeo = trackGeo(new THREE.ConeGeometry(0.016, 0.052, 6));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const petal = new THREE.Mesh(petalGeo, succulentMat);
    petal.position.set(Math.cos(a) * 0.032, 0.114, Math.sin(a) * 0.032);
    petal.rotation.order = 'YXZ';
    petal.rotation.y = -a + Math.PI / 2;
    petal.rotation.x = 0.92;
    petal.scale.set(1.15, 1, 0.45);
    petal.castShadow = !isSoftwareGl;
    pot2Group.add(petal);
  }
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.35;
    const petal = new THREE.Mesh(petalGeo, leafLightMat);
    petal.position.set(Math.cos(a) * 0.016, 0.122, Math.sin(a) * 0.016);
    petal.rotation.order = 'YXZ';
    petal.rotation.y = -a + Math.PI / 2;
    petal.rotation.x = 0.52;
    petal.scale.set(0.9, 0.82, 0.42);
    pot2Group.add(petal);
  }
  plantsGroup.add(pot2Group);
  root.add(plantsGroup);

  // --------------------------------------------------------------------------
  // 8. Hotspot 5: Retro Desk Phone & Steaming Espresso Mug ("contact")
  // --------------------------------------------------------------------------
  const contactGroup = new THREE.Group();
  contactGroup.position.set(1.18, 0, 0.22);

  // A. Retro-Modern Corded Desk Phone
  const phoneGroup = new THREE.Group();
  phoneGroup.position.set(0.06, 0, -0.1);
  phoneGroup.rotation.y = -0.32;
  addContactShadow(phoneGroup, 0, 0.004, 0, 0.42, 0.44, 0.44);

  const phoneShellMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xd9cbb8,
      roughness: 0.36,
      metalness: 0.08,
      emissive: 0x000000,
    }),
  );
  const phoneBase = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.28, 0.08, 0.31, 3, 0.015)),
    phoneShellMat,
  );
  phoneBase.position.y = 0.04;
  phoneBase.castShadow = !isSoftwareGl;
  phoneGroup.add(phoneBase);

  // Sloped dial deck
  const dialDeck = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.25, 0.055, 0.2, 3, 0.012)),
    phoneShellMat,
  );
  dialDeck.position.set(0, 0.082, 0.04);
  dialDeck.rotation.x = 0.24;
  phoneGroup.add(dialDeck);

  // Brass rotary / dial ring accent
  const dialRing = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.068, 0.072, 0.014, 24)),
    brassMat,
  );
  dialRing.position.set(0, 0.114, 0.052);
  dialRing.rotation.x = 0.24;
  phoneGroup.add(dialRing);

  const dialCenter = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.036, 0.036, 0.018, 20)),
    anodizedDarkMat,
  );
  dialCenter.position.set(0, 0.116, 0.052);
  dialCenter.rotation.x = 0.24;
  phoneGroup.add(dialCenter);

  // Handset resting across top cradle
  const handsetGroup = new THREE.Group();
  handsetGroup.position.set(0, 0.138, -0.078);
  const handsetBridge = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.28, 0.032, 0.052, 3, 0.012)),
    anodizedDarkMat,
  );
  handsetBridge.castShadow = !isSoftwareGl;
  handsetGroup.add(handsetBridge);

  for (const sx of [-0.115, 0.115]) {
    const cup = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.04, 0.032, 0.042, 18)),
      anodizedDarkMat,
    );
    cup.position.set(sx, -0.016, 0);
    handsetGroup.add(cup);
  }
  phoneGroup.add(handsetGroup);
  contactGroup.add(phoneGroup);

  // B. Hand-thrown Ceramic Coffee Mug + Cork Coaster + Rising Steam
  const mugGroup = new THREE.Group();
  mugGroup.position.set(-0.24, 0, 0.24);
  addContactShadow(mugGroup, 0, 0.004, 0, 0.26, 0.26, 0.42);

  // Cork coaster
  const corkMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x9b6d43,
      roughness: 0.92,
      metalness: 0,
    }),
  );
  const coaster = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.098, 0.102, 0.012, 24)),
    corkMat,
  );
  coaster.position.y = 0.006;
  coaster.receiveShadow = !isSoftwareGl;
  mugGroup.add(coaster);

  // Hollow ceramic mug via LatheGeometry
  const mugProfile = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.068, 0),
    new THREE.Vector2(0.076, 0.02),
    new THREE.Vector2(0.078, 0.165),
    new THREE.Vector2(0.072, 0.172),
    new THREE.Vector2(0.066, 0.165),
    new THREE.Vector2(0.062, 0.022),
    new THREE.Vector2(0, 0.022),
  ];
  const mugMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe8e2d5,
      roughness: 0.56,
      metalness: 0.02,
      emissive: 0x000000,
    }),
  );
  const mugBody = new THREE.Mesh(
    trackGeo(new THREE.LatheGeometry(mugProfile, 28)),
    mugMat,
  );
  mugBody.position.y = 0.012;
  mugBody.castShadow = !isSoftwareGl;
  mugGroup.add(mugBody);

  // Mug handle
  const handle = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.042, 0.011, 12, 24, Math.PI)),
    mugMat,
  );
  handle.rotation.z = -Math.PI / 2;
  handle.position.set(0.076, 0.098, 0);
  mugGroup.add(handle);

  // Espresso liquid disc
  const coffeeMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: 0x24130a,
      roughness: 0.12,
      metalness: 0,
      clearcoat: 0.9,
    }),
  );
  const coffeeDisc = new THREE.Mesh(
    trackGeo(new THREE.CircleGeometry(0.064, 24)),
    coffeeMat,
  );
  coffeeDisc.rotation.x = -Math.PI / 2;
  coffeeDisc.position.y = 0.156;
  mugGroup.add(coffeeDisc);

  // Rising steam particles
  const steamParticles: SteamParticle[] = [];
  for (let i = 0; i < 6; i++) {
    const sMat = trackMat(
      new THREE.SpriteMaterial({
        map: textures.steamSprite,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      }),
    );
    const sprite = new THREE.Sprite(sMat);
    const bx = (Math.random() - 0.5) * 0.035;
    const bz = (Math.random() - 0.5) * 0.035;
    sprite.position.set(bx, 0.19 + i * 0.05, bz);
    sprite.scale.setScalar(0.08 + i * 0.012);
    mugGroup.add(sprite);
    steamParticles.push({
      sprite,
      baseX: bx,
      baseZ: bz,
      phase: i * 1.15,
      speed: 0.28 + (i % 3) * 0.06,
    });
  }

  contactGroup.add(mugGroup);

  const contactHitMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.68, 0.28, 0.68)),
    trackMat(new THREE.MeshBasicMaterial({ visible: false })),
  );
  contactHitMesh.position.set(-0.08, 0.14, 0.08);
  contactHitMesh.layers.set(1);
  contactHitMesh.userData.hotspotId = 'contact';
  contactGroup.add(contactHitMesh);
  root.add(contactGroup);

  // --------------------------------------------------------------------------
  // 8b. Machined Aluminum Headphone Stand & Over-Ear Headphones (Back-Right)
  // --------------------------------------------------------------------------
  const headphoneGroup = new THREE.Group();
  headphoneGroup.position.set(1.58, 0, -0.2);
  headphoneGroup.rotation.y = -0.46;
  addContactShadow(headphoneGroup, 0, 0.004, 0, 0.28, 0.28, 0.42);

  const standBase = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.088, 0.095, 0.018, 24)),
    brushedAluminumMat,
  );
  standBase.position.y = 0.009;
  standBase.castShadow = !isSoftwareGl;
  headphoneGroup.add(standBase);

  const standStem = new THREE.Mesh(
    trackGeo(new THREE.CylinderGeometry(0.011, 0.014, 0.34, 14)),
    brushedAluminumMat,
  );
  standStem.position.y = 0.18;
  standStem.castShadow = !isSoftwareGl;
  headphoneGroup.add(standStem);

  const standCradle = new THREE.Mesh(
    trackGeo(new RoundedBoxGeometry(0.055, 0.02, 0.09, 2, 0.008)),
    walnutMat,
  );
  standCradle.position.y = 0.35;
  headphoneGroup.add(standCradle);

  // Over-ear headphone headband arc + earcups
  const headbandCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.088, 0.24, 0),
    new THREE.Vector3(-0.072, 0.34, 0),
    new THREE.Vector3(0, 0.375, 0),
    new THREE.Vector3(0.072, 0.34, 0),
    new THREE.Vector3(0.088, 0.24, 0),
  ]);
  const headbandMesh = new THREE.Mesh(
    trackGeo(new THREE.TubeGeometry(headbandCurve, 24, 0.014, 10, false)),
    anodizedDarkMat,
  );
  headbandMesh.castShadow = !isSoftwareGl;
  headphoneGroup.add(headbandMesh);

  for (const side of [-1, 1] as const) {
    const cupGroup = new THREE.Group();
    cupGroup.position.set(side * 0.086, 0.21, 0);
    cupGroup.rotation.z = side * -0.14;

    const cupShell = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.048, 0.044, 0.032, 20)),
      anodizedDarkMat,
    );
    cupShell.rotation.z = Math.PI / 2;
    cupShell.castShadow = !isSoftwareGl;
    cupGroup.add(cupShell);

    const cupTrim = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.042, 0.004, 8, 20)),
      brassMat,
    );
    cupTrim.rotation.y = Math.PI / 2;
    cupTrim.position.x = side * 0.016;
    cupGroup.add(cupTrim);

    const earPad = new THREE.Mesh(
      trackGeo(new THREE.TorusGeometry(0.04, 0.013, 10, 20)),
      leatherMat,
    );
    earPad.rotation.y = Math.PI / 2;
    earPad.position.x = -side * 0.016;
    cupGroup.add(earPad);

    headphoneGroup.add(cupGroup);
  }
  root.add(headphoneGroup);

  // --------------------------------------------------------------------------
  // 9. Lighting Rig (Warm Desk Lamp #FFB347 + Cool Rim #64748B + Studio Key)
  // --------------------------------------------------------------------------
  const hemi = new THREE.HemisphereLight(0x334155, 0x1c1917, 0.48);
  root.add(hemi);

  const key = new THREE.DirectionalLight(0x94a3b8, 0.55);
  key.position.set(-2.8, 3.6, 2.4);
  key.castShadow = !isSoftwareGl;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 11;
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 2.2;
  key.shadow.camera.bottom = -2.2;
  key.shadow.bias = -0.0005;
  key.shadow.normalBias = 0.02;
  root.add(key);

  const rim = new THREE.DirectionalLight(0x64748b, 1.45);
  rim.position.set(2.4, 2.5, -2.2);
  root.add(rim);

  const lampSpot = new THREE.SpotLight(0xffb347, 12.5, 5.8, Math.PI / 3.4, 0.65, 1.4);
  lampSpot.position.set(0.84, 1.02, -0.18);
  lampSpot.target.position.set(0.25, 0.02, 0.18);
  root.add(lampSpot.target);
  root.add(lampSpot);

  const monitorBacklight = new THREE.PointLight(0x64748b, 2.1, 3.6, 1.6);
  monitorBacklight.position.set(0, 0.88, -0.86);
  root.add(monitorBacklight);

  const slatBias = new THREE.PointLight(0xffb347, 4.8, 4.4, 1.5);
  slatBias.position.set(0, 1.08, -1.26);
  root.add(slatBias);

  // --------------------------------------------------------------------------
  // 10. Hotspot Registry
  // --------------------------------------------------------------------------
  const hotspots: Record<HotspotId, HotspotRig> = {
    projects: {
      id: 'projects',
      label: 'Projects Showcase',
      subtitle: 'Ultrawide Monitor · 4 Selected Works',
      group: monitorGroup,
      hitMesh: monHitMesh,
      emissiveMaterials: [monChassisMat],
      tooltipAnchor: new THREE.Vector3(0, 1.34, -0.58),
    },
    skills: {
      id: 'skills',
      label: 'Skills & Tech Stack',
      subtitle: '75% Mechanical Keyboard · Tools',
      group: keyboardGroup,
      hitMesh: kbHitMesh,
      emissiveMaterials: [kbCaseMat, mouseMat],
      tooltipAnchor: new THREE.Vector3(-0.08, 0.24, 0.34),
    },
    about: {
      id: 'about',
      label: 'About Me & Journey',
      subtitle: 'Leather Notebook · Bio & Experience',
      group: notebookGroup,
      hitMesh: nbHitMesh,
      emissiveMaterials: [leatherMat],
      tooltipAnchor: new THREE.Vector3(-1.16, 0.24, 0.25),
    },
    labs: {
      id: 'labs',
      label: 'Achievements & Labs',
      subtitle: 'Framed Plaque · Papers & R&D',
      group: frameGroup,
      hitMesh: frameHitMesh,
      emissiveMaterials: [frameBodyMat],
      tooltipAnchor: new THREE.Vector3(-1.32, 0.72, -0.52),
    },
    contact: {
      id: 'contact',
      label: 'Contact & Socials',
      subtitle: 'Desk Phone & Espresso · Say Hello',
      group: contactGroup,
      hitMesh: contactHitMesh,
      emissiveMaterials: [phoneShellMat, mugMat],
      tooltipAnchor: new THREE.Vector3(1.12, 0.36, 0.22),
    },
  };

  const hitMeshes = Object.values(hotspots).map((h) => h.hitMesh);

  return {
    root,
    hotspots,
    hitMeshes,
    lights: {
      hemi,
      key,
      rim,
      lampSpot,
      monitorBacklight,
      slatBias,
    },
    materials: {
      lampBulb: lampBulbMat,
      monitorScreen: monitorScreenMat,
      studioBackdrop: studioBackdropMat,
      slatBiasStrip: slatBiasMat,
    },
    steamParticles,
    monitorGroup,
    dispose: () => {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
    },
  };
}
