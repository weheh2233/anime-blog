import type { KeyValueStorage } from "../timer/index.js"

export function createBrowserStorage(storage: Storage | null): KeyValueStorage {
  if (storage === null) {
    return createMemoryStorage()
  }

  return {
    getItem(key: string): string | null {
      try {
        return storage.getItem(key)
      } catch (error) {
        if (error instanceof DOMException) {
          return null
        }

        throw error
      }
    },
    setItem(key: string, value: string): void {
      try {
        storage.setItem(key, value)
      } catch (error) {
        if (error instanceof DOMException) {
          return
        }

        throw error
      }
    },
    removeItem(key: string): void {
      try {
        storage.removeItem(key)
      } catch (error) {
        if (error instanceof DOMException) {
          return
        }

        throw error
      }
    },
  }
}

function createMemoryStorage(): KeyValueStorage {
  const items = new Map<string, string>()

  return {
    getItem(key: string): string | null {
      return items.get(key) ?? null
    },
    setItem(key: string, value: string): void {
      items.set(key, value)
    },
    removeItem(key: string): void {
      items.delete(key)
    },
  }
}
