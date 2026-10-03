import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { env } from './config/env.js'
import { connectDatabase } from './services/database.js'
import { authRoutes } from './routes/auth.routes.js'
import { statusRoutes } from './routes/status.routes.js'
import { workspaceRoutes } from './routes/workspace.routes.js'
import { validateGithubConfiguration } from './services/integrations.js'

export function createApp(io: Server) {
  const app = express()
  app.use(cors({ origin: env.clientOrigin === '*' ? true : env.clientOrigin }))
  app.use(express.json({ limit: '2mb' }))
  app.use('/api', statusRoutes())
  app.use('/api/auth', authRoutes())
  app.use('/api/repository-workspaces', workspaceRoutes((event, payload) => io.emit(event, payload)))
  return app
}

async function start() {
  validateGithubConfiguration()
  await connectDatabase()
  const httpServer = createServer()
  const io = new Server(httpServer, { cors: { origin: env.clientOrigin === '*' ? true : env.clientOrigin } })
  io.on('connection', socket => socket.emit('connected', { message: 'Realtime workspace updates enabled.' }))
  httpServer.on('request', createApp(io))
  httpServer.listen(env.port, () => console.log(`Repository guide API listening on ${env.port}`))
}

start()
