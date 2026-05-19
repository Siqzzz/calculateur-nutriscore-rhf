import type {
  CreateIngredientPayload,
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

// Ingrédients CIQUAL
export const searchIngredients = (search: string, page = 1, limit = 20) =>
  request<IngredientSearchResult>(`/ingredients?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`)

export const getIngredient = (id: number) =>
  request<Ingredient>(`/ingredients/${id}`)

// Ingrédients personnalisés
export const listCustomIngredients = () =>
  request<IngredientSearchResult>('/ingredients?personnalise=1')

export const createCustomIngredient = (payload: CreateIngredientPayload) =>
  request<Ingredient>('/ingredients', { method: 'POST', body: JSON.stringify(payload) })

export const deleteCustomIngredient = (id: number) =>
  request<null>(`/ingredients/${id}`, { method: 'DELETE' })

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

// Calcul Nutri-Score
export const calculateNutriScore = (recipeId: number) =>
  request<NutriScoreResult>(`/recipes/${recipeId}/calculate`, { method: 'POST' })
