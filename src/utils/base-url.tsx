// Canonical public origin. Build-time constant: import.meta.env.PROD is
// statically replaced by Vite in both client and SSR bundles, and the prod
// origin must match PUBLIC_URL in wrangler.json.
export const baseUrl = import.meta.env.PROD
  ? 'https://www.mainefoodmap.org'
  : `http://127.0.0.1:${import.meta.env.VITE_PORT ?? '3000'}`
