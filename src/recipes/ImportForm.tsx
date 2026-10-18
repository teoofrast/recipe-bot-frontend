import { useEffect, useRef, useState, type FormEvent } from 'react'

import { ApiError, api, errorText } from '../api/client'
import {
  FADE_AFTER_MS,
  KEPT_JOBS,
  STATUS_TEXT,
  fadesAway,
  isFinished,
  loadJobs,
  lost,
  saveJobs,
} from './importStatus'

const POLL_MS = 1500

interface Props {
  onImported: (recipeId: string) => void
  onOpenRecipe: (id: string) => void
}

export function ImportForm({ onImported, onOpenRecipe }: Props) {
  const [url, setUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState(loadJobs)
  // Imports finished before a reload are already in the recipe list.
  const [told] = useState(
    () => new Set(jobs.filter(isFinished).map((job) => job.id)),
  )

  useEffect(() => saveJobs(jobs), [jobs])

  const dismiss = (id: string) =>
    setJobs((current) => current.filter((job) => job.id !== id))

  // Each finished import fades on its own timer, counted from when the page saw it finish
  // (after a reload: from the reload).
  const fading = useRef(new Map<string, number>())
  useEffect(() => {
    for (const job of jobs) {
      if (fadesAway(job) && !fading.current.has(job.id)) {
        fading.current.set(
          job.id,
          window.setTimeout(() => {
            fading.current.delete(job.id)
            dismiss(job.id)
          }, FADE_AFTER_MS),
        )
      }
    }
  }, [jobs])
  useEffect(() => {
    const timers = fading.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const running = jobs.filter((job) => !isFinished(job)).map((job) => job.id)
  const runningKey = running.join(',')

  // Polls the unfinished imports; the import itself runs on the backend.
  useEffect(() => {
    if (!runningKey) return
    const timer = setInterval(async () => {
      const ids = runningKey.split(',')
      const updates = await Promise.allSettled(ids.map(api.getImport))
      setJobs((current) =>
        current.map((job) => {
          const update = updates[ids.indexOf(job.id)]
          if (!update) return job
          if (update.status === 'fulfilled') return update.value
          const gone =
            update.reason instanceof ApiError && update.reason.status === 404
          return gone ? lost(job) : job // a network hiccup: ask again next time
        }),
      )
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [runningKey])

  // Tells about each saved recipe once, so that the list can refresh.
  useEffect(() => {
    for (const job of jobs) {
      if (job.status === 'done' && job.recipe_id && !told.has(job.id)) {
        told.add(job.id)
        onImported(job.recipe_id)
      }
    }
  }, [jobs, told, onImported])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      const job = await api.createImport(url.trim())
      setJobs((current) => [job, ...current].slice(0, KEPT_JOBS))
      setUrl('')
    } catch (failure) {
      setError(errorText(failure))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="import">
      <form onSubmit={submit} className="row">
        <input
          type="url"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="Ссылка на YouTube, TikTok или Instagram"
          required
          aria-label="Ссылка на видео"
        />
        <button type="submit" disabled={sending || !url.trim()}>
          Добавить
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {jobs.length > 0 && (
        <ul className="jobs">
          {jobs.map((job) => (
            <li key={job.id} className={`job ${job.status}`}>
              <span className="job-url" title={job.url}>
                {job.url.replace(/^https?:\/\/(www\.)?/, '')}
              </span>
              <span className="job-status">
                {!isFinished(job) && (
                  <span className="spinner" aria-hidden="true" />
                )}
                {job.status === 'done' && job.recipe_id ? (
                  <>
                    {job.already_saved
                      ? 'уже был в коллекции'
                      : 'рецепт сохранён'}{' '}
                    —{' '}
                    <button
                      type="button"
                      className="link"
                      onClick={() => onOpenRecipe(job.recipe_id!)}
                    >
                      открыть
                    </button>
                  </>
                ) : (
                  STATUS_TEXT[job.status]
                )}
              </span>
              {job.error && <span className="error">{job.error}</span>}
              {isFinished(job) && (
                <button
                  type="button"
                  className="dismiss"
                  onClick={() => dismiss(job.id)}
                  aria-label="Закрыть"
                  title="Закрыть"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
