export type WorkspaceState = 'draft' | 'source_ready' | 'guide_generated'

export type SourceFile = { file_path: string; file_content: string }
export type SetupChecklistItem = { id: string; label: string; status: 'found' | 'not_found'; instructions: string; evidence: string[] }

export type Guide = {
  generated_at: string
  project_description: string
  overview_content: string
  getting_started_content: string
  how_to_contribute_content: string
  open_questions_content: string
  repository_structure: { file_path: string; role_description: string }[]
  setup_checklist: SetupChecklistItem[]
}

export type WorkspaceRecord = {
  id?: string
  _id?: string
  repository_name: string
  github_repository_url?: string | null
  state: WorkspaceState
  source_file_count?: number
  source_files?: SourceFile[]
  guide?: Guide
  updatedAt?: string
}
