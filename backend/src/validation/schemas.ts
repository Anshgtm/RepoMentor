import { z } from 'zod'

export const identitySchema = z.object({
  repository_name: z.string().trim().min(1).max(120),
  github_repository_url: z.string().url().nullable().optional(),
})

export const sourceSchema = z.object({
  files: z.array(z.object({
    file_path: z.string().trim().min(1),
    file_content: z.string().min(1),
  })).min(1),
})

export const registerSchema = z.object({ email: z.string().email(), password: z.string().min(8) })
export const loginSchema = registerSchema
