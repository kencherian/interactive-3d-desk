import { BookOpen, Moon, Sun } from 'lucide-react';
import { CAMERA_PRESETS, HOTSPOT_ORDER } from '../desk/cameraLogic';
import {
  CameraSectionId,
  LightingMode,
  PROFILE_DATA,
} from '../desk/portfolioData';

interface TopHudProps {
  activeSection: CameraSectionId;
  lightingMode: LightingMode;
  isReaderMode: boolean;
  onSelectSection: (section: CameraSectionId) => void;
  onToggleLighting: () => void;
  onToggleReaderMode: () => void;
}

const NAV_ITEMS: Array<{ id: CameraSectionId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  ...HOTSPOT_ORDER.map((id) => ({
    id,
    label: CAMERA_PRESETS[id].label,
  })),
];

export function TopHud({
  activeSection,
  lightingMode,
  isReaderMode,
  onSelectSection,
  onToggleLighting,
  onToggleReaderMode,
}: TopHudProps) {
  const isNight = lightingMode === 'night';

  return (
    <header className="fixed top-3 inset-x-3 z-30 pointer-events-none flex flex-col gap-2">
      <div className="mx-auto w-full max-w-[1380px] pointer-events-auto glass-surface rounded-2xl px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Left: Brand Name & Title */}
        <button
          type="button"
          onClick={() => {
            if (isReaderMode) onToggleReaderMode();
            onSelectSection('overview');
          }}
          className="text-left shrink-0 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-lg px-1 py-0.5"
        >
          <span className="font-display text-sm sm:text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100 block leading-tight">
            {PROFILE_DATA.name}
          </span>
          <span className="hidden sm:block text-xs text-slate-600 dark:text-slate-400 leading-tight">
            {PROFILE_DATA.role}
          </span>
        </button>

        {/* Center: Camera Preset Navigation (desktop/tablet inline) */}
        {!isReaderMode && (
          <nav
            aria-label="Desk section presets"
            className="hidden lg:flex items-center gap-1 rounded-xl bg-slate-900/5 dark:bg-white/5 p-1"
          >
            {NAV_ITEMS.map((item) => {
              const active = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectSection(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
                    active
                      ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-sm'
                      : 'text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Right: Day/Night Lighting & 2D Reader Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleLighting}
            aria-label={
              isNight
                ? 'Switch to Daylight lighting mode'
                : 'Switch to Late Night coding mode'
            }
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/8 dark:hover:bg-white/14 text-slate-800 dark:text-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            {isNight ? (
              <Moon className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
            )}
            <span>{isNight ? 'Late Night' : 'Daylight'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleReaderMode}
            aria-pressed={isReaderMode}
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              isReaderMode
                ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950'
                : 'bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/8 dark:hover:bg-white/14 text-slate-800 dark:text-slate-100'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{isReaderMode ? '3D Desk' : '2D Reader'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
