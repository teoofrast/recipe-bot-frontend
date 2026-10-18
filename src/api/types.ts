// Short names for the generated schema (src/api/schema.ts, `npm run gen:api`).
import type { components } from './schema'

type Schemas = components['schemas']

export type ImportJob = Schemas['ImportJobResponse']
export type ImportStatus = Schemas['ImportStatus']
export type Recipe = Schemas['RecipeResponse']
export type RecipeSummary = Schemas['RecipeSummary']
export type SearchHit = Schemas['SearchHit']
export type SourceRecipe = Schemas['SourceRecipeResponse']
export type ErrorResponse = Schemas['ErrorResponse']

/** One event of POST /chat/stream; `event` is the SSE event name. */
export type ChatEvent =
  | Schemas['TokenData']
  | Schemas['ToolData']
  | Schemas['SourcesData']
  | Schemas['DoneData']
  | Schemas['ErrorData']
