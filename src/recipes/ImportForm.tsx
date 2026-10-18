import { useEffect, useRef, useState, type FormEvent } from 'react'

import { api, errorText } from '../api/client'
import type { ImportJob } from '../api/types'
import { STATUS_TEXT, isFinished } from './importStatus'

const POLL_MS = 1500

interface Props {
  onImported: (recipeId: string) => void
  onOpenRecipe: (id: string) => void
}

export function ImportForm({ onImported, onOpenRecipe }: Props) {
  const [url, setUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<ImportJob[]>([])

  const running = jobs.filter((job) => !isFinished(job)).map((job) => job.id)
  const runningKey = running.join(',')

  // Polls the unfinished imports; the import itself runs on the backend.
  useEffect(() => {
    if (!runningKey) return
    const timer = setInterval(async () => {
      const updates = await Promise.allSettled(
        runningKey.split(',').map(api.getImport),
      )
      const fresh = updates.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      )
      setJobs((current) =>
        current.map(
          (job) => fresh.find((update) => update.id === job.id) ?? job,
        ),
      )
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [runningKey])

  // Tells about each saved recipe once, so that the list can refresh.
  const told = useRef(new Set<string>())
  useEffect(() => {
    for (const job of jobs) {
      if (job.status === 'done' && job.recipe_id && !told.current.has(job.id)) {
        told.current.add(job.id)
        onImported(job.recipe_id)
      }
    }
  }, [jobs, onImported])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSending(true)
    setError(null)
    try {
      const job = await api.createImport(url.trim())
      setJobs((current) => [job, ...current].slice(0, 5))
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
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
