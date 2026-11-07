import { ReactFlow } from '@xyflow/react'
import { Activity, Database, FileText, CheckCircle2, GitGraph } from 'lucide-react'

export function Architecture({
  fileCount = 0,
  guideReady = false,
}: {
  fileCount?: number
  guideReady?: boolean
}) {
  const nodes = [
    {
      id: '1',
      type: 'input',
      data: { label: 'Source Snapshot' },
      position: { x: 20, y: 70 },
      style: {
        background: '#181b26',
        color: '#e2e8f0',
        border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: '6px',
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
        padding: '8px 12px',
      },
    },
    {
      id: '2',
      data: { label: 'AST Symbol Parser' },
      position: { x: 190, y: 70 },
      style: {
        background: '#10221c',
        color: '#6ee7b7',
        border: '1px solid rgba(16,185,129,0.3)',
        borderRadius: '6px',
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
        padding: '8px 12px',
      },
    },
    {
      id: '3',
      type: 'output',
      data: { label: 'Architecture Guide' },
      position: { x: 370, y: 70 },
      style: {
        background: '#1b1b2a',
        color: '#c4b5fd',
        border: '1px solid rgba(167,139,250,0.3)',
        borderRadius: '6px',
        fontSize: '11px',
        fontFamily: 'JetBrains Mono, monospace',
        padding: '8px 12px',
      },
    },
  ]

  return (
    <div className="rounded-lg border border-white/10 bg-[#0f1118] p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-2">
          <GitGraph size={16} className="text-emerald-400" />
          <h2 className="text-sm font-bold text-white tracking-tight">
            Synthesis Call Graph
          </h2>
        </div>
        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[2px]">
          Static Heuristic
        </span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs font-mono text-zinc-400">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06]">
          <FileText size={12} className="text-zinc-400" />
          <span>{fileCount} files indexed</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06]">
          <Database size={12} className="text-zinc-400" />
          <span>Local AST cache</span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.06]">
          <CheckCircle2 size={12} className={guideReady ? 'text-emerald-400' : 'text-zinc-500'} />
          <span className={guideReady ? 'text-emerald-300' : 'text-zinc-400'}>
            {guideReady ? 'Analysis complete' : 'Awaiting synthesis'}
          </span>
        </span>
      </div>

      <div className="h-[220px] border border-white/10 bg-[#08090d] rounded-md overflow-hidden shadow-inner">
        <ReactFlow
          nodes={nodes}
          edges={[
            {
              id: 'e1',
              source: '1',
              target: '2',
              animated: true,
              style: { stroke: '#10b981', strokeWidth: 2 },
            },
            {
              id: 'e2',
              source: '2',
              target: '3',
              animated: true,
              style: { stroke: '#a78bfa', strokeWidth: 2 },
            },
          ]}
          fitView
        />
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed font-sans">
        Trace how repository source files are parsed into abstract syntax trees without execution, mapped into dependencies, and compiled into an actionable guide.
      </p>
    </div>
  )
}
