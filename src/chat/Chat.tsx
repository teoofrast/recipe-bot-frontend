import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from 'react'
import Markdown from 'react-markdown'

import type { ChatMessage } from './state'
import { useChat } from './useChat'

const EXAMPLES = [
  'Что приготовить из курицы?',
  'Что можно сделать за 30 минут?',
  'Какие у меня есть супы?',
]

interface Props {
  onOpenRecipe: (id: string) => void
}

export function Chat({ onOpenRecipe }: Props) {
  const { messages, busy, send, retry, stop, reset } = useChat()
  const [draft, setDraft] = useState('')
  const end = useRef<HTMLDivElement>(null)

  const last = messages.at(-1)
  useEffect(
    () => end.current?.scrollIntoView({ block: 'end' }),
    [messages.length, last?.text],
  )

  const submit = (event?: FormEvent) => {
    event?.preventDefault()
    if (busy || !draft.trim()) return
    send(draft)
    setDraft('')
  }

  // Enter sends, Shift+Enter is a new line.
  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    )
      submit(event)
  }

  return (
    <section className="chat" aria-label="Чат по рецептам">
      <div className="panel-head">
        <h2>Чат по рецептам</h2>
        <button
          type="button"
          className="ghost"
          onClick={reset}
          disabled={messages.length === 0}
        >
          Новый чат
        </button>
      </div>

      <div className="messages">
        {messages.length === 0 && (
          <div className="empty">
            <p>Спросите что-нибудь о сохранённых рецептах.</p>
            <div className="examples">
              {EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  className="chip"
                  onClick={() => send(example)}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) =>
          message.role === 'user' ? (
            <div key={message.id} className="message user">
              {message.text}
            </div>
          ) : (
            <Answer
              key={message.id}
              message={message}
              onRetry={retry}
              onOpenRecipe={onOpenRecipe}
            />
          ),
        )}
        <div ref={end} />
      </div>

      <form className="composer" onSubmit={submit}>
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Например: что приготовить на ужин из курицы?"
          rows={2}
          maxLength={4000}
          aria-label="Вопрос"
        />
        {busy ? (
          <button type="button" className="danger" onClick={stop}>
            Стоп
          </button>
        ) : (
          <button type="submit" disabled={!draft.trim()}>
            Спросить
          </button>
        )}
      </form>
    </section>
  )
}

interface AnswerProps {
  message: ChatMessage
  onRetry: (id: string) => void
  onOpenRecipe: (id: string) => void
}

function Answer({ message, onRetry, onOpenRecipe }: AnswerProps) {
  const thinking = message.status === 'streaming' && !message.text
  return (
    <div
      className="message assistant"
      aria-busy={message.status === 'streaming'}
    >
      {message.text && (
        <div className="markdown">
          <Markdown
            components={{
              a: ({ node: _node, ...props }) => (
                <a {...props} target="_blank" rel="noreferrer" />
              ),
            }}
          >
            {message.text}
          </Markdown>
        </div>
      )}
      {message.status === 'streaming' && (
        <p className="activity">
          <span className="spinner" aria-hidden="true" />
          {message.activity ?? (thinking ? 'Думаю…' : 'Печатаю…')}
        </p>
      )}
      {message.sources.length > 0 && (
        <div className="sources">
          <span className="muted">Рецепты:</span>
          {message.sources.map((source) => (
            <span key={source.recipe_id} className="source">
              <button
                type="button"
                className="link"
                onClick={() => onOpenRecipe(source.recipe_id)}
              >
                {source.title}
              </button>
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                title="Видео"
              >
                ▶
              </a>
            </span>
          ))}
        </div>
      )}
      {message.status === 'stopped' && (
        <p className="muted">Ответ остановлен.</p>
      )}
      {message.status === 'error' && (
        <p className="error">
          {message.error}{' '}
          <button
            type="button"
            className="link"
            onClick={() => onRetry(message.id)}
          >
            Повторить
          </button>
        </p>
      )}
    </div>
  )
}
