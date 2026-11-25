export function isDev(): boolean {
  return process.env.NODE_ENV !== 'production'
}

// atproto loopback-client spec requires the literal host `127.0.0.1`, not
// `localhost`. We normalize here so cookie-stored origins from the browser
// still produce a spec-compliant redirect_uri.
export function getPublicUrl(requestHost?: string): string {
  const env = process.env as Record<string, string | undefined>
  if (isDev()) {
    if (requestHost) {
      const host = requestHost.includes(':')
        ? requestHost
        : `${requestHost}:${env.VITE_PORT || '3000'}`
      const normalized = host.replace(/^localhost/, '127.0.0.1')
      return `http://${normalized}`
    }
    const port = env.VITE_PORT || '3000'
    return `http://127.0.0.1:${port}`
  }
  if (env.PUBLIC_URL) return env.PUBLIC_URL.replace(/\/$/, '')
  throw new Error('PUBLIC_URL is not set in production environment')
}

export function isDevLoopback(): boolean {
  return isDev()
}
