import { describe, expect, it } from 'vitest'

import { streamOf } from '../test/streams'
import { readSse } from './sse'

async function collect(body: ReadableStream<Uint8Array>) {
  const messages = []
  for await (const message of readSse(body)) messages.push(message)
  return messages
}

describe('readSse', () => {
  it('reads events split anywhere between chunks', async () => {
    const body =
      'event: token\r\ndata: {"text":"При"}\r\n\r\nevent: done\r\ndata: {}\r\n\r\n'
    const chunks = body.match(/.{1,7}/gs)!

    expect(await collect(streamOf(...chunks))).toEqual([
      { event: 'token', data: '{"text":"При"}' },
      { event: 'done', data: '{}' },
    ])
  })

  it('skips pings and joins multi-line data', async () => {
    const body = ': ping - 2026-10-18\n\ndata: a\ndata: b\n\n'

    expect(await collect(streamOf(body))).toEqual([
      { event: 'message', data: 'a\nb' },
    ])
  })

  it('drops an event cut before its blank line', async () => {
    expect(
      await collect(streamOf('event: token\ndata: {"text":"x"}\n')),
    ).toEqual([])
  })

  it('splits multibyte characters across chunks correctly', async () => {
    const bytes = new TextEncoder().encode('data: борщ\n\n')
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(bytes.slice(0, 8)) // in the middle of «б»
        controller.enqueue(bytes.slice(8))
        controller.close()
      },
    })

    expect(await collect(body)).toEqual([{ event: 'message', data: 'борщ' }])
  })
})
