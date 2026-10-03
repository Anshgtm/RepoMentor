import { github, githubConfigured } from './integrations.js'

export type RepositorySummary = {
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
  readme_excerpt?: string
  reason?: string
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
}

export type OverviewSection = { title: string; content: string; bullets?: string[] }
export type ProjectOverview = {
  what_the_project_is: OverviewSection
  problem_it_solves: OverviewSection
  how_it_works: OverviewSection
  key_features: OverviewSection
  technology_stack: OverviewSection
  architecture: OverviewSection
  target_users: OverviewSection
  project_structure: OverviewSection
  setup_and_execution: OverviewSection
  limitations_and_missing_information: OverviewSection
}

const summaryCache = new Map<string, { expiresAt: number; value: RepositorySummary }>()
const SUMMARY_CACHE_MS = 10 * 60 * 1000
const ANALYSIS_VERSION = 'v3'

function githubErrorReason(error: any) {
  const headers = error?.response?.headers || {}
  const remaining = headers['x-ratelimit-remaining']
  const reset = headers['x-ratelimit-reset']
  const retryAfter = headers['retry-after']
  if (error?.status === 403 || error?.status === 429 || remaining === '0' || /rate limit/i.test(error?.message || '')) {
    const resetText = reset ? ` Try again after ${new Date(Number(reset) * 1000).toLocaleTimeString()}.` : retryAfter ? ` Retry after ${retryAfter} seconds.` : ''
    return `GitHub API rate limit reached.${resetText} Configure GITHUB_TOKEN for authenticated requests.`
  }
  return githubConfigured ? 'Check that the repository is public or that your token has access.' : 'GitHub integration is not configured on the API.'
}

