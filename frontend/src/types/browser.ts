export type GithubBrowserEntry = { name: string; path: string; type: 'folder' | 'file'; size?: number; html_url?: string }
export type GithubDirectory = { path: string; branch: string; entries: GithubBrowserEntry[] }
export type GithubFile = { path: string; branch: string; content: string; html_url?: string; size?: number; status: 'ready' | 'binary' | 'oversized'; message?: string }
