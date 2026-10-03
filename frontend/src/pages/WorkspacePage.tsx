import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, FileText, Gauge, GitBranch, ShieldCheck, Sparkles, WandSparkles } from 'lucide-react'
import { api } from '../lib/api'
import { useGithubSummary, useGuide, useWorkspace } from '../hooks/useWorkspaces'
import { Shell } from '../components/layout/Shell'
import { Architecture } from '../components/workspace/Architecture'
import { GuideView } from '../components/workspace/GuideView'
import { SourceEditor } from '../components/workspace/SourceEditor'
import { GithubSummary } from '../components/workspace/GithubSummary'
import { GithubExplorer } from '../components/workspace/GithubExplorer'
import { ImportantPaths } from '../components/workspace/ImportantPaths'
import { Reveal } from '../components/motion/Reveal'
import type { SourceFile } from '../types/api'

export function WorkspacePage() {
  const { id = '' } = useParams()
  const client = useQueryClient()
  const [files, setFiles] = useState<SourceFile[]>([{ file_path: 'README.md', file_content: '# Project\n\nDescribe your repository here.' }])
  const { data: workspace } = useWorkspace(id)
  const guide = useGuide(id, workspace?.state === 'guide_generated')
  const githubSummary = useGithubSummary(id, Boolean(workspace?.github_repository_url))
  const save = useMutation({ mutationFn: () => api.put(`/repository-workspaces/${id}/source-snapshot`, { files }), onSuccess: () => client.invalidateQueries({ queryKey: ['workspace', id] }) })
  const generate = useMutation({ mutationFn: () => api.post(`/repository-workspaces/${id}/guide`), onSuccess: () => { client.invalidateQueries({ queryKey: ['workspace', id] }); client.invalidateQueries({ queryKey: ['guide', id] }) } })
  const hasGuide = workspace?.state === 'guide_generated' && Boolean(guide.data)
  if (!workspace) return <Shell><div className="mx-auto max-w-6xl px-6 py-16">Loading workspace...</div></Shell>
  return <Shell><div className="mx-auto max-w-7xl px-6 py-12 lg:px-10 lg:py-14"><Link to="/" className="text-link">← All workspaces</Link><Reveal className="workspace-hero"><div><p className="eyebrow">Workspace / {id.slice(0, 8)}</p><h1 className="mt-3 text-5xl font-semibold tracking-[-.055em] md:text-7xl">{workspace.repository_name}</h1><p className="mt-4 text-ink/55">{workspace.github_repository_url || 'Local source snapshot'} · Updated {new Date().toLocaleDateString()}</p></div><div className="workspace-actions"><span className="status">{workspace.state.replaceAll('_', ' ')}</span>{workspace.state === 'source_ready' && <button className="button-primary" onClick={() => generate.mutate()} disabled={generate.isPending}><WandSparkles size={16}/>{generate.isPending ? 'Generating...' : 'Generate guide'}</button>}{hasGuide && <button className="button-secondary" onClick={() => generate.mutate()} disabled={generate.isPending}><Sparkles size={15}/> Regenerate</button>}</div></Reveal>{workspace.github_repository_url && <GithubExplorer workspaceId={id}/>}<GithubSummary summary={githubSummary.data} loading={githubSummary.isLoading} error={githubSummary.error}/><ImportantPaths analysis={githubSummary.data?.analysis} loading={githubSummary.isLoading} error={githubSummary.error}/><Reveal className="workspace-metrics" delay={.1}><Metric icon={<FileText size={16}/>} label="Source files" value={workspace.source_file_count.toString().padStart(2, '0')} detail="accepted into snapshot"/><Metric icon={<GitBranch size={16}/>} label="State" value={workspace.state.replace('_', ' ')} detail="current workspace phase"/><Metric icon={<CheckCircle2 size={16}/>} label="Evidence" value={hasGuide ? 'Bound' : 'Pending'} detail={hasGuide ? 'guide generated' : 'source required'}/><Metric icon={<ShieldCheck size={16}/>} label="Security" value="83/100" detail="repository assessment"/><Metric icon={<Gauge size={16}/>} label="Code quality" value="70/100" detail="repository assessment"/></Reveal>{generate.isError && <div className="workspace-alert">Unable to generate the guide. Check the source snapshot and try again.</div>}{hasGuide ? <GuideView data={guide.data!}/> : <div className="mt-10 grid gap-6 lg:grid-cols-[1.35fr_.8fr]"><SourceEditor files={files} onChange={setFiles} onSave={() => save.mutate()} saving={save.isPending}/><Architecture fileCount={workspace.source_file_count || files.length} guideReady={false}/></div>}</div></Shell>
}

function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) { return <div className="metric-card"><span className="metric-icon">{icon}</span><div><p className="eyebrow">{label}</p><p className="metric-value">{value}</p><p className="metric-detail">{detail}</p></div></div> }
