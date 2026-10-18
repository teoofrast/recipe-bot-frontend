import type { ImportJob, ImportStatus } from '../api/types'

export const STATUS_TEXT: Record<ImportStatus, string> = {
  queued: 'в очереди',
  reading: 'читаю описание и субтитры…',
  transcribing: 'распознаю речь…',
  watching: 'смотрю видео…',
  extracting: 'извлекаю рецепт…',
  saving: 'сохраняю…',
  done: 'готово',
  no_recipe: 'в видео нет рецепта',
  failed: 'не получилось',
}

export function isFinished(job: ImportJob): boolean {
  return (
    job.status === 'done' ||
    job.status === 'no_recipe' ||
    job.status === 'failed'
  )
}

/** A saved recipe (or a video without one) needs no attention: its notice goes away by itself.
 * A failure stays until closed, so that it is not missed. */
export function fadesAway(job: ImportJob): boolean {
  return job.status === 'done' || job.status === 'no_recipe'
}

export const FADE_AFTER_MS = 15_000

/** The backend keeps imports in memory: after its restart an import is gone. */
export function lost(job: ImportJob): ImportJob {
  return {
    ...job,
    status: 'failed',
    error: 'Импорт потерян: бэкенд перезапускали. Добавьте ссылку ещё раз.',
  }
}

const STORAGE_KEY = 'recipe-bot:imports'
export const KEPT_JOBS = 5

/** Imports survive a page reload: the backend goes on, the page goes on watching. */
export function loadJobs(): ImportJob[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.slice(0, KEPT_JOBS) : []
  } catch {
    return [] // no storage or a broken value
  }
}

export function saveJobs(jobs: ImportJob[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs.slice(0, KEPT_JOBS)))
  } catch {
    // the list then lasts until the page is reloaded
  }
}
