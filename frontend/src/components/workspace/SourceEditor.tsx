import { useMemo, useState } from 'react'
import Editor from '@monaco-editor/react'
import { Clipboard, FileCode2, FilePlus2, Trash2 } from 'lucide-react'
import type { SourceFile } from '../../types/api'
import { useAppState } from '../../state/AppState'

type Props = { files: SourceFile[]; onChange: (files: SourceFile[]) => void; onSave: () => void; saving: boolean }

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
  const selected = files[selectedIndex] || files[0]
  const lineCount = useMemo(() => selected?.file_content.split('\n').length || 0, [selected])
  const updateFile = (patch: Partial<SourceFile>) => onChange(files.map((file, index) => index === selectedIndex ? { ...file, ...patch } : file))
  const addFile = () => { onChange([...files, { file_path: `notes-${files.length + 1}.md`, file_content: '# Notes\n' }]); setSelectedIndex(files.length) }
  const removeFile = () => { if (files.length === 1) return; onChange(files.filter((_, index) => index !== selectedIndex)); setSelectedIndex(Math.max(0, selectedIndex - 1)) }
  const copyContent = async () => { if (selected) await navigator.clipboard?.writeText(selected.file_content) }
  if (!selected) return null
  return <section className="panel source-workbench"><div className="source-header"><div><p className="eyebrow">01 / Source snapshot</p><h2 className="mt-2 text-2xl font-medium">Give the guide evidence.</h2></div><button className="button-secondary compact-button" type="button" onClick={addFile}><FilePlus2 size={15}/> Add file</button></div><div className="source-layout"><aside className="file-sidebar"><div className="file-sidebar-heading"><span>Files</span><span>{files.length.toString().padStart(2, '0')}</span></div>{files.map((file, index) => <button type="button" className={`file-item ${index === selectedIndex ? 'is-selected' : ''}`} key={`${file.file_path}-${index}`} onClick={() => setSelectedIndex(index)}><FileCode2 size={15}/><span>{file.file_path || 'Untitled file'}</span></button>)}</aside><div className="editor-pane"><div className="file-toolbar"><label>Selected file<input value={selected.file_path} onChange={event => updateFile({ file_path: event.target.value })}/></label><div className="file-actions"><button className="icon-button" type="button" title="Copy file content" onClick={copyContent}><Clipboard size={15}/></button><button className="icon-button danger-button" type="button" title="Remove file" onClick={removeFile} disabled={files.length === 1}><Trash2 size={15}/></button></div></div><div className="editor-frame"><Editor height="300px" language={languageFor(selected.file_path)} theme={state.theme === 'dark' ? 'vs-dark' : 'light'} value={selected.file_content} onChange={value => updateFile({ file_content: value || '' })}/></div><div className="editor-footer"><span>{languageFor(selected.file_path)} · {lineCount} lines</span><span>Local source only</span></div></div></div><div className="source-footer"><p>Files are used as evidence for the guide and are not fetched from GitHub.</p><button className="button-primary" onClick={onSave} disabled={saving}>{saving ? 'Saving snapshot...' : 'Accept source snapshot'}</button></div></section>
}
