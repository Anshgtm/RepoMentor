import { ReactFlow } from '@xyflow/react'
import { Activity, Database, FileText, CheckCircle2 } from 'lucide-react'

export function Architecture({
  fileCount = 0,
  guideReady = false,
}: {
  fileCount?: number
  guideReady?: boolean
}) {
  const nodes = [
    { id: '1', type: 'input', data: { label: 'Source Snapshot' }, position: { x: 20, y: 70 } },
    { id: '2', data: { label: 'AST Symbol Parser' }, position: { x: 200, y: 70 } },
    { id: '3', type: 'output', data: { label: 'Architecture Guide' }, position: { x: 400, y: 70 } },
  ]

  return (
    <section className="panel border border-line-strong p-5 bg-surface">
      <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            Synthesis Call Graph
          </h2>
        </div>
        <Activity size={16} className="text-emerald-400" />
      </div>

      <div className="flex flex-wrap gap-4 text-xs font-mono text-muted mb-4">
        <span className="flex items-center gap-1.5">
          <FileText size={13} className="text-zinc-500" />
          {fileCount} files indexed
        </span>
        <span className="flex items-center gap-1.5">
          <Database size={13} className="text-zinc-500" />
          Local AST cache
        </span>
        <span className="flex items-center gap-1.5 text-ink">
          <CheckCircle2 size={13} className={guideReady ? 'text-emerald-400' : 'text-zinc-500'} />
          {guideReady ? 'Analysis complete' : 'Awaiting synthesis'}
        </span>
      </div>

      <div className="h-[220px] border border-line bg-[#0a0c0e] rounded-[2px] overflow-hidden">
        <ReactFlow
          nodes={nodes}
          edges={[
            { id: 'e1', source: '1', target: '2', animated: true },
            { id: 'e2', source: '2', target: '3', animated: true },
          ]}
          fitView
        />
      </div>

      <p className="mt-3 text-xs text-muted leading-relaxed">
        Trace how submitted repository source code is parsed into abstract syntax trees, mapped for symbols, and compiled into an onboarding walkthrough.
      </p>
    </section>
  )
}
