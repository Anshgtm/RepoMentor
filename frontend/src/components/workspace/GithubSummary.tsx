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
} from 'lucide-react'
import type { GithubSummary as GithubSummaryData, ProjectOverview, ProjectOverviewSection } from '../../types/api'

export function GithubSummary({
  summary,
  loading,
  error,
}: {
  summary?: GithubSummaryData
  loading: boolean
  error?: unknown
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-white/10 bg-[#0f1118] p-8 text-center space-y-3 my-6 shadow-sm">
        <div className="flex items-center justify-center gap-2 text-emerald-400 font-mono text-xs">
          <LoaderCircle size={18} className="animate-spin" />
          <span>Analyzing GitHub repository & extracting architectural evidence...</span>
        </div>
        <p className="text-xs text-zinc-500">
          Parsing manifest files, entry points, endpoints, and documentation
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

  return (
    <div className="space-y-6 my-6">
      {/* Top Repository Identity Bar */}
      <div className="rounded-lg border border-white/10 bg-[#11131c] p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md bg-white/[0.05] border border-white/10 flex items-center justify-center text-white shadow-inner">
              <Github size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[2px]">
                  Project Understanding
                </span>
                <span className="text-[11px] font-mono text-zinc-500">
                  {summary.description_source === 'readme' ? 'Verified from README' : 'Inferred via Static Scan'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight mt-1">
                {summary.owner && summary.name ? `${summary.owner}/${summary.name}` : 'Repository Overview'}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {summary.stars !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-zinc-300">
                <Star size={13} className="text-amber-400" />
                {summary.stars.toLocaleString()}
              </span>
            )}
            {summary.forks !== undefined && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-zinc-300">
                <GitFork size={13} className="text-zinc-400" />
                {summary.forks.toLocaleString()}
              </span>
            )}
            {summary.language && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-300">
                {summary.language}
              </span>
            )}
            {summary.default_branch && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-white/[0.03] border border-white/[0.08] text-xs font-mono text-zinc-400">
                {summary.default_branch}
              </span>
            )}
            {summary.html_url && (
              <a
                href={summary.html_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[3px] bg-[#1a1d28] hover:bg-[#222634] border border-white/10 hover:border-white/20 text-xs font-medium text-white transition-all shadow-sm"
              >
                <span>GitHub</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        {/* Project Description Banner */}
        <div className="rounded-md bg-[#0b0c12] border border-white/[0.06] p-4 text-sm text-zinc-200 leading-relaxed font-sans">
          <p>{summary.project_description || summary.plain_language}</p>
        </div>

        {/* Code-Grounded Evidence Stats */}
        {summary.analysis && <AnalysisEvidenceBar analysis={summary.analysis} />}
      </div>

      {/* Structured Overview Cards */}
      {summary.project_overview ? (
        <ProjectOverviewDashboard overview={summary.project_overview} />
      ) : null}

      {/* Excerpt if present */}
      {summary.readme_excerpt && (
        <div className="rounded-lg border border-white/[0.08] bg-[#0c0d14] p-4 text-xs font-mono text-zinc-400 space-y-1.5">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold block">
            README Excerpt
          </span>
          <p className="italic text-zinc-300 leading-relaxed font-sans">
            "{summary.readme_excerpt}"
          </p>
        </div>
      )}

      {summary.reason && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono">
          <CircleAlert size={14} className="flex-shrink-0" />
          <span>{summary.reason}</span>
        </div>
      )}
    </div>
  )
}

function AnalysisEvidenceBar({ analysis }: { analysis: NonNullable<GithubSummaryData['analysis']> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 border-t border-white/[0.06]">
      <div className="rounded-[4px] bg-white/[0.02] border border-white/[0.05] p-2.5 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <Boxes size={13} className="text-emerald-400" />
          <span>Files Analyzed</span>
        </div>
        <div className="font-mono text-base font-bold text-white">
          {analysis.files_analyzed.length}
        </div>
      </div>

      <div className="rounded-[4px] bg-white/[0.02] border border-white/[0.05] p-2.5 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <Code2 size={13} className="text-blue-400" />
          <span>Entry Points</span>
        </div>
        <div className="font-mono text-xs font-semibold text-zinc-200 truncate" title={analysis.entry_points.join(', ')}>
          {analysis.entry_points.length ? analysis.entry_points.join(', ') : 'Not detected'}
        </div>
      </div>

      <div className="rounded-[4px] bg-white/[0.02] border border-white/[0.05] p-2.5 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <Route size={13} className="text-purple-400" />
          <span>Routes & APIs</span>
        </div>
        <div className="font-mono text-base font-bold text-white">
          {analysis.routes_and_endpoints.length}
        </div>
      </div>

      <div className="rounded-[4px] bg-white/[0.02] border border-white/[0.05] p-2.5 space-y-1">
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400">
          <Database size={13} className="text-amber-400" />
          <span>Data Models</span>
        </div>
        <div className="font-mono text-xs font-semibold text-zinc-200 truncate" title={analysis.data_models.join(', ')}>
          {analysis.data_models.length ? analysis.data_models.join(', ') : 'Not detected'}
        </div>
      </div>
    </div>
  )
}

function ProjectOverviewDashboard({ overview }: { overview: ProjectOverview }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Problem It Solves */}
      {overview.problem_it_solves && (
        <OverviewCard
          icon={<ShieldAlert size={16} className="text-amber-400" />}
          title={overview.problem_it_solves.title}
          content={overview.problem_it_solves.content}
          bullets={overview.problem_it_solves.bullets}
          borderAccent="hover:border-amber-500/30"
        />
      )}

      {/* 2. Key Features */}
      {overview.key_features && (
        <OverviewCard
          icon={<Sparkles size={16} className="text-emerald-400" />}
          title={overview.key_features.title}
          content={overview.key_features.content}
          bullets={overview.key_features.bullets}
          isFeatureList
          borderAccent="hover:border-emerald-500/30"
        />
      )}

      {/* 3. Technology Stack */}
      {overview.technology_stack && (
        <OverviewCard
          icon={<Cpu size={16} className="text-blue-400" />}
          title={overview.technology_stack.title}
          content={overview.technology_stack.content}
          bullets={overview.technology_stack.bullets}
          isTechStack
          borderAccent="hover:border-blue-500/30"
        />
      )}

      {/* 4. Architecture */}
      {overview.architecture && (
        <OverviewCard
          icon={<Layers size={16} className="text-purple-400" />}
          title={overview.architecture.title}
          content={overview.architecture.content}
          bullets={overview.architecture.bullets}
          borderAccent="hover:border-purple-500/30"
        />
      )}

      {/* 5. How It Works */}
      {overview.how_it_works && (
        <OverviewCard
          icon={<Route size={16} className="text-emerald-400" />}
          title={overview.how_it_works.title}
          content={overview.how_it_works.content}
          bullets={overview.how_it_works.bullets}
          borderAccent="hover:border-emerald-500/30"
        />
      )}

      {/* 6. Project Structure */}
      {overview.project_structure && (
        <OverviewCard
          icon={<FolderTree size={16} className="text-teal-400" />}
          title={overview.project_structure.title}
          content={overview.project_structure.content}
          bullets={overview.project_structure.bullets}
          isStructure
          borderAccent="hover:border-teal-500/30"
        />
      )}

      {/* 7. Target Users */}
      {overview.target_users && (
        <OverviewCard
          icon={<Users size={16} className="text-pink-400" />}
          title={overview.target_users.title}
          content={overview.target_users.content}
          bullets={overview.target_users.bullets}
          borderAccent="hover:border-pink-500/30"
        />
      )}

      {/* 8. Setup & Execution */}
      {overview.setup_and_execution && (
        <OverviewCard
          icon={<FileCode size={16} className="text-indigo-400" />}
          title={overview.setup_and_execution.title}
          content={overview.setup_and_execution.content}
          bullets={overview.setup_and_execution.bullets}
          borderAccent="hover:border-indigo-500/30"
        />
      )}
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
  isStructure = false,
  borderAccent = '',
}: {
  icon: React.ReactNode
  title: string
  content: string
  bullets?: string[]
  isFeatureList?: boolean
  isTechStack?: boolean
  isStructure?: boolean
  borderAccent?: string
}) {
  return (
    <div
      className={`rounded-lg border border-white/10 bg-[#11131c] p-5 space-y-3.5 transition-all duration-200 shadow-sm ${borderAccent}`}
    >
      <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.06]">
        {icon}
        <h3 className="font-heading text-sm font-semibold text-white tracking-tight">
          {title}
        </h3>
      </div>

      <p className="text-xs text-zinc-300 leading-relaxed font-sans">{content}</p>

      {/* Tech Stack rendered as Pills */}
      {isTechStack && bullets && bullets.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {bullets.map((tech, idx) => (
            <span
              key={idx}
              className="inline-flex items-center px-2.5 py-1 rounded-[3px] bg-blue-500/10 border border-blue-500/25 text-blue-300 font-mono text-[11px] font-medium"
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Features rendered with Checkmarks */}
      {isFeatureList && bullets && bullets.length > 0 && (
        <ul className="space-y-2 pt-1">
          {bullets.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-zinc-200 font-sans">
              <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Structure rendered with Code Pills */}
      {isStructure && bullets && bullets.length > 0 && (
        <ul className="space-y-1.5 pt-1">
          {bullets.map((item, idx) => {
            const [file, ...rest] = item.split(':')
            return (
              <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300 font-sans">
                <span className="font-mono text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-[2px] flex-shrink-0">
                  {file}
                </span>
                <span className="text-zinc-400 text-[11px] mt-0.5">{rest.join(':')}</span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Standard bullet items */}
      {!isTechStack && !isFeatureList && !isStructure && bullets && bullets.length > 0 && (
        <ul className="space-y-1.5 pt-1">
          {bullets.map((bullet, idx) => (
            <li key={idx} className="flex items-start gap-2 text-xs text-zinc-300 font-sans">
              <span className="w-1.5 h-1.5 rounded-[1px] bg-emerald-400 mt-1.5 flex-shrink-0" />
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
