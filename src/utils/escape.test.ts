import { describe, expect, it } from 'vitest'
import { escapeXml, jsonForScript } from './escape'
import { sanitizeNext } from './redirects'

describe('jsonForScript', () => {
  it('escapes script closing tags', () => {
    const result = jsonForScript({
      x: '</script><script>alert(1)</script>',
    })

    expect(result).not.toContain('</script>')
  })
})

describe('escapeXml', () => {
  it('escapes XML special characters', () => {
    expect(escapeXml('a&b<c>')).toBe('a&amp;b&lt;c&gt;')
  })
})

describe('sanitizeNext', () => {
  it.each([
    [undefined, '/'],
    ['/ok', '/ok'],
    ['//evil.com', '/'],
    ['/\\evil.com', '/'],
    ['https://evil.com', '/'],
  ])('sanitizes %s to %s', (next, expected) => {
    expect(sanitizeNext(next)).toBe(expected)
  })
})
