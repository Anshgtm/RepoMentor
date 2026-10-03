import { github } from './integrations.js'

export type GithubBrowserEntry = { name: string; path: string; type: 'folder' | 'file'; size?: number; html_url?: string }
export type GithubDirectory = { path: string; branch: string; entries: GithubBrowserEntry[] }
export type GithubFile = { path: string; branch: string; content: string; html_url?: string; size?: number; status: 'ready' | 'binary' | 'oversized'; message?: string }

const directoryCache = new Map<string, { expiresAt: number; value: GithubDirectory }>()
const fileCache = new Map<string, { expiresAt: number; value: GithubFile }>()
const CACHE_MS = 10 * 60 * 1000

export function parseGithubRepositoryUrl(value: string) {
  const url = new URL(value)
  if (url.hostname.toLowerCase() !== 'github.com') throw new Error('Only github.com repository URLs are supported.')
  const [owner, repository] = url.pathname.split('/').filter(Boolean)
  if (!owner || !repository) throw new Error('The GitHub repository URL is incomplete.')
  return { owner, repository: repository.replace(/\.git$/, '') }
}

export async function listGithubDirectory(repositoryUrl: string, path = ''): Promise<GithubDirectory> {
  const { owner, repository } = parseGithubRepositoryUrl(repositoryUrl)
  const cacheKey = `${owner}/${repository}:${path}`
  const cached = directoryCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value
  const repositoryResponse = await github.repos.get({ owner, repo: repository })
  const response = await github.repos.getContent({ owner, repo: repository, path, ref: repositoryResponse.data.default_branch })
  const items = Array.isArray(response.data) ? response.data : [response.data]
  const value: GithubDirectory = { path, branch: repositoryResponse.data.default_branch, entries: items.map((item: any): GithubBrowserEntry => ({ name: item.name, path: item.path, type: item.type === 'dir' ? 'folder' : 'file', size: item.size, html_url: item.html_url })).sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1) }
  directoryCache.set(cacheKey, { expiresAt: Date.now() + CACHE_MS, value })
  return value
}

export async function readGithubFile(repositoryUrl: string, path: string): Promise<GithubFile> {
  const { owner, repository } = parseGithubRepositoryUrl(repositoryUrl)
  const cacheKey = `${owner}/${repository}:${path}`
  const cached = fileCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now()) return cached.value
  const repositoryResponse = await github.repos.get({ owner, repo: repository })
  const response: any = await github.repos.getContent({ owner, repo: repository, path, ref: repositoryResponse.data.default_branch })
  if (Array.isArray(response.data) || response.data.type !== 'file') throw new Error('The selected path is not a file.')
  if (response.data.encoding !== 'base64') throw new Error('GitHub returned an unsupported file encoding.')
  const size = response.data.size || 0
  if (size > 500_000) return { path: response.data.path, branch: repositoryResponse.data.default_branch, content: '', html_url: response.data.html_url, size, status: 'oversized' as const, message: 'This file is larger than the 500 KB preview limit. Open it on GitHub to inspect the full source.' }
  const content = Buffer.from(response.data.content, 'base64')
  if (content.includes(0)) return { path: response.data.path, branch: repositoryResponse.data.default_branch, content: '', html_url: response.data.html_url, size, status: 'binary' as const, message: 'This appears to be a binary file and cannot be displayed as source code.' }
  const value = { path: response.data.path, branch: repositoryResponse.data.default_branch, content: content.toString('utf8'), html_url: response.data.html_url, size, status: 'ready' as const }
  fileCache.set(cacheKey, { expiresAt: Date.now() + CACHE_MS, value })
  return value
}
