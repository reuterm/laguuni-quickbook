import type { BrowserStorage } from './local-storage'

export function createMemoryStorage(
  initialEntries: Record<string, string> = {},
): BrowserStorage {
  const values = new Map(Object.entries(initialEntries))

  return {
    getItem(key) {
      return values.get(key) ?? null
    },
    removeItem(key) {
      values.delete(key)
    },
    setItem(key, value) {
      values.set(key, value)
    },
  }
}
