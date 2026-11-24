import { useCallback, useEffect, useState } from 'react';
import { DeskCanvas } from './components/DeskCanvas';
import { InspectionDrawer } from './components/InspectionDrawer';
import { LoadingScreen } from './components/LoadingScreen';
import { ReaderView } from './components/ReaderView';
import { TopHud } from './components/TopHud';
import { CAMERA_PRESETS, HOTSPOT_ORDER, isHotspotId } from './desk/cameraLogic';
import {
  CameraSectionId,
  HotspotId,
  LightingMode,
} from './desk/portfolioData';

const MOBILE_NAV_ITEMS: Array<{ id: CameraSectionId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  ...HOTSPOT_ORDER.map((id) => ({
    id,
    label: CAMERA_PRESETS[id].label,
  })),
];

export default function App() {
  const [activeSection, setActiveSection] = useState<CameraSectionId>('overview');
  const [lightingMode, setLightingMode] = useState<LightingMode>('night');
  const [isReaderMode, setIsReaderMode] = useState(false);
  const [loadProgress, setLoadProgress] = useState(10);
  const [sceneReady, setSceneReady] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('autostart') === '1';
    }
    return false;
  });
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  // Sync Tailwind dark class on <html> with lightingMode
  useEffect(() => {
    document.documentElement.classList.toggle('dark', lightingMode === 'night');
  }, [lightingMode]);

  const handleLoadProgress = useCallback((progress: number, ready: boolean) => {
    setLoadProgress(progress);
    if (ready) {
      setSceneReady(true);
    }
  }, []);

  const handleContextError = useCallback(() => {
    setWebglUnavailable(true);
    setIsReaderMode(true);
    setSceneReady(true);
  }, []);

  const handleSelectSection = useCallback((section: CameraSectionId) => {
    setActiveSection(section);
  }, []);

  const handleSelectHotspot = useCallback((id: HotspotId) => {
    setActiveSection(id);
  }, []);

  const handleBackToDesk = useCallback(() => {
    setActiveSection('overview');
  }, []);

  const handleToggleLighting = useCallback(() => {
    setLightingMode((prev) => (prev === 'night' ? 'day' : 'night'));
  }, []);

  const handleToggleReaderMode = useCallback(() => {
    setIsReaderMode((prev) => !prev);
  }, []);

  const activeHotspot: HotspotId | null = isHotspotId(activeSection)
    ? activeSection
    : null;

  return (
    <div
      data-lighting={lightingMode}
      data-section={activeSection}
      className="relative w-full h-full overflow-hidden bg-[#ddd6cc] dark:bg-[#0f131a]"
    >
      <TopHud
        activeSection={activeSection}
        lightingMode={lightingMode}
        isReaderMode={isReaderMode}
        onSelectSection={handleSelectSection}
        onToggleLighting={handleToggleLighting}
        onToggleReaderMode={handleToggleReaderMode}
      />

      {isReaderMode ? (
        <div className="w-full h-full overflow-y-auto">
          <ReaderView
            onReturnTo3D={() => {
              if (!webglUnavailable) {
                setIsReaderMode(false);
              }
            }}
          />
        </div>
      ) : (
        <main className="relative w-full h-full">
          <DeskCanvas
            activeSection={activeSection}
            lightingMode={lightingMode}
            onSelectHotspot={handleSelectHotspot}
            onLoadProgress={handleLoadProgress}
            onContextError={handleContextError}
          />

          {/* Subtle Overview Hint Pill (Desktop, vanishes when inspecting a desk object) */}
          {activeSection === 'overview' && (
            <div className="pointer-events-none hidden lg:flex fixed bottom-5 inset-x-0 z-20 justify-center px-4">
              <div className="glass-surface rounded-xl px-4 py-2 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-3">
                <span>Drag to orbit</span>
                <span aria-hidden="true">·</span>
                <span>Scroll to zoom</span>
                <span aria-hidden="true">·</span>
                <span>Click any desk object to inspect</span>
              </div>
            </div>
          )}

          {/* Compact Mobile Quick-Navigation Dock (only when drawer is closed) */}
          {!activeHotspot && (
            <nav
              aria-label="Mobile desk presets"
              className="lg:hidden fixed bottom-3 inset-x-3 z-20 flex justify-center"
            >
              <div className="glass-surface rounded-xl p-1 flex items-center gap-1 overflow-x-auto max-w-full">
                {MOBILE_NAV_ITEMS.map((item) => {
                  const active = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSection(item.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                        active
                          ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          )}

          <InspectionDrawer
            activeHotspot={activeHotspot}
            onBackToDesk={handleBackToDesk}
            onNavigateHotspot={handleSelectHotspot}
          />
        </main>
      )}

      <LoadingScreen progress={loadProgress} visible={!sceneReady} />
    </div>
  );
}
