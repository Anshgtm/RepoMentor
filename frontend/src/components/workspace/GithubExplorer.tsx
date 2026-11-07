import { useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Clipboard,
  Copy,
  ExternalLink,
  File,
  FileCode2,
  Folder,
  FolderOpen,
  LoaderCircle,
  Search,
  X,
  Code2,
  Check,
  GitBranch,
} from 'lucide-react'
import Editor from '@monaco-editor/react'
import { useGithubDirectory, useGithubFile } from '../../hooks/useGithubBrowser'
import type { GithubBrowserEntry } from '../../types/browser'
import { useAppState } from '../../state/AppState'

function iconFor(name: string) {
  const extension = name.split('.').pop()?.toLowerCase()
  if (['ts', 'tsx', 'js', 'jsx'].includes(extension || ''))
    return <FileCode2 size={14} className="text-amber-400" />
  if (['py'].includes(extension || ''))
    return <FileCode2 size={14} className="text-blue-400" />
  if (['json', 'yml', 'yaml', 'toml'].includes(extension || ''))
    return <FileCode2 size={14} className="text-emerald-400" />
  if (['css', 'html'].includes(extension || ''))
    return <FileCode2 size={14} className="text-pink-400" />
  if (['md'].includes(extension || ''))
    return <FileTextIcon size={14} className="text-indigo-400" />
  return <File size={14} className="text-zinc-400" />
}

function FileTextIcon({ size, className }: { size: number; className?: string }) {
  return <File size={size} className={className} />
}

function languageFor(name: string) {
  const extension = name.split('.').pop()?.toLowerCase()
  const languages: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    java: 'java',
    cpp: 'cpp',
    cc: 'cpp',
    cxx: 'cpp',
    h: 'cpp',
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    json: 'json',
    md: 'markdown',
    mdx: 'markdown',
    sql: 'sql',
    go: 'go',
    rs: 'rust',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    sh: 'shell',
  }
  return languages[extension || ''] || 'plaintext'
}

