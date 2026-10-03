import type { WorkspaceRecord } from '../types/workspace.js'
import type { SetupChecklistItem } from '../types/workspace.js'

function commands(text: string, patterns: RegExp[]) {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)
  return [...new Set(lines.filter(line => patterns.some(pattern => pattern.test(line))).slice(0, 4))]
}

function buildSetupChecklist(files: WorkspaceRecord['source_files']): SetupChecklistItem[] {
  const source = files || []
  const text = source.map(file => `${file.file_path}\n${file.file_content}`).join('\n')
  const packageFiles = source.filter(file => /(^|\/)(package\.json|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|requirements\.txt|pyproject\.toml|cargo\.toml|go\.mod)$/i.test(file.file_path)).map(file => file.file_path)
  const envFiles = source.filter(file => /(^|\/)(\.env(?:\.[\w.-]+)?|\.env\.example|example\.env)$/i.test(file.file_path)).map(file => file.file_path)
  const databaseFiles = source.filter(file => /(schema|migration|prisma|mongoose|sequelize|typeorm|database|docker-compose|docker-compose\.ya?ml)/i.test(file.file_path)).map(file => file.file_path)
  const dependencyCommands = commands(text, [/npm (?:install|ci)/i, /yarn install/i, /pnpm install/i, /pip install/i, /poetry install/i, /cargo build/i, /go mod download/i])
  const serverCommands = commands(text, [/npm run (?:dev|start)/i, /yarn (?:dev|start)/i, /pnpm (?:dev|start)/i, /uvicorn/i, /flask run/i, /cargo run/i, /go run/i])
  const testCommands = commands(text, [/npm (?:run )?test/i, /yarn test/i, /pnpm test/i, /pytest/i, /cargo test/i, /go test/i, /vitest/i, /jest/i])
  const envVariables = [...new Set((text.match(/\b[A-Z][A-Z0-9_]{2,}\b/g) || []).filter(value => /(?:API|APP|DATABASE|DB|PORT|SECRET|TOKEN|KEY|URL|HOST|ENV)/i.test(value)).slice(0, 12))]
  return [
    { id: 'dependencies', label: 'Install dependencies', status: dependencyCommands.length || packageFiles.length ? 'found' : 'not_found', instructions: dependencyCommands.length ? dependencyCommands.join(' · ') : packageFiles.length ? `Inspect ${packageFiles.join(', ')} and install the declared packages.` : 'No dependency manifest or install command was found.', evidence: [...packageFiles, ...dependencyCommands] },
    { id: 'environment', label: 'Configure environment variables', status: envFiles.length || envVariables.length ? 'found' : 'not_found', instructions: envFiles.length ? `Copy values from ${envFiles.join(', ')} and provide the required secrets locally.` : envVariables.length ? `The source references ${envVariables.join(', ')}. Define them in the runtime environment.` : 'No environment file or recognizable environment variable was found.', evidence: [...envFiles, ...envVariables] },
    { id: 'database', label: 'Configure the database', status: databaseFiles.length || /(?:mongodb|postgres|mysql|sqlite|redis|database_url|db_url)/i.test(text) ? 'found' : 'not_found', instructions: databaseFiles.length ? `Review ${databaseFiles.join(', ')} for schema, migration, or database startup steps.` : 'No database configuration or migration evidence was found.', evidence: databaseFiles },
    { id: 'development-server', label: 'Start the development server', status: serverCommands.length ? 'found' : 'not_found', instructions: serverCommands.length ? serverCommands.join(' · ') : 'No development server command was found in the supplied material.', evidence: serverCommands },
    { id: 'tests', label: 'Run tests', status: testCommands.length ? 'found' : 'not_found', instructions: testCommands.length ? testCommands.join(' · ') : 'No test command was found in the supplied material.', evidence: testCommands },
  ]
}

function inferLocalProjectDescription(workspace: WorkspaceRecord, files: WorkspaceRecord['source_files']) {
  const name = workspace.repository_name.replace(/[-_]+/g, ' ')
  const text = (files || []).map(file => file.file_content).join('\n').toLowerCase()
  const domain = /task|todo|project|kanban|issue/.test(`${name} ${text}`) ? 'organize tasks and track work' : /shop|store|commerce|cart|product/.test(`${name} ${text}`) ? 'manage products or commerce workflows' : /blog|cms|content|article/.test(`${name} ${text}`) ? 'publish and manage written content' : /chat|message|social|community/.test(`${name} ${text}`) ? 'support communication and collaboration' : 'support a software workflow'
  return `${name.replace(/\b\w/g, letter => letter.toUpperCase())} is a project designed to ${domain}. This description is inferred from the repository name and supplied source files because the README does not include a clear project overview.`
}

function localReadmeDetails(readme: string) {
  const lines = readme.split('\n').map(line => line.trim()).filter(Boolean)
  const featureLines = lines.filter(line => /^[-*+]\s/.test(line)).map(line => line.replace(/^[-*+]\s+/, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')).slice(0, 8)
  const headings = lines.filter(line => /^#{2,4}\s/.test(line)).map(line => line.replace(/^#+\s*/, '')).filter(title => !/install|setup|license/i.test(title)).slice(0, 8)
  return { featureLines, headings }
}

export function buildGuide(workspace: WorkspaceRecord) {
  const files = workspace.source_files || []
  const readme = files.find(file => /(^|\/)(readme|overview)(\.|$)/i.test(file.file_path))
  const text = files.map(file => file.file_content).join('\n')
  const setup = text.match(/(?:install|setup|getting started)[^\n]*\n+([\s\S]{0,400})/i)?.[1]?.trim() || 'The supplied material does not provide local setup instructions.'
  const readmeDescription = readme?.file_content.split('\n').map(line => line.trim()).filter(line => line && !/^#/.test(line) && !/^[-*_]{3,}$/.test(line) && !/^```/.test(line)).find(line => line.length > 35) || inferLocalProjectDescription(workspace, files)
  const readmeDetails = readme ? localReadmeDetails(readme.file_content) : { featureLines: [], headings: [] }
  const detailedDescription = [readmeDescription.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/`([^`]+)`/g, '$1'), readmeDetails.featureLines.length ? `The README highlights these capabilities: ${readmeDetails.featureLines.join('; ')}.` : '', readmeDetails.headings.length ? `It is organized around: ${readmeDetails.headings.join(', ')}.` : ''].filter(Boolean).join('\n\n')

  return {
    generated_at: new Date().toISOString(),
    project_description: detailedDescription.slice(0, 1600),
    overview_content: readme?.file_content?.split('\n').slice(0, 4).join('\n') || 'The repository purpose is not evident from the supplied material.',
    getting_started_content: setup,
    how_to_contribute_content: 'The supplied material does not provide contribution instructions.',
    open_questions_content: 'No open questions from the supplied material.',
    repository_structure: files.map(file => ({ file_path: file.file_path, role_description: 'Supplied source file available for contributor orientation.' })),
    setup_checklist: buildSetupChecklist(files),
  }
}
