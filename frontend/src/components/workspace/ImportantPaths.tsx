import { useState } from 'react'
import { ArrowRight, LoaderCircle, Route, SlidersHorizontal } from 'lucide-react'
import type { GithubSummary } from '../../types/api'

export function ImportantPaths({ analysis, loading = false, error }: { analysis?: GithubSummary['analysis']; loading?: boolean; error?: unknown }) {
  const [depth, setDepth] = useState(3)
  const paths = analysis?.important_paths || []
  const errorMessage = error && typeof error === 'object' && 'response' in error ? ((error as { response?: { data?: { detail?: string } } }).response?.data?.detail || 'Repository analysis is unavailable.') : 'Repository analysis is unavailable.'
  return <section className="important-paths panel"><div className="important-paths-heading"><div><p className="eyebrow">03 / Trace the important paths</p><h2>Follow the code through the system.</h2></div><label className="depth-control"><SlidersHorizontal size={14}/> Depth <select value={depth} onChange={event => setDepth(Number(event.target.value))}><option value={2}>2 layers</option><option value={3}>3 layers</option><option value={4}>4 layers</option></select></label></div>{loading ? <div className="path-empty"><LoaderCircle className="animate-spin" size={16}/> Scanning routes, services, and data models...</div> : error ? <div className="path-empty is-error">{errorMessage}</div> : paths.length ? <div className="path-list">{paths.slice(0, depth * 3).map(path => <div className="important-path" key={path.label}><div className="path-label"><Route size={15}/><strong>{path.label}</strong></div><div className="path-steps">{path.steps.slice(0, depth).map((step, index) => <span key={`${path.label}-${step}-${index}`}>{step}{index < Math.min(path.steps.length, depth) - 1 && <ArrowRight size={13}/>}</span>)}</div><small>Evidence: {path.evidence.join(' · ')}</small></div>)}</div> : <div className="path-empty">No route-to-module paths were verified in the scanned repository files.</div>}</section>
}
