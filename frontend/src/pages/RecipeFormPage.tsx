import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import type { Ingredient, MethodeFriture, NutriGrade, NutriScoreResult, Recipe, RecipeIngredient, RecipeType } from '../types'
import { IngredientSearch } from '../components/IngredientSearch'
import { NutriScoreDisplay } from '../components/NutriScoreDisplay'
import { addIngredient, calculateNutriScore, createRecipe, getRecipe, removeIngredient, updateIngredient } from '../api/client'

const TYPE_CONFIG: Record<RecipeType, { label: string; icon: string; desc: string }> = {
  general:  { label: 'Général',  icon: '🍽',  desc: 'Plats composés, entrées, desserts…' },
  viande:   { label: 'Viande',   icon: '🥩',  desc: 'Recettes à base de viande rouge' },
  boissons: { label: 'Boissons', icon: '🥤', desc: 'Jus, sodas, boissons chaudes…' },
}

const FRITURE_LABELS: Record<MethodeFriture, string> = {
  non: 'Pas de friture',
  '1_passage': '1 passage friture',
  surgele: 'Surgelé / frites',
  '2_passages_plus': '2 passages et plus',
}

const GRADE_BG: Record<string, string> = {
  A: 'bg-[#038141]', B: 'bg-[#85BB2F]', C: 'bg-[#FECB02]', D: 'bg-[#EE8100]', E: 'bg-[#E63312]',
}

