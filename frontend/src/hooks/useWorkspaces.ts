import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { GithubSummary, Workspace } from '../types/api'

export function useWorkspaces() {
  return useQuery({
    queryKey: ['workspaces'],
    queryFn: async () => (await api.get<{ workspaces: Workspace[] }>('/repository-workspaces')).data.workspaces,
  })
}

export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ['workspace', id],
    queryFn: async () => (await api.get<Workspace>(`/repository-workspaces/${id}`)).data,
    enabled: Boolean(id),
  })
}

export function useGuide(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['guide', id],
    queryFn: async () => (await api.get(`/repository-workspaces/${id}/guide`)).data,
    enabled,
  })
}

export function useGithubSummary(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ['github-summary', id],
    queryFn: async () => (await api.get<GithubSummary>(`/repository-workspaces/${id}/github-summary`)).data,
    enabled,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000,
  })
}
