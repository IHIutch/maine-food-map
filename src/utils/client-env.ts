import { z } from 'zod'

export const clientEnvSchema = z.object({
  VITE_PORT: z.string().default('3000'),
  VITE_MAPBOX_API_KEY: z.string(),
})
