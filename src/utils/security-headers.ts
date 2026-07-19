const ENFORCED_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy':
    'geolocation=(self), camera=(), microphone=(), payment=()',
} as const

const CSP_REPORT_ONLY =
  "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.usefathom.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://places.googleapis.com https://*.mapbox.com; connect-src 'self' https://*.mapbox.com https://cdn.usefathom.com; worker-src 'self' blob:; child-src blob:; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"

export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)

  for (const [name, value] of Object.entries(ENFORCED_HEADERS)) {
    headers.set(name, value)
  }

  if (headers.get('content-type')?.toLowerCase().startsWith('text/html')) {
    headers.set('Content-Security-Policy-Report-Only', CSP_REPORT_ONLY)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
