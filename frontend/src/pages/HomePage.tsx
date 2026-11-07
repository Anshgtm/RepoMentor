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
  Activity,
  Zap,
  Sparkles,
  Play,
  Pause,
  CheckCircle2,
} from 'lucide-react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Shell } from '../components/layout/Shell'
import { useWorkspaces } from '../hooks/useWorkspaces'
import { useAppState } from '../state/AppState'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

const PIPELINE_STAGES = [
  {
    step: '01',
    phase: 'READING CODE',
    title: 'Reading Without Running',
    detail: 'Reads code files like sentences in a book, identifying commands and names safely without needing to run any software.',
    metric: '100% Safe (No Code Executed)',
    icon: BookOpen,
    flowBadge: 'Raw Code ➔ Clean Words',
    accentColor: 'from-emerald-500/20 via-teal-500/10 to-transparent',
    iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  {
    step: '02',
    phase: 'CONNECTING PARTS',
    title: 'Figuring Out What Depends on What',
    detail: 'Like following furniture assembly instructions, maps out which files need other files so everything fits together in order.',
    metric: 'Step-by-Step Order',
    icon: GitBranch,
    flowBadge: 'Dependencies ➔ Proper Order',
    accentColor: 'from-blue-500/20 via-cyan-500/10 to-transparent',
    iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  },
  {
    step: '03',
    phase: 'FINDING ENTRANCES',
    title: 'Locating the Front Doors',
    detail: 'Finds where visitors and users enter the app, like the reception desk in a building directing people to the right room.',
    metric: 'All Entry Doors Found',
    icon: Route,
    flowBadge: 'User Requests ➔ App Doors',
    accentColor: 'from-purple-500/20 via-indigo-500/10 to-transparent',
    iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  },
  {
    step: '04',
    phase: 'FOLLOWING THE PATH',
    title: 'Tracing the Paper Trail',
    detail: 'Follows an action from clicking a button on screen, through the rules, all the way to saving information in the filing cabinet.',
    metric: 'Complete Action Journey',
    icon: Zap,
    flowBadge: 'Button Click ➔ Saved in DB',
    accentColor: 'from-amber-500/20 via-orange-500/10 to-transparent',
    iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  {
    step: '05',
    phase: 'TOUR GUIDE',
    title: 'Beginner-Friendly Reading Guide',
    detail: 'Turns all the messy code into a clear, numbered guide so anyone new can understand the project without getting lost.',
    metric: 'Simple Starting Guide',
    icon: Sparkles,
    flowBadge: 'Complex App ➔ Plain English Tour',
    accentColor: 'from-emerald-500/20 via-amber-500/10 to-transparent',
    iconBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
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
    role: 'Root Entrypoint',
    lines: 48,
    code: `import express from 'express'\nimport { apiRoutes } from './routes/api.routes'\nimport { connectDatabase } from './services/db'\n\nexport const app = express()\napp.use(express.json())\napp.use('/api', apiRoutes)\n\nexport async function bootstrap() {\n  await connectDatabase()\n  app.listen(8000, () => console.log('Listening on :8000'))\n}\nbootstrap()`,
    flow: ['Client HTTP Request', 'express.json() parser', 'Router: /api', 'Service Layer Dispatch']
  },
  'api.routes.ts': {
    path: 'src/routes/api.routes.ts',
    name: 'api.routes.ts',
    role: 'Router Dispatcher',
    lines: 92,
    code: `import { Router } from 'express'\nimport { WorkspaceService } from '../services/workspace.service'\n\nexport const apiRoutes = Router()\n\napiRoutes.post('/workspaces/:id/guide', async (req, res) => {\n  const guide = await WorkspaceService.buildGuide(req.params.id)\n  res.json({ status: 'ok', guide })\n})`,
    flow: ['apiRoutes router', 'POST /workspaces/:id/guide', 'WorkspaceService.buildGuide()', 'Workspace Model commit']
  },
  'workspace.service.ts': {
    path: 'src/services/workspace.service.ts',
    name: 'workspace.service.ts',
    role: 'Business Logic',
    lines: 184,
    code: `import { Workspace } from '../models/Workspace'\nimport { parseAST } from '../lib/parser'\n\nexport class WorkspaceService {\n  static async buildGuide(workspaceId: string) {\n    const workspace = await Workspace.findById(workspaceId)\n    const entrypoints = await parseAST(workspace.files)\n    return { workspaceId, entrypoints, generatedAt: new Date() }\n  }\n}`,
    flow: ['Load files from MongoDB', 'Run AST traversal engine', 'Identify root entry points', 'Return architectural orientation']
  },
  'Workspace.ts': {
    path: 'src/models/Workspace.ts',
    name: 'Workspace.ts',
    role: 'Persistence Model',
    lines: 44,
    code: `import { Schema, model } from 'mongoose'\n\nconst WorkspaceSchema = new Schema({\n  name: { type: String, required: true },\n  gitUrl: { type: String },\n  status: { type: String, default: 'pending' },\n  entryPoints: [String],\n  createdAt: { type: Date, default: Date.now }\n})\n\nexport const Workspace = model('Workspace', WorkspaceSchema)`,
    flow: ['MongoDB Collection: workspaces', 'BSON serialization', 'Indexed by workspace ID']
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
          y: 28,
          opacity: 0,
          duration: 0.85,
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
          y: 28,
          duration: 0.6,
          stagger: 0.12,
          ease: 'power2.out',
          clearProps: 'all',
        })
      }

      // 3. Pipeline Reel ScrollTrigger with Staggered Cards (Refresh-Safe with full opacity)
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
            { y: 22 },
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
          y: 30,
          duration: 0.7,
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
          y: 28,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power2.out',
          clearProps: 'all',
        })
      }

      // Ensure ScrollTrigger accurately measures scroll offsets upon page refresh / reload
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
        { opacity: 0.4, y: 6 },
        { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' }
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
          <h1 className="font-heading text-4xl sm:text-6xl md:text-[72px] font-bold tracking-tight text-white leading-[1.05]">
            Navigate unfamiliar codebases like a native application.
          </h1>

          <p className="text-zinc-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-sans opacity-70">
            RepoMentor statically parses GitHub repositories and local source trees into an interactive, spatial workbench with execution traces and contributor guides.
          </p>

          {/* Arc Command Bar (⌘T / Ctrl+T style) */}
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
                Inspect ↵
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

        {/* Problem Section: Arc "Split View" Comparison */}
        <section ref={problemRef} className="space-y-6">
          <div className="text-center space-y-2 max-w-2xl mx-auto">
            <h2 className="font-heading text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight opacity-70">
              Understanding a new repository shouldn&apos;t feel like solving a puzzle.
            </h2>

            <p className="text-zinc-400 text-sm sm:text-base leading-relaxed font-sans opacity-70">
              Traditional code exploration forces developers into endless browser tabs, disconnected documentation, and blind trial-and-error.
            </p>
          </div>

          {/* Arc Split View Container */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Left Split View: The Chaotic Status Quo */}
            <div className="arc-split-pane gsap-split-card border-red-500/20 bg-[#0d0e12] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-[1px] bg-red-400/80"></span>
                  <span className="font-mono text-xs font-semibold text-red-400">STATUS QUO: 20 TABS CHAOS</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Fragmented</span>
              </div>
              <div className="space-y-3 text-xs text-zinc-300 font-sans">
                <div className="p-2.5 rounded-[3px] bg-red-500/5 border border-red-500/10 space-y-1">
                  <strong className="text-white block font-heading">The Entrypoint Maze</strong>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Opening 20+ tabs trying to find where execution begins, which middleware loads, and how ports bind.
                  </p>
                </div>
                <div className="p-2.5 rounded-[3px] bg-red-500/5 border border-red-500/10 space-y-1">
                  <strong className="text-white block font-heading">Invisible Execution Paths</strong>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Tracing API routes down to persistence queries means blind grepping across unverified files.
                  </p>
                </div>
                <div className="p-2.5 rounded-[3px] bg-red-500/5 border border-red-500/10 space-y-1">
                  <strong className="text-white block font-heading">Outdated Documentation</strong>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    README files drift within weeks of release, forcing contributors to reverse-engineer architecture from scratch.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Split View: RepoMentor Unified Canvas */}
            <div className="arc-split-pane gsap-split-card border-emerald-500/20 bg-[#0d0e12] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-[1px] bg-emerald-400"></span>
                  <span className="font-mono text-xs font-semibold text-emerald-400">REPOMENTOR: UNIFIED WORKBENCH</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">Continuous AST</span>
              </div>
              <div className="space-y-3 text-xs text-zinc-300 font-sans">
                <div className="p-2.5 rounded-[3px] bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                  <strong className="text-white block font-heading">Automatic Starting Point Finder</strong>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Instantly finds where the project starts up, its configuration settings, and main entry doors without running code.
                  </p>
                </div>
                <div className="p-2.5 rounded-[3px] bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                  <strong className="text-white block font-heading">Button-to-Database Journey</strong>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Traces an action from when someone clicks a button all the way through the app to where data is saved.
                  </p>
                </div>
                <div className="p-2.5 rounded-[3px] bg-emerald-500/5 border border-emerald-500/10 space-y-1">
                  <strong className="text-white block font-heading">Step-by-Step Reading Order</strong>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    Creates a beginner-friendly roadmap showing which files to read first, second, and third.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive & Animated Code Breakdown Pipeline */}
        <section ref={pipelineRef} className="space-y-4 pt-2">
          <div className="pipeline-header flex flex-col lg:flex-row lg:items-center justify-between gap-4 px-1">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 font-semibold mb-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <Activity size={14} className="animate-pulse" />
                <span>HOW IT WORKS</span>
                <span className="text-zinc-600">/</span>
                <span className="text-zinc-400">Stage {activeStage + 1} of {PIPELINE_STAGES.length}</span>
              </div>
              <h3 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                <span>Code Breakdown Made Simple</span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                5 simple stages showing how RepoMentor understands code without executing it.
              </p>
            </div>

            {/* Stage Quick Select & Navigation Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Stage Pill Quick Jump */}
              <div className="flex items-center gap-1 bg-[#0b0c10] p-1 rounded-[4px] border border-white/[0.08]">
                {PIPELINE_STAGES.map((stg, idx) => (
                  <button
                    key={stg.step}
                    type="button"
                    onClick={() => selectStage(idx)}
                    className={`px-2 py-0.5 rounded-[3px] text-[11px] font-mono transition-all duration-200 cursor-pointer ${
                      activeStage === idx
                        ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                    }`}
                    title={stg.title}
                  >
                    {stg.step}
                  </button>
                ))}
              </div>

              {/* Auto Tour Play/Pause Toggle */}
              <button
                type="button"
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[3px] text-xs font-mono border transition-all cursor-pointer ${
                  isAutoPlaying
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.3)] animate-pulse'
                    : 'bg-[#0f1015] text-zinc-400 border-white/10 hover:border-white/20 hover:text-zinc-200'
                }`}
                aria-label="Toggle auto walkthrough"
              >
                {isAutoPlaying ? <Pause size={12} className="text-emerald-400" /> : <Play size={12} />}
                <span className="hidden sm:inline">{isAutoPlaying ? 'Playing' : 'Auto Tour'}</span>
              </button>

              {/* Left & Right Arrow Buttons */}
              <button
                type="button"
                onClick={() => scrollTrack('left')}
                className="w-8 h-8 rounded-[3px] border border-white/10 bg-[#0f1015] hover:bg-[#161820] hover:border-white/20 hover:scale-105 active:scale-95 flex items-center justify-center text-zinc-300 transition-all cursor-pointer"
                aria-label="Previous stage"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => scrollTrack('right')}
                className="w-8 h-8 rounded-[3px] border border-white/10 bg-[#0f1015] hover:bg-[#161820] hover:border-white/20 hover:scale-105 active:scale-95 flex items-center justify-center text-zinc-300 transition-all cursor-pointer"
                aria-label="Next stage"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Smooth Scrollable Horizontal Reel with Animated Cards */}
          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-2 scroll-smooth snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none"
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
                  className={`pipeline-card min-w-[300px] sm:min-w-[340px] max-w-[340px] flex-shrink-0 snap-start rounded-[8px] border p-5 space-y-4 transition-all duration-300 relative overflow-hidden group cursor-pointer ${
                    isActive
                      ? 'border-emerald-500/80 bg-[#151926] -translate-y-2 shadow-[0_16px_40px_rgba(16,185,129,0.25)] ring-1 ring-emerald-500/50'
                      : 'border-zinc-800 hover:border-zinc-600 bg-[#11131c] hover:-translate-y-1.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.7)]'
                  }`}
                >
                  {/* Glowing Top Accent Beam */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r ${item.accentColor} transition-all duration-300 ${
                      isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'
                    }`}
                  />

                  {/* Header: Stage Badge + Icon + Phase */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-mono text-xs font-bold px-2 py-0.5 rounded-[2px] transition-colors ${
                          isActive
                            ? 'text-emerald-300 bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
                            : 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                        }`}
                      >
                        STAGE {item.step}
                      </span>
                      <div
                        className={`w-6 h-6 rounded-[3px] border flex items-center justify-center transition-all duration-300 ${item.iconBg} ${
                          isActive ? 'scale-110 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'group-hover:scale-105'
                        }`}
                      >
                        <StageIcon size={13} />
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-zinc-300 uppercase tracking-wider font-semibold">
                      {item.phase}
                    </span>
                  </div>

                  {/* Title & Plain English Explanation */}
                  <div className="space-y-1.5">
                    <h4
                      className={`font-heading text-sm font-semibold transition-colors duration-200 ${
                        isActive ? 'text-emerald-200' : 'text-white group-hover:text-emerald-300'
                      }`}
                    >
                      {item.title}
                    </h4>
                    <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                      {item.detail}
                    </p>
                  </div>

                  {/* Visual Flow Transformation Pill */}
                  <div
                    className={`flex items-center gap-1.5 text-[11px] font-mono px-2.5 py-1.5 rounded-[3px] border transition-all duration-300 ${
                      isActive
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 shadow-sm'
                        : 'bg-[#181a24] border-zinc-700/60 text-zinc-200 group-hover:text-white group-hover:border-zinc-500'
                    }`}
                  >
                    <span className="text-emerald-400 font-bold transition-transform duration-300 group-hover:translate-x-0.5">
                      ➜
                    </span>
                    <span>{item.flowBadge}</span>
                  </div>

                  {/* Footer: Metric & Live Verified Badge */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                    <span className="text-zinc-300 font-medium">{item.metric}</span>
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                      </span>
                      <span>Verified</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* The Hero Application: Arc Codebase Workbench Window */}
        <section ref={workbenchRef} className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 px-1">
            <span className="flex items-center gap-2 text-zinc-300">
              <Layers size={13} className="text-emerald-400" />
              <span>Interactive Repository Workbench</span>
            </span>
            <span className="text-zinc-500 hidden sm:inline">Click files and tabs below to explore</span>
          </div>

          <div className="arc-window-frame">
            {/* Arc Window Chrome Header */}
            <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#101217] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 pr-3 border-r border-white/10">
                  <span className="w-2.5 h-2.5 rounded-[1px] bg-zinc-700"></span>
                  <span className="w-2.5 h-2.5 rounded-[1px] bg-zinc-700"></span>
                  <span className="w-2.5 h-2.5 rounded-[1px] bg-zinc-700"></span>
                </div>
                <span className="text-xs font-mono text-zinc-300 truncate">
                  repomentor://workspace/atlas-core/{activeNode.path}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs font-mono text-zinc-400">
                <span className="hidden md:flex items-center gap-1 text-zinc-500">
                  <GitBranch size={12} className="text-zinc-400" />
                  <span>main @ 8f3c12</span>
                </span>
                <span className="text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-[2px]">
                  AST: INDEXED
                </span>
              </div>
            </div>

            {/* Arc Application Body: Sidebar + Main Content Viewport */}
            <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
              {/* Arc Left Sidebar (Spaces + Files) */}
              <div className="md:col-span-4 border-r border-white/[0.08] bg-[#0c0d12] p-3 flex flex-col justify-between text-xs font-mono">
                <div className="space-y-4">
                  {/* Arc Spaces Switcher */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-zinc-500 tracking-wider font-semibold px-1">
                      Arc Spaces
                    </span>
                    <button
                      type="button"
                      onClick={() => { setActiveSpace('atlas'); setSelectedFile('server.ts') }}
                      className={`arc-space-tab ${activeSpace === 'atlas' ? 'is-active' : ''}`}
                    >
                      <span className="w-2 h-2 rounded-[1px] bg-emerald-400 flex-shrink-0"></span>
                      <span className="truncate">Space 1: Core Engine</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveSpace('routes'); setSelectedFile('api.routes.ts') }}
                      className={`arc-space-tab ${activeSpace === 'routes' ? 'is-active' : ''}`}
                    >
                      <span className="w-2 h-2 rounded-[1px] bg-sky-400 flex-shrink-0"></span>
                      <span className="truncate">Space 2: API Route Hub</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { setActiveSpace('models'); setSelectedFile('Workspace.ts') }}
                      className={`arc-space-tab ${activeSpace === 'models' ? 'is-active' : ''}`}
                    >
                      <span className="w-2 h-2 rounded-[1px] bg-amber-400 flex-shrink-0"></span>
                      <span className="truncate">Space 3: Database Models</span>
                    </button>
                  </div>

                  {/* Arc Filesystem Tree */}
                  <div className="space-y-1 pt-2 border-t border-white/[0.06]">
                    <div className="flex items-center justify-between text-[10px] uppercase text-zinc-500 tracking-wider font-semibold px-1 pb-1">
                      <span>Filesystem Index</span>
                      <span>4 items</span>
                    </div>

                    {Object.entries(ARC_FILES).map(([key, file]) => {
                      const isSelected = selectedFile === key
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setSelectedFile(key)}
                          className={`w-full flex items-center justify-between p-1.5 rounded-[3px] transition-colors text-left ${
                            isSelected
                              ? 'bg-zinc-800 text-white font-medium border border-zinc-700'
                              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileCode2 size={13} className={isSelected ? 'text-emerald-400' : 'text-zinc-500'} />
                            <span className="truncate">{file.name}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500 border border-white/5 px-1 py-0.2 rounded-[2px]">
                            {file.lines}L
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Sidebar Bottom Status */}
                <div className="pt-3 border-t border-white/[0.06] text-[11px] text-zinc-500 flex items-center justify-between">
                  <span>AST Depth: 4 Layers</span>
                  <span className="text-zinc-400">Zero Runtime Sandbox</span>
                </div>
              </div>

              {/* Arc Right Main Viewport (Editor & Flow Viewer) */}
              <div className="md:col-span-8 bg-[#090a0e] flex flex-col justify-between">
                <div>
                  {/* Viewport Top Bar */}
                  <div className="flex items-center justify-between border-b border-white/[0.08] bg-[#111319] px-4 py-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{activeNode.path}</span>
                      <span className="text-zinc-500">/</span>
                      <span className="text-emerald-400 text-[11px]">{activeNode.role}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setActiveTab('syntax')}
                        className={`px-2.5 py-1 rounded-[3px] text-xs transition-colors ${
                          activeTab === 'syntax'
                            ? 'bg-zinc-800 text-white border border-zinc-700 font-medium'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Syntax
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('flow')}
                        className={`px-2.5 py-1 rounded-[3px] text-xs transition-colors ${
                          activeTab === 'flow'
                            ? 'bg-zinc-800 text-white border border-zinc-700 font-medium'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Call Flow
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveTab('guide')}
                        className={`px-2.5 py-1 rounded-[3px] text-xs transition-colors ${
                          activeTab === 'guide'
                            ? 'bg-zinc-800 text-white border border-zinc-700 font-medium'
                            : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        Reading Order
                      </button>
                    </div>
                  </div>

                  {/* Viewport Content */}
                  <div ref={viewportContentRef} className="p-4 sm:p-5 font-mono text-xs overflow-auto max-h-[380px]">
                    {activeTab === 'syntax' && (
                      <pre className="text-zinc-300 leading-relaxed whitespace-pre font-mono">
                        <code>{activeNode.code}</code>
                      </pre>
                    )}

                    {activeTab === 'flow' && (
                      <div className="space-y-4 pt-1">
                        <div className="text-[11px] text-zinc-500 uppercase tracking-wider">
                          Step-by-Step Action Journey
                        </div>
                        <div className="space-y-2">
                          {activeNode.flow.map((step, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2.5 bg-zinc-900 border border-white/[0.06] rounded-[3px]">
                              <span className="w-5 h-5 rounded-[2px] bg-zinc-800 text-emerald-400 border border-zinc-700 flex items-center justify-center text-xs font-bold">
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
                          Synthesized Contributor Reading Order
                        </div>
                        <div className="space-y-2">
                          <div className="p-2.5 bg-zinc-900 border border-white/[0.06] rounded-[3px] flex items-center justify-between">
                            <div>
                              <strong className="text-white block font-sans">01. README.md &amp; Environment Flags</strong>
                              <span className="text-zinc-500 text-[11px] font-sans">Understand environment prerequisites and database ports.</span>
                            </div>
                            <span className="text-[11px] font-mono text-emerald-400 font-medium">Step 1</span>
                          </div>
                          <div className="p-2.5 bg-zinc-900 border border-white/[0.06] rounded-[3px] flex items-center justify-between">
                            <div>
                              <strong className="text-white block font-sans">02. src/server.ts Entrypoint</strong>
                              <span className="text-zinc-500 text-[11px] font-sans">Review root application bootstrap and router mount configuration.</span>
                            </div>
                            <span className="text-[11px] font-mono text-emerald-400 font-medium">Step 2</span>
                          </div>
                          <div className="p-2.5 bg-zinc-900 border border-white/[0.06] rounded-[3px] flex items-center justify-between">
                            <div>
                              <strong className="text-white block font-sans">03. src/routes/ &amp; src/services/</strong>
                              <span className="text-zinc-500 text-[11px] font-sans">Inspect business logic services and data model persistence.</span>
                            </div>
                            <span className="text-[11px] font-mono text-emerald-400 font-medium">Step 3</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Viewport Footer Bar */}
                <div className="border-t border-white/[0.08] bg-[#111319] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono text-zinc-400">
                  <span className="truncate">Active Heuristic: {activeNode.role} verified by AST syntax traversal.</span>
                  <Link to="/new" className="arc-btn-primary text-xs py-1 px-3 rounded-[3px] flex-shrink-0">
                    Analyze Full Repository <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Core Architecture Spaces: Arc-Inspired Minimalist Panes */}
        <section ref={spacesRef} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="arc-split-pane space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-[4px] bg-zinc-900 border border-white/10 flex items-center justify-center text-emerald-400">
                <FolderTree size={16} />
              </div>
              <span className="font-mono text-xs text-zinc-500 font-medium">SPACE 01</span>
            </div>
            <h3 className="font-heading text-base font-semibold text-white">Spatial Architectural Mapping</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Automatically discovers root bootstrappers, middleware stacks, and boundary configurations across directories.
            </p>
          </div>

          <div className="arc-split-pane space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-[4px] bg-zinc-900 border border-white/10 flex items-center justify-center text-emerald-400">
                <Route size={16} />
              </div>
              <span className="font-mono text-xs text-zinc-500 font-medium">SPACE 02</span>
            </div>
            <h3 className="font-heading text-base font-semibold text-white">Continuous Call Tracing</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Follows requests from the router dispatch layer down through service logic into database persistence models.
            </p>
          </div>

          <div className="arc-split-pane space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-8 h-8 rounded-[4px] bg-zinc-900 border border-white/10 flex items-center justify-center text-emerald-400">
                <BookOpen size={16} />
              </div>
              <span className="font-mono text-xs text-zinc-500 font-medium">SPACE 03</span>
            </div>
            <h3 className="font-heading text-base font-semibold text-white">Contributor Onboarding</h3>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Provides an actionable, sequenced reading order with prerequisite checklists so you start contributing immediately.
            </p>
          </div>
        </section>

        {/* Workspaces Section */}
        <section className="pt-6 border-t border-white/[0.08]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-heading text-xl font-semibold text-white opacity-70">Active Analysis Workspaces</h2>
              <p className="text-xs text-zinc-400 mt-0.5 opacity-70">Repositories you have inspected or saved to your account.</p>
            </div>
            <Link to="/new" className="arc-btn-secondary text-xs py-1.5 px-3 rounded-[3px]">
              + New Workspace
            </Link>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-xs font-mono text-zinc-500 rounded-[3px] border border-white/[0.06] bg-zinc-900">
              Loading workspace index...
            </div>
          ) : visibleWorkspaces.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {visibleWorkspaces.map((item) => (
                <Link
                  key={item.id}
                  to={`/workspace/${item.id}`}
                  className="arc-split-pane block text-left group"
                >
                  <div>
                    <div className="flex items-center justify-between text-sm text-zinc-200 font-semibold mb-1 group-hover:text-emerald-400 transition-colors">
                      <span className="truncate">{item.repository_name}</span>
                      <ExternalLink size={13} className="text-zinc-500 group-hover:text-emerald-400 flex-shrink-0 transition-colors" />
                    </div>
                    <div className="text-[11px] font-mono text-zinc-500 truncate mb-4">
                      {item.github_repository_url || 'Local Source Snapshot'}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-3 border-t border-white/[0.06]">
                    <span className="px-2 py-0.5 rounded-[2px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                      {item.state.replaceAll('_', ' ')}
                    </span>
                    <span>{item.source_file_count} files</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-[3px] border border-white/[0.06] bg-zinc-900/60 text-center space-y-3">
              <Code2 size={24} className="mx-auto text-zinc-600" />
              <div className="text-sm font-semibold text-zinc-200">
                {state.authEmail ? 'No workspaces found' : 'Sign in to access your workspaces'}
              </div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed font-sans">
                {state.authEmail
                  ? 'Paste any repository URL above to generate your first architecture map.'
                  : 'Saved workspaces and generated guides are stored securely to your account.'}
              </p>
              <div className="pt-2">
                {state.authEmail ? (
                  <Link to="/new" className="arc-btn-primary text-xs py-2 px-4 rounded-[3px]">
                    Analyze a Repository
                  </Link>
                ) : (
                  <Link to="/login" className="arc-btn-secondary text-xs py-2 px-4 rounded-[3px]">
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </Shell>
  )
}
