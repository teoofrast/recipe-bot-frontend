import type { ImportJob, ImportStatus } from '../api/types'

export const STATUS_TEXT: Record<ImportStatus, string> = {
  queued: 'в очереди',
  reading: 'читаю описание и субтитры…',
  transcribing: 'распознаю речь…',
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
