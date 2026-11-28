import { clientEnvSchema } from './client-env'

export const clientEnv = clientEnvSchema.parse(import.meta.env)

export const baseUrl = import.meta.env.PROD
  ? 'https://www.mainefoodmap.org'
  : `http://localhost:${clientEnv.VITE_PORT}`
