import process from 'node:process'
import { z } from 'zod'

import { clientEnvSchema } from './client-env'

const serverEnvSchema = z.object({
  DATABASE_URL: z.url(),
})

// Cloudflare Workers (via nodejs_compat) populate `process.env` per-request,
// not at module load — a top-level `envSchema.parse(process.env)` would see
// an empty object on a cold start. Call this inside a server function or
// request handler instead of at module scope.
export function getServerEnv() {
  return serverEnvSchema.parse(process.env)
}

export const clientEnv = clientEnvSchema.parse(import.meta.env)

export const baseUrl = import.meta.env.PROD
  ? 'https://www.mainefoodmap.org'
  : `http://localhost:${clientEnv.VITE_PORT}`