export default function RecipeFormPage() {
  const { id } = useParams<{ id: string }>()

  const [step, setStep] = useState<'setup' | 'managing'>(id ? 'managing' : 'setup')
  const [type, setType] = useState<RecipeType>('general')
  const [nom, setNom] = useState('')
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [nutriResult, setNutriResult] = useState<NutriScoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null)
  const [poids, setPoids] = useState('')
  const [estCuit, setEstCuit] = useState(false)
  const [methodeFriture, setMethodeFriture] = useState<MethodeFriture>('non')

  // Inline editing state
  const [editingRiId, setEditingRiId] = useState<number | null>(null)
  const [editPoids, setEditPoids] = useState('')
  const [editEstCuit, setEditEstCuit] = useState(false)
  const [editFriture, setEditFriture] = useState<MethodeFriture>('non')

  useEffect(() => {
    if (id) {
      setLoading(true)
      getRecipe(parseInt(id))
        .then(r => { setRecipe(r); setType(r.type); setStep('managing') })
        .catch(() => setError('Recette introuvable.'))
        .finally(() => setLoading(false))
    }
  }, [id])

  const handleCreate = async () => {
    if (!nom.trim()) return setError('Le nom est requis.')
    setError(null)
    setLoading(true)
    try {
      const r = await createRecipe(nom.trim(), type)
      setRecipe(r)
      setStep('managing')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!recipe || !selectedIng) return
    const p = parseFloat(poids)
    if (isNaN(p) || p <= 0) return setError('Le poids doit être un nombre positif.')
    setError(null)
    setLoading(true)
    try {
      const updated = await addIngredient(recipe.id, {
        ingredientId: selectedIng.id, poidsInitial: p,
        estCuit, methodeFriture, position: recipe.ingredients.length,
      })
      setRecipe(updated)
      setSelectedIng(null)
      setPoids('')
      setEstCuit(false)
      setMethodeFriture('non')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = async (riId: number) => {
    if (!recipe) return
    setLoading(true)
    try {
      setRecipe(await removeIngredient(recipe.id, riId))
      setNutriResult(null)
      if (editingRiId === riId) setEditingRiId(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (ri: RecipeIngredient) => {
    setEditingRiId(ri.id)
    setEditPoids(String(ri.poidsInitial))
    setEditEstCuit(ri.estCuit)
    setEditFriture(ri.methodeFriture)
  }

  const cancelEdit = () => setEditingRiId(null)

  const saveEdit = async (riId: number) => {
    if (!recipe) return
    const p = parseFloat(editPoids)
    if (isNaN(p) || p <= 0) return setError('Poids invalide.')
    setError(null)
    setLoading(true)
    try {
      const updated = await updateIngredient(recipe.id, riId, {
        poidsInitial: p,
        estCuit: editEstCuit,
        methodeFriture: editFriture,
      })
      setRecipe(updated)
      setNutriResult(null)
      setEditingRiId(null)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  const handleCalculate = async () => {
    if (!recipe) return
    setLoading(true)
    setError(null)
    try {
      const result = await calculateNutriScore(recipe.id)
      setNutriResult(result)
      setRecipe(result.recipe)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de calcul')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !recipe && step === 'managing') {
    return <div className="text-center py-16 text-slate-400">Chargement…</div>
  }

  const displayGrade = (nutriResult?.grade ?? recipe?.gradeNutri) as NutriGrade | null

  return (
    <div>
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Retour
      </Link>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {/* Étape setup */}
      {step === 'setup' && (
        <div className="max-w-xl">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Nouvelle recette</h1>
          <p className="text-slate-500 text-sm mb-8">Choisissez le type et donnez un nom à votre recette.</p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">Type de recette</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(TYPE_CONFIG) as [RecipeType, typeof TYPE_CONFIG[RecipeType]][]).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => setType(key)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center transition-all ${
                    type === key
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl">{cfg.icon}</span>
                  <span className="text-sm font-semibold">{cfg.label}</span>
                  <span className="text-xs text-slate-500 leading-tight">{cfg.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">Nom de la recette</label>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Ex : Gratin dauphinois"
              className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={loading || !nom.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-3 transition-colors"
          >
            {loading ? 'Création…' : 'Créer la recette →'}
          </button>
        </div>
      )}

      {/* Étape managing */}
      {step === 'managing' && recipe && (
        <>
          {/* Header recette */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{TYPE_CONFIG[type].icon}</span>
              <div>
                <h1 className="font-bold text-slate-900 text-lg">{recipe.nom}</h1>
                <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full font-medium">
                  {TYPE_CONFIG[type].label}
                </span>
              </div>
              {displayGrade && (
                <span className={`ml-2 w-9 h-9 rounded-full text-white font-bold text-base flex items-center justify-center ${GRADE_BG[displayGrade]}`}>
                  {displayGrade}
                </span>
              )}
            </div>
            <button
              onClick={handleCalculate}
              disabled={loading || recipe.ingredients.length === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors shrink-0"
            >
              {loading ? 'Calcul…' : '🧮 Calculer le Nutri-Score'}
            </button>
          </div>

          {/* Info box viande rouge (viande type only) */}
          {type === 'viande' && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 mb-6 flex items-start gap-2">
              <span className="text-base">🥩</span>
              <span>Pour les recettes <strong>viande</strong>, le % de viande rouge de chaque ingrédient est pris en compte dans le calcul du Nutri-Score. Vérifiez que les ingrédients carnés ont bien leur % renseigné.</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
            {/* Colonne gauche */}
            <div className="space-y-4">
              {/* Ajout ingrédient */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <h2 className="font-semibold text-slate-800 mb-4">Ajouter un ingrédient</h2>
                <IngredientSearch onSelect={ing => { setSelectedIng(ing); setError(null) }} />
                {selectedIng && (
                  <div className="mt-2 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-sm text-emerald-700">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="font-medium truncate">{selectedIng.nom}</span>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Poids initial (g)</label>
                    <input
                      type="number"
                      value={poids}
                      onChange={e => setPoids(e.target.value)}
                      min="0" step="0.1"
                      placeholder="0"
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">État de cuisson</label>
                    <div className="flex items-center h-[38px] gap-2">
                      <input
                        type="checkbox"
                        id="estCuit"
                        checked={estCuit}
                        onChange={e => setEstCuit(e.target.checked)}
                        className="w-4 h-4 accent-blue-600"
                      />
                      <label htmlFor="estCuit" className="text-sm text-slate-700 cursor-pointer">Cuit</label>
                    </div>
                  </div>
                </div>

                {estCuit && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Méthode de friture</label>
                    <select
                      value={methodeFriture}
                      onChange={e => setMethodeFriture(e.target.value as MethodeFriture)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {(Object.entries(FRITURE_LABELS) as [MethodeFriture, string][]).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  onClick={handleAdd}
                  disabled={!selectedIng || !poids || loading}
                  className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors"
                >
                  + Ajouter l'ingrédient
                </button>
              </div>

              {/* Liste ingrédients */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-800">
                    Ingrédients
                    <span className="ml-2 text-xs text-slate-400 font-normal">{recipe.ingredients.length}/24</span>
                  </h2>
                </div>

                {recipe.ingredients.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p className="text-sm">Aucun ingrédient ajouté</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recipe.ingredients.map(ri => (
                      <div key={ri.id} className="py-3">
                        {editingRiId === ri.id ? (
                          /* Inline edit row */
                          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                            <p className="text-sm font-medium text-slate-800">{ri.ingredient.nom}</p>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-xs text-slate-500 mb-1">Poids (g)</label>
                                <input
                                  type="number" min="0" step="0.1"
                                  value={editPoids}
                                  onChange={e => setEditPoids(e.target.value)}
                                  className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex items-end gap-2 pb-1">
                                <input type="checkbox" id={`cuit-${ri.id}`} checked={editEstCuit}
                                  onChange={e => setEditEstCuit(e.target.checked)}
                                  className="w-4 h-4 accent-blue-600" />
                                <label htmlFor={`cuit-${ri.id}`} className="text-sm text-slate-700 cursor-pointer">Cuit</label>
                              </div>
                            </div>
                            {editEstCuit && (
                              <select value={editFriture} onChange={e => setEditFriture(e.target.value as MethodeFriture)}
                                className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {(Object.entries(FRITURE_LABELS) as [MethodeFriture, string][]).map(([val, label]) => (
                                  <option key={val} value={val}>{label}</option>
                                ))}
                              </select>
                            )}
                            <div className="flex gap-2 pt-1">
                              <button onClick={() => saveEdit(ri.id)} disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg py-1.5 transition-colors">
                                ✓ Valider
                              </button>
                              <button onClick={cancelEdit}
                                className="flex-1 border border-slate-300 text-slate-600 text-xs font-medium rounded-lg py-1.5 hover:bg-slate-100 transition-colors">
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Normal row */
                          <div className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-slate-800 truncate">{ri.ingredient.nom}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {ri.estCuit && (
                                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded">cuit</span>
                                )}
                                {type === 'viande' && ri.ingredient.pctViandeRouge != null && (
                                  <span className="text-xs text-slate-500">{ri.ingredient.pctViandeRouge}% V.rouge</span>
                                )}
                                {type === 'boissons' && (
                                  <span className="text-xs text-slate-500">
                                    Édulcorant: {ri.ingredient.presenceEdulorant ? 'OUI' : 'NON'}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-sm font-mono text-slate-600 shrink-0">{ri.poidsInitial} g</span>
                            <button
                              onClick={() => startEdit(ri)}
                              className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Modifier"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleRemove(ri.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Colonne droite : résultats */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="font-semibold text-slate-800 mb-4">Résultat Nutri-Score</h2>
              <NutriScoreDisplay
                grade={(nutriResult?.grade ?? recipe.gradeNutri) as NutriGrade | null}
                score={nutriResult?.score ?? recipe.scoreNutri}
                nutrition={nutriResult?.nutrition ?? recipe.nutrition100g}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