function cleanMarkdown(value: string) {
  return value.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/[*_>#]/g, '').replace(/\s+/g, ' ').trim()
}

function readmeDescription(readme: string, fallback: string) {
  const lines = readme.split('\n').map(line => line.trim()).filter(Boolean)
  const content = lines.filter(line => !/^#/.test(line) && !/^\[!\[/.test(line) && !/^<img/.test(line) && !/^[-*_]{3,}$/.test(line) && !/^https?:\/\//.test(line))
  const paragraph = content.find(line => line.length > 35 && !/^[-*+`] /.test(line))
  const value = (paragraph || '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/`([^`]+)`/g, '$1').trim().slice(0, 700)
  return value ? cleanMarkdown(value) : fallback
}

function readmeDetails(readme: string) {
  const lines = readme.split('\n')
  const sections: { title: string; lines: string[] }[] = []
  let current: { title: string; lines: string[] } | undefined
  for (const raw of lines) {
    const line = raw.trim()
    const heading = line.match(/^#{2,4}\s+(.+)/)
    if (heading) { current = { title: cleanMarkdown(heading[1]), lines: [] }; sections.push(current); continue }
    if (current && line) current.lines.push(line)
  }
  const featureSection = sections.find(section => /feature|capabilit|function|what it does/i.test(section.title))
  const usageSection = sections.find(section => /usage|how to use|workflow|example|getting started/i.test(section.title))
  const featureLines = (featureSection?.lines || []).filter(line => /^[-*+]\s/.test(line) || line.length > 35).slice(0, 8).map(cleanMarkdown)
  const usageLines = (usageSection?.lines || []).filter(line => !/^```/.test(line)).slice(0, 5).map(cleanMarkdown)
  return { sections, featureLines, usageLines }
}

function humanizeName(value: string) {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase())
}

function inferDescription(name: string, repository: any, readme: string) {
  const readableName = humanizeName(name)
  const topics = (repository.topics || []).map((topic: string) => humanizeName(topic).toLowerCase())
  const signals = [...topics, repository.language?.toLowerCase() || ''].join(' ')
  const domain = /task|todo|project|work|kanban|issue/.test(signals) ? 'organize tasks and track work' : /shop|store|commerce|cart|product/.test(signals) ? 'manage products, shopping, or commerce workflows' : /blog|cms|content|article/.test(signals) ? 'publish and manage written content' : /chat|message|social|community/.test(signals) ? 'support communication and collaboration' : /portfolio|landing|website|frontend|ui/.test(signals) ? 'deliver an interactive web experience' : /api|server|backend|service/.test(signals) ? 'provide application services and data through a backend' : 'support a software workflow'
  const technology = repository.language ? ` It is built primarily with ${repository.language}.` : ''
  const readmeHint = readme ? ' The repository README does not include a clear project overview, so this description is inferred from the available repository signals.' : ' This description is inferred from the repository name and available metadata.'
  return `${readableName} is a project designed to ${domain}.${technology}${readmeHint}`
}

function fileMatches(path: string, pattern: RegExp) { return pattern.test(path) }

async function analyzeRepository(owner: string, repo: string, branch: string, readme: string, language?: string | null) {
  const treeResponse: any = await github.git.getTree({ owner, repo, tree_sha: branch, recursive: '1' })
  const tree = (treeResponse.data.tree || []).filter((item: any) => item.type === 'blob' && typeof item.path === 'string')
  const relevant = tree.filter((item: any) => fileMatches(item.path, /(^|\/)(package\.json|requirements\.txt|pyproject\.toml|go\.mod|Cargo\.toml|docker-compose[^/]*|\.env(?:\.[\w.-]+)?|README[^/]*|(?:src|app|server|api|lib|routes?|controllers?|services?|models?|components?|pages?|config|schema|migration)\/|(?:main|index|server|app)\.(ts|tsx|js|jsx|py|java|go|rb|php)$)|\.(ts|tsx|js|jsx|py|java|go|rb|php|sql|graphql|prisma)$/i)).slice(0, 80)
  const files = await Promise.all(relevant.map(async (item: any) => {
    try {
      const response: any = await github.git.getBlob({ owner, repo, file_sha: item.sha })
      return { path: item.path, content: Buffer.from(response.data.content, 'base64').toString('utf8').slice(0, 18000) }
    } catch { return { path: item.path, content: '' } }
  }))
  const manifests = files.filter(file => /(^|\/)(package\.json|requirements\.txt|pyproject\.toml|go\.mod|Cargo\.toml)$/i.test(file.path))
  const entryPoints = files.filter(file => /(^|\/)(main|index|server|app)\.(ts|tsx|js|jsx|py)$/i.test(file.path)).map(file => file.path)
  const routeFiles = files.filter(file => /(route|controller|endpoint|api\/)/i.test(file.path) || /(?:app|router)\.(get|post|put|patch|delete|use)\s*\(/i.test(file.content) || /@(Get|Post|Put|Patch|Delete|RequestMapping)\s*\(/i.test(file.content))
  const modelFiles = files.filter(file => /(model|schema|migration|entity)/i.test(file.path))
  const dependencies: string[] = []
  for (const file of manifests) {
    if (file.path.endsWith('package.json')) { try { const json = JSON.parse(file.content); dependencies.push(...Object.keys({ ...(json.dependencies || {}), ...(json.devDependencies || {}) })) } catch {} }
    else dependencies.push(...file.content.split('\n').map((line: string) => line.trim().split(/[=<>~]/)[0]).filter((line: string) => line && !line.startsWith('#')).slice(0, 30))
  }
  const technologySet = new Set<string>()
  for (const dependency of dependencies) {
    if (/react/i.test(dependency)) technologySet.add('React')
    if (/express|fastify|nestjs/i.test(dependency)) technologySet.add('Node.js server framework')
    if (/mongoose|prisma|sequelize|typeorm/i.test(dependency)) technologySet.add('database/ORM layer')
    if (/axios|tanstack|socket/i.test(dependency)) technologySet.add('API or realtime client')
    if (/zod|pydantic/i.test(dependency)) technologySet.add('request validation')
  }
  if (language) technologySet.add(language)
  const routeSignals = routeFiles.flatMap(file => [...file.content.matchAll(/(?:app|router)\.(get|post|put|patch|delete|use)\s*\(\s*[`'\"]([^`'\"]+)/gi)].map(match => `${match[1].toUpperCase()} ${match[2]}`)).concat(routeFiles.flatMap(file => [...file.content.matchAll(/@(Get|Post|Put|Patch|Delete)\s*\(\s*[`'\"]?([^`'\")\s]*)/gi)].map(match => `${match[1].toUpperCase()} ${match[2] || '/'}`))).slice(0, 24)
  const modelSignals = modelFiles.map(file => file.path).slice(0, 12)
  const importantPaths = routeFiles.flatMap(file => {
    const routes = [...file.content.matchAll(/(?:app|router)\.(get|post|put|patch|delete|use)\s*\(\s*[`'\"]([^`'\"]+)/gi)]
    const imports = [...file.content.matchAll(/from\s+['"]([^'"]+)['"]/g)].map(match => match[1]).filter(value => !value.startsWith('@'))
    return routes.slice(0, 5).map(route => ({ label: `${route[1].toUpperCase()} ${route[2]}`, steps: [file.path, ...imports.slice(0, 2), ...modelFiles.slice(0, 1).map(model => model.path)], evidence: [file.path, ...modelFiles.slice(0, 1).map(model => model.path)] }))
  }).slice(0, 12)
  const importPaths = files.filter(file => entryPoints.includes(file.path)).flatMap(file => [...file.content.matchAll(/(?:from\s+|require\(\s*|import\s+['"])(['"`]?)([^'"`\s)]+)\1/gi)].map(match => match[2]).filter(value => value.startsWith('.') || value.startsWith('@/')).slice(0, 8))
  const fallbackPaths = importantPaths.length ? importantPaths : entryPoints.slice(0, 4).map(entry => ({ label: `Entry path: ${entry}`, steps: [entry, ...importPaths.slice(0, 3)], evidence: [entry, ...importPaths.slice(0, 3)] }))
  const architectureNotes = [
    entryPoints.length ? `Application entry points include ${entryPoints.join(', ')}.` : '',
    routeFiles.length ? `The repository contains ${routeFiles.length} route/controller files.` : '',
    modelFiles.length ? `Data structures are represented in ${modelFiles.map(file => file.path).join(', ')}.` : '',
    manifests.length ? `Dependencies are declared in ${manifests.map(file => file.path).join(', ')}.` : '',
    readme ? 'README documentation was included in the analysis.' : 'No README content was available; the explanation uses source and configuration files.',
  ].filter(Boolean)
  return { files_analyzed: files.map(file => file.path), dependency_manifests: manifests.map(file => file.path), entry_points: entryPoints, routes_and_endpoints: routeSignals, data_models: modelSignals, architecture_notes: architectureNotes, technologies: [...technologySet], important_paths: fallbackPaths }
}

function makeProjectOverview(name: string, repository: any, readme: string, analysis: Awaited<ReturnType<typeof analyzeRepository>>): ProjectOverview {
  const projectName = humanizeName(name)
  const readmeDetails = readmeDetailsFromText(readme)
  const featureBullets = readmeDetails.featureLines.length ? readmeDetails.featureLines : analysis.routes_and_endpoints.length ? analysis.routes_and_endpoints.map(route => `Provides a ${route} operation.`) : ['No feature list was explicitly documented in the available files.']
  const stack = analysis.technologies.length ? analysis.technologies : [repository.language || 'The primary language could not be verified.']
  const setupFiles = analysis.dependency_manifests.length ? `Dependency manifests found: ${analysis.dependency_manifests.join(', ')}.` : 'No dependency manifest was found in the scanned files.'
  return {
    what_the_project_is: { title: 'What the project is', content: `${projectName} is a software project whose purpose is described by the repository documentation and source structure. ${readmeDetails.intro || repository.description || `The available code suggests it supports ${inferDescription(name, repository, readme).replace(`${projectName} is a project designed to `, '').replace(/\.$/, '')}.`}` },
    problem_it_solves: { title: 'Problem it solves', content: readmeDetails.problem || 'The specific real-world problem is not explicitly stated in the available files. The detected features and routes provide context, but the user need cannot be verified with certainty.' },
    how_it_works: { title: 'How it works', content: 'The verified workflow is summarized from the available entry points, routes, models, and README instructions.', bullets: [analysis.entry_points.length ? `Execution begins in ${analysis.entry_points.join(', ')}.` : 'The application entry point was not identified.', analysis.routes_and_endpoints.length ? `The application exposes or uses these operations: ${analysis.routes_and_endpoints.slice(0, 8).join(', ')}.` : 'No route or API operation was detected.', analysis.data_models.length ? `Data is represented through ${analysis.data_models.join(', ')}.` : 'No data model files were detected.', 'The final user-facing output could not be fully verified from the bounded source scan.'] },
    key_features: { title: 'Key features', content: 'Features found in the README and source signals:', bullets: featureBullets },
    technology_stack: { title: 'Technology stack', content: 'Technologies detected from dependency manifests and repository metadata:', bullets: stack },
    architecture: { title: 'Architecture', content: 'The application appears to be organized around the following verified relationships:', bullets: [analysis.entry_points.length ? `Entry points: ${analysis.entry_points.join(', ')}.` : 'Frontend/backend entry points were not identified.', analysis.dependency_manifests.length ? `Configuration and dependencies: ${analysis.dependency_manifests.join(', ')}.` : 'Dependency configuration was not found.', analysis.routes_and_endpoints.length ? 'Route or API handlers connect user actions to application logic.' : 'No route layer was detected.', analysis.data_models.length ? 'Model/schema files indicate a data layer in the repository.' : 'No database model or schema files were detected.', 'External service relationships are only included when visible in the scanned files.'] },
    target_users: { title: 'Target users', content: readmeDetails.audience || 'The target users are not explicitly identified in the available documentation. The likely audience cannot be stated confidently from code alone.' },
    project_structure: { title: 'Project structure', content: 'Important repository areas identified during analysis:', bullets: [...analysis.entry_points.map(file => `${file}: application entry point.`), ...analysis.data_models.map(file => `${file}: data model, schema, or migration area.`), ...analysis.dependency_manifests.map(file => `${file}: dependency and project configuration.`)].slice(0, 14) },
    setup_and_execution: { title: 'Setup and execution', content: `${setupFiles} Follow the detected setup checklist for commands, environment variables, database configuration, development servers, and tests.` },
    limitations_and_missing_information: { title: 'Limitations and missing information', content: 'This overview is limited to the repository files and metadata available during analysis.', bullets: ['Only a bounded set of high-signal files was scanned.', ...(readme ? [] : ['README content was unavailable.']), ...(analysis.routes_and_endpoints.length ? [] : ['No routes or API endpoints could be verified.']), ...(analysis.data_models.length ? [] : ['No database models or schemas could be verified.']), 'Claims not supported by files are intentionally marked as unverified.'] },
  }
}

function readmeDetailsFromText(readme: string) {
  const paragraphs = readme.split(/\n\s*\n/).map(cleanMarkdown).filter(value => value.length > 35)
  const headings = readme.split('\n').filter(line => /^#{2,4}\s/.test(line)).map(line => line.replace(/^#+\s*/, '').trim())
  const featureLines = readme.split('\n').filter(line => /^[-*+]\s/.test(line)).map(line => cleanMarkdown(line.replace(/^[-*+]\s+/, ''))).slice(0, 8)
  return { intro: paragraphs[0], problem: paragraphs.find(value => /problem|need|help|allows|enables|designed to/i.test(value)), audience: paragraphs.find(value => /developer|user|team|business|student|customer|for /i.test(value)), featureLines, headings }
}

function parseRepositoryUrl(value: string) {
  try {
    const url = new URL(value)
    if (url.hostname.toLowerCase() !== 'github.com') return null
    const [owner, repository] = url.pathname.split('/').filter(Boolean)
    if (!owner || !repository) return null
    return { owner, repository: repository.replace(/\.git$/, '') }
  } catch {
    return null
  }
}

export async function summarizeGithubRepository(repositoryUrl?: string | null): Promise<RepositorySummary> {
  if (!repositoryUrl) return { available: false, configured: githubConfigured, plain_language: 'No GitHub repository was supplied.', project_description: 'Add a GitHub repository URL so RepoMentor can explain what this project does.', description_source: 'unavailable' }
  const parsed = parseRepositoryUrl(repositoryUrl)
  if (!parsed) return { available: false, configured: githubConfigured, plain_language: 'The supplied URL is not a valid GitHub repository URL.', project_description: 'The project description cannot be inferred until a valid GitHub repository URL is supplied.', description_source: 'unavailable', reason: 'Use a URL such as https://github.com/owner/repository.' }
  const cacheKey = `${ANALYSIS_VERSION}:${parsed.owner}/${parsed.repository}`
  const cached = summaryCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value

  try {
    const [{ data: repository }, readmeResponse] = await Promise.all([
      github.repos.get({ owner: parsed.owner, repo: parsed.repository }),
      github.repos.getReadme({ owner: parsed.owner, repo: parsed.repository }).catch(() => null),
    ])
    const readme = readmeResponse?.data && 'content' in readmeResponse.data ? Buffer.from(readmeResponse.data.content, 'base64').toString('utf8') : ''
    const description = repository.description || 'No repository description is available.'
    const projectDescription = readmeDescription(readme, inferDescription(parsed.repository, repository, readme))
    const details = readmeDetails(readme)
    const analysis = await analyzeRepository(parsed.owner, parsed.repository, repository.default_branch, readme, repository.language)
    const language = repository.language ? ` It is primarily written in ${repository.language}.` : ''
    const activity = `It has ${repository.stargazers_count.toLocaleString()} stars, ${repository.forks_count.toLocaleString()} forks, and ${repository.open_issues_count.toLocaleString()} open issues.`
    const capabilities = details.featureLines.length ? `Main capabilities described by the README: ${details.featureLines.join('; ')}.` : ''
    const usage = details.usageLines.length ? `The README explains usage through: ${details.usageLines.join(' ')}.` : ''
    const stack = repository.language ? `The main implementation language is ${repository.language}.` : 'The primary implementation language is not identified by GitHub.'
    const sourceFacts = [analysis.technologies.length ? `Technology signals include ${analysis.technologies.join(', ')}.` : '', analysis.entry_points.length ? `The code starts from ${analysis.entry_points.join(', ')}.` : '', analysis.routes_and_endpoints.length ? `Detected API or route operations include ${analysis.routes_and_endpoints.join(', ')}.` : '', analysis.data_models.length ? `The data layer includes ${analysis.data_models.join(', ')}.` : ''].filter(Boolean).join('\n')
    const detailedDescription = `${projectDescription}\n\n${capabilities}\n${usage}\n${sourceFacts}\n${stack}\nThis repository has ${repository.stargazers_count.toLocaleString()} stars and ${repository.forks_count.toLocaleString()} forks. The default branch is ${repository.default_branch}.`.replace(/\n{3,}/g, '\n\n').trim()
    const result = { available: true, configured: githubConfigured, owner: parsed.owner, name: parsed.repository, html_url: repository.html_url, description: repository.description, language: repository.language, stars: repository.stargazers_count, forks: repository.forks_count, open_issues: repository.open_issues_count, default_branch: repository.default_branch, project_description: detailedDescription, description_source: readmeDescription(readme, '') === projectDescription ? 'readme' : 'inferred', plain_language: `${parsed.repository} is a GitHub repository owned by ${parsed.owner}. ${detailedDescription.replace(/\n/g, ' ')}${language} ${activity} The default branch is ${repository.default_branch}.`, readme_excerpt: readme.replace(/\s+/g, ' ').trim().slice(0, 600) || undefined, analysis, project_overview: makeProjectOverview(parsed.repository, repository, readme, analysis) } satisfies RepositorySummary
    summaryCache.set(cacheKey, { expiresAt: Date.now() + SUMMARY_CACHE_MS, value: result })
    return result
  } catch (error: any) {
    return { available: false, configured: githubConfigured, owner: parsed.owner, name: parsed.repository, plain_language: `GitHub temporarily could not provide fresh details for ${parsed.owner}/${parsed.repository}.`, project_description: inferDescription(parsed.repository, {}, ''), description_source: 'inferred', reason: githubErrorReason(error) }
  }
}
