import { randomUUID } from 'node:crypto'
import { Workspace } from '../models/Workspace.js'
import { isDatabaseReady } from './database.js'
import type { SourceFile, WorkspaceRecord } from '../types/workspace.js'

export const memoryWorkspaces: WorkspaceRecord[] = []

export function serializeWorkspace(item: any) {
  return {
    id: String(item._id || item.id),
    repository_name: item.repository_name,
    github_repository_url: item.github_repository_url,
    state: item.state,
    source_file_count: item.source_file_count || item.source_files?.length || 0,
    guide_generated_at: item.guide?.generated_at,
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
