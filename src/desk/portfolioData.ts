// ============================================================================
// [CUSTOMIZE] Personal Portfolio Content
// Edit the constants below to personalize your 3D Desk Portfolio.
// ============================================================================

export type HotspotId = 'projects' | 'skills' | 'about' | 'labs' | 'contact';
export type CameraSectionId = 'overview' | HotspotId;
export type LightingMode = 'day' | 'night';

export interface ProfileData {
  name: string;
  role: string;
  location: string;
  availability: string;
  tagline: string;
  bio: string[];
  experience: Array<{
    period: string;
    role: string;
    company: string;
    location: string;
    summary: string;
  }>;
  education: Array<{
    year: string;
    degree: string;
    institution: string;
  }>;
}

export interface ProjectItem {
  id: string;
  title: string;
  category: 'WebGL & 3D' | 'Design Systems' | 'Full-Stack';
  year: string;
  role: string;
  summary: string;
  impact: string;
  stack: string[];
  liveUrl: string;
  githubUrl: string;
}

export interface SkillGroup {
  title: string;
  focus: string;
  items: Array<{
    name: string;
    context: string;
    years: string;
  }>;
}

export interface LabItem {
  id: string;
  kind: 'Publication' | 'Certification' | 'R&D Experiment';
  title: string;
  venue: string;
  year: string;
  summary: string;
  referenceUrl: string;
}

export interface ContactData {
  email: string;
  handle: string;
  responseTime: string;
  socials: Array<{
    label: string;
    handle: string;
    url: string;
  }>;
}

// [CUSTOMIZE] Owner Profile
export const PROFILE_DATA: ProfileData = {
  name: 'Alex Mercer',
  role: 'Creative Technologist',
  location: 'San Francisco, CA',
  availability: 'Available for select advisory & Q2 builds',
  tagline:
    'Architecting tactile WebGL interfaces, physically grounded 3D tools, and resilient frontend systems.',
  bio: [
    'I build interactive software where spatial computing meets crisp editorial craft. Over the past eight years, I have led frontend and real-time graphics engineering across design tools, robotics telemetry consoles, and interactive product showcases.',
    'My work focuses on bridging low-level GPU ergonomics—custom GLSL shaders, procedural geometry, and frame-paced rendering—with accessible, keyboard-first web interfaces that remain fast on everyday hardware.',
  ],
  experience: [
    {
      period: '2023 — Present',
      role: 'Principal Creative Technologist',
      company: 'Atelier Spatial',
      location: 'San Francisco',
      summary:
        'Lead WebGL architecture and design engineering for interactive 3D configurators, CAD-to-browser viewers, and spatial storytelling platforms.',
    },
    {
      period: '2020 — 2023',
      role: 'Staff Frontend & Graphics Engineer',
      company: 'Kestrel Robotics',
      location: 'Seattle',
      summary:
        'Built real-time Three.js fleet visualization dashboards rendering 60Hz lidar point clouds and kinematic telemetry with React and WebWorkers.',
    },
    {
      period: '2018 — 2020',
      role: 'Senior UI / Motion Engineer',
      company: 'Monograph Studio',
      location: 'New York',
      summary:
        'Crafted bespoke interactive brand flagships, custom canvas typography engines, and modular component libraries.',
    },
  ],
  education: [
    {
      year: '2018',
      degree: 'M.S. Computer Graphics & Interactive Media',
      institution: 'Carnegie Mellon University',
    },
    {
      year: '2016',
      degree: 'B.S. Computer Science & Visual Design',
      institution: 'University of Washington',
    },
  ],
};

// [CUSTOMIZE] Projects Showcase (Ultrawide Monitor)
export const PROJECTS_DATA: ProjectItem[] = [
  {
    id: 'helios-cad',
    title: 'Helios Browser CAD Inspector',
    category: 'WebGL & 3D',
    year: '2026',
    role: 'Lead Architect',
    summary:
      'Zero-dependency spatial assembly viewer supporting procedural cross-sections, physically calibrated PBR finishes, and sub-millimeter measurement snapping directly in the browser.',
    impact: '42% faster design review sign-off across 140+ hardware teams',
    stack: ['Three.js', 'TypeScript', 'GLSL', 'WebWorkers', 'React'],
    liveUrl: 'https://example.com/helios-cad',
    githubUrl: 'https://github.com/example/helios-cad',
  },
  {
    id: 'sonora-acoustics',
    title: 'Sonora Acoustic Field Studio',
    category: 'WebGL & 3D',
    year: '2025',
    role: 'Graphics & Audio Engineer',
    summary:
      'Interactive 3D room acoustics simulator visualizing standing waves, early reflections, and ray-traced sound pressure fields paired with real-time Web Audio convolution.',
    impact: 'Featured in WebGL Showcase · 18k monthly active acoustic engineers',
    stack: ['WebGL2', 'Custom Shaders', 'Web Audio API', 'InstancedMesh'],
    liveUrl: 'https://example.com/sonora-acoustics',
    githubUrl: 'https://github.com/example/sonora-acoustics',
  },
  {
    id: 'vellum-tokens',
    title: 'Vellum Spatial Design System',
    category: 'Design Systems',
    year: '2025',
    role: 'Design Systems Lead',
    summary:
      'Accessible multi-theme UI foundation engineered for dense creative and telemetry applications, pairing WCAG AA contrast guards with composable drawer and canvas primitives.',
    impact: 'Adopted across 9 production web apps with 98% Lighthouse accessibility',
    stack: ['React 19', 'Tailwind CSS', 'TypeScript', 'Playwright'],
    liveUrl: 'https://example.com/vellum-tokens',
    githubUrl: 'https://github.com/example/vellum-tokens',
  },
  {
    id: 'meridian-telemetry',
    title: 'Meridian Orbital Telemetry Console',
    category: 'Full-Stack',
    year: '2024',
    role: 'Principal Frontend Engineer',
    summary:
      'High-throughput orbital pass planner and ground-station scheduler streaming live ephemeris tracks over WebSockets with zero main-thread frame drops.',
    impact: 'Sustains 60fps across 4,200 active orbital tracks on mid-tier laptops',
    stack: ['TypeScript', 'Node.js', 'WebSockets', 'Three.js', 'Canvas 2D'],
    liveUrl: 'https://example.com/meridian-telemetry',
    githubUrl: 'https://github.com/example/meridian-telemetry',
  },
];

