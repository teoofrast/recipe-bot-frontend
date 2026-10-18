import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import App from './App'
import { STATUS_TEXT } from './recipes/importStatus'

describe('App', () => {
  it('asks for the API key first', () => {
    const html = renderToString(<App />)

    expect(html).toContain('Рецепты')
    expect(html).toContain('Ключ API')
  })

  it('names every import status', () => {
    expect(Object.keys(STATUS_TEXT)).toHaveLength(8)
  })
})
