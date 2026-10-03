export type Workspace = {
  id: string
  repository_name: string
  github_repository_url?: string | null
  state: string
  source_file_count: number
  guide_generated_at?: string
}

export type SourceFile = { file_path: string; file_content: string }
export type SetupChecklistItem = { id: string; label: string; status: 'found' | 'not_found'; instructions: string; evidence: string[] }

export type GithubSummary = {
  available: boolean
  configured: boolean
  owner?: string
  name?: string
  html_url?: string
  description?: string | null
  language?: string | null
  stars?: number
  forks?: number
  open_issues?: number
  default_branch?: string
  plain_language: string
  project_description: string
  description_source: 'readme' | 'inferred' | 'unavailable'
  analysis?: {
    files_analyzed: string[]
    dependency_manifests: string[]
    entry_points: string[]
    routes_and_endpoints: string[]
    data_models: string[]
    architecture_notes: string[]
    technologies: string[]
    important_paths: { label: string; steps: string[]; evidence: string[] }[]
  }
  project_overview?: ProjectOverview
  readme_excerpt?: string
  reason?: string
}

export type Guide = {
  repository: Workspace
  source_snapshot: { file_count: number; accepted_at: string }
  guide: {
    generated_at: string
    project_description: string
    overview_content: string
    getting_started_content: string
    how_to_contribute_content: string
    open_questions_content: string
    repository_structure: { file_path: string; role_description: string }[]
    setup_checklist: SetupChecklistItem[]
  }
  project_overview?: ProjectOverview
}

export type ProjectOverviewSection = { title: string; content: string; bullets?: string[] }
export type ProjectOverview = {
  what_the_project_is: ProjectOverviewSection
  problem_it_solves: ProjectOverviewSection
  how_it_works: ProjectOverviewSection
  key_features: ProjectOverviewSection
  technology_stack: ProjectOverviewSection
  architecture: ProjectOverviewSection
  target_users: ProjectOverviewSection
  project_structure: ProjectOverviewSection
  setup_and_execution: ProjectOverviewSection
  limitations_and_missing_information: ProjectOverviewSection
}
