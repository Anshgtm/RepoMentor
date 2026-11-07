import { useState } from 'react'
import {
  ArrowRight,
  LoaderCircle,
  Route,
  SlidersHorizontal,
  Search,
  Layers,
  Database,
  ShieldCheck,
  Cpu,
} from 'lucide-react'
import type { GithubSummary } from '../../types/api'

function methodColor(method: string) {
  const m = method.toUpperCase()
  if (m.includes('GET')) return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
  if (m.includes('POST')) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (m.includes('PUT')) return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  if (m.includes('DELETE')) return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  return 'bg-purple-500/15 text-purple-300 border-purple-500/30'
}

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
  const [filter, setFilter] = useState('')

  const paths = analysis?.important_paths || []
  const filteredPaths = paths.filter(
    (p) =>
      !filter ||
      p.label.toLowerCase().includes(filter.toLowerCase()) ||
      p.steps.some((s) => s.toLowerCase().includes(filter.toLowerCase()))
  )

  const errorMessage =
    error && typeof error === 'object' && 'response' in error
      ? ((error as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Repository analysis is unavailable.')
      : 'Repository analysis is unavailable.'

  return (
    <div className="rounded-lg border border-white/10 bg-[#0f1118] p-5 my-6 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/[0.08] gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[2px]">
              Execution Topology
            </span>
            <span className="text-xs font-mono text-zinc-500">
              {paths.length} detected call journeys
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            Request-to-Database Execution Paths
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Follows each API endpoint from incoming user HTTP request through controllers directly into database persistence models.
          </p>
        </div>

        {/* Trace Depth Selector */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-mono text-zinc-400 bg-[#141622] border border-white/10 px-3 py-1.5 rounded-[4px]">
            <SlidersHorizontal size={13} className="text-emerald-400" />
            <span className="hidden sm:inline">Trace Depth:</span>
            <select
              value={depth}
              onChange={(e) => setDepth(Number(e.target.value))}
              className="bg-transparent border-0 text-white font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value={2} className="bg-[#141622]">2 Layers (Route → Controller)</option>
              <option value={3} className="bg-[#141622]">3 Layers (Route → Middleware → Service)</option>
              <option value={4} className="bg-[#141622]">4 Layers (Full Call Pipeline → DB)</option>
            </select>
          </label>
        </div>
      </div>

      {/* Filter bar */}
      {paths.length > 3 && (
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search endpoints by route name or file..."
            className="w-full bg-[#131520] border border-white/[0.08] focus:border-emerald-500/40 focus:outline-none rounded-[4px] pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 font-sans"
          />
        </div>
      )}

      {loading ? (
        <div className="py-14 text-center text-xs font-mono text-zinc-400 flex flex-col items-center justify-center gap-2">
          <LoaderCircle className="animate-spin text-emerald-400" size={20} />
          <span>Scanning route handlers, service layers, and database models...</span>
        </div>
      ) : error ? (
        <div className="py-8 text-center text-xs font-mono text-red-400 bg-red-500/5 border border-red-500/10 rounded-md">
          {errorMessage}
        </div>
      ) : filteredPaths.length ? (
        <div className="grid gap-3">
          {filteredPaths.slice(0, depth * 4).map((path, idx) => {
            const [method, ...endpointParts] = path.label.split(' ')
            const endpoint = endpointParts.join(' ') || method

            return (
              <div
                key={`${path.label}-${idx}`}
                className="p-4 rounded-md border border-white/[0.08] bg-[#12141e] hover:border-white/20 transition-all duration-200 space-y-3 shadow-sm"
              >
                {/* Route Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-[3px] border ${methodColor(
                        method
                      )}`}
                    >
                      {method}
                    </span>
                    <span className="font-mono text-sm font-semibold text-white tracking-wide">
                      {endpoint}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Step 1 of {Math.min(path.steps.length, depth)}
                  </span>
                </div>

                {/* Step Breadcrumb Flow */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono pt-1">
                  {path.steps.slice(0, depth).map((step, stepIdx) => (
                    <span key={`${step}-${stepIdx}`} className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-[3px] bg-[#181a26] border border-white/[0.08] text-zinc-200 text-xs flex items-center gap-1.5 shadow-sm">
                        <span className="text-[10px] text-emerald-400 font-bold">
                          {stepIdx + 1}.
                        </span>
                        <span>{step}</span>
                      </span>
                      {stepIdx < Math.min(path.steps.length, depth) - 1 && (
                        <ArrowRight size={13} className="text-zinc-600 flex-shrink-0" />
                      )}
                    </span>
                  ))}
                </div>

                {/* Verified Trace Evidence */}
                {path.evidence.length > 0 && (
                  <div className="text-[11px] font-mono text-zinc-500 pt-2 border-t border-white/[0.04] flex items-center gap-1.5 truncate">
                    <span className="text-zinc-400 font-semibold">Evidence:</span>
                    <span className="text-zinc-400 truncate">{path.evidence.join(' · ')}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="py-12 text-center text-xs font-mono text-zinc-500">
          No matching request-to-module sequences found.
        </div>
      )}
    </div>
  )
}
