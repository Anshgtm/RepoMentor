import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  GitBranch,
  FolderTree,
  ExternalLink,
  Code2,
  Route,
  BookOpen,
  FileCode2,
  Layers,
  Command,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Play,
  Pause,
  FolderGit2,
  Github,
  Compass,
} from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Shell } from '../components/layout/Shell'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { useAppState } from '../state/AppState'
import type { Workspace } from '../types/api'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const PIPELINE_STAGES = [
  {
    step: '01',
    phase: 'Reading Code',
    title: 'Read & index files safely',
    detail: 'Scans source files, folder layouts, and imports like reading chapters in a book—without running any untrusted code.',
    summary: 'Source files ➔ Clean index',
    icon: BookOpen,
  },
  {
    step: '02',
    phase: 'Mapping Links',
    title: 'Connect how files relate',
    detail: 'Maps out which files import and depend on each other, showing how modules fit together.',
    summary: 'Dependencies ➔ Visual map',
    icon: GitBranch,
  },
  {
    step: '03',
    phase: 'Entry Points',
    title: 'Find where execution starts',
    detail: 'Locates main starting files—such as web servers, route hubs, and CLI commands—where the application boots up.',
    summary: 'Structure ➔ Starting door',
    icon: Route,
  },
  {
    step: '04',
    phase: 'Tracing Flows',
    title: 'Follow user actions to data',
    detail: 'Traces complete execution paths from a user click on screen down through backend services to database records.',
    summary: 'Button click ➔ Database record',
    icon: Compass,
  },
  {
    step: '05',
    phase: 'Beginner Guide',
    title: 'Generate plain English guide',
    detail: 'Translates architectural connections into simple explanations, real-world analogies, and a prioritized reading sequence.',
    summary: 'Codebase ➔ Beginner guide',
    icon: Sparkles,
  },
]

type FileNode = {
  path: string
  name: string
  role: string
  lines: number
  code: string
  flow: string[]
}

const ARC_FILES: Record<string, FileNode> = {
  'server.ts': {
    path: 'src/server.ts',
    name: 'server.ts',
    role: 'Application Entry Point',
    lines: 48,
    code: `import express from 'express'\nimport { apiRoutes } from './routes/api.routes'\nimport { connectDatabase } from './services/db'\n\nexport const app = express()\napp.use(express.json())\napp.use('/api', apiRoutes)\n\nexport async function bootstrap() {\n  await connectDatabase()\n  app.listen(8000, () => console.log('Listening on :8000'))\n}\nbootstrap()`,
    flow: [
      'Client sends HTTP request to the server',
      'Express parses the incoming JSON request body',
      'Matches route path and hands off to apiRoutes',
      'Dispatches to business logic service layer',
    ],
  },
  'api.routes.ts': {
    path: 'src/routes/api.routes.ts',
    name: 'api.routes.ts',
    role: 'Route Controller',
    lines: 92,
    code: `import { Router } from 'express'\nimport { WorkspaceService } from '../services/workspace.service'\n\nexport const apiRoutes = Router()\n\napiRoutes.post('/workspaces/:id/guide', async (req, res) => {\n  const guide = await WorkspaceService.buildGuide(req.params.id)\n  res.json({ status: 'ok', guide })\n})`,
    flow: [
      'Receives POST /workspaces/:id/guide',
      'Extracts workspace ID from request parameters',
      'Calls WorkspaceService.buildGuide()',
      'Returns JSON response with generated guide',
    ],
  },
  'workspace.service.ts': {
    path: 'src/services/workspace.service.ts',
    name: 'workspace.service.ts',
    role: 'Core Business Logic',
    lines: 184,
    code: `import { Workspace } from '../models/Workspace'\nimport { parseAST } from '../lib/parser'\n\nexport class WorkspaceService {\n  static async buildGuide(workspaceId: string) {\n    const workspace = await Workspace.findById(workspaceId)\n    const entrypoints = await parseAST(workspace.files)\n    return { workspaceId, entrypoints, generatedAt: new Date() }\n  }\n}`,
    flow: [
      'Queries workspace metadata from database',
      'Scans files for primary entrypoints and routes',
      'Constructs step-by-step reading order',
      'Persists guide snapshot with timestamp',
    ],
  },
  'Workspace.ts': {
    path: 'src/models/Workspace.ts',
    name: 'Workspace.ts',
    role: 'Database Schema',
    lines: 44,
    code: `import { Schema, model } from 'mongoose'\n\nconst WorkspaceSchema = new Schema({\n  name: { type: String, required: true },\n  gitUrl: { type: String },\n  status: { type: String, default: 'pending' },\n  entryPoints: [String],\n  createdAt: { type: Date, default: Date.now }\n})\n\nexport const Workspace = model('Workspace', WorkspaceSchema)`,
    flow: [
      'Defines database fields for saved workspaces',
      'Enforces name and repository URL attributes',
      'Indexes by workspace ID for instant lookup',
    ],
  },
}