function formatBytes(size = 0) {
  return size < 1024
    ? `${size} B`
    : size < 1024 * 1024
    ? `${(size / 1024).toFixed(1)} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function GithubExplorer({ workspaceId }: { workspaceId: string }) {
  const { state } = useAppState()
  const [expanded, setExpanded] = useState<string[]>(() =>
    JSON.parse(sessionStorage.getItem(`repomentor-expanded-${workspaceId}`) || '[]')
  )
  const [selectedPath, setSelectedPath] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)

  const root = useGithubDirectory(workspaceId, '', true)
  const selectedFile = useGithubFile(workspaceId, selectedPath)

  useEffect(() => {
    sessionStorage.setItem(`repomentor-expanded-${workspaceId}`, JSON.stringify(expanded))
  }, [expanded, workspaceId])

  const toggle = (path: string) =>
    setExpanded((items) =>
      items.includes(path) ? items.filter((item) => item !== path) : [...items, path]
    )

  const file = selectedFile.data
  const rootError = apiErrorMessage(root.error, 'Could not load repository files.')

  const handleCopyCode = async () => {
    if (file?.content) {
      await navigator.clipboard?.writeText(file.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-[#0f1118] overflow-hidden my-6 shadow-sm">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-white/[0.08] bg-[#12141e] gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[3px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Code2 size={15} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Repository Code Browser</h2>
            <p className="text-[11px] text-zinc-400">Explore file structure, read source, and inspect dependencies</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-zinc-300">
            <GitBranch size={13} className="text-emerald-400" />
            <span>{root.data?.branch || 'main'} branch</span>
          </span>
        </div>
      </div>

      {/* Main Split Body: Sidebar + Viewer */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
        {/* Left: Tree Sidebar (4 cols) */}
        <aside className="md:col-span-4 border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#0c0d14] flex flex-col">
          {/* Search Box */}
          <div className="p-3 border-b border-white/[0.06]">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter files in repository..."
                className="w-full bg-[#131520] border border-white/10 focus:border-emerald-500/40 focus:outline-none rounded-[4px] pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 font-sans"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Directory Tree */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 max-h-[520px]">
            {root.isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-500 text-xs font-mono">
                <LoaderCircle size={16} className="animate-spin text-emerald-400" />
                <span>Loading repository tree...</span>
              </div>
            ) : root.isError ? (
              <div className="p-4 text-xs font-mono text-red-400 text-center">
                {rootError}
              </div>
            ) : (
              <Tree
                entries={root.data?.entries || []}
                depth={0}
                expanded={expanded}
                selectedPath={selectedPath}
                search={search}
                workspaceId={workspaceId}
                onToggle={toggle}
                onSelect={setSelectedPath}
              />
            )}
          </div>
        </aside>

        {/* Right: Code Viewer (8 cols) */}
        <div className="md:col-span-8 flex flex-col bg-[#10121a]">
          {selectedPath && file ? (
            <>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.08] bg-[#141622] gap-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300 truncate">
                  {selectedPath.split('/').map((part, index, parts) => (
                    <span key={`${part}-${index}`} className="flex items-center gap-1">
                      <span className={index === parts.length - 1 ? 'text-white font-semibold' : 'text-zinc-400'}>
                        {part}
                      </span>
                      {index < parts.length - 1 && <span className="text-zinc-600">/</span>}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="px-2 py-0.5 rounded-[2px] bg-white/[0.05] border border-white/10 text-[10px] font-mono text-emerald-300 uppercase">
                    {languageFor(selectedPath)}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">
                    {formatBytes(file.size)}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="p-1.5 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors border border-white/[0.06]"
                    title="Copy code"
                  >
                    {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                  </button>

                  {file.html_url && (
                    <a
                      href={file.html_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors border border-white/[0.06]"
                      title="Open on GitHub"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedPath(null)}
                    className="p-1.5 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors border border-white/[0.06]"
                    title="Close preview"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 min-h-[460px]">
                {file.status === 'ready' ? (
                  <Editor
                    height="460px"
                    language={languageFor(selectedPath)}
                    theme={state.theme === 'dark' ? 'vs-dark' : 'light'}
                    value={file.content}
                    options={{
                      readOnly: true,
                      lineNumbers: 'on',
                      minimap: { enabled: false },
                      wordWrap: 'on',
                      fontSize: 12,
                      fontFamily: 'JetBrains Mono, monospace',
                      padding: { top: 14, bottom: 14 },
                      renderLineHighlight: 'all',
                    }}
                  />
                ) : (
                  <div className="py-20 text-center text-xs font-mono text-zinc-400">
                    {file.message || 'This file cannot be previewed.'}
                  </div>
                )}
              </div>
            </>
          ) : selectedPath && selectedFile.isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-24 text-zinc-400 text-xs font-mono">
              <LoaderCircle size={18} className="animate-spin text-emerald-400" />
              <span>Fetching file content from GitHub...</span>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-500">
                <Code2 size={24} />
              </div>
              <h3 className="text-sm font-semibold text-white">Select a file to inspect</h3>
              <p className="text-xs text-zinc-400 max-w-sm leading-relaxed">
                Choose any file from the repository tree on the left to inspect its syntax-highlighted source code, routes, or imports.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Tree({
  entries,
  depth,
  expanded,
  selectedPath,
  search,
  workspaceId,
  onToggle,
  onSelect,
}: {
  entries: GithubBrowserEntry[]
  depth: number
  expanded: string[]
  selectedPath: string | null
  search: string
  workspaceId: string
  onToggle: (path: string) => void
  onSelect: (path: string) => void
}) {
  const visible = entries.filter(
    (entry) => !search || entry.path.toLowerCase().includes(search.toLowerCase())
  )

  if (visible.length === 0) {
    return <div className="py-4 text-center text-[11px] font-mono text-zinc-500">No matching files found.</div>
  }

  return (
    <div className="space-y-0.5">
      {visible.map((entry) => (
        <TreeItem
          key={entry.path}
          entry={entry}
          depth={depth}
          expanded={expanded}
          selectedPath={selectedPath}
          search={search}
          workspaceId={workspaceId}
          onToggle={onToggle}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

function TreeItem({
  entry,
  depth,
  expanded,
  selectedPath,
  search,
  workspaceId,
  onToggle,
  onSelect,
}: {
  entry: GithubBrowserEntry
  depth: number
  expanded: string[]
  selectedPath: string | null
  search: string
  workspaceId: string
  onToggle: (path: string) => void
  onSelect: (path: string) => void
}) {
  const open = expanded.includes(entry.path)
  const isSelected = selectedPath === entry.path
  const isFolder = entry.type === 'folder'
  const directory = useGithubDirectory(workspaceId, entry.path, isFolder && open)

  return (
    <>
      <button
        type="button"
        onClick={() => (isFolder ? onToggle(entry.path) : onSelect(entry.path))}
        style={{ paddingLeft: `${0.5 + depth * 0.85}rem` }}
        className={`w-full flex items-center gap-1.5 py-1 px-2 rounded-[3px] text-xs font-mono text-left transition-colors cursor-pointer select-none ${
          isSelected
            ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
            : 'text-zinc-300 hover:bg-white/[0.04] hover:text-white'
        }`}
      >
        {isFolder ? (
          <span className="text-zinc-500">
            {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
          </span>
        ) : (
          <span className="w-3" />
        )}

        {isFolder ? (
          open ? (
            <FolderOpen size={14} className="text-amber-400 flex-shrink-0" />
          ) : (
            <Folder size={14} className="text-amber-400 flex-shrink-0" />
          )
        ) : (
          iconFor(entry.name)
        )}

        <span className="truncate">{entry.name}</span>
      </button>

      {isFolder && open && (
        <div>
          {directory.isLoading ? (
            <div
              style={{ paddingLeft: `${1.2 + depth * 0.85}rem` }}
              className="py-1 text-[11px] font-mono text-zinc-500 flex items-center gap-1.5"
            >
              <LoaderCircle size={11} className="animate-spin text-emerald-400" />
              <span>Loading folder...</span>
            </div>
          ) : directory.isError ? (
            <div
              style={{ paddingLeft: `${1.2 + depth * 0.85}rem` }}
              className="py-1 text-[11px] font-mono text-red-400"
            >
              Unable to load folder.
            </div>
          ) : (
            <Tree
              entries={directory.data?.entries || []}
              depth={depth + 1}
              expanded={expanded}
              selectedPath={selectedPath}
              search={search}
              workspaceId={workspaceId}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          )}
        </div>
      )}
    </>
  )
}

function apiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    return (
      (error as { response?: { data?: { detail?: string } } }).response?.data?.detail || fallback
    )
  }
  return fallback
}
