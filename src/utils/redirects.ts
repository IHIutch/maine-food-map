// Same-origin path guard for post-auth/logout redirects. Rejects absolute
// URLs, protocol-relative (//), and backslash variants (/\) which browsers
// normalize to //.
export function sanitizeNext(next: string | undefined | null): string {
  if (!next) return '/'
  if (!/^\/(?![/\\])/.test(next)) return '/'
  return next
}
