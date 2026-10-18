import { ApiError, apiFetch } from './client'
import { readSse } from './sse'
import type { ChatEvent } from './types'

const EVENTS = new Set<string>(['token', 'tool', 'sources', 'done', 'error'])

/** Asks the assistant; yields its events as they come. Aborting `signal` stops the answer on the backend too. */
export async function* streamChat(
  chatId: string,
  text: string,
  signal: AbortSignal,
): AsyncGenerator<ChatEvent> {
  const response = await apiFetch('/chat/stream', {
    method: 'POST',
    body: JSON.stringify({ chat_id: chatId, text }),
    headers: { Accept: 'text/event-stream' },
    signal,
  })
  if (!response.body) throw new ApiError(0, 'no_body', 'Пустой ответ бэкенда')
  for await (const message of readSse(response.body)) {
    if (!EVENTS.has(message.event)) continue
    // The body has no `event` field: the SSE event name is it.
    yield { ...JSON.parse(message.data), event: message.event } as ChatEvent
  }
}
