import { describe, expect, it } from 'vitest'

import type { ChatEvent } from '../api/types'
import {
  applyEvent,
  ask,
  finish,
  newChat,
  retry,
  type ChatMessage,
} from './state'

function answer(events: ChatEvent[]): ChatMessage {
  const [state, id] = ask(newChat(), 'Что приготовить?')
  const message = state.messages.find((m) => m.id === id)!
  return events.reduce(applyEvent, message)
}

describe('chat state', () => {
  it('starts with a chat id and adds a question with an empty answer', () => {
    const chat = newChat()
    const [state, id] = ask(chat, 'Суп?')

    expect(chat.chatId).toMatch(/^web-[0-9a-f]{16}$/)
    expect(state.messages.map((m) => [m.role, m.text, m.status])).toEqual([
      ['user', 'Суп?', 'done'],
      ['assistant', '', 'streaming'],
    ])
    expect(state.messages[1]).toMatchObject({ id, question: 'Суп?' })
  })

  it('builds the answer from the events', () => {
    const tooling = answer([
      { event: 'tool', name: 'search_recipes', description: 'Ищу рецепты' },
    ])
    expect(tooling.activity).toBe('Ищу рецепты')

    const done = answer([
      { event: 'tool', name: 'search_recipes', description: 'Ищу рецепты' },
      { event: 'token', text: 'Курица ' },
      { event: 'token', text: 'карри.' },
      {
        event: 'sources',
        recipes: [
          { recipe_id: 'a1', title: 'Карри', url: 'https://youtu.be/c' },
        ],
      },
      { event: 'done', model: 'm:free' },
    ] as ChatEvent[])

    expect(done).toMatchObject({
      text: 'Курица карри.',
      status: 'done',
      model: 'm:free',
      activity: undefined,
    })
    expect(done.sources).toHaveLength(1)
  })

  it('keeps the text so far on an error and can be retried', () => {
    const failed = answer([
      { event: 'token', text: 'Курица' },
      { event: 'error', message: 'Ни одна модель не ответила' },
    ])
    expect(failed).toMatchObject({
      status: 'error',
      text: 'Курица',
      error: 'Ни одна модель не ответила',
    })

    const again = retry({ chatId: 'c', messages: [failed] }, failed.id)
      .messages[0]
    expect(again).toMatchObject({
      status: 'streaming',
      text: '',
      error: undefined,
      question: 'Что приготовить?',
    })
  })

  it('finishes only an unfinished answer', () => {
    const streaming = answer([{ event: 'token', text: 'Кур' }])
    expect(finish(streaming, 'stopped')).toMatchObject({
      status: 'stopped',
      text: 'Кур',
    })
    expect(finish(streaming, { error: 'Ответ оборвался' })).toMatchObject({
      status: 'error',
    })

    const done = answer([{ event: 'done', model: null }])
    expect(finish(done, 'stopped')).toBe(done)
  })
})
