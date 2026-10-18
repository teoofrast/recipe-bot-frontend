// The API key lives in this browser only. Fine locally; a real login replaces it before deploy (card 12).
const STORAGE_KEY = 'recipe-bot:api-key'

export function loadApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return '' // no storage: private mode, SSR in tests
  }
}

export function saveApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, key)
  } catch {
    // the key then lasts until the page is reloaded
  }
}
