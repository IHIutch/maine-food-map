import server from '@tanstack/react-start/server-entry'
import type { Register } from '@tanstack/react-router'
import type { RequestHandler } from '@tanstack/react-start/server'
import { applySecurityHeaders } from './utils/security-headers'

const fetch: RequestHandler<Register> = async (request, options) => {
  const response = await server.fetch(request, options)
  return applySecurityHeaders(response)
}

export default { fetch }
