import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Bookmark, Clock3, FileText, Github, ListChecks, NotebookPen, Plus, ArrowUpRight, FolderGit2 } from 'lucide-react'
import { Shell } from '../components/layout/Shell'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { useAppState } from '../state/AppState'
import type { Workspace } from '../types/api'

type PersonalState = {
  bookmarkedFiles: string[]
  bookmarkedIssues: string[]
  notes: string
  recent: string[]
  progress: Record<string, number>
}

const initialState: PersonalState = {
  bookmarkedFiles: [],
  bookmarkedIssues: [],
  notes: '',
  recent: [],
  progress: {},
}

export function MyWorkspacePage() {
  const { state } = useAppState()
  const { data: workspaces = [], isLoading } = useWorkspaces()
  const storageKey = `repomentor-personal-${state.authEmail || 'guest'}`

  const [personal, setPersonal] = useState<PersonalState>(() => {
    try {
      return { ...initialState, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }
    } catch {
      return initialState
    }
  })

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(personal))
  }, [personal, storageKey])

  const recent = useMemo(
    () =>
      personal.recent
        .map((id) => workspaces.find((workspace) => workspace.id === id))
        .filter(Boolean) as Workspace[],
    [personal.recent, workspaces]
  )

  if (!state.authEmail) {
    return <Navigate to="/login" state={{ from: '/my-workspace' }} replace />
  }

  return (
    <Shell>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">
              Workspace Overview
            </h1>
            <p className="mt-1 text-sm text-muted">
              Active repository sessions, architectural notes, and indexed files for {state.authEmail}.
            </p>
          </div>
          <Link className="button-primary text-xs" to="/new">
            <Plus size={14} /> New Repository Analysis
          </Link>
        </div>

        {/* 2x2 Grid of developer sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Saved Repositories */}
          <DashboardCard
            icon={<Github size={16} />}
            title="Indexed Repositories"
            count={workspaces.length}
          >
            {isLoading ? (
              <div className="p-6 text-center text-xs font-mono text-muted">
                Loading repository index...
              </div>
            ) : workspaces.length > 0 ? (
              <div className="divide-y divide-line">
                {workspaces.map((workspace) => (
                  <Link
                    key={workspace.id}
                    to={`/workspace/${workspace.id}`}
                    onClick={() =>
                      setPersonal((current) => ({
                        ...current,
                        recent: [
                          workspace.id,
                          ...current.recent.filter((id) => id !== workspace.id),
                        ].slice(0, 5),
                      }))
                    }
                    className="p-3 flex items-center justify-between hover:bg-surface-raised transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-ink group-hover:text-emerald-400">
                        {workspace.repository_name}
                      </div>
                      <div className="text-xs font-mono text-muted mt-0.5 truncate max-w-xs">
                        {workspace.github_repository_url || 'Local Source Snapshot'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="status-pill status-ready text-[10px]">
                        {workspace.state.replace('_', ' ')}
                      </span>
                      <ArrowUpRight size={14} className="text-muted group-hover:text-ink" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted">
                No repositories created yet.{' '}
                <Link to="/new" className="text-ink font-semibold hover:underline">
                  Create your first workspace.
                </Link>
              </div>
            )}
          </DashboardCard>

          {/* Recent Explorations */}
          <DashboardCard
            icon={<Clock3 size={16} />}
            title="Recent Inspection Sessions"
            count={recent.length}
          >
            {recent.length > 0 ? (
              <div className="divide-y divide-line">
                {recent.map((workspace) => (
                  <Link
                    key={workspace.id}
                    to={`/workspace/${workspace.id}`}
                    className="p-3 flex items-center justify-between hover:bg-surface-raised transition-colors group"
                  >
                    <div>
                      <div className="text-sm font-semibold text-ink">
                        {workspace.repository_name}
                      </div>
                      <div className="text-xs font-mono text-muted mt-0.5">
                        {workspace.source_file_count} files indexed
                      </div>
                    </div>
                    <ArrowUpRight size={14} className="text-muted group-hover:text-ink" />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-muted">
                Recently opened repositories will appear here automatically.
              </div>
            )}
          </DashboardCard>

          {/* Bookmarked Files */}
          <DashboardCard
            icon={<Bookmark size={16} />}
            title="Bookmarked Files &amp; Routes"
            count={personal.bookmarkedFiles.length + personal.bookmarkedIssues.length}
          >
            <div className="p-6 text-center text-xs text-muted">
              {personal.bookmarkedFiles.length > 0
                ? `${personal.bookmarkedFiles.length} files saved for reference.`
                : 'Bookmark critical route handlers and entry points while browsing workspaces.'}
            </div>
          </DashboardCard>

          {/* Personal Architecture Notes */}
          <DashboardCard icon={<NotebookPen size={16} />} title="Session Architecture Notes">
            <div className="p-4 space-y-2">
              <textarea
                value={personal.notes}
                onChange={(e) =>
                  setPersonal((current) => ({ ...current, notes: e.target.value }))
                }
                placeholder="Log mental models, environment prerequisites, or key findings..."
                className="font-mono text-xs h-32 w-full p-2.5 bg-input border border-line rounded-[2px] resize-none"
              />
              <div className="flex justify-between items-center text-[10px] font-mono text-muted">
                <span>Stored in browser memory</span>
                <span>{personal.notes.length} characters</span>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </Shell>
  )
}

function DashboardCard({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode
  title: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <section className="panel border border-line-strong bg-surface rounded-[2px] overflow-hidden">
      <div className="p-3.5 border-b border-line bg-surface-raised flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-muted">{icon}</span>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </div>
        {count !== undefined && (
          <span className="font-mono text-xs text-muted bg-surface px-2 py-0.5 border border-line rounded-[2px]">
            {count.toString().padStart(2, '0')}
          </span>
        )}
      </div>
      <div>{children}</div>
    </section>
  )
}
