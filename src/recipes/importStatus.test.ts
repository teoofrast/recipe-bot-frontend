import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ImportJob } from '../api/types'
import { fadesAway, isFinished, loadJobs, lost, saveJobs } from './importStatus'

function job(
  id: string,
  status: ImportJob['status'] = 'extracting',
): ImportJob {
  return {
    id,
    url: `https://youtu.be/${id}`,
    status,
    recipe_id: null,
    already_saved: false,
    error: null,
    created_at: '2026-10-18T09:00:00Z',
    updated_at: '2026-10-18T09:00:00Z',
  }
}

function memoryStorage() {
  const items = new Map<string, string>()
  return {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('imports across a page reload', () => {
  it('keeps the last five imports', () => {
    vi.stubGlobal('localStorage', memoryStorage())

    saveJobs(['a', 'b', 'c', 'd', 'e', 'f'].map((id) => job(id)))

    expect(loadJobs().map((saved) => saved.id)).toEqual([
      'a',
      'b',
      'c',
      'd',
      'e',
    ])
  })

  it('starts empty without storage or with a broken value', () => {
    expect(loadJobs()).toEqual([]) // no localStorage in node

    const storage = memoryStorage()
    storage.setItem('recipe-bot:imports', '{not json')
    vi.stubGlobal('localStorage', storage)
    expect(loadJobs()).toEqual([])
  })

  it('marks an import the restarted backend forgot as failed', () => {
    const gone = lost(job('a'))

    expect(isFinished(gone)).toBe(true)
    expect(gone.error).toContain('бэкенд перезапускали')
  })
})

describe('finished import notices', () => {
  it('go away by themselves unless something failed', () => {
    expect(fadesAway(job('a', 'done'))).toBe(true)
    expect(fadesAway(job('a', 'no_recipe'))).toBe(true)
    expect(fadesAway(job('a', 'failed'))).toBe(false)
    expect(fadesAway(job('a', 'watching'))).toBe(false)
  })
})
