import { afterEach, describe, expect, it, vi } from 'vitest'

import { streamChat } from './chat'
import { ApiError } from './client'
import { streamOf } from '../test/streams'

function respond(response: Response) {
  const fetch = vi.fn(async (_url: string, _init: RequestInit) => response)
  vi.stubGlobal('fetch', fetch)
  return fetch
}

afterEach(() => vi.unstubAllGlobals())

async function collect(chatId: string, text: string) {
  const events = []
  for await (const event of streamChat(
    chatId,
    text,
    new AbortController().signal,
  ))
    events.push(event)
  return events
}

describe('streamChat', () => {
  it('posts the question and yields typed events', async () => {
    const fetch = respond(
      new Response(
        streamOf(
          'event: tool\r\ndata: {"name":"search_recipes","description":"Ищу рецепты"}\r\n\r\n',
          ': ping\r\n\r\n',
          'event: token\r\ndata: {"text":"Борщ"}\r\n\r\n',
          'event: unknown\r\ndata: {}\r\n\r\n',
          'event: done\r\ndata: {"model":"m:free"}\r\n\r\n',
        ),
        { headers: { 'Content-Type': 'text/event-stream' } },
      ),
    )

    expect(await collect('web-1', 'Суп?')).toEqual([
      { event: 'tool', name: 'search_recipes', description: 'Ищу рецепты' },
      { event: 'token', text: 'Борщ' },
      { event: 'done', model: 'm:free' },
    ])
    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('/api/chat/stream')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({
      chat_id: 'web-1',
      text: 'Суп?',
    })
    expect(new Headers(init.headers).has('X-API-Key')).toBe(true)
  })

  it('turns the backend error format into ApiError', async () => {
    respond(
      Response.json(
        {
          error: {
            code: 'unauthorized',
            message: 'Нужен правильный заголовок X-API-Key',
          },
        },
        { status: 401 },
      ),
    )

    const failure = await collect('web-1', 'Суп?').catch(
      (error: unknown) => error,
    )

    expect(failure).toBeInstanceOf(ApiError)
    expect(failure).toMatchObject({
      status: 401,
      code: 'unauthorized',
      message: 'Нужен правильный заголовок X-API-Key',
    })
  })

  it('explains a backend that is not running', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Promise.reject(new TypeError('Failed to fetch'))),
    )

    await expect(collect('web-1', 'Суп?')).rejects.toMatchObject({
      status: 0,
      code: 'network',
    })
  })

  it('names a proxy error page by its status', async () => {
    respond(new Response('<html>Bad Gateway</html>', { status: 502 }))

    await expect(collect('web-1', 'Суп?')).rejects.toThrow(
      'Ошибка бэкенда (502)',
    )
  })
})
