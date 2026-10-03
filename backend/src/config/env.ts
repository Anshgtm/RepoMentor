import 'dotenv/config'

function requiredSecret(name: string, minimumLength: number) {
  const value = process.env[name]?.trim()
  if (!value || value.length < minimumLength) {
    throw new Error(`${name} must be set to a random value of at least ${minimumLength} characters.`)
  }
  return value
}

export const env = {
  port: Number(process.env.PORT || 8000),
  jwtSecret: requiredSecret('JWT_SECRET', 32),
  mongoUri: process.env.MONGODB_URI,
  redisUrl: process.env.REDIS_URL,
  githubToken: process.env.GITHUB_TOKEN,
  clientOrigin: process.env.CLIENT_ORIGIN || '*',
}
