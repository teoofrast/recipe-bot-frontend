import { useEffect, useState, type FormEvent } from 'react'

import { api, errorText } from '../api/client'
import type { RecipeSummary } from '../api/types'
import { RecipeView } from './RecipeView'

interface Props {
  selected: string | null
  onSelect: (id: string | null) => void
  /** Changes when the collection changed elsewhere (a finished import). */
  version: number
  onChanged: () => void
}

export function RecipesPanel({
  selected,
  onSelect,
  version,
  onChanged,
}: Props) {
  const [recipes, setRecipes] = useState<RecipeSummary[] | null>(null)
  const [query, setQuery] = useState('')
  const [found, setFound] = useState<RecipeSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    api
      .listRecipes()
      .then((list) => {
        setRecipes(list)
        setError(null)
      })
      .catch((failure) => setError(errorText(failure)))
  }, [version])

  const search = async (event: FormEvent) => {
    event.preventDefault()
    if (!query.trim()) return setFound(null)
    setSearching(true)
    try {
      setFound((await api.searchRecipes(query.trim())).map((hit) => hit.recipe))
      setError(null)
    } catch (failure) {
      setError(errorText(failure))
    } finally {
      setSearching(false)
    }
  }

  if (selected) {
    return (
      <RecipeView
        key={selected}
        id={selected}
        onBack={() => onSelect(null)}
        onDeleted={() => {
          onSelect(null)
          onChanged()
        }}
      />
    )
  }

  const shown = found ?? recipes
  return (
    <div className="recipes">
      <form onSubmit={search} className="row">
        <input
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            if (!event.target.value) setFound(null)
          }}
          placeholder="Поиск: «суп с курицей»"
          aria-label="Поиск рецептов"
        />
        <button type="submit" className="ghost" disabled={searching}>
          {searching ? 'Ищу…' : 'Найти'}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
      {shown === null && !error && <p className="muted">Загружаю…</p>}
      {found && (
        <p className="muted">
          Найдено: {found.length}.{' '}
          <button
            type="button"
            className="link"
            onClick={() => {
              setQuery('')
              setFound(null)
            }}
          >
            Показать все
          </button>
        </p>
      )}
      {shown?.length === 0 && (
        <p className="muted">
          {found
            ? 'Ничего похожего.'
            : 'Пока пусто — добавьте ссылку на видео.'}
        </p>
      )}
      <ul className="recipe-list">
        {shown?.map((recipe) => (
          <li key={recipe.id}>
            <button
              type="button"
              className="recipe-item"
              onClick={() => onSelect(recipe.id)}
            >
              <span className="title">{recipe.title}</span>
              <span className="muted">
                {[
                  recipe.total_minutes && `${recipe.total_minutes} мин`,
                  ...recipe.tags.slice(0, 3),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
