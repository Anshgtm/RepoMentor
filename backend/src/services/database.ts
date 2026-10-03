import mongoose from 'mongoose'
import { env } from '../config/env.js'

export const isDatabaseReady = () => mongoose.connection.readyState === 1

export async function connectDatabase() {
  if (!env.mongoUri) return
  try {
    await mongoose.connect(env.mongoUri)
  } catch {
    console.warn('MongoDB unavailable; using memory store.')
  }
}
