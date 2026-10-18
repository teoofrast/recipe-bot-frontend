import { useEffect, useState } from 'react'

import { api, errorText } from '../api/client'
import type { Recipe } from '../api/types'

interface Props {
  id: string
  onBack: () => void
  onDeleted: () => void
}

function amount(value: number | null, unit: string | null): string {
  if (value === null) return unit ?? ''
  return [Number.isInteger(value) ? value : value.toLocaleString('ru-RU'), unit]
    .filter(Boolean)
    .join(' ')
}

export function RecipeView({ id, onBack, onDeleted }: Props) {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    api
      .getRecipe(id)
      .then((found) => current && setRecipe(found))
      .catch((failure) => current && setError(errorText(failure)))
    return () => {
      current = false
    }
  }, [id])

  const remove = async () => {
    if (!recipe || !confirm(`Удалить «${recipe.title}»?`)) return
    try {
      await api.deleteRecipe(recipe.id)
      onDeleted()
    } catch (failure) {
      setError(errorText(failure))
    }
  }

  const facts =
    recipe &&
    [
      recipe.servings && `${recipe.servings} порц.`,
      recipe.total_minutes && `${recipe.total_minutes} мин`,
      recipe.cuisine,
    ].filter(Boolean)

  return (
    <article className="recipe">
      <button type="button" className="link" onClick={onBack}>
        ← Все рецепты
      </button>
      {error && <p className="error">{error}</p>}
      {!recipe && !error && <p className="muted">Загружаю…</p>}
      {recipe && (
        <>
          <h3>{recipe.title}</h3>
          {facts && facts.length > 0 && (
            <p className="muted">{facts.join(' · ')}</p>
          )}
          {recipe.tags.length > 0 && (
            <p className="tags">
              {recipe.tags.map((tag) => (
                <span key={tag} className="tag">
                  {tag}
                </span>
              ))}
            </p>
          )}
          <h4>Ингредиенты</h4>
          <ul>
            {recipe.ingredients.map((item, index) => (
              <li key={index}>
                {item.name}
                {(item.amount !== null || item.unit) && (
                  <>: {amount(item.amount, item.unit)}</>
                )}
                {item.note && <span className="muted"> ({item.note})</span>}
              </li>
            ))}
          </ul>
          <h4>Шаги</h4>
          <ol>
            {recipe.steps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
          <p className="row spread">
            <a href={recipe.source.url} target="_blank" rel="noreferrer">
              Видео ({recipe.source.platform}
              {recipe.source.author ? `, ${recipe.source.author}` : ''})
            </a>
            <button
              type="button"
              className="ghost danger-text"
              onClick={remove}
            >
              Удалить
            </button>
          </p>
        </>
      )}
    </article>
  )
}