// [CUSTOMIZE] Skills & Tech Stack (Mechanical Keyboard)
export const SKILLS_DATA: SkillGroup[] = [
  {
    title: 'Graphics & Spatial Web',
    focus: 'Real-time 3D pipelines, shaders, and GPU memory discipline',
    items: [
      { name: 'Three.js & WebGL2', context: 'Procedural PBR, InstancedMesh, PMREM IBL', years: '7 yrs' },
      { name: 'GLSL Shaders', context: 'Signed distance fields, post-processing, custom lighting', years: '6 yrs' },
      { name: 'WebGPU & TSL', context: 'Compute buffers and node-based materials', years: '2 yrs' },
      { name: 'HTML5 Canvas 2D', context: 'Dynamic procedural textures and HUD telemetry', years: '8 yrs' },
    ],
  },
  {
    title: 'Frontend Architecture',
    focus: 'Accessible UI overlays, state machines, and motion systems',
    items: [
      { name: 'TypeScript', context: 'Strict domain modeling and zero-allocation loops', years: '8 yrs' },
      { name: 'React & Next.js', context: 'Isolated WebGL refs, concurrent UI rendering', years: '8 yrs' },
      { name: 'Tailwind CSS', context: 'Design tokens, dual-theme contrast architecture', years: '5 yrs' },
      { name: 'Web Accessibility', context: 'Keyboard navigation, ARIA landmarks, 2D fallbacks', years: '6 yrs' },
    ],
  },
  {
    title: 'Systems & Tooling',
    focus: 'Deterministic testing, asset pipelines, and edge services',
    items: [
      { name: 'Node.js & Express', context: 'Streaming APIs, WebSocket relays, build tooling', years: '7 yrs' },
      { name: 'Playwright & node:test', context: 'Automated visual checks and pure logic suites', years: '4 yrs' },
      { name: 'Blender & glTF', context: 'Mesh optimization, Draco/KTX2 compression', years: '5 yrs' },
      { name: 'Web Audio API', context: 'Procedural tactile UI feedback & spatial sound', years: '4 yrs' },
    ],
  },
];

// [CUSTOMIZE] Achievements, Publications & Labs (Framed Desk Badge)
export const LABS_DATA: LabItem[] = [
  {
    id: 'pub-pbr-browser',
    kind: 'Publication',
    title: 'Deterministic Software-WebGL Pacing for Rich Spatial UI',
    venue: 'Journal of Web Graphics & Craft',
    year: '2026',
    summary:
      'Architectural patterns for pairing physically based studio reflections and smooth damped camera rigs with CPU-paced frame synchronization.',
    referenceUrl: 'https://example.com/papers/webgl-pacing',
  },
  {
    id: 'lab-woodgrain',
    kind: 'R&D Experiment',
    title: 'Procedural Hardwood & Brushed Anisotropy Generator',
    venue: 'Atelier Open Lab',
    year: '2025',
    summary:
      'Zero-asset procedural canvas noise pipeline producing matched albedo, roughness, and bump maps for walnut, oak, and machined brass surfaces.',
    referenceUrl: 'https://example.com/labs/procedural-pbr',
  },
  {
    id: 'cert-khronos',
    kind: 'Certification',
    title: 'Real-Time Physically Based Rendering & glTF Asset Specialist',
    venue: 'Graphics Engineering Guild',
    year: '2024',
    summary:
      'Verified competency in microfacet BRDF calibration, linear-to-sRGB color pipelines, and GPU draw-call batching.',
    referenceUrl: 'https://example.com/certs/pbr-specialist',
  },
  {
    id: 'lab-kinematics',
    kind: 'R&D Experiment',
    title: 'Second-Order Spring Camera Choreography',
    venue: 'Atelier Open Lab',
    year: '2024',
    summary:
      'Frame-rate independent exponential damping curves that transition effortlessly between OrbitControls exploration and focused inspection presets.',
    referenceUrl: 'https://example.com/labs/spring-cameras',
  },
];

// [CUSTOMIZE] Contact & Social Links (Coffee Mug & Retro Desk Phone)
export const CONTACT_DATA: ContactData = {
  email: 'alex.mercer@atelierspatial.dev',
  handle: '@alexmercer_3d',
  responseTime: 'Typically responds within 24 hours',
  socials: [
    { label: 'GitHub', handle: 'github.com/alexmercer-3d', url: 'https://github.com' },
    { label: 'LinkedIn', handle: 'linkedin.com/in/alexmercer-3d', url: 'https://linkedin.com' },
    { label: 'X / Twitter', handle: '@alexmercer_3d', url: 'https://x.com' },
    { label: 'Read.cv', handle: 'read.cv/alexmercer', url: 'https://read.cv' },
  ],
};
