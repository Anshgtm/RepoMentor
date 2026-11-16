import { randomUUID } from 'node:crypto'
import { Workspace } from '../models/Workspace.js'
import { isDatabaseReady } from './database.js'
import type { SourceFile, WorkspaceRecord } from '../types/workspace.js'

export const memoryWorkspaces: WorkspaceRecord[] = []

export function serializeWorkspace(item: any) {
  const sampleFiles = item.source_files || []
  let detectedLanguage: string | null = null

  if (sampleFiles.length > 0) {
    const extCounts: Record<string, number> = {}
    for (const f of sampleFiles) {
      const ext = f.file_path ? f.file_path.split('.').pop()?.toLowerCase() : ''
      if (ext && ext.length <= 5) extCounts[ext] = (extCounts[ext] || 0) + 1
    }
    const topExt = Object.entries(extCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
    const extMap: Record<string, string> = {
      ts: 'TypeScript',
      tsx: 'TypeScript',
      js: 'JavaScript',
      jsx: 'JavaScript',
      py: 'Python',
      go: 'Go',
      rs: 'Rust',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      rb: 'Ruby',
      php: 'PHP',
    }
    if (topExt && extMap[topExt]) {
      detectedLanguage = extMap[topExt]
    }
  }

  if (!detectedLanguage && item.guide?.project_overview?.technology_stack?.bullets?.length) {
    const techs = item.guide.project_overview.technology_stack.bullets.join(' ').toLowerCase()
    if (techs.includes('typescript')) detectedLanguage = 'TypeScript'
    else if (techs.includes('javascript') || techs.includes('node')) detectedLanguage = 'JavaScript'
    else if (techs.includes('python')) detectedLanguage = 'Python'
    else if (techs.includes('rust')) detectedLanguage = 'Rust'
    else if (techs.includes('go')) detectedLanguage = 'Go'
  }

  return {
    id: String(item._id || item.id),
    repository_name: item.repository_name,
    github_repository_url: item.github_repository_url,
    state: item.state,
    source_file_count: item.source_file_count || item.source_files?.length || 0,
    guide_generated_at: item.guide?.generated_at,
    updated_at: item.updatedAt || item.guide?.generated_at || item.createdAt,
    created_at: item.createdAt,
    language: detectedLanguage,
  }
}

export async function listWorkspaces(): Promise<any[]> {
  return isDatabaseReady() ? Workspace.find().sort({ createdAt: -1 }).lean() : memoryWorkspaces
}

export async function findWorkspace(id: string, mutable = false): Promise<any> {
  return isDatabaseReady()
    ? mutable ? Workspace.findById(id) : Workspace.findById(id).lean()
    : memoryWorkspaces.find(item => item.id === id)
}

export async function createWorkspace(data: Pick<WorkspaceRecord, 'repository_name' | 'github_repository_url'>): Promise<any> {
  if (isDatabaseReady()) return Workspace.create(data)
  const workspace: WorkspaceRecord = { id: randomUUID(), ...data, state: 'draft', source_file_count: 0 }
  memoryWorkspaces.unshift(workspace)
  return workspace
}

export async function saveSource(workspace: any, files: SourceFile[]) {
  workspace.source_files = files
  workspace.source_file_count = files.length
  workspace.state = 'source_ready'
  if (isDatabaseReady()) await workspace.save()
}

export async function saveGuide(workspace: any, guide: WorkspaceRecord['guide']) {
  workspace.guide = guide
  workspace.state = 'guide_generated'
  if (isDatabaseReady()) await workspace.save()
}
