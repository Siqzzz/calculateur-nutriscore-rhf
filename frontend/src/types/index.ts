export interface Ingredient {
  id: number
  nom: string
  alimentCode: string | null
  groupeNom: string | null
  sousGroupeNom: string | null
  energieKj: number | null
  energieKcal: number | null
  proteines: number | null
  glucides: number | null
  lipides: number | null
  sucres: number | null
  fibres: number | null
  acideGrasSatures: number | null
  sodium: number | null
  sel: number | null
  fruitsLegumesPct: number | null
  partComestible: number | null
  rendementCuisson: number | null
  estViandeRouge: boolean
  pctViandeRouge: number | null
  presenceEdulorant: boolean
  estPersonnalise: boolean
}

export type RecipeType = 'general' | 'viande' | 'boissons'
export type MethodeFriture = 'non' | '1_passage' | 'surgele' | '2_passages_plus'
export type NutriGrade = 'A' | 'B' | 'C' | 'D' | 'E'

export interface RecipeIngredient {
  id: number
  ingredient: Ingredient
  poidsInitial: number
  estCuit: boolean
  methodeFriture: MethodeFriture
  partComestibleOverride: number | null
  poidsFinalCalcule: number | null
  position: number
}

export interface Nutrition100g {
  energieKj: number | null
  energieKcal: number | null
  proteines: number | null
  glucides: number | null
  lipides: number | null
  sucres: number | null
  fibres: number | null
  acideGrasSatures: number | null
  sodium: number | null
  sel: number | null
}

export interface Recipe {
  id: number
  nom: string
  type: RecipeType
  scoreNutri: number | null
  gradeNutri: NutriGrade | null
  nutrition100g: Nutrition100g
  ingredients: RecipeIngredient[]
  createdAt: string
  updatedAt: string
}

export interface IngredientSearchResult {
  data: Ingredient[]
  total: number
  page: number
  limit: number
}

export interface NutriScoreResult {
  score: number | null
  grade: NutriGrade | null
  nutrition: Nutrition100g
  recipe: Recipe
}

export interface CreateIngredientPayload {
  nom: string
  groupeNom?: string
  energieKj?: number | string
  energieKcal?: number | string
  lipides?: number | string
  acideGrasSatures?: number | string
  glucides?: number | string
  sucres?: number | string
  fibres?: number | string
  proteines?: number | string
  sel?: number | string
  fruitsLegumesPct?: number | string
  estViandeRouge?: boolean
  pctViandeRouge?: number | string
  presenceEdulorant?: boolean
}

export type UpdateIngredientPayload = Partial<CreateIngredientPayload>
