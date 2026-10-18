import { useCallback, useEffect, useState } from 'react'

import { ApiError, api, errorText } from './api/client'
import { loadApiKey, saveApiKey } from './api/key'
import { Chat } from './chat/Chat'
import { KeyForm } from './KeyForm'
import { ImportForm } from './recipes/ImportForm'
import { RecipesPanel } from './recipes/RecipesPanel'

type Backend =
  | { state: 'checking' }
  | { state: 'ok' }
  | { state: 'problem'; message: string }

function App() {
  const [apiKey, setApiKey] = useState(loadApiKey)
  // The health check of the key it was made with: a new key shows «проверяю…» again.
  const [health, setHealth] = useState<{ key: string; result: Backend } | null>(
    null,
  )
  const [selected, setSelected] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!apiKey) return
    let current = true
    const report = (result: Backend) =>
      current && setHealth({ key: apiKey, result })
    api
      .health()
      .then(() => report({ state: 'ok' }))
      .catch((error) =>
        report({
          state: 'problem',
          message:
            error instanceof ApiError && error.status === 401
              ? 'Ключ не подошёл'
              : errorText(error),
        }),
      )
    return () => {
      current = false
    }
  }, [apiKey])
  const backend: Backend =
    health?.key === apiKey ? health.result : { state: 'checking' }

  const changeKey = (key: string) => {
    saveApiKey(key)
    setApiKey(key)
  }
  const refresh = useCallback(() => setVersion((current) => current + 1), [])

  const needsKey =
    !apiKey ||
    (backend.state === 'problem' && backend.message === 'Ключ не подошёл')

  return (
    <div className="app">
      <header>
        <h1>Рецепты</h1>
        <span className={`status ${backend.state}`}>
          {!apiKey
            ? 'нужен ключ'
            : backend.state === 'checking'
              ? 'проверяю…'
              : backend.state === 'ok'
                ? 'бэкенд доступен'
                : backend.message}
        </span>
        {apiKey && (
          <button type="button" className="ghost" onClick={() => changeKey('')}>
            Сменить ключ
          </button>
        )}
      </header>

      {needsKey ? (
        <KeyForm
          problem={apiKey ? 'Ключ не подошёл' : null}
          onSave={changeKey}
        />
      ) : (
        <main>
          <Chat onOpenRecipe={setSelected} />
          <aside>
            <h2>Добавить рецепт</h2>
            <ImportForm onImported={refresh} onOpenRecipe={setSelected} />
            <h2>Мои рецепты</h2>
            <RecipesPanel
              selected={selected}
              onSelect={setSelected}
              version={version}
              onChanged={refresh}
            />
          </aside>
        </main>
      )}
    </div>
  )
}

export default App
