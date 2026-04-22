import type {
  NodeSavedSession,
  NodeSavedSessionStore,
  NodeSavedState,
  NodeSavedStateStore,
} from '@atproto/oauth-client-node'

const STATE_TTL_SECONDS = 10 * 60

export function makeStateStore(kv: KVNamespace): NodeSavedStateStore {
  return {
    async get(key: string) {
      const raw = await kv.get(`state:${key}`, 'json')
      return (raw as NodeSavedState | null) ?? undefined
    },
    async set(key: string, value: NodeSavedState) {
      await kv.put(`state:${key}`, JSON.stringify(value), {
        expirationTtl: STATE_TTL_SECONDS,
      })
    },
    async del(key: string) {
      await kv.delete(`state:${key}`)
    },
  }
}

export function makeSessionStore(kv: KVNamespace): NodeSavedSessionStore {
  return {
    async get(did: string) {
      const raw = await kv.get(`session:${did}`, 'json')
      return (raw as NodeSavedSession | null) ?? undefined
    },
    async set(did: string, value: NodeSavedSession) {
      await kv.put(`session:${did}`, JSON.stringify(value))
    },
    async del(did: string) {
      await kv.delete(`session:${did}`)
    },
  }
}
