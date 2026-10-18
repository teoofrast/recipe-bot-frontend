export interface SseMessage {
  event: string
  data: string
}

/**
 * Reads a text/event-stream body: `event:` and `data:` fields, a blank line ends a message,
 * `:` lines (pings) are skipped. Lines end with \n or \r\n (a lone \r is not supported).
 */
export async function* readSse(
  body: ReadableStream<Uint8Array>,
): AsyncGenerator<SseMessage> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let event = ''
  let data: string[] = []
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) return
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const raw of lines) {
        const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw
        if (line === '') {
          if (data.length > 0)
            yield { event: event || 'message', data: data.join('\n') }
          event = ''
          data = []
          continue
        }
        if (line.startsWith(':')) continue
        const colon = line.indexOf(':')
        const field = colon === -1 ? line : line.slice(0, colon)
        let value = colon === -1 ? '' : line.slice(colon + 1)
        if (value.startsWith(' ')) value = value.slice(1)
        if (field === 'event') event = value
        else if (field === 'data') data.push(value)
      }
    }
  } finally {
    // Also runs when the reader of this generator stops early.
    reader.cancel().catch(() => {})
  }
}
