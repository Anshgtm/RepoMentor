import { useState } from 'react'
import { FileCode2, GitBranch, Terminal, Cpu, Check, Layers } from 'lucide-react'

type FileSnippet = {
  path: string
  lang: string
  lines: { no: number; text: string; tag?: string }[]
  metrics: { lines: number; astNodes: number; dependencies: number }
}

const SNIPPETS: Record<string, FileSnippet> = {
  'server.ts': {
    path: 'src/server.ts',
    lang: 'typescript',
    metrics: { lines: 48, astNodes: 312, dependencies: 6 },
    lines: [
      { no: 1, text: "import express from 'express'" },
      { no: 2, text: "import { createServer } from 'node:http'" },
      { no: 3, text: "import { workspaceRoutes } from './routes/workspaces.js'" },
      { no: 4, text: "" },
      { no: 5, text: "export const app = express()", tag: "APP_ROOT" },
      { no: 6, text: "app.use(express.json())" },
      { no: 7, text: "app.use('/api/workspaces', workspaceRoutes)", tag: "MOUNT_ROUTER" },
      { no: 8, text: "" },
      { no: 9, text: "export const server = createServer(app)", tag: "ENTRY_POINT" },
      { no: 10, text: "server.listen(8000, () => log('Ready on :8000'))" },
    ]
  },
  'workspaces.ts': {
    path: 'src/routes/workspaces.ts',
    lang: 'typescript',
    metrics: { lines: 84, astNodes: 540, dependencies: 4 },
    lines: [
      { no: 1, text: "import { Router } from 'express'" },
      { no: 2, text: "import { WorkspaceService } from '../services/workspace.js'" },
      { no: 3, text: "" },
      { no: 4, text: "export const router = Router()", tag: "SUBROUTER" },
      { no: 5, text: "router.post('/', async (req, res) => {", tag: "HANDLER: POST" },
      { no: 6, text: "  const guide = await WorkspaceService.build(req.body)" },
      { no: 7, text: "  return res.status(201).json(guide)", tag: "DISPATCH" },
      { no: 8, text: "})" },
    ]
  },
  'schema.ts': {
    path: 'src/models/workspace.ts',
    lang: 'typescript',
    metrics: { lines: 36, astNodes: 215, dependencies: 2 },
    lines: [
      { no: 1, text: "import { Schema, model } from 'mongoose'" },
      { no: 2, text: "" },
      { no: 3, text: "const WorkspaceSchema = new Schema({", tag: "DATA_MODEL" },
      { no: 4, text: "  name: { type: String, required: true }," },
      { no: 5, text: "  gitUrl: { type: String, index: true }," },
      { no: 6, text: "  entryPoints: [{ type: String }]," },
      { no: 7, text: "})", tag: "INDEXED" },
    ]
  }
}

export function OrbitalField() {
  const [activeFile, setActiveFile] = useState<string>('server.ts')
  const current = SNIPPETS[activeFile]

  return (
    <div className="telemetry-card w-full">
      {/* Top status bar */}
      <div className="telemetry-header">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-zinc-400" />
          <span className="font-semibold text-zinc-300">AST_PARSER_ACTIVE</span>
          <span className="text-zinc-600">|</span>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-none"></span>
            STATIC_ANALYSIS_PASS
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-zinc-400">
          <span>AST Nodes: {current.metrics.astNodes}</span>
          <span>Deps: {current.metrics.dependencies}</span>
        </div>
      </div>

      {/* File selector tabs */}
      <div className="flex items-center justify-between border-b border-white/5 bg-zinc-950 px-2 py-1">
        <div className="telemetry-tabs">
          {Object.keys(SNIPPETS).map((fileKey) => (
            <button
              key={fileKey}
              type="button"
              onClick={() => setActiveFile(fileKey)}
              className={`telemetry-tab flex items-center gap-1.5 ${activeFile === fileKey ? 'is-active text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              <FileCode2 size={12} className={activeFile === fileKey ? 'text-emerald-400' : 'text-zinc-500'} />
              <span>{fileKey}</span>
            </button>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono text-zinc-500 pr-2">
          <GitBranch size={11} />
          <span>main @ 4f19b2</span>
        </div>
      </div>

      {/* Code body */}
      <div className="telemetry-body bg-[#0a0c0e] min-h-[260px] overflow-x-auto">
        {current.lines.map((line, idx) => (
          <div key={idx} className="code-line hover:bg-white/[0.02] py-0.5 px-1">
            <span className="line-no">{line.no}</span>
            <span className="code-text flex-1">
              {line.text}
              {line.tag && <span className="code-tag font-mono text-[9px] uppercase tracking-wider">{line.tag}</span>}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom telemetry footer */}
      <div className="border-t border-white/5 bg-zinc-950 px-3 py-2 flex items-center justify-between text-[11px] font-mono text-zinc-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1 text-zinc-400">
            <Layers size={12} className="text-zinc-500" />
            Layer: Application Controller
          </span>
          <span className="hidden md:inline text-zinc-600">/</span>
          <span className="hidden md:flex items-center gap-1 text-zinc-400">
            <Cpu size={12} className="text-zinc-500" />
            Parse time: 38ms
          </span>
        </div>
        <span className="text-zinc-400 font-mono text-[10px] tracking-wide">
          ANALYSIS READY
        </span>
      </div>
    </div>
  )
}
