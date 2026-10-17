import { useEffect, useState } from 'react'

type BackendStatus = 'checking' | 'ok' | 'unavailable'

const STATUS_TEXT: Record<BackendStatus, string> = {
  checking: 'проверяю…',
  ok: 'доступен',
  unavailable: 'недоступен',
}

function App() {
  const [status, setStatus] = useState<BackendStatus>('checking')

  useEffect(() => {
    fetch('/api/health')
      .then((response) => setStatus(response.ok ? 'ok' : 'unavailable'))
      .catch(() => setStatus('unavailable'))
  }, [])

  return (
    <main>
      <h1>Рецепты</h1>
      <p>Бэкенд: {STATUS_TEXT[status]}</p>
    </main>
  )
}

export default App
