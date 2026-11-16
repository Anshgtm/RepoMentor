import { useState } from 'react'
import {
  ExternalLink,
  Github,
  Star,
  GitFork,
  CircleAlert,
  Boxes,
  Code2,
  Database,
  Route,
  Sparkles,
  CheckCircle2,
  Layers,
  Cpu,
  Users,
  FolderTree,
  ShieldAlert,
  LoaderCircle,
  FileCode,
  Check,
  ChevronDown,
  ChevronRight,
  Workflow,
  Compass,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react'
import type {
  GithubSummary as GithubSummaryData,
  ProjectOverview,
  StructuredOverview,
  DirectoryGroup,
} from '../../types/api'

export function GithubSummary({
  summary,
  loading,
  error,
}: {
  summary?: GithubSummaryData
  loading: boolean
  error?: unknown
}) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)

  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#141416] p-8 text-center space-y-3 my-6 shadow-sm">
        <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono text-xs">
          <LoaderCircle size={18} className="animate-spin" />
          <span>Analyzing repository &amp; extracting architectural evidence...</span>
        </div>
        <p className="text-xs text-zinc-500">
          Scanning source files, manifests, routes, and documentation without executing code
        </p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6 my-6 space-y-2">
        <div className="flex items-center gap-2 text-red-400 font-semibold text-sm">
          <CircleAlert size={16} />
          <span>Unable to load repository understanding</span>
        </div>
        <p className="text-xs text-zinc-400 font-mono">
          {apiErrorMessage(error, 'Could not retrieve repository details from GitHub API.')}
        </p>
      </div>
    )
  }

  if (!summary) return null

  const structured = summary.structured_overview
  const overview = summary.project_overview
  const analysis = summary.analysis

  return (
    <div className="space-y-6 my-6">
      {/* Top Repository Identity Bar */}
      <div className="rounded-lg border border-white/[0.08] bg-[#141416] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/[0.04] border border-white/10 flex items-center justify-center text-white shrink-0">
              <Github size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[3px]">
                  Repository Overview
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {summary.description_source === 'readme' ? 'Verified from README' : 'Inferred via Source Scan'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                {summary.owner && summary.name ? `${summary.owner}/${summary.name}` : 'Repository Overview'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {summary.stars !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-zinc-300">
                <Star size={13} className="text-amber-400" />
                {summary.stars.toLocaleString()}
              </span>
            )}
            {summary.forks !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-zinc-300">
                <GitFork size={13} className="text-zinc-400" />
                {summary.forks.toLocaleString()}
              </span>
            )}
            {summary.language && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300">
                {summary.language}
              </span>
            )}
            {summary.default_branch && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-zinc-400">
                {summary.default_branch}
              </span>
            )}
            {summary.html_url && (
              <a
                href={summary.html_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] bg-[#1a1d28] hover:bg-[#222634] border border-white/10 hover:border-white/20 text-xs font-medium text-white transition-all shadow-sm"
              >
                <span>GitHub</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Code-Grounded Evidence Stats */}
        {analysis && <AnalysisEvidenceBar analysis={analysis} />}
      </div>

      {/* PART 1: STRUCTURED 5-PART REPOSITORY OVERVIEW (Replacing giant text paragraph) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass size={16} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Beginner-Friendly Project Orientation
            </h3>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            Plain English · Grounded in code evidence
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Question 1: What does this project do? */}
          <StructuredQuestionCard
            badge="1. Core Purpose"
            title="What does this project do?"
            icon={<Sparkles size={15} className="text-emerald-400" />}
            content={structured?.what_it_does.content || summary.project_description || summary.plain_language}
            isVerified={structured?.what_it_does.is_verified ?? (summary.description_source === 'readme')}
            evidence={structured?.what_it_does.evidence}
          />

          {/* Question 2: What problem does it solve? */}
          <StructuredQuestionCard
            badge="2. Problem Solved"
            title="What problem does it solve?"
            icon={<ShieldAlert size={15} className="text-amber-400" />}
            content={
              structured?.problem_it_solves.content ||
              overview?.problem_it_solves.content ||
              'Eliminates manual complexity, provides modular structure, and streamlines development operations.'
            }
            isVerified={structured?.problem_it_solves.is_verified ?? false}
            evidence={structured?.problem_it_solves.evidence}
          />

          {/* Question 3: Who is it built for? */}
          <StructuredQuestionCard
            badge="3. Target Users"
            title="Who is it built for?"
            icon={<Users size={15} className="text-pink-400" />}
            content={
              structured?.who_it_is_for.content ||
              overview?.target_users.content ||
              `Developers, software teams, and students building upon ${summary.language || 'modern software'}.`
            }
            isVerified={structured?.who_it_is_for.is_verified ?? false}
            evidence={structured?.who_it_is_for.evidence}
          />

          {/* Question 4: How does it work? */}
          <div className="rounded-lg border border-white/[0.08] bg-[#141416] p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Workflow size={15} className="text-blue-400" />
                <h4 className="text-xs font-semibold text-white">4. How does it work?</h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                Execution Flow
              </span>
            </div>

            <div className="space-y-2 pt-1 text-xs text-zinc-300">
              {(structured?.how_it_works.steps || [
                `1. Starts in ${analysis?.entry_points[0] || 'the main entrypoint'}, loading configuration and ports.`,
                `2. Matches incoming requests through ${analysis?.routes_and_endpoints.length || 'active'} route handlers.`,
                `3. Processes business logic and verifies data against schemas.`,
                `4. Returns formatted responses and updates user state.`,
              ]).map((step, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-2 rounded-[4px] bg-[#0c0d12] border border-white/[0.04]">
                  <span className="w-4 h-4 rounded-[3px] bg-zinc-800 text-emerald-400 border border-zinc-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-zinc-300 text-[12px] leading-relaxed">{step.replace(/^\d+\.\s*/, '')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Question 5: What technologies does it use? (Frontend + Backend separated) */}
        <div className="rounded-lg border border-white/[0.08] bg-[#141416] p-5 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <Cpu size={15} className="text-purple-400" />
              <h4 className="text-xs font-semibold text-white">5. What technologies does it use?</h4>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">
              Frontend &amp; Backend Categorized
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Frontend */}
            <div className="space-y-2 p-3 rounded-[6px] bg-[#0d0e14] border border-white/[0.04]">
              <span className="text-[10px] font-mono uppercase text-emerald-400 tracking-wider font-semibold block">
                Frontend (User Interface)
              </span>
              {structured?.technologies.frontend.length ? (
                <div className="space-y-1.5">
                  {structured.technologies.frontend.map((t, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-semibold text-zinc-200">{t.name}</span>
                      <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">{t.purpose}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">No dedicated frontend framework detected in scanned files.</p>
              )}
            </div>

            {/* Backend */}
            <div className="space-y-2 p-3 rounded-[6px] bg-[#0d0e14] border border-white/[0.04]">
              <span className="text-[10px] font-mono uppercase text-blue-400 tracking-wider font-semibold block">
                Backend (Server &amp; Services)
              </span>
              {structured?.technologies.backend.length ? (
                <div className="space-y-1.5">
                  {structured.technologies.backend.map((t, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-semibold text-zinc-200">{t.name}</span>
                      <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">{t.purpose}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">{summary.language || 'Standard language modules'}</p>
              )}
            </div>

            {/* Database & Infra */}
            <div className="space-y-2 p-3 rounded-[6px] bg-[#0d0e14] border border-white/[0.04]">
              <span className="text-[10px] font-mono uppercase text-amber-400 tracking-wider font-semibold block">
                Database &amp; Infrastructure
              </span>
              {structured?.technologies.database_or_infra.length ? (
                <div className="space-y-1.5">
                  {structured.technologies.database_or_infra.map((t, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-semibold text-zinc-200">{t.name}</span>
                      <p className="text-[11px] text-zinc-400 leading-tight mt-0.5">{t.purpose}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-500 italic">Local or file-based persistence</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PART 2 & 5: UPGRADED INFORMATION CARDS (Expandable & Linear/Raycast Styled) */}
      {overview && (
        <section className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-white tracking-tight">
                Architectural Breakdown &amp; Analysis Cards
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <span>{showTechnicalDetails ? 'Collapse Technical Details' : 'Expand Technical Details'}</span>
              <ChevronDown size={14} className={`transform transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Problem it solves */}
            <OverviewCard
              icon={<ShieldAlert size={16} className="text-amber-400" />}
              title="1. Problem It Solves"
              content={overview.problem_it_solves.content}
              bullets={overview.problem_it_solves.bullets}
              showDetails={showTechnicalDetails}
            />

            {/* 2. Key features (Actual capabilities, not raw endpoints) */}
            <OverviewCard
              icon={<Sparkles size={16} className="text-emerald-400" />}
              title="2. Key Features"
              content={overview.key_features.content}
              bullets={overview.key_features.bullets}
              isFeatureList
              showDetails={showTechnicalDetails}
            />

            {/* 3. Technology stack */}
            <OverviewCard
              icon={<Cpu size={16} className="text-blue-400" />}
              title="3. Technology Stack"
              content={overview.technology_stack.content}
              bullets={overview.technology_stack.bullets}
              isTechStack
              showDetails={showTechnicalDetails}
            />

            {/* 4. Architecture & Component Relationships */}
            <OverviewCard
              icon={<Layers size={16} className="text-purple-400" />}
              title="4. Architecture &amp; Component Flow"
              content={overview.architecture.content}
              bullets={overview.architecture.bullets}
              showDetails={showTechnicalDetails}
            />

            {/* 5. How it works */}
            <OverviewCard
              icon={<Route size={16} className="text-emerald-400" />}
              title="5. How It Works"
              content={overview.how_it_works.content}
              bullets={overview.how_it_works.bullets}
              showDetails={showTechnicalDetails}
            />

            {/* 6. Project structure (Grouped by Directory - Part 3) */}
            <div className="rounded-lg border border-white/[0.08] bg-[#141416] p-5 space-y-3.5 shadow-sm">
              <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.06]">
                <FolderTree size={16} className="text-teal-400" />
                <h4 className="text-sm font-semibold text-white tracking-tight">
                  6. Project Structure (Grouped by Directory)
                </h4>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                Directories organized by their functional role in the codebase:
              </p>

              {analysis?.directory_groups && analysis.directory_groups.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {analysis.directory_groups.slice(0, 6).map((grp, idx) => (
                    <div key={idx} className="p-2.5 rounded-[4px] bg-[#0c0d12] border border-white/[0.04] space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-semibold text-emerald-300">{grp.directory}/</span>
                        <span className="text-[10px] font-mono text-zinc-500">{grp.count} files</span>
                      </div>
                      <p className="text-[11px] text-zinc-400">{grp.role}</p>
                      {showTechnicalDetails && grp.sample_files.length > 0 && (
                        <div className="pt-1 text-[10px] font-mono text-zinc-500 truncate">
                          Samples: {grp.sample_files.map((f) => f.split('/').pop()).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="space-y-1.5 pt-1">
                  {overview.project_structure.bullets?.map((b, i) => (
                    <li key={i} className="text-xs text-zinc-400 font-mono">
                      {b}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}

      {/* README Excerpt */}
      {summary.readme_excerpt && (
        <div className="rounded-lg border border-white/[0.08] bg-[#141416] p-4 text-xs font-mono text-zinc-400 space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">
            Official README Excerpt
          </span>
          <p className="text-zinc-300 leading-relaxed font-sans italic">
            "{summary.readme_excerpt}"
          </p>
        </div>
      )}
    </div>
  )
}

function StructuredQuestionCard({
  badge,
  title,
  icon,
  content,
  isVerified,
  evidence,
}: {
  badge: string
  title: string
  icon: React.ReactNode
  content: string
  isVerified: boolean
  evidence?: string
}) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#141416] p-5 space-y-3 flex flex-col justify-between">
      <div className="space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            {icon}
            <h4 className="text-xs font-semibold text-white">{title}</h4>
          </div>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isVerified
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                : 'bg-zinc-800 text-zinc-400 border-white/10'
            }`}
          >
            {isVerified ? 'Verified Fact' : 'Inferred Analysis'}
          </span>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed font-sans">{content}</p>
      </div>

      {evidence && (
        <div className="pt-2 border-t border-white/[0.04] text-[11px] font-mono text-zinc-500 flex items-center gap-1.5">
          <Check size={11} className={isVerified ? 'text-emerald-400' : 'text-zinc-500'} />
          <span className="truncate">{evidence}</span>
        </div>
      )}
    </div>
  )
}

function AnalysisEvidenceBar({
  analysis,
}: {
  analysis: NonNullable<GithubSummaryData['analysis']>
}) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-2 border-t border-white/[0.06]">
      <div className="rounded-[4px] bg-[#0c0d12] border border-white/[0.04] p-2.5 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <Boxes size={13} className="text-emerald-400" />
          <span>Files Analyzed</span>
        </div>
        <div className="font-mono text-base font-bold text-white">
          {analysis.files_analyzed.length}
        </div>
      </div>

      <div className="rounded-[4px] bg-[#0c0d12] border border-white/[0.04] p-2.5 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <Code2 size={13} className="text-blue-400" />
          <span>Entry Points</span>
        </div>
        <div
          className="font-mono text-xs font-semibold text-zinc-200 truncate"
          title={analysis.entry_points.join(', ')}
        >
          {analysis.entry_points.length ? analysis.entry_points[0] : 'None detected'}
        </div>
      </div>

      <div className="rounded-[4px] bg-[#0c0d12] border border-white/[0.04] p-2.5 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <Route size={13} className="text-purple-400" />
          <span>Routes &amp; APIs</span>
        </div>
        <div className="font-mono text-base font-bold text-white">
          {analysis.routes_and_endpoints.length}
        </div>
      </div>

      <div className="rounded-[4px] bg-[#0c0d12] border border-white/[0.04] p-2.5 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <Database size={13} className="text-amber-400" />
          <span>Data Models</span>
        </div>
        <div
          className="font-mono text-xs font-semibold text-zinc-200 truncate"
          title={analysis.data_models.join(', ')}
        >
          {analysis.data_models.length ? `${analysis.data_models.length} schemas` : 'None detected'}
        </div>
      </div>
    </div>
  )
}

function OverviewCard({
  icon,
  title,
  content,
  bullets,
  isFeatureList = false,
  isTechStack = false,
  showDetails = false,
}: {
  icon: React.ReactNode
  title: string
  content: string
  bullets?: string[]
  isFeatureList?: boolean
  isTechStack?: boolean
  showDetails?: boolean
}) {
  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#141416] p-5 space-y-3.5 shadow-sm">
      <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.06]">
        {icon}
        <h4 className="text-sm font-semibold text-white tracking-tight">{title}</h4>
      </div>

      <p className="text-xs text-zinc-300 leading-relaxed font-sans">{content}</p>

      {isTechStack && bullets && bullets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {bullets.map((tech, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2.5 py-1 rounded-[4px] bg-blue-500/10 border border-blue-500/20 text-blue-300 font-mono text-[11px] font-medium"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {isFeatureList && bullets && bullets.length > 0 && (
        <ul className="space-y-2 pt-1">
          {bullets.slice(0, showDetails ? bullets.length : 5).map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-zinc-200 font-sans">
              <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {!isTechStack && !isFeatureList && bullets && bullets.length > 0 && (
        <ul className="space-y-2 pt-1">
          {bullets.slice(0, showDetails ? bullets.length : 4).map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300 font-sans">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    return (
      (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || fallback
    )
  }
  return fallback
}
