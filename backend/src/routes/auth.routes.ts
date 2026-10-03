import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { env } from '../config/env.js'
import { loginSchema, registerSchema } from '../validation/schemas.js'
import { isDatabaseReady } from '../services/database.js'

const memoryUsers: { id: string; email: string; password_hash: string }[] = []

export function authRoutes() {
  const router = Router()
  router.post('/register', async (req, res) => {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) return res.status(422).json({ detail: parsed.error.issues[0].message })
    const passwordHash = await bcrypt.hash(parsed.data.password, 12)
    const user = isDatabaseReady() ? await User.create({ email: parsed.data.email, password_hash: passwordHash }) : { _id: randomUUID(), email: parsed.data.email, password_hash: passwordHash }
    if (!isDatabaseReady()) memoryUsers.push({ id: String(user._id), email: user.email, password_hash: user.password_hash })
    res.status(201).json({ token: jwt.sign({ sub: String(user._id), email: user.email }, env.jwtSecret, { expiresIn: '7d' }), user: { email: user.email } })
  })
  router.post('/login', async (req, res) => {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) return res.status(422).json({ detail: parsed.error.issues[0].message })
    const user: any = isDatabaseReady() ? await User.findOne({ email: parsed.data.email }) : memoryUsers.find(item => item.email === parsed.data.email)
    if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) return res.status(401).json({ detail: 'Invalid email or password.' })
    res.json({ token: jwt.sign({ sub: String(user._id || user.id), email: user.email }, env.jwtSecret, { expiresIn: '7d' }), user: { email: user.email } })
  })
  return router
}
