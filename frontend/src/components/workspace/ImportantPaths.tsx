import { useState } from 'react'
import { ArrowRight, LoaderCircle, Route, SlidersHorizontal } from 'lucide-react'
import type { GithubSummary } from '../../types/api'

export function ImportantPaths({
  analysis,
  loading = false,
  error,
}: {
  analysis?: GithubSummary['analysis']
  loading?: boolean
  error?: unknown
}) {
  const [depth, setDepth] = useState(3)
  const paths = analysis?.important_paths || []
  const errorMessage =
    error && typeof error === 'object' && 'response' in error
      ? ((error as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Repository analysis is unavailable.')
      : 'Repository analysis is unavailable.'

  return (
    <section className="important-paths panel border border-line-strong p-5 bg-surface my-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-line gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ink">
            Request-to-Module Execution Paths
          </h2>
        </div>
        <label className="flex items-center gap-2 text-xs font-mono text-muted">
          <SlidersHorizontal size={14} />
          <span>Trace Depth:</span>
          <select
            value={depth}
            onChange={(event) => setDepth(Number(event.target.value))}
            className="bg-surface-raised border border-line text-ink py-1 px-2 text-xs font-mono rounded-[2px]"
          >
            <option value={2}>2 Layers (Route → Controller)</option>
            <option value={3}>3 Layers (Route → Service → DB)</option>
            <option value={4}>4 Layers (Full Call Pipeline)</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs font-mono text-muted flex items-center justify-center gap-2">
          <LoaderCircle className="animate-spin" size={16} /> Scanning route handlers, service layers, and models...
        </div>
      ) : error ? (
        <div className="py-8 text-center text-xs font-mono text-red-400">
          {errorMessage}
        </div>
      ) : paths.length ? (
        <div className="grid gap-3 mt-4">
          {paths.slice(0, depth * 3).map((path) => (
            <div key={path.label} className="p-3 border border-line bg-surface-raised rounded-[2px] font-mono text-xs">
              <div className="flex items-center gap-2 text-ink font-semibold mb-2">
                <Route size={14} className="text-emerald-400" />
                <span>{path.label}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-muted text-xs">
                {path.steps.slice(0, depth).map((step, index) => (
                  <span key={`${path.label}-${step}-${index}`} className="flex items-center gap-2">
                    <span className="px-2 py-0.5 border border-line bg-surface rounded-[2px] text-zinc-300">
                      {step}
                    </span>
                    {index < Math.min(path.steps.length, depth) - 1 && (
                      <ArrowRight size={12} className="text-muted-dark" />
                    )}
                  </span>
                ))}
              </div>
              <div className="text-[11px] text-muted-dark mt-2 border-t border-line/50 pt-1.5">
                Heuristic trace: {path.evidence.join(' · ')}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-xs font-mono text-muted">
          No verified request-to-module sequences detected in scanned files.
        </div>
      )}
    </section>
  )
}
