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
