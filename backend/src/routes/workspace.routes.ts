import { Router } from 'express'
import { identitySchema, sourceSchema } from '../validation/schemas.js'
import { buildGuide } from '../services/guide.service.js'
import { loadWebsiteUrl, queryRag, summarizeRag } from '../services/rag.service.js'
import { createWorkspace, findWorkspace, listWorkspaces, saveGuide, saveSource, serializeWorkspace } from '../services/workspace.service.js'
import type { SourceFile } from '../types/workspace.js'
import { summarizeGithubRepository } from '../services/github.service.js'
import { listGithubDirectory, readGithubFile } from '../services/github-browser.service.js'
import { githubRateLimitResponse } from '../services/integrations.js'

export function workspaceRoutes(emit: (event: string, payload: unknown) => void) {
  const router = Router()
  router.get('/', async (_req, res) => res.json({ workspaces: (await listWorkspaces()).map(serializeWorkspace) }))
  router.post('/', async (req, res) => {
    const parsed = identitySchema.safeParse(req.body)
    if (!parsed.success) return res.status(422).json({ detail: parsed.error.issues[0].message })
    res.status(201).json(serializeWorkspace(await createWorkspace(parsed.data)))
  })
  router.get('/:id', async (req, res) => {
    const item = await findWorkspace(req.params.id)
    if (!item) return res.status(404).json({ detail: 'Workspace not found.' })
    res.json(serializeWorkspace(item))
  })
  router.get('/:id/github-summary', async (req, res) => {
    const item = await findWorkspace(req.params.id)
    if (!item) return res.status(404).json({ detail: 'Workspace not found.' })
    res.json(await summarizeGithubRepository(item.github_repository_url))
  })
  router.get('/:id/github-directory', async (req, res) => {
    try {
      const item = await findWorkspace(req.params.id)
      if (!item) return res.status(404).json({ detail: 'Workspace not found.' })
      if (!item.github_repository_url) return res.status(409).json({ detail: 'A GitHub repository URL is required.' })
      res.json(await listGithubDirectory(item.github_repository_url, typeof req.query.path === 'string' ? req.query.path : ''))
    } catch (error) { const detail = githubRateLimitResponse(error); res.status(detail ? 429 : 400).json({ detail: detail || (error instanceof Error ? error.message : 'Unable to load the GitHub directory.') }) }
  })
  router.get('/:id/github-file', async (req, res) => {
    try {
      const item = await findWorkspace(req.params.id)
      if (!item) return res.status(404).json({ detail: 'Workspace not found.' })
      if (!item.github_repository_url) return res.status(409).json({ detail: 'A GitHub repository URL is required.' })
      const path = typeof req.query.path === 'string' ? req.query.path : ''
      if (!path) return res.status(422).json({ detail: 'A file path is required.' })
      res.json(await readGithubFile(item.github_repository_url, path))
    } catch (error) { const detail = githubRateLimitResponse(error); res.status(detail ? 429 : 400).json({ detail: detail || (error instanceof Error ? error.message : 'Unable to read the GitHub file.') }) }
  })
  router.put('/:id/source-snapshot', async (req, res) => {
    const parsed = sourceSchema.safeParse(req.body)
    if (!parsed.success) return res.status(422).json({ detail: parsed.error.issues[0].message })
    const item = await findWorkspace(req.params.id, true)
    if (!item) return res.status(404).json({ detail: 'Workspace not found.' })
    await saveSource(item, parsed.data.files as SourceFile[])
    const result = serializeWorkspace(item)
    emit('workspace.updated', result)
    res.json(result)
  })
  router.post('/:id/guide', async (req, res) => {
    const item = await findWorkspace(req.params.id, true)
    if (!item) return res.status(404).json({ detail: 'Workspace not found.' })
    if (!item.source_files?.length) return res.status(409).json({ detail: 'Source material is required before generating a guide.' })
    await saveGuide(item, buildGuide(item))
    emit('guide.generated', { id: req.params.id })
    res.status(201).json(serializeWorkspace(item))
  })
  router.get('/:id/guide', async (req, res) => {
    const item = await findWorkspace(req.params.id)
    if (!item?.guide) return res.status(404).json({ detail: 'Current guide not found.' })
    res.json({ repository: serializeWorkspace(item), source_snapshot: { file_count: item.source_file_count, accepted_at: item.updatedAt || new Date().toISOString() }, guide: item.guide })
  })
  router.post('/:id/rag/ask', async (req, res) => {
    try {
      const item = await findWorkspace(req.params.id, true)
      if (!item) return res.status(404).json({ detail: 'Workspace not found.' })
      const query = typeof req.body?.query === 'string' ? req.body.query : ''
      if (!query.trim()) return res.status(422).json({ detail: 'A question or query is required.' })
      const answer = await queryRag(item, query.trim())
      res.json(answer)
    } catch (error) {
      res.status(500).json({ detail: error instanceof Error ? error.message : 'RAG query failed.' })
    }
  })
  router.get('/:id/rag/summary', async (req, res) => {
    try {
      const item = await findWorkspace(req.params.id, true)
      if (!item) return res.status(404).json({ detail: 'Workspace not found.' })
      const summary = await summarizeRag(item)
      res.json(summary)
    } catch (error) {
      res.status(500).json({ detail: error instanceof Error ? error.message : 'RAG summarization failed.' })
    }
  })
  router.post('/:id/rag/load-url', async (req, res) => {
    try {
      const url = typeof req.body?.url === 'string' ? req.body.url.trim() : ''
      if (!url) return res.status(422).json({ detail: 'A valid website URL is required.' })
      const result = await loadWebsiteUrl(url)
      res.json(result)
    } catch (error) {
      res.status(500).json({ detail: error instanceof Error ? error.message : 'Loading website URL failed.' })
    }
  })
  return router
}
