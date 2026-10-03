import { Router } from 'express'
import { githubConfigured, jobQueue } from '../services/integrations.js'
import { isDatabaseReady } from '../services/database.js'

export function statusRoutes() {
  const router = Router()
  router.get('/health', (_req, res) => res.json({ ok: true, database: isDatabaseReady() ? 'mongodb' : 'memory' }))
  router.get('/github/status', (_req, res) => res.json({ configured: githubConfigured, authenticated: githubConfigured, public_access: true, message: githubConfigured ? 'GitHub authenticated integration configured.' : 'Public GitHub access enabled. Set GITHUB_TOKEN for higher rate limits and private repositories.' }))
  router.get('/jobs/status', (_req, res) => res.json({ configured: Boolean(jobQueue), message: jobQueue ? 'Background jobs configured.' : 'Set REDIS_URL to enable BullMQ.' }))
  return router
}
