import { loadApiKey } from './key'
import type { ImportJob, Recipe, RecipeSummary, SearchHit } from './types'

/** The backend's error ({"error": {"code", "message"}}) or a network failure (status 0). */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

/** fetch to /api with the key; throws ApiError unless the answer is 2xx. */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('X-API-Key', loadApiKey())
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await fetch(`/api${path}`, { ...init, headers })
  } catch (error) {
    if (init.signal?.aborted) throw error
    throw new ApiError(
      0,
      'network',
      'Бэкенд недоступен — запущен ли docker compose?',
    )
  }
  if (!response.ok) throw await errorOf(response)
  return response
}

async function errorOf(response: Response): Promise<ApiError> {
  try {
    const { error } = await response.json()
    if (typeof error?.message === 'string') {
      return new ApiError(response.status, error.code, error.message)
    }
  } catch {
    // not our JSON: a proxy error page and the like
  }
  return new ApiError(
    response.status,
    'http_error',
    `Ошибка бэкенда (${response.status})`,
  )
}

async function json<T>(path: string, init?: RequestInit): Promise<T> {
  return (await apiFetch(path, init)).json() as Promise<T>
}

export const api = {
  health: () => json<{ status: string }>('/health'),
  createImport: (url: string) =>
    json<ImportJob>('/imports', {
      method: 'POST',
      body: JSON.stringify({ url }),
    }),
  getImport: (id: string) =>
    json<ImportJob>(`/imports/${encodeURIComponent(id)}`),
  listRecipes: () => json<RecipeSummary[]>('/recipes'),
  searchRecipes: (q: string) =>
    json<SearchHit[]>(
      `/recipes/search?${new URLSearchParams({ q, limit: '10' })}`,
    ),
  getRecipe: (id: string) => json<Recipe>(`/recipes/${encodeURIComponent(id)}`),
  deleteRecipe: async (id: string) => {
    await apiFetch(`/recipes/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}

export function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
