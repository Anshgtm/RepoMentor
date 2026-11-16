import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import {
  CheckCircle2,
  FileText,
  Gauge,
  GitBranch,
  ShieldCheck,
  RefreshCw,
  Cpu,
  Layers,
  ArrowLeft,
  Github,
  ExternalLink,
  BookOpen,
  Route,
  FolderTree,
  Sparkles,
  Sliders,
  Bot,
  Brain,
  MessageSquareQuote,
  Database,
} from 'lucide-react'
import { api } from '../lib/api'
import { useGithubSummary, useGuide, useWorkspace } from '../hooks/useWorkspaces'
import { Shell } from '../components/layout/Shell'
import { Architecture } from '../components/workspace/Architecture'
import { GuideView } from '../components/workspace/GuideView'
import { SourceEditor } from '../components/workspace/SourceEditor'
import { GithubSummary } from '../components/workspace/GithubSummary'
import { GithubExplorer } from '../components/workspace/GithubExplorer'
import { ImportantPaths } from '../components/workspace/ImportantPaths'
import { RagAssistant } from '../components/workspace/RagAssistant'
import type { SourceFile } from '../types/api'

export function WorkspacePage() {
  const { id = '' } = useParams()
  const client = useQueryClient()
  const [activeTab, setActiveTab] = useState<'overview' | 'explorer' | 'routes' | 'guide' | 'rag'>('overview')

  const [files, setFiles] = useState<SourceFile[]>([
    {
      file_path: 'README.md',
      file_content: '# Project\n\nDescribe your repository architecture and dependencies here.',
    },
  ])
  const { data: workspace } = useWorkspace(id)
  const guide = useGuide(id, workspace?.state === 'guide_generated')
  const githubSummary = useGithubSummary(id, Boolean(workspace?.github_repository_url))

  const save = useMutation({
    mutationFn: () => api.put(`/repository-workspaces/${id}/source-snapshot`, { files }),
    onSuccess: () => client.invalidateQueries({ queryKey: ['workspace', id] }),
  })

  const generate = useMutation({
    mutationFn: () => api.post(`/repository-workspaces/${id}/guide`),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['workspace', id] })
      client.invalidateQueries({ queryKey: ['guide', id] })
      setActiveTab('guide')
    },
  })

  const hasGuide = workspace?.state === 'guide_generated' && Boolean(guide.data)

  if (!workspace) {
    return (
      <Shell>
        <div className="mx-auto max-w-7xl px-6 py-24 text-center space-y-3">
          <div className="inline-flex items-center gap-2 font-mono text-xs text-emerald-400">
            <RefreshCw size={15} className="animate-spin" />
            <span>Loading workspace architecture...</span>
          </div>
          <p className="text-xs text-zinc-500 font-sans">
            Retrieving cached models, repository trees, and metadata
          </p>
        </div>
      </Shell>
    )
  }

  const routeCount = githubSummary.data?.analysis?.routes_and_endpoints.length || 0
  const fileCount = githubSummary.data?.analysis?.files_analyzed.length || workspace.source_file_count

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Breadcrumb Bar */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={13} />
            <span>All Workspaces</span>
          </Link>
        </div>

        {/* Workspace Hero Header */}
        <div className="rounded-xl border border-white/[0.08] bg-[#141416] p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[3px] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span>{workspace.state.replaceAll('_', ' ')}</span>
                </span>
                <span className="text-zinc-600 font-mono text-xs">/</span>
                <span className="font-mono text-xs text-zinc-400 font-medium">
                  ID: {id.slice(0, 8)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                <span>{workspace.repository_name}</span>
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400 pt-1">
                {workspace.github_repository_url ? (
                  <a
                    href={workspace.github_repository_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors"
                  >
                    <Github size={13} />
                    <span className="truncate max-w-xs">{workspace.github_repository_url}</span>
                    <ExternalLink size={11} className="text-zinc-500" />
                  </a>
                ) : (
                  <span>Local source snapshot</span>
                )}
                <span className="text-zinc-600">·</span>
                <span>Active workspace session</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {workspace.state === 'source_ready' && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
                  onClick={() => generate.mutate()}
                  disabled={generate.isPending}
                >
                  <Cpu size={14} className={generate.isPending ? 'animate-spin' : ''} />
                  <span>{generate.isPending ? 'Analyzing AST...' : 'Generate Contributor Guide'}</span>
                </button>
              )}

              {hasGuide && (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[4px] bg-[#1a1d28] hover:bg-[#232736] border border-white/10 hover:border-white/20 text-white text-xs font-medium transition-all shadow-sm cursor-pointer"
                  onClick={() => generate.mutate()}
                  disabled={generate.isPending}
                >
                  <RefreshCw size={13} className={generate.isPending ? 'animate-spin text-emerald-400' : ''} />
                  <span>Regenerate Guide</span>
                </button>
              )}

              {workspace.github_repository_url && (
                <a
                  href={workspace.github_repository_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[4px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white text-xs font-medium transition-all"
                >
                  <Github size={13} />
                  <span className="hidden sm:inline">GitHub</span>
                  <ExternalLink size={11} className="text-zinc-400" />
                </a>
              )}
            </div>
          </div>

          {/* Real Repository Metrics Grid (No fake statistics) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-white/[0.08]">
            <MetricCard
              icon={<FileText size={15} className="text-emerald-400" />}
              label="Source Files"
              value={fileCount.toString().padStart(2, '0')}
              detail="Clean filtered index"
              onClick={() => setActiveTab('explorer')}
            />
            <MetricCard
              icon={<Cpu size={15} className="text-blue-400" />}
              label="Primary Language"
              value={githubSummary.data?.language || workspace.language || 'Multi-stack'}
              detail="Detected from code"
            />
            <MetricCard
              icon={<Route size={15} className="text-purple-400" />}
              label="API Endpoints"
              value={routeCount.toString().padStart(2, '0')}
              detail="Routes detected"
              onClick={() => setActiveTab('routes')}
            />
            <MetricCard
              icon={<Database size={15} className="text-amber-400" />}
              label="Data Models"
              value={(githubSummary.data?.analysis?.data_models.length || 0).toString().padStart(2, '0')}
              detail="Schemas & entities"
            />
            <MetricCard
              icon={<CheckCircle2 size={15} className="text-emerald-400" />}
              label="Guide Status"
              value={hasGuide ? 'Ready' : 'Pending'}
              detail={hasGuide ? 'Guide compiled' : 'Awaiting snapshot'}
              onClick={() => setActiveTab('guide')}
            />
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0b0c12] border border-white/10 rounded-lg overflow-x-auto">
          <TabButton
            active={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            icon={<Sparkles size={14} />}
            label="Overview & Architecture"
          />
          {workspace.github_repository_url && (
            <TabButton
              active={activeTab === 'explorer'}
              onClick={() => setActiveTab('explorer')}
              icon={<FolderTree size={14} />}
              label="Code Explorer"
            />
          )}
          <TabButton
            active={activeTab === 'routes'}
            onClick={() => setActiveTab('routes')}
            icon={<Route size={14} />}
            label="API & Execution Paths"
            badge={routeCount ? routeCount.toString() : undefined}
          />
          <TabButton
            active={activeTab === 'guide'}
            onClick={() => setActiveTab('guide')}
            icon={<BookOpen size={14} />}
            label={hasGuide ? 'Contributor Guide' : 'Source Snapshot & Guide'}
          />
          <TabButton
            active={activeTab === 'rag'}
            onClick={() => setActiveTab('rag')}
            icon={<Bot size={14} className="text-emerald-400" />}
            label="Ask RepoMentor AI (RAG)"
            badge="Free AI"
          />
        </div>

        {/* Error Alert */}
        {generate.isError && (
          <div
            className="p-4 border border-red-500/30 bg-red-500/10 text-red-300 text-xs font-mono rounded-md"
            role="alert"
          >
            Unable to synthesize the architecture guide. Verify that files contain valid source text and retry.
          </div>
        )}

        {/* Tab 1: Overview & Insights */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick AI Spotlight Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-gradient-to-r from-emerald-950/40 via-[#141416] to-[#141416] border border-emerald-500/20 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <Brain size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Ask RepoMentor AI (RAG)</span>
                    <span className="text-[10px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Free &amp; Unlimited</span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Ask questions, get the simplest conceptual breakdown, and cite exact source lines instantly.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('rag')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[4px] bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors shrink-0 cursor-pointer shadow-sm"
              >
                <Bot size={14} />
                <span>Ask AI Now</span>
              </button>
            </div>

            <GithubSummary
              summary={githubSummary.data}
              loading={githubSummary.isLoading}
              error={githubSummary.error}
            />

            {/* If no github repo, show architecture graph */}
            {!workspace.github_repository_url && (
              <Architecture fileCount={files.length} guideReady={hasGuide} />
            )}
          </div>
        )}

        {/* Tab 2: Code Explorer */}
        {activeTab === 'explorer' && workspace.github_repository_url && (
          <div>
            <GithubExplorer workspaceId={id} />
          </div>
        )}

        {/* Tab 3: API & Execution Paths */}
        {activeTab === 'routes' && (
          <div>
            <ImportantPaths
              analysis={githubSummary.data?.analysis}
              loading={githubSummary.isLoading}
              error={githubSummary.error}
            />
          </div>
        )}

        {/* Tab 4: Contributor Guide & Setup */}
        {activeTab === 'guide' && (
          <div>
            {hasGuide ? (
              <GuideView data={guide.data!} />
            ) : (
              <div className="grid gap-6 lg:grid-cols-[1.35fr_.8fr]">
                <SourceEditor
                  files={files}
                  onChange={setFiles}
                  onSave={() => save.mutate()}
                  saving={save.isPending}
                />
                <Architecture
                  fileCount={workspace.source_file_count || files.length}
                  guideReady={false}
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Free RAG AI Assistant (Zero Token Cost, Unlimited Q&A) */}
        {activeTab === 'rag' && (
          <div>
            <RagAssistant workspace={workspace} />
          </div>
        )}
      </div>
    </Shell>
  )
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-lg bg-[#12141c] border border-white/[0.06] p-3.5 flex flex-col justify-between transition-all ${
        onClick ? 'hover:border-white/20 hover:bg-[#161824] cursor-pointer' : ''
      }`}
    >
      <div className="flex items-center justify-between text-zinc-400 mb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
        <span>{icon}</span>
      </div>
      <div>
        <div className="text-base font-bold text-white font-mono">{value}</div>
        <div className="text-[11px] text-zinc-400 mt-0.5">{detail}</div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
  badge?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
        active
          ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/40 shadow-sm'
          : 'text-zinc-400 hover:text-white hover:bg-white/[0.05]'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge && (
        <span
          className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
            active ? 'bg-emerald-500/30 text-emerald-200' : 'bg-white/10 text-zinc-300'
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  )
}
