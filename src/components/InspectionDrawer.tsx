import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Send,
} from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import {
  CAMERA_PRESETS,
  ProjectCategoryFilter,
  filterProjects,
  getAdjacentHotspot,
  validateContactForm,
} from '../desk/cameraLogic';
import {
  CONTACT_DATA,
  HotspotId,
  LABS_DATA,
  PROFILE_DATA,
  SKILLS_DATA,
} from '../desk/portfolioData';

interface InspectionDrawerProps {
  activeHotspot: HotspotId | null;
  onBackToDesk: () => void;
  onNavigateHotspot: (id: HotspotId) => void;
}

const PROJECT_CATEGORIES: ProjectCategoryFilter[] = [
  'All',
  'WebGL & 3D',
  'Design Systems',
  'Full-Stack',
];

const SECTION_NUMBERS: Record<HotspotId, string> = {
  projects: '01',
  skills: '02',
  about: '03',
  labs: '04',
  contact: '05',
};

export function InspectionDrawer({
  activeHotspot,
  onBackToDesk,
  onNavigateHotspot,
}: InspectionDrawerProps) {
  const [projectCategory, setProjectCategory] =
    useState<ProjectCategoryFilter>('All');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    if (!activeHotspot) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onBackToDesk();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeHotspot, onBackToDesk]);

  if (!activeHotspot) return null;

  const preset = CAMERA_PRESETS[activeHotspot];
  const visibleProjects = filterProjects(projectCategory);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_DATA.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    } catch {
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = validateContactForm({
      name: formName,
      email: formEmail,
      message: formMessage,
    });
    if (!result.valid) {
      setFormErrors(result.errors as Record<string, string>);
      return;
    }
    setFormErrors({});
    setFormSubmitted(true);
    setFormName('');
    setFormEmail('');
    setFormMessage('');
  };

  return (
    <aside
      role="dialog"
      aria-label={preset.label}
      data-testid={`drawer-${activeHotspot}`}
      className="fixed inset-x-3 bottom-3 top-20 sm:inset-x-auto sm:top-20 sm:right-4 sm:bottom-4 sm:w-[470px] z-30 flex flex-col rounded-2xl glass-surface overflow-hidden"
    >
      {/* Drawer Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-900/10 dark:border-white/10">
        <button
          type="button"
          onClick={onBackToDesk}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900/6 hover:bg-slate-900/12 dark:bg-white/8 dark:hover:bg-white/14 text-slate-900 dark:text-slate-100 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Back to Desk</span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() =>
              onNavigateHotspot(getAdjacentHotspot(activeHotspot, 'prev'))
            }
            aria-label="Previous desk section"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-900/6 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400 px-1">
            {SECTION_NUMBERS[activeHotspot]} / 05
          </span>
          <button
            type="button"
            onClick={() =>
              onNavigateHotspot(getAdjacentHotspot(activeHotspot, 'next'))
            }
            aria-label="Next desk section"
            className="p-2 rounded-lg text-slate-600 hover:text-slate-950 hover:bg-slate-900/6 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto drawer-scroll px-5 py-5 space-y-6">
        <div className="space-y-1">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
            {preset.objectName}
          </p>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            {preset.hint}
          </h2>
        </div>

        {/* 01. PROJECTS */}
        {activeHotspot === 'projects' && (
          <div className="space-y-5">
            <div
              role="tablist"
              aria-label="Filter projects by category"
              className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-900/5 dark:bg-white/5"
            >
              {PROJECT_CATEGORIES.map((cat) => {
                const selected = projectCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setProjectCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      selected
                        ? 'bg-white text-slate-900 dark:bg-amber-400 dark:text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="divide-y divide-slate-900/10 dark:divide-white/10">
              {visibleProjects.map((proj) => (
                <article key={proj.id} className="py-5 first:pt-1 last:pb-1 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                    <span>{proj.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{proj.year}</span>
                    <span aria-hidden="true">·</span>
                    <span>{proj.role}</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-50">
                    {proj.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {proj.summary}
                  </p>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    {proj.impact}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                    {proj.stack.join(' · ')}
                  </p>
                  <div className="flex items-center gap-3 pt-1">
                    <a
                      href={proj.liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300 transition-colors whitespace-nowrap"
                    >
                      <span>Live Demo</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                    <a
                      href={proj.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-900/15 dark:border-white/15 text-slate-800 dark:text-slate-200 hover:bg-slate-900/5 dark:hover:bg-white/8 transition-colors whitespace-nowrap"
                    >
                      <span>GitHub</span>
                      <ExternalLink className="w-3 h-3" aria-hidden="true" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* 02. SKILLS & TECH STACK */}
        {activeHotspot === 'skills' && (
          <div className="divide-y divide-slate-900/10 dark:divide-white/10">
            {SKILLS_DATA.map((group) => (
              <section key={group.title} className="py-5 first:pt-1 last:pb-1 space-y-3">
                <div>
                  <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                    {group.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {group.focus}
                  </p>
                </div>
                <ul className="space-y-2.5">
                  {group.items.map((skill) => (
                    <li
                      key={skill.name}
                      className="flex items-start justify-between gap-3 py-1.5"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {skill.name}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {skill.context}
                        </p>
                      </div>
                      <span className="font-mono-tabular text-xs text-amber-700 dark:text-amber-400 shrink-0">
                        {skill.years}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}

        {/* 03. ABOUT ME & JOURNEY */}
        {activeHotspot === 'about' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                {PROFILE_DATA.location} · {PROFILE_DATA.availability}
              </p>
              {PROFILE_DATA.bio.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-sm leading-relaxed text-slate-700 dark:text-slate-300"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-900/10 dark:border-white/10">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                Experience
              </h3>
              <div className="space-y-4">
                {PROFILE_DATA.experience.map((exp) => (
                  <div key={exp.company} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {exp.role}
                      </p>
                      <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400 shrink-0">
                        {exp.period}
                      </span>
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      {exp.company} · {exp.location}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {exp.summary}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-900/10 dark:border-white/10">
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                Education
              </h3>
              <div className="space-y-2.5">
                {PROFILE_DATA.education.map((edu) => (
                  <div
                    key={edu.degree}
                    className="flex items-baseline justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                        {edu.degree}
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-400">
                        {edu.institution}
                      </p>
                    </div>
                    <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400 shrink-0">
                      {edu.year}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 04. ACHIEVEMENTS & LABS */}
        {activeHotspot === 'labs' && (
          <div className="divide-y divide-slate-900/10 dark:divide-white/10">
            {LABS_DATA.map((item) => (
              <article key={item.id} className="py-4 first:pt-1 last:pb-1 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono-tabular text-slate-500 dark:text-slate-400">
                  <span>{item.kind}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.venue}</span>
                  <span aria-hidden="true">·</span>
                  <span>{item.year}</span>
                </div>
                <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-50">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {item.summary}
                </p>
                <a
                  href={item.referenceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  <span>Read archive note</span>
                  <ExternalLink className="w-3 h-3" aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        )}

        {/* 05. CONTACT & SOCIAL LINKS */}
        {activeHotspot === 'contact' && (
          <div className="space-y-6">
            <div className="rounded-xl p-4 bg-slate-900/5 dark:bg-white/5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Direct Email
                  </p>
                  <p className="font-mono-tabular text-sm font-medium text-slate-900 dark:text-slate-100">
                    {CONTACT_DATA.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-900/10 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shrink-0"
                >
                  {copiedEmail ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {CONTACT_DATA.responseTime}
              </p>
            </div>

            {/* Social Links */}
            <div className="space-y-2.5">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-50">
                Social Channels
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CONTACT_DATA.socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-slate-900/10 dark:border-white/10 hover:bg-slate-900/5 dark:hover:bg-white/6 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {s.label}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {s.handle}
                      </p>
                    </div>
                    <ExternalLink
                      className="w-3.5 h-3.5 text-slate-400 shrink-0"
                      aria-hidden="true"
                    />
                  </a>
                ))}
              </div>
            </div>

            {/* Interactive Message Form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="space-y-3 pt-4 border-t border-slate-900/10 dark:border-white/10"
            >
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-50">
                Send a Quick Note
              </h3>

              {formSubmitted && (
                <div
                  role="status"
                  className="rounded-xl p-3 text-xs bg-amber-500/15 text-amber-900 dark:text-amber-200 border border-amber-500/30"
                >
                  Message prepared. Thank you for reaching out — Alex will reply shortly.
                </div>
              )}

              <div className="space-y-1">
                <label
                  htmlFor="drawer-contact-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Name
                </label>
                <input
                  id="drawer-contact-name"
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    setFormSubmitted(false);
                  }}
                  placeholder="Jordan Lee"
                  className="w-full rounded-xl px-3 py-2 text-sm bg-white/80 dark:bg-slate-900/80 border border-slate-900/15 dark:border-white/15 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {formErrors.name}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="drawer-contact-email"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Email
                </label>
                <input
                  id="drawer-contact-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => {
                    setFormEmail(e.target.value);
                    setFormSubmitted(false);
                  }}
                  placeholder="jordan@studio.dev"
                  className="w-full rounded-xl px-3 py-2 text-sm bg-white/80 dark:bg-slate-900/80 border border-slate-900/15 dark:border-white/15 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {formErrors.email && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {formErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="drawer-contact-message"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Message
                </label>
                <textarea
                  id="drawer-contact-message"
                  rows={3}
                  value={formMessage}
                  onChange={(e) => {
                    setFormMessage(e.target.value);
                    setFormSubmitted(false);
                  }}
                  placeholder="Tell me about your project or team..."
                  className="w-full rounded-xl px-3 py-2 text-sm bg-white/80 dark:bg-slate-900/80 border border-slate-900/15 dark:border-white/15 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {formErrors.message && (
                  <p className="text-xs text-rose-600 dark:text-rose-400">
                    {formErrors.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300 transition-colors"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Send Message</span>
              </button>
            </form>
          </div>
        )}
      </div>
    </aside>
  );
}
