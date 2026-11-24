import { PROFILE_DATA } from '../desk/portfolioData';

interface LoadingScreenProps {
  progress: number;
  visible: boolean;
}

export function LoadingScreen({ progress, visible }: LoadingScreenProps) {
  if (!visible) return null;

  const clamped = Math.max(0, Math.min(100, Math.round(progress)));

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="loading-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0f131a] text-slate-100 px-6 transition-opacity duration-300"
    >
      <div className="w-full max-w-sm space-y-5">
        <div className="space-y-1.5">
          <p className="text-xs font-mono-tabular tracking-widest uppercase text-amber-400/90">
            Interactive Workspace
          </p>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-slate-50">
            {PROFILE_DATA.name}
          </h1>
          <p className="text-sm text-slate-400">
            Preparing procedural desk materials &amp; lighting
          </p>
        </div>

        <div className="space-y-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-200 ease-out"
              style={{ width: `${clamped}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-mono-tabular text-slate-400">
            <span>Initializing 3D studio</span>
            <span>{clamped}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
