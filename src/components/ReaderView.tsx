import { ArrowLeft, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { ProjectCategoryFilter, filterProjects } from '../desk/cameraLogic';
import {
  CONTACT_DATA,
  LABS_DATA,
  PROFILE_DATA,
  SKILLS_DATA,
} from '../desk/portfolioData';

interface ReaderViewProps {
  onReturnTo3D: () => void;
}

const CATEGORIES: ProjectCategoryFilter[] = [
  'All',
  'WebGL & 3D',
  'Design Systems',
  'Full-Stack',
];

export function ReaderView({ onReturnTo3D }: ReaderViewProps) {
  const [category, setCategory] = useState<ProjectCategoryFilter>('All');
  const projects = filterProjects(category);

  return (
    <main
      data-testid="reader-view"
      className="min-h-screen bg-[#f4f1ea] dark:bg-[#0f131a] text-slate-900 dark:text-slate-100 pt-24 pb-20 px-4 sm:px-8 transition-colors"
    >
      <div className="mx-auto max-w-5xl space-y-16">
        {/* Hero Intro */}
        <section className="space-y-6 pb-10 border-b border-slate-900/10 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs font-mono-tabular text-amber-700 dark:text-amber-400">
              2D Reader View · {PROFILE_DATA.location} · {PROFILE_DATA.availability}
            </p>
            <button
              type="button"
              onClick={onReturnTo3D}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Return to 3D Desk</span>
            </button>
          </div>

          <h1
            className="font-display text-3xl sm:text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 max-w-3xl"
            style={{ textWrap: 'balance' }}
          >
            {PROFILE_DATA.tagline}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {PROFILE_DATA.bio.map((p, idx) => (
              <p
                key={idx}
                className="text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300"
              >
                {p}
              </p>
            ))}
          </div>
        </section>

        {/* 01. Selected Projects */}
        <section className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                01. Selected Works
              </p>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-50">
                Projects Showcase
              </h2>
            </div>

            <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-900/5 dark:bg-white/5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    category === cat
                      ? 'bg-white text-slate-900 dark:bg-amber-400 dark:text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((proj) => (
              <article
                key={proj.id}
                className="rounded-2xl p-6 bg-white/75 dark:bg-slate-900/65 border border-slate-900/10 dark:border-white/10 space-y-3"
              >
                <div className="flex items-center gap-2 text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                  <span>{proj.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{proj.year}</span>
                  <span aria-hidden="true">·</span>
                  <span>{proj.role}</span>
                </div>
                <h3 className="font-display text-xl font-semibold text-slate-900 dark:text-slate-50">
                  {proj.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {proj.summary}
                </p>
                <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                  {proj.impact}
                </p>
                <p className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                  {proj.stack.join(' · ')}
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <a
                    href={proj.liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300 transition-colors"
                  >
                    <span>Live Demo</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                  <a
                    href={proj.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-900/15 dark:border-white/15 hover:bg-slate-900/5 dark:hover:bg-white/8 transition-colors"
                  >
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* 02. Technical Stack */}
        <section className="space-y-6 pt-8 border-t border-slate-900/10 dark:border-white/10">
          <div>
            <p className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
              02. Technical Stack
            </p>
            <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-50">
              Skills &amp; Engineering Tools
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SKILLS_DATA.map((group) => (
              <div
                key={group.title}
                className="rounded-2xl p-5 bg-white/75 dark:bg-slate-900/65 border border-slate-900/10 dark:border-white/10 space-y-4"
              >
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                    {group.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {group.focus}
                  </p>
                </div>
                <ul className="space-y-2.5">
                  {group.items.map((item) => (
                    <li key={item.name} className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {item.name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {item.context}
                        </p>
                      </div>
                      <span className="font-mono-tabular text-xs text-amber-700 dark:text-amber-400 shrink-0">
                        {item.years}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* 03. Experience & Labs */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-slate-900/10 dark:border-white/10">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                03. Journey
              </p>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-50">
                Experience &amp; Education
              </h2>
            </div>
            <div className="space-y-5">
              {PROFILE_DATA.experience.map((exp) => (
                <div key={exp.company} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {exp.role}
                    </p>
                    <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400">
                      {exp.period}
                    </span>
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    {exp.company} · {exp.location}
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {exp.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                04. Research &amp; Credentials
              </p>
              <h2 className="font-display text-2xl font-semibold text-slate-900 dark:text-slate-50">
                Publications &amp; Labs
              </h2>
            </div>
            <div className="space-y-4">
              {LABS_DATA.map((lab) => (
                <div key={lab.id} className="space-y-1">
                  <p className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                    {lab.kind} · {lab.venue} · {lab.year}
                  </p>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                    {lab.title}
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {lab.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 05. Contact */}
        <footer className="pt-8 border-t border-slate-900/10 dark:border-white/10 flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <p className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
              Let&apos;s build something tactile.
            </p>
            <p className="font-mono-tabular text-sm text-slate-600 dark:text-slate-300">
              {CONTACT_DATA.email}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {CONTACT_DATA.socials.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-medium text-slate-700 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white underline underline-offset-4"
              >
                {s.label}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </main>
  );
}
