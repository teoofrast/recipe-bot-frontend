import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import App from './App'

describe('App', () => {
  it('renders the title and backend status while checking', () => {
    const html = renderToString(<App />)

    expect(html).toContain('Рецепты')
    expect(html).toContain('проверяю…')
  })
})
