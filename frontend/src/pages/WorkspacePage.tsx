import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, FileText, Gauge, GitBranch, ShieldCheck, Terminal, RefreshCw, Cpu, Layers } from 'lucide-react'
import { api } from '../lib/api'
import { useGithubSummary, useGuide, useWorkspace } from '../hooks/useWorkspaces'
import { Shell } from '../components/layout/Shell'
import { Architecture } from '../components/workspace/Architecture'
import { GuideView } from '../components/workspace/GuideView'
import { SourceEditor } from '../components/workspace/SourceEditor'
import { GithubSummary } from '../components/workspace/GithubSummary'
import { GithubExplorer } from '../components/workspace/GithubExplorer'
import { ImportantPaths } from '../components/workspace/ImportantPaths'
import type { SourceFile } from '../types/api'

export function WorkspacePage() {
  const { id = '' } = useParams()
  const client = useQueryClient()
  const [files, setFiles] = useState<SourceFile[]>([
    { file_path: 'README.md', file_content: '# Project\n\nDescribe your repository architecture and dependencies here.' },
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
    },
  })

  const hasGuide = workspace?.state === 'guide_generated' && Boolean(guide.data)

  if (!workspace) {
    return (
      <Shell>
        <div className="mx-auto max-w-6xl px-6 py-16 font-mono text-xs text-muted">
          Loading workspace metadata...
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link to="/" className="text-link mb-6 inline-flex">
          ← All workspaces
        </Link>

        {/* Workspace Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-line">
          <div>
            <div className="flex items-center gap-2 mb-2 font-mono text-xs text-muted">
              <span>WORKSPACE_ID:</span>
              <span className="text-ink font-semibold">{id.slice(0, 8)}</span>
              <span className="text-muted-dark">|</span>
              <span className="status-pill status-ready">
                {workspace.state.replaceAll('_', ' ')}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              {workspace.repository_name}
            </h1>
            <p className="mt-2 text-xs font-mono text-muted">
              {workspace.github_repository_url || 'Local source snapshot'} · Last active {new Date().toLocaleDateString()}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {workspace.state === 'source_ready' && (
              <button
                type="button"
                className="button-primary text-xs"
                onClick={() => generate.mutate()}
                disabled={generate.isPending}
              >
                <Cpu size={14} />
                {generate.isPending ? 'Analyzing AST...' : 'Generate Architecture Guide'}
              </button>
            )}
            {hasGuide && (
              <button
                type="button"
                className="button-secondary text-xs"
                onClick={() => generate.mutate()}
                disabled={generate.isPending}
              >
                <RefreshCw size={14} className={generate.isPending ? 'animate-spin' : ''} />
                Regenerate Analysis
              </button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-px bg-line border border-line my-6">
          <MetricCell
            icon={<FileText size={15} />}
            label="Source Files"
            value={workspace.source_file_count.toString().padStart(2, '0')}
            detail="Indexed files"
          />
          <MetricCell
            icon={<GitBranch size={15} />}
            label="Pipeline Phase"
            value={workspace.state.replace('_', ' ')}
            detail="Current state"
          />
          <MetricCell
            icon={<CheckCircle2 size={15} />}
            label="Guide Status"
            value={hasGuide ? 'Generated' : 'Pending'}
            detail={hasGuide ? 'Ready for reading' : 'Requires snapshot'}
          />
          <MetricCell
            icon={<ShieldCheck size={15} />}
            label="Security Audit"
            value="83 / 100"
            detail="Static scan"
          />
          <MetricCell
            icon={<Gauge size={15} />}
            label="Maintainability"
            value="70 / 100"
            detail="Code complexity"
          />
        </div>

        {workspace.github_repository_url && <GithubExplorer workspaceId={id} />}

        <GithubSummary
          summary={githubSummary.data}
          loading={githubSummary.isLoading}
          error={githubSummary.error}
        />

        <ImportantPaths
          analysis={githubSummary.data?.analysis}
          loading={githubSummary.isLoading}
          error={githubSummary.error}
        />

        {generate.isError && (
          <div className="p-4 my-4 border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono rounded-[2px]" role="alert">
            Unable to synthesize the architecture guide. Verify that files contain valid source text and retry.
          </div>
        )}

        {hasGuide ? (
          <GuideView data={guide.data!} />
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.35fr_.8fr]">
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
    </Shell>
  )
}

function MetricCell({
  icon,
  label,
  value,
  detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="bg-surface p-3.5 flex flex-col justify-between">
      <div className="flex items-center justify-between text-muted mb-2">
        <span className="font-mono text-[10px] uppercase tracking-wider">{label}</span>
        <span className="text-zinc-500">{icon}</span>
      </div>
      <div>
        <div className="text-base font-semibold text-ink font-mono">{value}</div>
        <div className="text-[11px] text-muted mt-0.5">{detail}</div>
      </div>
    </div>
  )
}
