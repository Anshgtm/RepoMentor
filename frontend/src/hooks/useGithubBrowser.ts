import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { GithubDirectory, GithubFile } from '../types/browser'

export function useGithubDirectory(id: string, path: string, enabled: boolean) {
  return useQuery({ queryKey: ['github-directory', id, path], queryFn: async () => (await api.get<GithubDirectory>(`/repository-workspaces/${id}/github-directory`, { params: { path } })).data, enabled, staleTime: 5 * 60 * 1000 })
}

export function useGithubFile(id: string, path: string | null) {
  return useQuery({ queryKey: ['github-file', id, path], queryFn: async () => (await api.get<GithubFile>(`/repository-workspaces/${id}/github-file`, { params: { path } })).data, enabled: Boolean(path), staleTime: 5 * 60 * 1000 })
}
