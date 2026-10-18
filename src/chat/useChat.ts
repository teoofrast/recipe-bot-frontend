import { useCallback, useEffect, useRef, useState } from 'react'

import { streamChat } from '../api/chat'
import { errorText } from '../api/client'
import * as chat from './state'

export function useChat() {
  const [state, setState] = useState(chat.loadChat)
  const running = useRef<AbortController | null>(null)

  useEffect(() => chat.saveChat(state), [state])
  useEffect(() => () => running.current?.abort(), [])

  const run = useCallback(
    async (chatId: string, answerId: string, question: string) => {
      const controller = new AbortController()
      running.current = controller
      const update = (
        change: (message: chat.ChatMessage) => chat.ChatMessage,
      ) => setState((current) => chat.updateMessage(current, answerId, change))
      try {
        for await (const event of streamChat(
          chatId,
          question,
          controller.signal,
        )) {
          update((message) => chat.applyEvent(message, event))
        }
        update((message) => chat.finish(message, { error: 'Ответ оборвался' }))
      } catch (error) {
        update((message) =>
          chat.finish(
            message,
            controller.signal.aborted ? 'stopped' : { error: errorText(error) },
          ),
        )
      } finally {
        if (running.current === controller) running.current = null
      }
    },
    [],
  )

  const busy = state.messages.some((message) => message.status === 'streaming')

  const send = (question: string) => {
    const text = question.trim()
    if (!text || busy) return
    const [next, answerId] = chat.ask(state, text)
    setState(next)
    void run(state.chatId, answerId, text)
  }

  const retry = (answerId: string) => {
    const answer = state.messages.find((message) => message.id === answerId)
    if (!answer?.question || busy) return
    setState(chat.retry(state, answerId))
    void run(state.chatId, answerId, answer.question)
  }

  const stop = () => running.current?.abort()

  const reset = () => {
    stop()
    setState(chat.newChat())
  }

  return { messages: state.messages, busy, send, retry, stop, reset }
}
