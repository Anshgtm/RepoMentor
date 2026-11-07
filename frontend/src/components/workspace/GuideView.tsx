import {
  Check,
  CheckCircle2,
  CircleDashed,
  Copy,
  Download,
  Github,
  BookOpen,
  Terminal,
  FileCode,
  Sparkles,
  HelpCircle,
} from 'lucide-react'
import { useState } from 'react'
import type { Guide } from '../../types/api'

export function GuideView({ data }: { data: Guide }) {
  const [copied, setCopied] = useState(false)

  const sections: { title: string; text: string; icon: React.ReactNode }[] = [
    { title: 'Overview', text: data.guide.overview_content, icon: <BookOpen size={16} className="text-emerald-400" /> },
    { title: 'Getting Started', text: data.guide.getting_started_content, icon: <Terminal size={16} className="text-blue-400" /> },
    { title: 'How to Contribute', text: data.guide.how_to_contribute_content, icon: <Sparkles size={16} className="text-amber-400" /> },
    { title: 'Open Questions', text: data.guide.open_questions_content, icon: <HelpCircle size={16} className="text-purple-400" /> },
  ]

  const copyGuide = async () => {
    const content = [
      ...sections.map((s) => `${s.title}\n${s.text}`),
      `Setup Checklist\n${data.guide.setup_checklist
        .map((item) => `${item.status === 'found' ? '[x]' : '[ ]'} ${item.label}: ${item.instructions}`)
        .join('\n')}`,
    ].join('\n\n')
    await navigator.clipboard?.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const foundCount = data.guide.setup_checklist.filter((item) => item.status === 'found').length

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] my-6">
      {/* Main Guide Content */}
      <article className="space-y-6">
        {/* Header */}
        <div className="rounded-lg border border-white/10 bg-[#0f1118] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[2px]">
                Contributor Guide
              </span>
              <span className="text-xs font-mono text-zinc-500">
                Generated {new Date(data.guide.generated_at).toLocaleDateString()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              A Practical Guide for {data.repository.repository_name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#1a1d28] hover:bg-[#242938] border border-white/10 text-xs font-mono text-white transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] bg-[#1a1d28] hover:bg-[#242938] border border-white/10 text-xs font-mono text-white transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Print / PDF</span>
            </button>
          </div>
        </div>

        {/* Project Purpose */}
        {data.guide.project_description && (
          <div className="rounded-lg border border-white/10 bg-[#11131c] p-5 shadow-sm space-y-2">
            <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
              Project Purpose
            </span>
            <p className="text-sm text-zinc-200 leading-relaxed font-sans">
              {data.guide.project_description}
            </p>
          </div>
        )}

        {/* Setup Checklist */}
        <div className="rounded-lg border border-white/10 bg-[#0f1118] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div>
              <h3 className="text-base font-bold text-white">Setup Checklist</h3>
              <p className="text-xs text-zinc-400 mt-0.5">From clone to first successful local run</p>
            </div>
            <span className="font-mono text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-[3px]">
              {foundCount} / {data.guide.setup_checklist.length} verified signals
            </span>
          </div>

          <div className="space-y-3">
            {data.guide.setup_checklist.map((item) => (
              <div
                key={item.id}
                className={`p-3.5 rounded-md border transition-all flex items-start gap-3 ${
                  item.status === 'found'
                    ? 'border-emerald-500/25 bg-emerald-500/5'
                    : 'border-white/[0.08] bg-white/[0.02]'
                }`}
              >
                <div className="mt-0.5 flex-shrink-0">
                  {item.status === 'found' ? (
                    <CheckCircle2 size={16} className="text-emerald-400" />
                  ) : (
                    <CircleDashed size={16} className="text-zinc-500" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-xs font-semibold text-white">{item.label}</strong>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-[2px] ${
                        item.status === 'found'
                          ? 'text-emerald-300 bg-emerald-500/15'
                          : 'text-zinc-400 bg-zinc-800'
                      }`}
                    >
                      {item.status === 'found' ? 'Detected' : 'Pending Manual Step'}
                    </span>
                  </div>

                  <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                    {item.instructions}
                  </p>

                  {item.evidence.length > 0 && (
                    <div className="pt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-mono text-zinc-500">Evidence:</span>
                      {item.evidence.map((ev, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-[2px] bg-white/[0.05] border border-white/[0.08] text-[10px] font-mono text-zinc-300"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        {sections.map((section) => (
          <div
            key={section.title}
            className="rounded-lg border border-white/10 bg-[#0f1118] p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.06]">
              {section.icon}
              <h3 className="text-sm font-bold text-white tracking-tight">{section.title}</h3>
            </div>
            <p className="text-xs text-zinc-300 whitespace-pre-line leading-relaxed font-sans">
              {section.text}
            </p>
          </div>
        ))}
      </article>

      {/* Right Column: Repository Structure */}
      <aside className="space-y-4 h-fit">
        <div className="rounded-lg border border-white/10 bg-[#0f1118] p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <FileCode size={15} className="text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Repository Structure</h3>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {data.guide.repository_structure.length} paths
            </span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {data.guide.repository_structure.map((item) => (
              <div
                key={item.file_path}
                className="p-3 rounded-md bg-[#12141e] border border-white/[0.06] hover:border-white/15 transition-all space-y-1"
              >
                <code className="text-xs font-mono text-emerald-300 font-semibold block truncate">
                  {item.file_path}
                </code>
                <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                  {item.role_description}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/[0.06] flex items-center gap-2 text-xs font-mono text-zinc-500">
            <Github size={13} />
            <span>Source snapshot accepted {new Date(data.source_snapshot.accepted_at).toLocaleDateString()}</span>
          </div>
        </div>
      </aside>
    </div>
  )
}
