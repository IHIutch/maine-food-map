// workerd does not implement `redirect: "error"`, which @atproto/oauth-client-node
// passes to fetch when resolving DIDs via PLC. We coerce to "manual" at Request
// construction and simulate "error" semantics by throwing on any 3xx response.
let patched = false

export function patchRequestForWorkerd() {
  if (patched) return
  patched = true
  const OriginalRequest = globalThis.Request
  class PatchedRequest extends OriginalRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      if (init && (init as any).redirect === 'error') {
        init = { ...init, redirect: 'manual' }
      }
      super(input as any, init)
    }
  }
  ;(globalThis as any).Request = PatchedRequest

  const originalFetch = globalThis.fetch
  globalThis.fetch = (async (input: any, init?: any) => {
    const wantsError = init && init.redirect === 'error'
    if (wantsError) {
      init = { ...init, redirect: 'manual' }
    }
    const res = await originalFetch(input, init)
    if (wantsError && res.status >= 300 && res.status < 400) {
      throw new TypeError(
        `fetch rejected redirect to ${res.headers.get('location')}`,
      )
    }
    return res
  }) as typeof fetch
}