function getWorkspaceLanguage(ws: Workspace): string {
  if (ws.language) return ws.language
  const url = (ws.github_repository_url || ws.repository_name || '').toLowerCase()
  if (url.includes('express') || url.includes('fastify') || url.includes('node') || url.includes('javascript') || url.includes('js')) return 'JavaScript'
  if (url.includes('react') || url.includes('next') || url.includes('typescript') || url.includes('ts')) return 'TypeScript'
  if (url.includes('python') || url.includes('django') || url.includes('flask') || url.includes('fastapi')) return 'Python'
  if (url.includes('rust') || url.includes('cargo')) return 'Rust'
  if (url.includes('go') || url.includes('golang')) return 'Go'
  return 'TypeScript'
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return 'Recently'
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return 'Recently'
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  } catch {
    return 'Recently'
  }
}

function getStatusBadge(state: string) {
  if (state === 'guide_generated') {
    return {
      label: 'Analyzed',
      dotClass: 'bg-emerald-400',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    }
  }
  if (state === 'source_ready') {
    return {
      label: 'Indexed',
      dotClass: 'bg-sky-400',
      badgeClass: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    }
  }
  return {
    label: 'Draft',
    dotClass: 'bg-zinc-400',
    badgeClass: 'bg-zinc-800 text-zinc-400 border border-white/10',
  }
}

