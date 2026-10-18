import type { ChatEvent, SourceRecipe } from '../api/types'

export type MessageStatus = 'streaming' | 'done' | 'stopped' | 'error'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  status: MessageStatus
  /** What the assistant is doing right now: «Ищу рецепты: «курица»». */
  activity?: string
  sources: SourceRecipe[]
  model?: string | null
  error?: string
  /** For an answer: the question, to ask it again. */
  question?: string
}

export interface ChatState {
  chatId: string
  messages: ChatMessage[]
}

export function randomId(): string {
  // crypto.randomUUID needs https or localhost; getRandomValues works on a LAN address too.
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join(
    '',
  )
}

export function newChat(): ChatState {
  return { chatId: `web-${randomId()}`, messages: [] }
}

/** Adds the question and an empty answer that the stream will fill. */
export function ask(state: ChatState, question: string): [ChatState, string] {
  const answer: ChatMessage = {
    id: randomId(),
    role: 'assistant',
    text: '',
    status: 'streaming',
    sources: [],
    question,
  }
  const asked: ChatMessage = {
    id: randomId(),
    role: 'user',
    text: question,
    status: 'done',
    sources: [],
  }
  return [{ ...state, messages: [...state.messages, asked, answer] }, answer.id]
}

/** Asks the failed answer's question again in its place. */
export function retry(state: ChatState, answerId: string): ChatState {
  return updateMessage(state, answerId, (message) => ({
    ...message,
    text: '',
    status: 'streaming',
    sources: [],
    activity: undefined,
    error: undefined,
    model: undefined,
  }))
}

export function applyEvent(
  message: ChatMessage,
  event: ChatEvent,
): ChatMessage {
  switch (event.event) {
    case 'token':
      return {
        ...message,
        text: message.text + event.text,
        activity: undefined,
      }
    case 'tool':
      return { ...message, activity: event.description }
    case 'sources':
      return { ...message, sources: event.recipes }
    case 'done':
      return {
        ...message,
        status: 'done',
        model: event.model,
        activity: undefined,
      }
    case 'error':
      return {
        ...message,
        status: 'error',
        error: event.message,
        activity: undefined,
      }
  }
}

/** The stream ended: by the user (Стоп), with an error, or without a `done`. */
export function finish(
  message: ChatMessage,
  how: 'stopped' | { error: string },
): ChatMessage {
  if (message.status !== 'streaming') return message
  if (how === 'stopped')
    return { ...message, status: 'stopped', activity: undefined }
  return { ...message, status: 'error', error: how.error, activity: undefined }
}

export function updateMessage(
  state: ChatState,
  id: string,
  change: (message: ChatMessage) => ChatMessage,
): ChatState {
  return {
    ...state,
    messages: state.messages.map((message) =>
      message.id === id ? change(message) : message,
    ),
  }
}

const STORAGE_KEY = 'recipe-bot:chat'

/** The same chat_id after a reload, so the assistant remembers the conversation. */
export function loadChat(): ChatState {
  try {
    const saved = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? 'null',
    ) as ChatState | null
    if (saved?.chatId && Array.isArray(saved.messages)) {
      // An answer cut by the reload will not continue.
      return {
        ...saved,
        messages: saved.messages.map((m) => finish(m, 'stopped')),
      }
    }
  } catch {
    // no storage or a broken value: start over
  }
  return newChat()
}

export function saveChat(state: ChatState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // the chat then lasts until the page is reloaded
  }
}
