import { useState, type FormEvent } from 'react'

interface Props {
  problem: string | null
  onSave: (key: string) => void
}

export function KeyForm({ problem, onSave }: Props) {
  const [key, setKey] = useState('')

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (key.trim()) onSave(key.trim())
  }

  return (
    <form className="key-form" onSubmit={submit}>
      <h2>Ключ API</h2>
      <p className="muted">
        Значение <code>API_KEY</code> из <code>.env</code> бэкенда. Хранится
        только в этом браузере.
      </p>
      {problem && <p className="error">{problem}</p>}
      <div className="row">
        <input
          type="password"
          value={key}
          onChange={(event) => setKey(event.target.value)}
          placeholder="API_KEY"
          autoComplete="off"
          aria-label="Ключ API"
        />
        <button type="submit" disabled={!key.trim()}>
          Сохранить
        </button>
      </div>
    </form>
  )
}
