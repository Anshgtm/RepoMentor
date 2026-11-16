import { useState } from 'react'
import {
  Sparkles,
  Send,
  MessageSquare,
  FileCode,
  Check,
  Copy,
  Terminal,
  HelpCircle,
  Lightbulb,
  Cpu,
  RefreshCw,
  Layers,
  Route,
  ArrowRight,
  ExternalLink,
  Globe,
  Database,
  Search,
  BookOpen,
  Users,
  Target,
  Wrench,
  FolderTree,
  PlayCircle,
} from 'lucide-react'
import { api } from '../../lib/api'
import type { RagAnswer, RagSummary, Workspace } from '../../types/api'

const SUGGESTED_QUESTIONS = [
  '💡 Explain this project like I am 5',
  '🚀 Where does execution start?',
  '🔐 How does authentication & login work?',
  '🗄️ What database or storage is used?',
  '📁 Explain the folder structure and file roles',
  '🛠️ How can I run and test this locally?',
]

export function RagAssistant({
  workspace,
}: {
  workspace: Workspace
}) {
  const [mode, setMode] = useState<'qa' | 'summary'>('qa')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [answers, setAnswers] = useState<RagAnswer[]>([])
  const [summary, setSummary] = useState<RagSummary | null>(null)
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const [webUrl, setWebUrl] = useState('')
  const [loadingWebUrl, setLoadingWebUrl] = useState(false)
  const [loadedUrls, setLoadedUrls] = useState<string[]>([])
  const [urlStatus, setUrlStatus] = useState<string | null>(null)

  const handleAsk = async (questionText?: string) => {
    const q = (questionText || query).trim()
    if (!q || loading) return

    setLoading(true)
    if (!questionText) setQuery('')

    try {
      const res = await api.post<RagAnswer>(
        `/repository-workspaces/${workspace.id}/rag/ask`,
        { query: q }
      )
      setAnswers((prev) => [res.data, ...prev])
    } catch (err) {
      console.error(err)
      setAnswers((prev) => [
        {
          answer:
            'Unable to reach the Python RAG model. Ensure the LangChain FAISS service is active on port 8001.',
          simplest_explanation: 'Error connecting to RAG backend.',
          sources: [],
          model_mode: 'teacher_local_rag',
          query: q,
        },
        ...prev,
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateSummary = async () => {
    setSummaryLoading(true)
    try {
      const res = await api.get<RagSummary>(
        `/repository-workspaces/${workspace.id}/rag/summary`
      )
      setSummary(res.data)
      setMode('summary')
    } catch (err) {
      console.error(err)
    } finally {
      setSummaryLoading(false)
    }
  }

  const handleLoadUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const target = webUrl.trim()
    if (!target || loadingWebUrl) return

    setLoadingWebUrl(true)
    setUrlStatus(null)

    try {
      const res = await api.post<{ status: string; url: string; title?: string; chunks_added?: number }>(
        `/repository-workspaces/${workspace.id}/rag/load-url`,
        { url: target }
      )
      if (res.data.status === 'success') {
        setLoadedUrls((prev) => (prev.includes(target) ? prev : [...prev, target]))
        setUrlStatus(`Ingested "${res.data.title || target}" into FAISS Vector DB (${res.data.chunks_added || 1} chunks)`)
        setWebUrl('')
      } else {
        setUrlStatus(`Loaded ${target}`)
      }
    } catch (err: any) {
      setUrlStatus(`Failed to load URL: ${err.response?.data?.detail || err.message}`)
    } finally {
      setLoadingWebUrl(false)
    }
  }

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="p-6 rounded-[8px] border border-white/[0.08] bg-[#141416] space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 font-mono text-[11px] font-semibold">
              <Cpu size={12} />
              <span>CORE PHILOSOPHY • SIMPLE REPOSITORY UNDERSTANDING</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-heading">
              RepoMentor Coding Mentor
            </h2>
            <p className="text-xs sm:text-[13px] text-zinc-300 font-sans leading-relaxed max-w-2xl">
              Like a personal senior coding mentor who has studied this entire repository. Explaining what code does, why it exists, and how it works in simple English without gatekeeping jargon.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={summaryLoading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <Sparkles size={14} className={summaryLoading ? 'animate-spin' : ''} />
              <span>{summaryLoading ? 'Synthesizing...' : '8-Part Beginner Overview'}</span>
            </button>
          </div>
        </div>

        {/* Feature Badges */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-white/[0.06] text-[11px] font-mono text-zinc-400">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-emerald-400">
            <Database size={12} /> FAISS Vector DB (384-D)
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-blue-400">
            <Globe size={12} /> LangChain WebLoader
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-purple-400">
            <FolderTree size={12} /> File Responsibilities
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-amber-400">
            <Route size={12} /> Full Workflow Tracing
          </span>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setMode('qa')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
              mode === 'qa'
                ? 'bg-white/[0.1] text-white border border-white/[0.12] shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <MessageSquare size={13} />
            <span>Ask Mentor Anything</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('summary')
              if (!summary) handleGenerateSummary()
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all cursor-pointer ${
              mode === 'summary'
                ? 'bg-white/[0.1] text-white border border-white/[0.12] shadow-sm font-semibold'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <BookOpen size={13} />
            <span>Beginner Repository Guide</span>
          </button>
        </div>
      </div>

      {/* Website & Documentation URL Loader */}
      <div className="p-5 rounded-[8px] border border-white/[0.08] bg-[#141416] space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Globe size={15} className="text-emerald-400" />
            <span>Ingest Website &amp; Documentation via URL (LangChain WebLoader)</span>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded">
            Live Web Crawl
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          Load project documentation, wikis, or live websites into the FAISS vector database to enrich explanations beyond source code alone.
        </p>
        <form onSubmit={handleLoadUrl} className="flex gap-2">
          <input
            type="url"
            value={webUrl}
            onChange={(e) => setWebUrl(e.target.value)}
            placeholder="Paste website URL (e.g. https://expressjs.com or https://docs.github.com)..."
            className="flex-1 rounded-[6px] border border-white/10 bg-[#0d0f14] py-2 px-3 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 font-mono"
          />
          <button
            type="submit"
            disabled={loadingWebUrl || !webUrl.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black text-xs font-semibold transition-all cursor-pointer shrink-0"
          >
            {loadingWebUrl ? <RefreshCw size={13} className="animate-spin" /> : <Globe size={13} />}
            <span>{loadingWebUrl ? 'Ingesting...' : 'Ingest URL'}</span>
          </button>
        </form>
        {urlStatus && (
          <div className="p-2.5 rounded-[4px] border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono flex items-center justify-between">
            <span>{urlStatus}</span>
            <button
              type="button"
              onClick={() => setUrlStatus(null)}
              className="text-zinc-400 hover:text-white cursor-pointer ml-2"
            >
              ✕
            </button>
          </div>
        )}
        {loadedUrls.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
            <span className="text-zinc-500 font-mono text-[11px]">Indexed Web Sources:</span>
            {loadedUrls.map((u, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono truncate max-w-xs"
              >
                {u}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Mode 1: Interactive Q&A */}
      {mode === 'qa' && (
        <div className="space-y-6">
          {/* Ask Input Card */}
          <div className="p-5 rounded-[8px] border border-white/[0.08] bg-[#141416] space-y-4 shadow-sm">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleAsk()
              }}
              className="space-y-3"
            >
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask anything about this repo (e.g. 'How does login work?', 'Explain server.ts like a teacher')..."
                  className="w-full rounded-[6px] border border-white/10 bg-[#0d0f14] py-3 pl-4 pr-12 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-emerald-500/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/20 font-sans"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-[4px] bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black flex items-center justify-center transition-all cursor-pointer"
                  title="Ask Mentor"
                >
                  <Send size={14} className={loading ? 'animate-pulse' : ''} />
                </button>
              </div>

              {/* Suggestions */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-zinc-500 font-mono text-[11px]">Teacher Suggestions:</span>
                {SUGGESTED_QUESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAsk(suggestion.replace(/^[^\w]+/, ''))}
                    className="px-2.5 py-1 rounded-full border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors cursor-pointer text-[11px]"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </form>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="p-6 rounded-[8px] border border-emerald-500/30 bg-[#141416] flex items-center gap-3 text-emerald-400 animate-pulse text-xs font-mono">
              <RefreshCw size={15} className="animate-spin text-emerald-400" />
              <span>Personal Coding Mentor studying code evidence and preparing simple teacher breakdown...</span>
            </div>
          )}

          {/* Q&A Thread */}
          {answers.length > 0 ? (
            <div className="space-y-4">
              {answers.map((item, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-[8px] border border-white/[0.08] bg-[#141416] space-y-4 shadow-sm"
                >
                  {/* Query Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center text-xs font-bold font-mono">
                        Q
                      </div>
                      <h4 className="text-sm font-semibold text-white font-sans">
                        {item.query}
                      </h4>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(item.answer, idx)}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title="Copy answer"
                    >
                      {copiedIdx === idx ? (
                        <Check size={13} className="text-emerald-400" />
                      ) : (
                        <Copy size={13} />
                      )}
                      <span>{copiedIdx === idx ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* Quick Simplest Takeaway Callout */}
                  {item.simplest_explanation && (
                    <div className="p-3.5 rounded-[6px] border border-emerald-500/20 bg-emerald-500/[0.06] text-xs font-sans text-zinc-200 flex items-start gap-2.5">
                      <Lightbulb size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-emerald-300 font-semibold block mb-0.5 font-mono text-[11px] uppercase tracking-wider">
                          Simplest Takeaway
                        </strong>
                        <span>{item.simplest_explanation}</span>
                      </div>
                    </div>
                  )}

                  {/* Teacher Formatted Answer Sections */}
                  <TeacherAnswerView rawAnswer={item.answer} />

                  {/* Cited Code Sources */}
                  {item.sources && item.sources.length > 0 && (
                    <div className="pt-3 border-t border-white/[0.06] space-y-2">
                      <div className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FileCode size={12} className="text-emerald-400" />
                        <span>Verified Repository Evidence ({item.sources.length} Chunks Retained)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {item.sources.map((src, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2.5 rounded-[4px] border border-white/[0.06] bg-[#0c0e14] text-xs font-mono space-y-1"
                          >
                            <div className="flex items-center justify-between text-zinc-300 font-semibold">
                              <span className="truncate text-emerald-400">{src.file_path}</span>
                              <span className="text-[10px] text-zinc-500 shrink-0">
                                lines {src.start_line}-{src.end_line}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 font-sans line-clamp-2">
                              {src.preview}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="p-8 rounded-[8px] border border-white/[0.06] bg-[#141416] text-center space-y-2">
                <HelpCircle size={24} className="mx-auto text-zinc-600" />
                <h4 className="text-sm font-semibold text-white">Ask your personal mentor anything</h4>
                <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                  Click any suggested teacher prompt above or ask how any folder, workflow, API endpoint, or authentication sequence works in simple language.
                </p>
              </div>
            )
          )}
        </div>
      )}

      {/* Mode 2: The 8-Part Beginner Repository Guide */}
      {mode === 'summary' && (
        <div className="space-y-6">
          {summary ? (
            <div className="space-y-6">
              {/* Question 1: What is this project? */}
              <div className="p-6 rounded-[8px] border border-emerald-500/30 bg-[#141416] space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold">
                  <Sparkles size={14} />
                  <span>1. WHAT IS THIS PROJECT?</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white font-heading leading-snug">
                  {summary.what_is_this_project || summary.headline}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {summary.free_guarantee}
                </p>
              </div>

              {/* Question 2 & 3: Problem Solved & Target Users */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-[8px] border border-white/[0.08] bg-[#141416] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                    <Target size={14} />
                    <span>2. What Problem Does It Solve?</span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-zinc-300 font-sans leading-relaxed">
                    {summary.problem_it_solves || 'Eliminates developer confusion, automates repetitive setup, and makes complex code clear.'}
                  </p>
                </div>

                <div className="p-5 rounded-[8px] border border-white/[0.08] bg-[#141416] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-blue-400">
                    <Users size={14} />
                    <span>3. Who Is This Useful For?</span>
                  </div>
                  <p className="text-xs sm:text-[13px] text-zinc-300 font-sans leading-relaxed">
                    {summary.who_is_it_for || summary.target_audience || 'Developers, students, contributors, and software teams.'}
                  </p>
                </div>
              </div>

              {/* Question 4: Which Technologies are Used & Why? */}
              <div className="p-6 rounded-[8px] border border-white/[0.08] bg-[#141416] space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-purple-400">
                  <Wrench size={14} />
                  <span>4. Which Technologies Are Used &amp; Why?</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {(summary.technologies_used && summary.technologies_used.length > 0
                    ? summary.technologies_used
                    : summary.tech_stack.map((t) => ({ name: t, reason: 'Essential library powering application capabilities.' }))
                  ).map((tech, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-[6px] border border-white/[0.06] bg-[#0c0e14] space-y-1"
                    >
                      <span className="text-xs font-bold text-white font-mono block">
                        {tech.name}
                      </span>
                      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                        {tech.reason}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 5: What are the Main Features? */}
              {summary.main_features && summary.main_features.length > 0 && (
                <div className="p-6 rounded-[8px] border border-white/[0.08] bg-[#141416] space-y-3">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-amber-400">
                    <Sparkles size={14} />
                    <span>5. What Are The Main Features?</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {summary.main_features.map((feat, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-[4px] border border-white/[0.06] bg-[#0c0e14] flex items-start gap-2.5 text-xs text-zinc-300 font-sans"
                      >
                        <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Question 6: Folder Structure & Real File Responsibilities (Requirement 3) */}
              <div className="p-6 rounded-[8px] border border-white/[0.08] bg-[#141416] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                    <FolderTree size={14} />
                    <span>6. Folder Structure &amp; File Responsibilities</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">No Blank Filenames · Real Explanations</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Every folder and file exists for a reason. Here is what the key paths actually do based on codebase evidence:
                </p>

                <div className="space-y-2.5">
                  {(summary.folder_explanations || [
                    { path: 'src/', responsibility: 'The main workspace where all custom components and business logic are created.' },
                    { path: 'package.json', responsibility: 'The project recipe book listing commands and third-party tools.' },
                  ]).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-[6px] border border-white/[0.06] bg-[#0c0e14] space-y-1"
                    >
                      <div className="text-xs font-mono font-bold text-emerald-400">
                        {item.path}
                      </div>
                      <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                        {item.responsibility}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 7: How Do The Different Parts Work Together? */}
              <div className="p-6 rounded-[8px] border border-white/[0.08] bg-[#141416] space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-blue-400">
                  <Route size={14} />
                  <span>7. How Do The Different Parts Work Together?</span>
                </div>

                <div className="space-y-2.5">
                  {(summary.how_parts_work_together || [
                    { step: 1, title: 'User Input', explanation: 'You click a button or type in the browser.' },
                    { step: 2, title: 'Backend Logic', explanation: 'The server verifies your input and runs calculation rules.' },
                    { step: 3, title: 'Data Check', explanation: 'The server retrieves or updates records safely.' },
                    { step: 4, title: 'Friendly Output', explanation: 'The browser displays clear visual results.' },
                  ]).map((part, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-[6px] border border-white/[0.06] bg-[#0c0e14] flex items-start gap-3 text-xs text-zinc-200 font-sans"
                    >
                      <div className="w-6 h-6 rounded-[4px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5">
                        {part.step || idx + 1}
                      </div>
                      <div>
                        {part.title && (
                          <span className="font-semibold text-white block mb-0.5 font-sans">
                            {part.title}
                          </span>
                        )}
                        <p className="text-zinc-300 leading-relaxed">{part.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Question 8: How Can Someone Run This Project Locally? */}
              <div className="p-6 rounded-[8px] border border-white/[0.08] bg-[#141416] space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                  <PlayCircle size={14} />
                  <span>8. How Can Someone Run This Project Locally?</span>
                </div>

                <div className="space-y-3">
                  {(summary.how_to_run_locally || [
                    { step: 1, command: 'npm install', explanation: 'Download supporting libraries.' },
                    { step: 2, command: 'npm run dev', explanation: 'Start local development server.' },
                  ]).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-[6px] border border-white/[0.06] bg-[#0c0e14] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-zinc-400">Step {item.step || idx + 1}:</span>
                        <code className="text-xs font-mono text-emerald-300 bg-black/40 px-2 py-0.5 rounded border border-white/10">
                          {item.command}
                        </code>
                      </div>
                      <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                        {item.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 rounded-[8px] border border-white/[0.06] bg-[#141416] text-center space-y-3">
              <Sparkles size={28} className="mx-auto text-emerald-400" />
              <h4 className="text-base font-semibold text-white">Generate 8-Part Beginner Repository Guide</h4>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                Click below to synthesize a comprehensive, beginner-friendly guide answering the 8 core repository questions with real file responsibilities.
              </p>
              <button
                type="button"
                onClick={handleGenerateSummary}
                disabled={summaryLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[4px] bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                {summaryLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
                <span>{summaryLoading ? 'Synthesizing Guide...' : 'Generate 8-Part Guide'}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Beautiful Teacher Answer Layout parser
 * Parses and elegantly styles:
 * - What it means
 * - How it works
 * - Files involved
 * - Simple example / Analogy
 * - In short
 */
function TeacherAnswerView({ rawAnswer }: { rawAnswer: string }) {
  // If the answer uses standard ### section headers, render them as distinct cards
  if (rawAnswer.includes('### What it means') || rawAnswer.includes('### How it works')) {
    const sections = rawAnswer.split(/###\s+/).filter(Boolean)

    return (
      <div className="space-y-3 pt-1">
        {sections.map((sec, i) => {
          const lines = sec.trim().split('\n')
          const title = lines[0].trim()
          const body = lines.slice(1).join('\n').trim()

          const isWhat = title.toLowerCase().includes('what it means')
          const isHow = title.toLowerCase().includes('how it works')
          const isFiles = title.toLowerCase().includes('files involved')
          const isExample = title.toLowerCase().includes('example') || title.toLowerCase().includes('analogy')
          const isShort = title.toLowerCase().includes('in short')

          return (
            <div
              key={i}
              className={`p-4 rounded-[6px] border ${
                isWhat
                  ? 'border-emerald-500/25 bg-emerald-500/[0.04]'
                  : isExample
                  ? 'border-amber-500/20 bg-amber-500/[0.03]'
                  : isShort
                  ? 'border-blue-500/20 bg-blue-500/[0.03]'
                  : 'border-white/[0.06] bg-[#0c0e14]'
              } space-y-1.5`}
            >
              <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-wider">
                {isWhat && <Lightbulb size={13} className="text-emerald-400" />}
                {isHow && <Route size={13} className="text-purple-400" />}
                {isFiles && <FolderTree size={13} className="text-blue-400" />}
                {isExample && <Sparkles size={13} className="text-amber-400" />}
                {isShort && <Check size={13} className="text-emerald-400" />}
                <span
                  className={
                    isWhat
                      ? 'text-emerald-300'
                      : isExample
                      ? 'text-amber-300'
                      : isShort
                      ? 'text-blue-300'
                      : 'text-zinc-200'
                  }
                >
                  {title}
                </span>
              </div>
              <div className="text-xs sm:text-[13px] text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap">
                {body}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // Fallback if not using headers
  return (
    <div className="text-xs sm:text-[13px] text-zinc-300 font-sans leading-relaxed whitespace-pre-wrap pt-1">
      {rawAnswer}
    </div>
  )
}
