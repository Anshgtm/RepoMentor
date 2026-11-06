import { useState } from 'react'
import { FileCode2, Folder, GitBranch, Terminal, Check, Layers, ArrowRight, CornerDownRight, Database, Server } from 'lucide-react'

type FileItem = {
  name: string
  path: string
  type: 'file' | 'folder'
  depth: number
  lines?: number
  role?: string
}

const DEMO_FILES: FileItem[] = [
  { name: 'src', path: 'src', type: 'folder', depth: 0 },
  { name: 'server.ts', path: 'src/server.ts', type: 'file', depth: 1, lines: 48, role: 'HTTP Entry point' },
  { name: 'routes', path: 'src/routes', type: 'folder', depth: 1 },
  { name: 'api.routes.ts', path: 'src/routes/api.routes.ts', type: 'file', depth: 2, lines: 92, role: 'Router dispatch' },
  { name: 'services', path: 'src/services', type: 'folder', depth: 1 },
  { name: 'guide.service.ts', path: 'src/services/guide.service.ts', type: 'file', depth: 2, lines: 184, role: 'Core business logic' },
  { name: 'models', path: 'src/models', type: 'folder', depth: 1 },
  { name: 'Workspace.ts', path: 'src/models/Workspace.ts', type: 'file', depth: 2, lines: 44, role: 'Database schema' },
  { name: 'package.json', path: 'package.json', type: 'file', depth: 0, lines: 38, role: 'Manifest & scripts' },
  { name: 'README.md', path: 'README.md', type: 'file', depth: 0, lines: 65, role: 'Documentation' }
]

const FILE_PREVIEWS: Record<string, { code: string; analysis: string; flow: string[] }> = {
  'src/server.ts': {
    code: `import express from 'express'\nimport { apiRoutes } from './routes/api.routes'\nimport { connectDatabase } from './services/db'\n\nexport const app = express()\napp.use(express.json())\napp.use('/api', apiRoutes)\n\nexport async function bootstrap() {\n  await connectDatabase()\n  app.listen(8000, () => console.log('Listening on :8000'))\n}\nbootstrap()`,
    analysis: 'Root application bootstrap. Initializes MongoDB connection, configures JSON middleware, and mounts API router on /api.',
    flow: ['HTTP Client Request', 'express.json() parser', 'Router: /api', 'Service Layer Dispatch']
  },
  'src/routes/api.routes.ts': {
    code: `import { Router } from 'express'\nimport { GuideService } from '../services/guide.service'\n\nexport const apiRoutes = Router()\n\napiRoutes.post('/workspaces/:id/guide', async (req, res) => {\n  const guide = await GuideService.generate(req.params.id)\n  res.json({ status: 'ok', guide })\n})`,
    analysis: 'Main REST API router. Validates incoming parameters and forwards execution to GuideService.',
    flow: ['apiRoutes router', 'POST /workspaces/:id/guide', 'GuideService.generate()', 'Workspace Model commit']
  },
  'src/services/guide.service.ts': {
    code: `import { Workspace } from '../models/Workspace'\nimport { parseAST } from '../lib/parser'\n\nexport class GuideService {\n  static async generate(workspaceId: string) {\n    const workspace = await Workspace.findById(workspaceId)\n    const entrypoints = await parseAST(workspace.files)\n    return { workspaceId, entrypoints, generatedAt: new Date() }\n  }\n}`,
    analysis: 'Domain service encapsulating static analysis, AST traversal, and synthesis of beginner-friendly onboarding steps.',
    flow: ['Load files from MongoDB', 'Run AST traversal engine', 'Identify root entry points', 'Return architectural orientation']
  },
  'src/models/Workspace.ts': {
    code: `import { Schema, model } from 'mongoose'\n\nconst WorkspaceSchema = new Schema({\n  name: { type: String, required: true },\n  gitUrl: { type: String },\n  status: { type: String, default: 'pending' },\n  entryPoints: [String],\n  createdAt: { type: Date, default: Date.now }\n})\n\nexport const Workspace = model('Workspace', WorkspaceSchema)`,
    analysis: 'Mongoose schema storing repository metadata, file snapshots, and synthesized architecture graphs.',
    flow: ['MongoDB Collection: workspaces', 'BSON serialization', 'Indexed by workspace ID']
  },
  'package.json': {
    code: `{\n  "name": "repomentor-core",\n  "version": "1.2.0",\n  "scripts": {\n    "dev": "tsx watch src/server.ts",\n    "build": "tsc",\n    "test": "vitest"\n  },\n  "dependencies": {\n    "express": "^4.21.2",\n    "mongoose": "^8.9.5"\n  }\n}`,
    analysis: 'Project manifest specifying engine requirements, build scripts, and external runtime dependencies.',
    flow: ['npm run dev', 'tsx watch compiler', 'Execute src/server.ts']
  },
  'README.md': {
    code: `# RepoMentor Core\n\nArchitecture mapping and static analysis engine for unfamiliar codebases.\n\n## Getting Started\n1. npm install\n2. npm run dev\n3. Navigate to http://localhost:8000`,
    analysis: 'Repository README containing project setup instructions and primary architectural description.',
    flow: ['Manual Developer Setup', 'Environment Configuration', 'Local Server Verification']
  }
}

