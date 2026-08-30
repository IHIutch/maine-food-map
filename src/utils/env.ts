import { z } from 'zod'

const serverEnvSchema = z.object({
  DATABASE_URL: z.url(),
})

const clientEnvSchema = z.object({
  VITE_PORT: z.string(),
  VITE_MAPBOX_API_KEY: z.string(),
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
