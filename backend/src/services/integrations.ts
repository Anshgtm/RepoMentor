import { Octokit } from '@octokit/rest'
import { Queue } from 'bullmq'
import { env } from '../config/env.js'

export const github = new Octokit(env.githubToken ? { auth: env.githubToken } : {})
export const githubConfigured = Boolean(env.githubToken)
export const jobQueue = env.redisUrl ? new Queue('repository-guide-jobs', { connection: { url: env.redisUrl } }) : null

export function validateGithubConfiguration() {
  if (!env.githubToken) {
    console.warn('GitHub integration is not configured. Set GITHUB_TOKEN in backend/.env to enable authenticated repository access.')
    return false
  }
  return true
}

export function githubRateLimitResponse(error: any) {
  const headers = error?.response?.headers || {}
  const remaining = headers['x-ratelimit-remaining']
  const reset = headers['x-ratelimit-reset']
  const retryAfter = headers['retry-after']
  const limited = error?.status === 403 || error?.status === 429 || remaining === '0' || /rate limit/i.test(error?.message || '')
  if (!limited) return null
  const resetText = reset ? ` Try again after ${new Date(Number(reset) * 1000).toLocaleTimeString()}.` : retryAfter ? ` Retry after ${retryAfter} seconds.` : ''
  return `GitHub API rate limit reached.${resetText} Configure GITHUB_TOKEN for authenticated requests.`
}
