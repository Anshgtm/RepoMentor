import { ReactFlow } from '@xyflow/react'
import { Activity, Database, FileText, Sparkles } from 'lucide-react'

export function Architecture({ fileCount = 0, guideReady = false }: { fileCount?: number; guideReady?: boolean }) {
  const nodes = [
    { id: '1', type: 'input', data: { label: 'Source snapshot' }, position: { x: 30, y: 80 } },
    { id: '2', data: { label: 'Evidence parser' }, position: { x: 240, y: 80 } },
    { id: '3', type: 'output', data: { label: 'Contributor guide' }, position: { x: 460, y: 80 } },
  ]
  return <section className="panel architecture-panel"><div className="architecture-heading"><div><p className="eyebrow">Pipeline map</p><h2 className="mt-2 text-2xl font-medium">From evidence to orientation.</h2></div><Activity size={19} className="text-gold"/></div><div className="architecture-stats"><span><FileText size={14}/>{fileCount} source files</span><span><Database size={14}/>Local snapshot</span><span className={guideReady ? 'is-live' : ''}><Sparkles size={14}/>{guideReady ? 'Guide ready' : 'Awaiting guide'}</span></div><div className="flow-frame"><ReactFlow nodes={nodes} edges={[{ id: 'e1', source: '1', target: '2', animated: true }, { id: 'e2', source: '2', target: '3', animated: true }]} fitView/></div><p className="mt-4 text-sm leading-6 text-ink/55">A visual trace of how the supplied material becomes a contributor guide.</p></section>
}
