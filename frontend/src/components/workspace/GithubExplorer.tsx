import { useEffect, useState } from 'react'
import { ChevronDown, ChevronRight, Clipboard, Copy, ExternalLink, File, FileCode2, Folder, FolderOpen, LoaderCircle, Search, X } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { useGithubDirectory, useGithubFile } from '../../hooks/useGithubBrowser'
import type { GithubBrowserEntry } from '../../types/browser'
import { useAppState } from '../../state/AppState'

function iconFor(name: string) {
  const extension = name.split('.').pop()?.toLowerCase()
  if (['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'css', 'html', 'json'].includes(extension || '')) return <FileCode2 size={15}/>
  return <File size={15}/>
}

function languageFor(name: string) {
  const extension = name.split('.').pop()?.toLowerCase()
  const languages: Record<string, string> = { js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript', py: 'python', java: 'java', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', h: 'cpp', html: 'html', htm: 'html', css: 'css', scss: 'scss', json: 'json', md: 'markdown', mdx: 'markdown', sql: 'sql', go: 'go', rs: 'rust', yml: 'yaml', yaml: 'yaml', xml: 'xml', sh: 'shell' }
  return languages[extension || ''] || 'plaintext'
}

function formatBytes(size = 0) { return size < 1024 ? `${size} B` : size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(1)} MB` }

export function GithubExplorer({ workspaceId }: { workspaceId: string }) {
  const { state } = useAppState(); const [expanded, setExpanded] = useState<string[]>(() => JSON.parse(sessionStorage.getItem(`repomentor-expanded-${workspaceId}`) || '[]')); const [selectedPath, setSelectedPath] = useState<string | null>(null); const [search, setSearch] = useState('')
  const root = useGithubDirectory(workspaceId, '', true); const selectedFile = useGithubFile(workspaceId, selectedPath)
  useEffect(() => { sessionStorage.setItem(`repomentor-expanded-${workspaceId}`, JSON.stringify(expanded)) }, [expanded, workspaceId])
  const toggle = (path: string) => setExpanded(items => items.includes(path) ? items.filter(item => item !== path) : [...items, path])
  const file = selectedFile.data
  const rootError = apiErrorMessage(root.error, 'Could not load repository files.')
  return <section className="github-explorer panel"><div className="explorer-heading"><div><p className="eyebrow">Repository browser</p><h2 className="mt-2 text-2xl font-medium">Explore the source.</h2></div><span className="explorer-branch">{root.data?.branch || 'main'} branch</span></div><div className="explorer-body"><aside className="explorer-tree"><div className="explorer-search"><Search size={14}/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Filter files"/></div>{root.isLoading ? <ExplorerState label="Loading repository tree..."/> : root.isError ? <ExplorerState label={rootError} error/> : <Tree entries={root.data?.entries || []} depth={0} expanded={expanded} selectedPath={selectedPath} search={search} workspaceId={workspaceId} onToggle={toggle} onSelect={setSelectedPath}/>}</aside><div className="explorer-viewer">{selectedPath && file ? <><div className="viewer-toolbar"><div className="breadcrumbs">{selectedPath.split('/').map((part, index, parts) => <span key={`${part}-${index}`}>{part}{index < parts.length - 1 && <b>/</b>}</span>)}</div><div className="viewer-actions"><button className="icon-button" title="Copy path" onClick={() => navigator.clipboard?.writeText(selectedPath)}><Clipboard size={15}/></button>{file.status === 'ready' && <button className="icon-button" title="Copy code" onClick={() => navigator.clipboard?.writeText(file.content)}><Copy size={15}/></button>}{file.html_url && <a className="icon-button" title="Open on GitHub" href={file.html_url} target="_blank" rel="noreferrer"><ExternalLink size={15}/></a>}<button className="icon-button" title="Close file" onClick={() => setSelectedPath(null)}><X size={15}/></button></div></div><div className="viewer-file-meta"><span>{languageFor(selectedPath)}</span><span>{formatBytes(file.size)}</span><span>{file.path}</span></div>{file.status === 'ready' ? <Editor height="100%" language={languageFor(selectedPath)} theme={state.theme === 'dark' ? 'vs-dark' : 'light'} value={file.content} options={{ readOnly: true, lineNumbers: 'on', minimap: { enabled: false }, wordWrap: 'on', padding: { top: 16 } }}/> : <ExplorerState label={file.message || 'This file cannot be previewed.'} error/>}</> : selectedPath && selectedFile.isLoading ? <ExplorerState label="Loading file..."/> : selectedPath && selectedFile.isError ? <ExplorerState label={apiErrorMessage(selectedFile.error, 'Unable to load file.')} error/> : <ExplorerState label="Select a file to inspect its source code."/>}</div></div></section>
}

function Tree({ entries, depth, expanded, selectedPath, search, workspaceId, onToggle, onSelect }: { entries: GithubBrowserEntry[]; depth: number; expanded: string[]; selectedPath: string | null; search: string; workspaceId: string; onToggle: (path: string) => void; onSelect: (path: string) => void }) {
  const visible = entries.filter(entry => !search || entry.path.toLowerCase().includes(search.toLowerCase()))
  return <div>{visible.length === 0 ? <ExplorerState label="No matching files."/> : visible.map(entry => <TreeItem key={entry.path} entry={entry} depth={depth} expanded={expanded} selectedPath={selectedPath} search={search} workspaceId={workspaceId} onToggle={onToggle} onSelect={onSelect}/>)}</div>
}

function TreeItem({ entry, depth, expanded, selectedPath, search, workspaceId, onToggle, onSelect }: { entry: GithubBrowserEntry; depth: number; expanded: string[]; selectedPath: string | null; search: string; workspaceId: string; onToggle: (path: string) => void; onSelect: (path: string) => void }) {
  const open = expanded.includes(entry.path); const directory = useGithubDirectory(workspaceId, entry.path, entry.type === 'folder' && open)
  return <><button type="button" className={`tree-item ${selectedPath === entry.path ? 'is-selected' : ''}`} style={{ paddingLeft: `${.7 + depth * 1.05}rem` }} onClick={() => entry.type === 'folder' ? onToggle(entry.path) : onSelect(entry.path)}>{entry.type === 'folder' ? (open ? <ChevronDown size={14}/> : <ChevronRight size={14}/>) : <span className="tree-spacer"/>}{entry.type === 'folder' ? (open ? <FolderOpen size={15}/> : <Folder size={15}/>) : iconFor(entry.name)}<span>{entry.name}</span></button>{entry.type === 'folder' && open && (directory.isLoading ? <ExplorerState label="Loading..." compact/> : directory.isError ? <ExplorerState label="Unable to load folder." error compact/> : <Tree entries={directory.data?.entries || []} depth={depth + 1} expanded={expanded} selectedPath={selectedPath} search={search} workspaceId={workspaceId} onToggle={onToggle} onSelect={onSelect}/>)}</>
}

function ExplorerState({ label, error = false, compact = false }: { label: string; error?: boolean; compact?: boolean }) { return <div className={`explorer-state ${compact ? 'compact' : ''} ${error ? 'is-error' : ''}`}>{!error && <LoaderCircle className="animate-spin" size={15}/>}<span>{label}</span></div> }

function apiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) return (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || fallback
  return fallback
}
