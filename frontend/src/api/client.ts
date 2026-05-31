import type {
  Ingredient,
  IngredientSearchResult,
  MethodeFriture,
  NutriScoreResult,
  Recipe,
  RecipeType,
} from '../types'

const BASE = '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  if (res.status === 204) return null as T
  return res.json()
}

// Ingrédients
export const searchIngredients = (search: string, page = 1, limit = 20) =>
  request<IngredientSearchResult>(`/ingredients?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`)

export const getIngredient = (id: number) =>
  request<Ingredient>(`/ingredients/${id}`)

// Recettes
export const listRecipes = () =>
  request<Recipe[]>('/recipes')

export const createRecipe = (nom: string, type: RecipeType) =>
  request<Recipe>('/recipes', { method: 'POST', body: JSON.stringify({ nom, type }) })

export const getRecipe = (id: number) =>
  request<Recipe>(`/recipes/${id}`)

export const updateRecipe = (id: number, nom: string) =>
  request<Recipe>(`/recipes/${id}`, { method: 'PATCH', body: JSON.stringify({ nom }) })

export const deleteRecipe = (id: number) =>
  request<null>(`/recipes/${id}`, { method: 'DELETE' })

// Ingrédients d'une recette
export interface AddIngredientPayload {
  ingredientId: number
  poidsInitial: number
  estCuit: boolean
  methodeFriture: MethodeFriture
  partComestibleOverride?: number | null
  position?: number
}

export const addIngredient = (recipeId: number, payload: AddIngredientPayload) =>
  request<Recipe>(`/recipes/${recipeId}/ingredients`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const removeIngredient = (recipeId: number, riId: number) =>
  request<Recipe>(`/recipes/${recipeId}/ingredients/${riId}`, { method: 'DELETE' })

export interface UpdateIngredientPayload {
  poidsInitial?: number
  estCuit?: boolean
  methodeFriture?: MethodeFriture
  partComestibleOverride?: number | null
}

export const updateIngredient = (recipeId: number, riId: number, payload: UpdateIngredientPayload) =>
  request<Recipe>(`/recipes/${recipeId}/ingredients/${riId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

// Calcul Nutri-Score
export const calculateNutriScore = (recipeId: number) =>
  request<NutriScoreResult>(`/recipes/${recipeId}/calculate`, { method: 'POST' })

// Ingrédients personnalisés
export interface CustomIngredientPayload {
  nom: string
  energieKj?: number | null
  lipides?: number | null
  acideGrasSatures?: number | null
  glucides?: number | null
  sucres?: number | null
  fibres?: number | null
  proteines?: number | null
  sel?: number | null
  fruitsLegumesPct?: number | null
  partComestible?: number | null
  rendementCuisson?: number | null
  estViandeRouge?: boolean
  pctViandeRouge?: number | null
  presenceEdulorant?: boolean
}

export const listCustomIngredients = () =>
  request<IngredientSearchResult>('/ingredients?type=custom&limit=1000')

export const createCustomIngredient = (payload: CustomIngredientPayload) =>
  request<Ingredient>('/ingredients', { method: 'POST', body: JSON.stringify(payload) })

export const updateCustomIngredient = (id: number, payload: Partial<CustomIngredientPayload>) =>
  request<Ingredient>(`/ingredients/${id}`, { method: 'PATCH', body: JSON.stringify(payload) })

export const deleteCustomIngredient = (id: number) =>
  request<null>(`/ingredients/${id}`, { method: 'DELETE' })
