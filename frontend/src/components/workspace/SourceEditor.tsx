import { useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  Clipboard,
  FileCode2,
  FilePlus2,
  Trash2,
  Check,
  Code2,
  FileText,
  Save,
  LoaderCircle,
} from 'lucide-react'
import type { SourceFile } from '../../types/api'
import { useAppState } from '../../state/AppState'

type Props = {
  files: SourceFile[]
  onChange: (files: SourceFile[]) => void
  onSave: () => void
  saving: boolean
}

function languageFor(path: string) {
  const extension = path.split('.').pop()?.toLowerCase()
  if (extension === 'json') return 'json'
  if (extension === 'ts' || extension === 'tsx') return 'typescript'
  if (extension === 'js' || extension === 'jsx') return 'javascript'
  if (extension === 'css') return 'css'
  if (extension === 'html') return 'html'
  return 'markdown'
}

export function SourceEditor({ files, onChange, onSave, saving }: Props) {
  const { state } = useAppState()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const selected = files[selectedIndex] || files[0]
  const lineCount = useMemo(
    () => selected?.file_content.split('\n').length || 0,
    [selected]
  )

  const updateFile = (patch: Partial<SourceFile>) =>
    onChange(
      files.map((file, index) => (index === selectedIndex ? { ...file, ...patch } : file))
    )

  const addFile = () => {
    onChange([...files, { file_path: `notes-${files.length + 1}.md`, file_content: '# Notes\n' }])
    setSelectedIndex(files.length)
  }

  const removeFile = () => {
    if (files.length === 1) return
    onChange(files.filter((_, index) => index !== selectedIndex))
    setSelectedIndex(Math.max(0, selectedIndex - 1))
  }

  const copyContent = async () => {
    if (selected) {
      await navigator.clipboard?.writeText(selected.file_content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!selected) return null

  return (
    <div className="rounded-lg border border-white/10 bg-[#0f1118] overflow-hidden shadow-sm space-y-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-white/[0.08] bg-[#12141e] gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[2px]">
              01 / Source Snapshot
            </span>
            <span className="text-xs font-mono text-zinc-500">{files.length} active files</span>
          </div>
          <h2 className="text-base font-bold text-white tracking-tight">
            Provide Repository Source Evidence
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Files pasted or uploaded here serve as evidence for generating the architectural guide.
          </p>
        </div>

        <button
          type="button"
          onClick={addFile}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#1a1d28] hover:bg-[#222634] border border-white/10 text-xs font-mono text-white transition-colors cursor-pointer self-start sm:self-auto"
        >
          <FilePlus2 size={14} className="text-emerald-400" />
          <span>Add File</span>
        </button>
      </div>

      {/* Editor Layout: Sidebar + Monaco */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px]">
        {/* Left Files List (4 cols) */}
        <aside className="md:col-span-4 border-b md:border-b-0 md:border-r border-white/[0.08] bg-[#0c0d14] p-3 space-y-1 overflow-y-auto max-h-[420px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.06] text-[10px] font-mono uppercase tracking-wider text-zinc-500">
            <span>Snapshot Files</span>
            <span>{files.length.toString().padStart(2, '0')}</span>
          </div>

          {files.map((file, index) => (
            <button
              type="button"
              key={`${file.file_path}-${index}`}
              onClick={() => setSelectedIndex(index)}
              className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-[4px] text-xs font-mono text-left transition-colors cursor-pointer ${
                index === selectedIndex
                  ? 'bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30'
                  : 'text-zinc-400 hover:bg-white/[0.04] hover:text-white'
              }`}
            >
              <FileCode2 size={14} className={index === selectedIndex ? 'text-emerald-400' : 'text-zinc-500'} />
              <span className="truncate">{file.file_path || 'Untitled file'}</span>
            </button>
          ))}
        </aside>

        {/* Right Editor Frame (8 cols) */}
        <div className="md:col-span-8 flex flex-col bg-[#10121a]">
          {/* File Toolbar */}
          <div className="flex items-center justify-between p-3 border-b border-white/[0.08] bg-[#141622] gap-2">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">Path:</span>
              <input
                value={selected.file_path}
                onChange={(e) => updateFile({ file_path: e.target.value })}
                className="w-full bg-[#181a26] border border-white/10 rounded-[3px] px-2.5 py-1 text-xs text-white font-mono focus:border-emerald-500/40 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono text-zinc-400 px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                {lineCount} lines
              </span>

              <button
                type="button"
                onClick={copyContent}
                title="Copy content"
                className="p-1.5 rounded-[3px] bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors border border-white/[0.06]"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Clipboard size={13} />}
              </button>

              <button
                type="button"
                onClick={removeFile}
                disabled={files.length === 1}
                title="Remove file"
                className="p-1.5 rounded-[3px] bg-red-500/10 hover:bg-red-500/20 text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-red-500/20"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-[300px]">
            <Editor
              height="300px"
              language={languageFor(selected.file_path)}
              theme={state.theme === 'dark' ? 'vs-dark' : 'light'}
              value={selected.file_content}
              onChange={(value) => updateFile({ file_content: value || '' })}
              options={{
                lineNumbers: 'on',
                minimap: { enabled: false },
                wordWrap: 'on',
                fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
                padding: { top: 12, bottom: 12 },
              }}
            />
          </div>
        </div>
      </div>

      {/* Footer Save Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-t border-white/[0.08] bg-[#12141e] gap-3">
        <p className="text-xs text-zinc-400">
          Source snapshot is retained locally in memory/database for architectural parsing.
        </p>

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-[4px] bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium text-xs shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          {saving ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          <span>{saving ? 'Saving Snapshot...' : 'Save & Update Evidence'}</span>
        </button>
      </div>
    </div>
  )
}