export function RepositoryPreview() {
  const [selectedPath, setSelectedPath] = useState('src/server.ts')
  const [viewMode, setViewMode] = useState<'source' | 'flow'>('source')
  const currentPreview = FILE_PREVIEWS[selectedPath] || FILE_PREVIEWS['src/server.ts']

  return (
    <div className="panel border border-line-strong overflow-hidden my-6">
      {/* Top telemetry bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-line bg-surface-raised px-4 py-2.5 text-xs font-mono">
        <div className="flex items-center gap-3">
          <span className="text-muted">Repository:</span>
          <span className="font-semibold text-ink">repomentor / core-engine</span>
          <span className="text-muted-dark">|</span>
          <span className="text-muted">Branch:</span>
          <span className="text-ink flex items-center gap-1">
            <GitBranch size={13} className="text-amber-500" /> main
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="status-pill status-ready">Analyzed</span>
          <span className="text-muted text-[11px]">10 files indexed</span>
        </div>
      </div>

      {/* Main 3-column workbench */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[440px]">
        {/* Left: Directory tree */}
        <div className="md:col-span-3 border-r border-line bg-surface p-3 font-mono text-xs">
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold pb-2 mb-2 border-b border-line flex items-center justify-between">
            <span>Filesystem</span>
            <span className="text-muted-dark">10 items</span>
          </div>
          <div className="space-y-0.5">
            {DEMO_FILES.map((item) => (
              <button
                key={item.path}
                type="button"
                onClick={() => item.type === 'file' && setSelectedPath(item.path)}
                className={`w-full flex items-center gap-1.5 py-1 px-1.5 rounded-[2px] text-left transition-colors ${
                  item.path === selectedPath
                    ? 'bg-surface-raised text-ink font-semibold border-l-2 border-emerald-500 pl-1'
                    : 'text-muted hover:text-ink hover:bg-surface-raised'
                }`}
                style={{ paddingLeft: `${item.depth * 14 + 6}px` }}
              >
                {item.type === 'folder' ? (
                  <Folder size={13} className="text-zinc-500 flex-shrink-0" />
                ) : (
                  <FileCode2 size={13} className={item.path === selectedPath ? 'text-emerald-400' : 'text-zinc-500 flex-shrink-0'} />
                )}
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center: File Source & Architecture Flow */}
        <div className="md:col-span-6 border-r border-line bg-[#0a0c0e] flex flex-col">
          {/* File bar & tab switcher */}
          <div className="flex items-center justify-between border-b border-line bg-surface-raised px-3 py-1.5 text-xs font-mono">
            <span className="text-ink font-medium">{selectedPath}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewMode('source')}
                className={`px-2 py-0.5 rounded-[2px] text-[11px] ${
                  viewMode === 'source' ? 'bg-surface text-ink border border-line' : 'text-muted hover:text-ink'
                }`}
              >
                Source
              </button>
              <button
                type="button"
                onClick={() => setViewMode('flow')}
                className={`px-2 py-0.5 rounded-[2px] text-[11px] ${
                  viewMode === 'flow' ? 'bg-surface text-ink border border-line' : 'text-muted hover:text-ink'
                }`}
              >
                Call Flow
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 p-3 overflow-auto font-mono text-xs">
            {viewMode === 'source' ? (
              <pre className="text-zinc-300 leading-relaxed overflow-x-auto whitespace-pre">
                <code>{currentPreview.code}</code>
              </pre>
            ) : (
              <div className="space-y-3 py-2">
                <div className="text-[11px] text-muted uppercase tracking-wider mb-2">Request Execution Sequence</div>
                {currentPreview.flow.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-[2px] bg-surface-raised border border-line flex items-center justify-center text-[10px] text-muted">
                      {idx + 1}
                    </span>
                    <span className="text-ink bg-surface border border-line px-2.5 py-1 rounded-[2px] text-xs">
                      {step}
                    </span>
                    {idx < currentPreview.flow.length - 1 && (
                      <ArrowRight size={13} className="text-muted-dark" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Analysis footer */}
          <div className="border-t border-line bg-surface-raised p-2.5 text-xs text-muted">
            <span className="font-semibold text-ink font-mono mr-1">Static Heuristic:</span>
            {currentPreview.analysis}
          </div>
        </div>

        {/* Right: Onboarding Guide & Entrypoints */}
        <div className="md:col-span-3 bg-surface p-4 flex flex-col justify-between text-xs">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted font-mono font-semibold pb-2 border-b border-line mb-3">
              Onboarding Sequence
            </div>
            <p className="text-muted mb-3 leading-relaxed">
              Recommended reading order to understand the architecture without reading all files:
            </p>
            <div className="space-y-2">
              <div className="p-2 border border-line rounded-[2px] bg-surface-raised">
                <div className="font-mono text-emerald-400 font-medium">01. README.md</div>
                <div className="text-muted text-[11px] mt-0.5">High-level purpose & environment flags</div>
              </div>
              <div className="p-2 border border-line rounded-[2px] bg-surface-raised">
                <div className="font-mono text-emerald-400 font-medium">02. src/server.ts</div>
                <div className="text-muted text-[11px] mt-0.5">Express server initialization & middleware</div>
              </div>
              <div className="p-2 border border-line rounded-[2px] bg-surface-raised">
                <div className="font-mono text-emerald-400 font-medium">03. src/routes/api.routes.ts</div>
                <div className="text-muted text-[11px] mt-0.5">Primary endpoints & parameter validation</div>
              </div>
              <div className="p-2 border border-line rounded-[2px] bg-surface-raised">
                <div className="font-mono text-emerald-400 font-medium">04. src/services/guide.service.ts</div>
                <div className="text-muted text-[11px] mt-0.5">Core business logic & AST analyzer</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-line mt-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-muted mb-2">
              <span>Coverage Heuristic</span>
              <span className="text-ink font-semibold">100% Core</span>
            </div>
            <div className="w-full bg-surface-raised border border-line h-1.5 rounded-[1px] overflow-hidden">
              <div className="bg-emerald-500 h-full w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
