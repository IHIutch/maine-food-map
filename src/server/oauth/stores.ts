import type {
  Store,
  StoredSession,
  StoredState,
} from '@atcute/oauth-node-client'

const STATE_TTL_SECONDS = 10 * 60

function kvStore<V>(
  kv: KVNamespace,
  prefix: string,
  opts?: { ttlSeconds?: number },
): Store<string, V> {
  const fullKey = (key: string) => `${prefix}:${key}`
  return {
    async get(key: string) {
      const raw = await kv.get(fullKey(key), 'json')
      return (raw as V | null) ?? undefined
    },
    async set(key: string, value: V) {
      await kv.put(fullKey(key), JSON.stringify(value), {
        expirationTtl: opts?.ttlSeconds,
      })
    },
    async delete(key: string) {
      await kv.delete(fullKey(key))
    },
    async clear() {
      // KV lacks a bulk-delete; list-and-delete is expensive and unnecessary
      // for OAuth stores (entries either TTL-expire or are deleted by key).
    },
  }
}

export function makeStateStore(kv: KVNamespace): Store<string, StoredState> {
  return kvStore<StoredState>(kv, 'state', { ttlSeconds: STATE_TTL_SECONDS })
}

export function makeSessionStore(kv: KVNamespace): Store<string, StoredSession> {
  return kvStore<StoredSession>(kv, 'session')
}