export function HomePage() {
  const { data = [], isLoading } = useWorkspaces()
  const { state } = useAppState()
  const navigate = useNavigate()
  const [quickUrl, setQuickUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<string>('server.ts')
  const [activeTab, setActiveTab] = useState<'syntax' | 'flow' | 'guide'>('syntax')
  const [activeSpace, setActiveSpace] = useState<'atlas' | 'routes' | 'models'>('atlas')
  const [activeStage, setActiveStage] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(false)

  const heroRef = useRef<HTMLDivElement>(null)
  const problemRef = useRef<HTMLDivElement>(null)
  const pipelineRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const workbenchRef = useRef<HTMLDivElement>(null)
  const viewportContentRef = useRef<HTMLDivElement>(null)
  const spacesRef = useRef<HTMLDivElement>(null)

  const activeNode = ARC_FILES[selectedFile] || ARC_FILES['server.ts']

  // Auto-tour timer for Code Breakdown section
  useEffect(() => {
    if (!isAutoPlaying) return
    const interval = setInterval(() => {
      setActiveStage((prev) => {
        const next = (prev + 1) % PIPELINE_STAGES.length
        cardRefs.current[next]?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        })
        return next
      })
    }, 2800)
    return () => clearInterval(interval)
  }, [isAutoPlaying])

  // GSAP Animations and ScrollTriggers
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero entrance stagger
      if (heroRef.current) {
        gsap.from(heroRef.current.children, {
          y: 24,
          opacity: 0,
          duration: 0.75,
          stagger: 0.1,
          ease: 'power3.out',
        })
      }

      // 2. Problem section ScrollTrigger
      if (problemRef.current) {
        gsap.from(problemRef.current.querySelectorAll('.gsap-split-card'), {
          scrollTrigger: {
            trigger: problemRef.current,
            start: 'top 80%',
            once: true,
          },
          y: 24,
          duration: 0.55,
          stagger: 0.12,
          ease: 'power2.out',
          clearProps: 'all',
        })
      }

      // 3. Pipeline Reel ScrollTrigger with Staggered Cards
      if (pipelineRef.current) {
        const headerEl = pipelineRef.current.querySelector('.pipeline-header')
        if (headerEl) {
          gsap.fromTo(
            headerEl,
            { y: 16 },
            {
              y: 0,
              duration: 0.45,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: pipelineRef.current,
                start: 'top 92%',
                once: true,
              },
              clearProps: 'all',
            }
          )
        }

        const cards = pipelineRef.current.querySelectorAll('.pipeline-card')
        if (cards.length > 0) {
          gsap.fromTo(
            cards,
            { y: 20 },
            {
              y: 0,
              duration: 0.5,
              stagger: 0.08,
              ease: 'power2.out',
              scrollTrigger: {
                trigger: pipelineRef.current,
                start: 'top 90%',
                once: true,
              },
              clearProps: 'all',
            }
          )
        }
      }

      // 4. Workbench Window ScrollTrigger
      if (workbenchRef.current) {
        gsap.from(workbenchRef.current, {
          scrollTrigger: {
            trigger: workbenchRef.current,
            start: 'top 85%',
            once: true,
          },
          y: 28,
          duration: 0.65,
          ease: 'power3.out',
          clearProps: 'all',
        })
      }

      // 5. Spaces section ScrollTrigger
      if (spacesRef.current) {
        gsap.from(spacesRef.current.children, {
          scrollTrigger: {
            trigger: spacesRef.current,
            start: 'top 85%',
            once: true,
          },
          y: 24,
          duration: 0.55,
          stagger: 0.1,
          ease: 'power2.out',
          clearProps: 'all',
        })
      }

      // Ensure ScrollTrigger accurately measures scroll offsets upon page refresh
      requestAnimationFrame(() => {
        ScrollTrigger.refresh()
      })
    })

    const refreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh()
    }, 200)

    return () => {
      clearTimeout(refreshTimeout)
      ctx.revert()
    }
  }, [])

  // Smooth micro-animation when active tab or file changes
  useEffect(() => {
    if (viewportContentRef.current) {
      gsap.fromTo(
        viewportContentRef.current,
        { opacity: 0.5, y: 4 },
        { opacity: 1, y: 0, duration: 0.2, ease: 'power2.out' }
      )
    }
  }, [activeTab, selectedFile])

  const scrollTrack = (direction: 'left' | 'right') => {
    if (!trackRef.current) return
    const offset = direction === 'left' ? -360 : 360
    trackRef.current.scrollBy({ left: offset, behavior: 'smooth' })
    setActiveStage((prev) => {
      const next = direction === 'left' ? Math.max(0, prev - 1) : Math.min(PIPELINE_STAGES.length - 1, prev + 1)
      return next
    })
  }

  const selectStage = (idx: number) => {
    setActiveStage(idx)
    cardRefs.current[idx]?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
      inline: 'center',
    })
  }

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!quickUrl.trim()) return
    navigate('/new', { state: { initialUrl: quickUrl.trim() } })
  }

  const selectSample = (url: string) => {
    setQuickUrl(url)
    navigate('/new', { state: { initialUrl: url } })
  }

  const visibleWorkspaces = state.authEmail ? data : []

  return (
    <Shell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8 space-y-20">
        {/* Arc Hero & Command Bar */}
        <section ref={heroRef} className="text-center max-w-4xl mx-auto space-y-6 pt-4">
          <h1 className="font-heading text-4xl sm:text-6xl md:text-[68px] font-bold tracking-tight text-white leading-[1.08]">
            Understand any GitHub repository in plain English.
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-sans">
            RepoMentor turns unfamiliar codebases into structured, beginner-friendly guides—explaining how the code is organized, where execution starts, and how each component works.
          </p>

          {/* Command Bar */}
          <form onSubmit={handleQuickSubmit} className="pt-2 max-w-xl mx-auto">
            <div className="arc-command-bar p-1.5 flex items-center gap-2">
              <div className="pl-3 text-zinc-500">
                <Command size={16} />
              </div>
              <input
                type="text"
                value={quickUrl}
                onChange={(e) => setQuickUrl(e.target.value)}
                placeholder="Paste repository URL (e.g. github.com/organization/repo)..."
                className="w-full bg-transparent border-0 text-sm text-zinc-100 font-mono focus:outline-none placeholder:text-zinc-600"
              />
              <button type="submit" className="arc-btn-primary whitespace-nowrap text-xs py-2 px-3.5 flex-shrink-0">
                Explore Repository ↵
              </button>
            </div>

            {/* Target Presets */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs font-mono text-zinc-500">
              <span>Quick targets:</span>
              <button
                type="button"
                onClick={() => selectSample('https://github.com/expressjs/express')}
                className="hover:text-emerald-400 transition-colors underline underline-offset-4"
              >
                expressjs/express
              </button>
              <span className="text-zinc-700">/</span>
              <button
                type="button"
                onClick={() => selectSample('https://github.com/fastify/fastify')}
                className="hover:text-emerald-400 transition-colors underline underline-offset-4"
              >
                fastify/fastify
              </button>
            </div>
          </form>
        </section>

        {/* Problem Section: Comparison View */}
        <section ref={problemRef} id="why-repomentor" className="space-y-6 scroll-mt-28">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Understanding a new repository shouldn&apos;t feel like solving a puzzle.
            </h2>

            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed font-sans">
              Traditional code exploration forces developers into endless browser tabs, disconnected documentation, and blind trial-and-error.
            </p>
          </div>

          {/* Comparison Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Left: The Challenge */}
            <div className="arc-split-pane gsap-split-card border-white/[0.08] bg-[#141416] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                  <span className="font-heading text-xs font-semibold text-zinc-300">The challenge with new codebases</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">Traditional approach</span>
              </div>
              <div className="space-y-3 text-xs text-zinc-300 font-sans">
                <div className="p-3 rounded-[6px] bg-[#0d0e12] border border-white/[0.05] space-y-1">
                  <strong className="text-zinc-200 block font-heading">Where does execution begin?</strong>
                  <p className="text-zinc-400 text-[12px] leading-relaxed">
                    Opening dozens of tabs trying to guess which configuration loads first and where the true starting point is.
                  </p>
                </div>
                <div className="p-3 rounded-[6px] bg-[#0d0e12] border border-white/[0.05] space-y-1">
                  <strong className="text-zinc-200 block font-heading">How does data move across files?</strong>
                  <p className="text-zinc-400 text-[12px] leading-relaxed">
                    Following a button click or request down to the database requires searching through nested controllers and unlinked layers.
                  </p>
                </div>
                <div className="p-3 rounded-[6px] bg-[#0d0e12] border border-white/[0.05] space-y-1">
                  <strong className="text-zinc-200 block font-heading">Missing or high-level documentation</strong>
                  <p className="text-zinc-400 text-[12px] leading-relaxed">
                    READMEs explain what the software does for users, but rarely explain how internal files interact with each other.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: RepoMentor Guided Approach */}
            <div className="arc-split-pane gsap-split-card border-emerald-500/30 bg-[#141416] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-heading text-xs font-semibold text-emerald-300">How RepoMentor makes it simple</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400/80">Guided mentor</span>
              </div>
              <div className="space-y-3 text-xs text-zinc-300 font-sans">
                <div className="p-3 rounded-[6px] bg-[#0d0e12] border border-emerald-500/10 space-y-1">
                  <strong className="text-emerald-200 block font-heading">Pinpoints the front door</strong>
                  <p className="text-zinc-400 text-[12px] leading-relaxed">
                    Immediately highlights the main bootstrap file, configuration settings, and server listeners in plain English.
                  </p>
                </div>
                <div className="p-3 rounded-[6px] bg-[#0d0e12] border border-emerald-500/10 space-y-1">
                  <strong className="text-emerald-200 block font-heading">Traces complete user workflows</strong>
                  <p className="text-zinc-400 text-[12px] leading-relaxed">
                    Shows step-by-step how user actions travel from the browser through server logic to saved records.
                  </p>
                </div>
                <div className="p-3 rounded-[6px] bg-[#0d0e12] border border-emerald-500/10 space-y-1">
                  <strong className="text-emerald-200 block font-heading">Sequenced beginner reading order</strong>
                  <p className="text-zinc-400 text-[12px] leading-relaxed">
                    Organizes the codebase into an orderly reading sequence so you learn foundational files before complex modules.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pipeline Section: How RepoMentor Works */}
        <section ref={pipelineRef} className="space-y-4 pt-2">
          <div className="pipeline-header flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-1">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-medium mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>HOW IT WORKS</span>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-400">Stage {activeStage + 1} of {PIPELINE_STAGES.length}</span>
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-white">
                How RepoMentor breaks down a repository
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Five clear steps that turn raw source files into beginner-friendly explanations.
              </p>
            </div>

            {/* Stage Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-[#0b0c10] p-1 rounded-[6px] border border-white/[0.08]">
                {PIPELINE_STAGES.map((stg, idx) => (
                  <button
                    key={stg.step}
                    type="button"
                    onClick={() => selectStage(idx)}
                    className={`px-2.5 py-1 rounded-[4px] text-[11px] font-mono transition-all cursor-pointer ${
                      activeStage === idx
                        ? 'bg-zinc-800 text-white font-medium border border-zinc-700'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]'
                    }`}
                    title={stg.title}
                  >
                    {stg.step}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] text-xs font-mono border transition-all cursor-pointer ${
                  isAutoPlaying
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#0f1015] text-zinc-400 border-white/10 hover:border-white/20 hover:text-zinc-200'
                }`}
                aria-label="Toggle auto walkthrough"
              >
                {isAutoPlaying ? <Pause size={12} className="text-emerald-400" /> : <Play size={12} />}
                <span className="hidden sm:inline">{isAutoPlaying ? 'Pause Tour' : 'Auto Tour'}</span>
              </button>

              <button
                type="button"
                onClick={() => scrollTrack('left')}
                className="w-8 h-8 rounded-[4px] border border-white/10 bg-[#0f1015] hover:bg-[#161820] hover:border-white/20 flex items-center justify-center text-zinc-300 transition-all cursor-pointer"
                aria-label="Previous stage"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => scrollTrack('right')}
                className="w-8 h-8 rounded-[4px] border border-white/10 bg-[#0f1015] hover:bg-[#161820] hover:border-white/20 flex items-center justify-center text-zinc-300 transition-all cursor-pointer"
                aria-label="Next stage"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Cards Track */}
          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-2 scroll-smooth snap-x snap-mandatory select-none"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {PIPELINE_STAGES.map((item, idx) => {
              const StageIcon = item.icon
              const isActive = activeStage === idx
              return (
                <div
                  key={item.step}
                  ref={(el) => { cardRefs.current[idx] = el }}
                  onClick={() => selectStage(idx)}
                  className={`pipeline-card min-w-[300px] sm:min-w-[340px] max-w-[340px] flex-shrink-0 snap-start rounded-[8px] border p-5 space-y-4 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'border-emerald-500/40 bg-[#141416] -translate-y-1 shadow-lg'
                      : 'border-zinc-800 hover:border-zinc-700 bg-[#141416]'
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-[3px] text-zinc-300 bg-zinc-800 border border-zinc-700">
                        Stage {item.step}
                      </span>
                      <div className="w-6 h-6 rounded-[4px] bg-zinc-800 border border-white/10 flex items-center justify-center text-emerald-400">
                        <StageIcon size={13} />
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                      {item.phase}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-heading text-sm font-semibold text-white">
                      {item.title}
                    </h4>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                      {item.detail}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] font-mono px-2.5 py-1.5 rounded-[4px] bg-[#0d0e12] border border-white/[0.06] text-zinc-300">
                    <span className="text-emerald-400">➜</span>
                    <span>{item.summary}</span>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono text-zinc-500">
                    <span>Safe &amp; isolated</span>
                    <span className="text-zinc-400">No runtime required</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Interactive Repository Workbench Window */}
        <section ref={workbenchRef} className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
            <span className="flex items-center gap-2 text-zinc-300">
              <Layers size={13} className="text-emerald-400" />
              <span>Interactive Repository Explorer</span>
            </span>
            <span className="text-zinc-500 hidden sm:inline">Select files and tabs to inspect structure</span>
          </div>

          <div className="arc-window-frame">
            {/* Window Chrome Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#101217] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 pr-3 border-r border-white/10">
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
                  <span className="w-2.5 h-2.5 rounded-full bg-zinc-700"></span>
                </div>
                <span className="text-xs font-mono text-zinc-300 truncate">
                  repomentor://sample/{activeNode.path}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                <span className="hidden md:flex items-center gap-1 text-zinc-500">
                  <GitBranch size={12} className="text-zinc-400" />
                  <span>main branch</span>
                </span>
                <span className="text-emerald-400 text-[11px] font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[4px]">
                  Analyzed
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
              {/* Left Sidebar */}
              <div className="md:col-span-4 border-r border-white/[0.08] bg-[#0c0d12] p-3 flex flex-col justify-between text-xs font-mono">
                <div className="space-y-4">
                  {/* Key Components */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-zinc-500 tracking-wider font-semibold px-1">
                      Key Components
                    </span>
                    <button
                      type="button"
                      onClick={() => { setActiveSpace('atlas'); setSelectedFile('server.ts') }}
                      className={`arc-space-tab ${activeSpace === 'atlas' ? 'is-active' : ''}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"></span>
                      <span className="truncate">Server Entrypoint</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveSpace('routes'); setSelectedFile('api.routes.ts') }}
                      className={`arc-space-tab ${activeSpace === 'routes' ? 'is-active' : ''}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0"></span>
                      <span className="truncate">API Routing</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveSpace('models'); setSelectedFile('Workspace.ts') }}
                      className={`arc-space-tab ${activeSpace === 'models' ? 'is-active' : ''}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0"></span>
                      <span className="truncate">Database Schema</span>
                    </button>
                  </div>

                  {/* Filesystem List */}
                  <div className="space-y-1 pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between text-[10px] uppercase text-zinc-500 tracking-wider font-semibold px-1 pb-1">
                      <span>Files In Scope</span>
                      <span>4 items</span>
                    </div>

                    {Object.entries(ARC_FILES).map(([key, file]) => {
                      const isSelected = selectedFile === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedFile(key)}
                          className={`w-full flex items-center justify-between p-1.5 rounded-[4px] transition-colors text-left ${
                            isSelected
                              ? 'bg-zinc-800 text-white font-medium border border-zinc-700'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileCode2 size={13} className={isSelected ? 'text-emerald-400' : 'text-zinc-500'} />
                            <span className="truncate">{file.name}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            {file.lines}L
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Status Bar */}
                <div className="pt-3 border-t border-white/[0.06] text-[11px] text-zinc-500 flex items-center justify-between">
                  <span>Static AST Analysis</span>
                  <span className="text-zinc-400">Zero Code Execution</span>
                </div>
              </div>

              {/* Viewport */}
              <div className="md:col-span-8 bg-[#090a0e] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#111319] px-4 py-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{activeNode.path}</span>
                      <span className="text-zinc-500">/</span>
                      <span className="text-zinc-400 text-[11px]">{activeNode.role}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('syntax')}
                        className={`px-2.5 py-1 rounded-[4px] text-xs transition-colors ${
                          activeTab === 'syntax'
                            ? 'bg-zinc-800 text-white border border-zinc-700 font-medium'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Code
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('flow')}
                        className={`px-2.5 py-1 rounded-[4px] text-xs transition-colors ${
                          activeTab === 'flow'
                            ? 'bg-zinc-800 text-white border border-zinc-700 font-medium'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Execution Flow
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('guide')}
                        className={`px-2.5 py-1 rounded-[4px] text-xs transition-colors ${
                          activeTab === 'guide'
                            ? 'bg-zinc-800 text-white border border-zinc-700 font-medium'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Reading Order
                      </button>
                    </div>
                  </div>

                  <div ref={viewportContentRef} className="p-4 sm:p-5 font-mono text-xs overflow-auto max-h-[380px]">
                    {activeTab === 'syntax' && (
                      <pre className="text-zinc-300 leading-relaxed whitespace-pre font-mono">
                        <code>{activeNode.code}</code>
                      </pre>
                    )}

                    {activeTab === 'flow' && (
                      <div className="space-y-4 pt-1">
                        <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
                          Step-by-Step Request Path
                        </div>
                        <div className="space-y-2">
                          {activeNode.flow.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2.5 bg-[#141416] border border-white/[0.08] rounded-[6px]">
                              <span className="w-5 h-5 rounded-[4px] bg-zinc-800 text-zinc-300 border border-zinc-700 flex items-center justify-center text-xs font-semibold">
                                {idx + 1}
                              </span>
                              <span className="text-zinc-200 font-medium">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'guide' && (
                      <div className="space-y-3 pt-1">
                        <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
                          Recommended Beginner Reading Sequence
                        </div>
                        <div className="space-y-2">
                          <div className="p-3 bg-[#141416] border border-white/[0.08] rounded-[6px] flex items-center justify-between">
                            <div>
                              <strong className="text-white block font-sans">1. README.md &amp; Configuration</strong>
                              <span className="text-zinc-400 text-[12px] font-sans">Learn project goals, installation commands, and environment variables.</span>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-400 font-medium">Step 1</span>
                          </div>
                          <div className="p-3 bg-[#141416] border border-white/[0.08] rounded-[6px] flex items-center justify-between">
                            <div>
                              <strong className="text-white block font-sans">2. src/server.ts (Entry Point)</strong>
                              <span className="text-zinc-400 text-[12px] font-sans">See how the web server initializes and attaches routing endpoints.</span>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-400 font-medium">Step 2</span>
                          </div>
                          <div className="p-3 bg-[#141416] border border-white/[0.08] rounded-[6px] flex items-center justify-between">
                            <div>
                              <strong className="text-white block font-sans">3. src/routes/ &amp; src/services/</strong>
                              <span className="text-zinc-400 text-[12px] font-sans">Explore core features, API logic, and database schemas.</span>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-400 font-medium">Step 3</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/[0.08] bg-[#111319] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-zinc-400">
                  <span className="truncate">Explains file roles and execution flow without executing code.</span>
                  <Link to="/new" className="arc-btn-primary text-xs py-1.5 px-3 rounded-[4px] flex-shrink-0">
                    Analyze a Repository <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Core Architecture Pillars */}
        <section ref={spacesRef} className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-[8px] border border-white/[0.08] bg-[#141416] p-6 space-y-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-[6px] bg-zinc-900 border border-white/10 flex items-center justify-center text-emerald-400">
                <FolderTree size={18} />
              </div>
              <span className="text-[11px] font-mono text-zinc-500 font-medium">Architecture</span>
            </div>
            <h3 className="font-heading text-base font-semibold text-white">Folder &amp; Module Overview</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Understand how directories are organized, what each major folder is responsible for, and how the frontend and backend communicate.
            </p>
            <div className="pt-2">
              <span className="inline-block text-[11px] font-mono text-zinc-500">
                Organized by true responsibility
              </span>
            </div>
          </div>

          <div className="rounded-[8px] border border-white/[0.08] bg-[#141416] p-6 space-y-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-[6px] bg-zinc-900 border border-white/10 flex items-center justify-center text-emerald-400">
                <Route size={18} />
              </div>
              <span className="text-[11px] font-mono text-zinc-500 font-medium">Workflows</span>
            </div>
            <h3 className="font-heading text-base font-semibold text-white">Step-by-Step Execution Traces</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Follow real actions—such as user login, form submissions, or API queries—from the button click down through controller logic to the database.
            </p>
            <div className="pt-2">
              <span className="inline-block text-[11px] font-mono text-zinc-500">
                Complete button-to-database journeys
              </span>
            </div>
          </div>

          <div className="rounded-[8px] border border-white/[0.08] bg-[#141416] p-6 space-y-3 hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-[6px] bg-zinc-900 border border-white/10 flex items-center justify-center text-emerald-400">
                <BookOpen size={18} />
              </div>
              <span className="text-[11px] font-mono text-zinc-500 font-medium">Roadmap</span>
            </div>
            <h3 className="font-heading text-base font-semibold text-white">Curated Reading Sequence</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Never wonder what to read first. RepoMentor ranks the most important files in numbered order so you understand foundations before diving into details.
            </p>
            <div className="pt-2">
              <span className="inline-block text-[11px] font-mono text-zinc-500">
                Sequenced learning order
              </span>
            </div>
          </div>
        </section>

        {/* Active Analysis Workspaces */}
        <section className="pt-6 border-t border-white/[0.08]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-heading text-xl font-semibold text-white">Active Analysis Workspaces</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Repositories you have inspected and saved to your account.</p>
            </div>
            <Link to="/new" className="arc-btn-secondary text-xs py-1.5 px-3 rounded-[4px]">
              + New Workspace
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs font-mono text-zinc-500 rounded-[8px] border border-white/[0.06] bg-[#141416]">
              Loading workspace index...
            </div>
          ) : visibleWorkspaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {visibleWorkspaces.map((item) => {
                const status = getStatusBadge(item.state)
                const language = getWorkspaceLanguage(item)
                const timestamp = formatRelativeTime(item.updated_at || item.guide_generated_at || item.created_at)

                return (
                  <div
                    key={item.id}
                    className="group rounded-[8px] border border-white/[0.08] bg-[#141416] p-5 hover:border-zinc-700 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Header: Repo Name + Status Badge */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <FolderGit2 size={16} className="text-zinc-400 group-hover:text-emerald-400 transition-colors shrink-0" />
                          <h3 className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                            {item.repository_name}
                          </h3>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-mono font-medium shrink-0 ${status.badgeClass}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dotClass}`} />
                          <span>{status.label}</span>
                        </span>
                      </div>

                      {/* GitHub URL */}
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono mb-4 truncate">
                        <Github size={12} className="shrink-0 text-zinc-600" />
                        <span className="truncate">{item.github_repository_url || 'Local Repository Snapshot'}</span>
                      </div>

                      {/* Repository Metadata Row */}
                      <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/[0.06] text-xs">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">Files</span>
                          <span className="text-zinc-300 font-medium font-mono">{item.source_file_count || 0}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">Language</span>
                          <span className="text-zinc-300 font-medium truncate block">{language}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono uppercase text-zinc-500 block mb-0.5">Last Analyzed</span>
                          <span className="text-zinc-400 font-mono text-[11px] truncate block">{timestamp}</span>
                        </div>
                      </div>
                    </div>

                    {/* Card Action Footer */}
                    <div className="pt-4 flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-mono text-[11px]">Workspace ready</span>
                      <Link
                        to={`/workspace/${item.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors group-hover:translate-x-0.5"
                      >
                        <span>Open Workspace</span>
                        <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 rounded-[8px] border border-white/[0.06] bg-[#141416] text-center space-y-3">
              <Code2 size={24} className="mx-auto text-zinc-600" />
              <div className="text-sm font-semibold text-zinc-200">
                {state.authEmail ? 'No workspaces yet' : 'Sign in to access your workspaces'}
              </div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed font-sans">
                {state.authEmail
                  ? 'Paste any repository URL above to inspect files, trace execution, and generate your first guide.'
                  : 'Saved repositories and generated guides are stored securely in your account.'}
              </p>
              <div className="pt-2 flex justify-center gap-3">
                {state.authEmail ? (
                  <Link to="/new" className="arc-btn-primary text-xs py-2 px-4 rounded-[4px]">
                    Analyze a Repository
                  </Link>
                ) : (
                  <>
                    <Link to="/login" className="arc-btn-secondary text-xs py-2 px-4 rounded-[4px]">
                      Sign In
                    </Link>
                    <Link to="/new" className="arc-btn-primary text-xs py-2 px-4 rounded-[4px]">
                      Analyze a Repository
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </Shell>
  )
}
