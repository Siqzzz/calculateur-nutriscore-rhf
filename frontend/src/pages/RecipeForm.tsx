import { useState } from 'react'
import type { Ingredient, MethodeFriture, NutriGrade, NutriScoreResult, Recipe, RecipeType } from '../types'
import { IngredientSearch } from '../components/IngredientSearch'
import { NutriScoreDisplay } from '../components/NutriScoreDisplay'
import {
  addIngredient,
  calculateNutriScore,
  createRecipe,
  removeIngredient,
} from '../api/client'

interface Props {
  type: RecipeType
}

const TYPE_LABELS: Record<RecipeType, string> = {
  general: 'Recette générale',
  viande: 'Recette viande',
  boissons: 'Boissons',
}

export function RecipeForm({ type }: Props) {
  const [nom, setNom] = useState('')
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [nutriResult, setNutriResult] = useState<NutriScoreResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // État pour le formulaire d'ajout d'ingrédient
  const [selectedIng, setSelectedIng] = useState<Ingredient | null>(null)
  const [poids, setPoids] = useState('')
  const [estCuit, setEstCuit] = useState(false)
  const [methodeFriture, setMethodeFriture] = useState<MethodeFriture>('non')

  const handleCreateRecipe = async () => {
    if (!nom.trim()) return setError('Le nom de la recette est requis.')
    setError(null)
    setLoading(true)
    try {
      const r = await createRecipe(nom.trim(), type)
      setRecipe(r)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  const handleAddIngredient = async () => {
    if (!recipe || !selectedIng) return
    const p = parseFloat(poids)
    if (isNaN(p) || p <= 0) return setError('Le poids doit être un nombre positif.')
    setError(null)
    setLoading(true)
    try {
      const updated = await addIngredient(recipe.id, {
        ingredientId: selectedIng.id,
        poidsInitial: p,
        estCuit,
        methodeFriture,
        position: recipe.ingredients.length,
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

  const handleRemoveIngredient = async (riId: number) => {
    if (!recipe) return
    setLoading(true)
    try {
      const updated = await removeIngredient(recipe.id, riId)
      setRecipe(updated)
      setNutriResult(null)
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

  return (
    <div style={pageStyle}>
      <h2 style={{ marginBottom: 24 }}>{TYPE_LABELS[type]}</h2>

      {error && <div style={errorStyle}>{error}</div>}

      {/* Étape 1 : créer la recette */}
      {!recipe ? (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>Nom de la recette</h3>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              placeholder="Ex : Gratin dauphinois"
              style={{ ...inputStyle, flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && handleCreateRecipe()}
            />
            <button onClick={handleCreateRecipe} disabled={loading} style={btnPrimaryStyle}>
              Créer la recette
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* En-tête recette */}
          <div style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{recipe.nom}</span>
              <span style={typeBadgeStyle}>{TYPE_LABELS[type]}</span>
            </div>
            <button onClick={handleCalculate} disabled={loading || recipe.ingredients.length === 0} style={btnPrimaryStyle}>
              {loading ? '⏳ Calcul...' : '🧮 Calculer le Nutri-Score'}
            </button>
          </div>

          <div style={twoColStyle}>
            {/* Colonne gauche : ingrédients */}
            <div>
              {/* Ajout d'un ingrédient */}
              <div style={cardStyle}>
                <h3 style={sectionTitle}>Ajouter un ingrédient</h3>
                <div style={{ marginBottom: 12 }}>
                  <IngredientSearch onSelect={setSelectedIng} />
                  {selectedIng && (
                    <div style={selectedIngStyle}>
                      ✅ <strong>{selectedIng.nom}</strong>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <label style={labelStyle}>
                    Poids initial (g)
                    <input
                      type="number"
                      value={poids}
                      onChange={e => setPoids(e.target.value)}
                      min="0"
                      step="0.1"
                      style={{ ...inputStyle, width: 120, marginTop: 4 }}
                    />
                  </label>

                  <label style={labelStyle}>
                    <input
                      type="checkbox"
                      checked={estCuit}
                      onChange={e => setEstCuit(e.target.checked)}
                      style={{ marginRight: 6 }}
                    />
                    Cuit
                  </label>

                  {estCuit && (
                    <label style={labelStyle}>
                      Méthode de friture
                      <select
                        value={methodeFriture}
                        onChange={e => setMethodeFriture(e.target.value as MethodeFriture)}
                        style={{ ...inputStyle, width: 'auto', marginTop: 4 }}
                      >
                        <option value="non">Pas de friture</option>
                        <option value="1_passage">1 passage friture</option>
                        <option value="surgele">Surgelé / frites</option>
                        <option value="2_passages_plus">2 passages et plus</option>
                      </select>
                    </label>
                  )}

                  <button
                    onClick={handleAddIngredient}
                    disabled={!selectedIng || !poids || loading}
                    style={btnSecondaryStyle}
                  >
                    + Ajouter
                  </button>
                </div>
              </div>

              {/* Liste des ingrédients */}
              <div style={cardStyle}>
                <h3 style={sectionTitle}>Ingrédients ({recipe.ingredients.length} / 24)</h3>
                {recipe.ingredients.length === 0 ? (
                  <p style={{ color: '#888', fontSize: '0.9rem' }}>Aucun ingrédient ajouté.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5' }}>
                        <th style={thStyle}>Ingrédient</th>
                        <th style={{ ...thStyle, textAlign: 'right' }}>Poids (g)</th>
                        {type === 'viande' && <th style={thStyle}>% V. rouge</th>}
                        {type === 'boissons' && <th style={thStyle}>Édulcorant</th>}
                        <th style={thStyle}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {recipe.ingredients.map(ri => (
                        <tr key={ri.id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={tdStyle}>
                            {ri.ingredient.nom}
                            {ri.estCuit && <span style={cuitBadge}>cuit</span>}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>{ri.poidsInitial}</td>
                          {type === 'viande' && (
                            <td style={tdStyle}>{ri.ingredient.pctViandeRouge ?? '-'}</td>
                          )}
                          {type === 'boissons' && (
                            <td style={tdStyle}>{ri.ingredient.presenceEdulorant ? 'OUI' : 'NON'}</td>
                          )}
                          <td style={tdStyle}>
                            <button
                              onClick={() => handleRemoveIngredient(ri.id)}
                              style={btnDangerStyle}
                              title="Supprimer"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Colonne droite : Nutri-Score */}
            <div>
              <div style={cardStyle}>
                <h3 style={sectionTitle}>Résultat Nutri-Score</h3>
                <NutriScoreDisplay
                  grade={(nutriResult?.grade ?? recipe.gradeNutri) as NutriGrade | null}
                  score={nutriResult?.score ?? recipe.scoreNutri}
                  nutrition={nutriResult?.nutrition ?? recipe.nutrition100g}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Styles
const pageStyle: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }
const cardStyle: React.CSSProperties = { background: 'white', border: '1px solid #e0e0e0', borderRadius: 10, padding: '20px 24px', marginBottom: 16 }
const sectionTitle: React.CSSProperties = { marginTop: 0, marginBottom: 16, fontSize: '1rem', color: '#333' }
const twoColStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 380px', gap: 16, alignItems: 'start' }
const inputStyle: React.CSSProperties = { padding: '8px 12px', fontSize: '0.9rem', border: '1px solid #ccc', borderRadius: 6, outline: 'none' }
const btnPrimaryStyle: React.CSSProperties = { padding: '8px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }
const btnSecondaryStyle: React.CSSProperties = { padding: '8px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }
const btnDangerStyle: React.CSSProperties = { padding: '2px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 4, cursor: 'pointer' }
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', fontSize: '0.875rem', color: '#444' }
const errorStyle: React.CSSProperties = { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 16px', color: '#dc2626', marginBottom: 16 }
const selectedIngStyle: React.CSSProperties = { marginTop: 8, padding: '6px 10px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, fontSize: '0.875rem' }
const typeBadgeStyle: React.CSSProperties = { marginLeft: 12, padding: '2px 10px', background: '#eff6ff', color: '#2563eb', borderRadius: 20, fontSize: '0.75rem' }
const thStyle: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '2px solid #e0e0e0' }
const tdStyle: React.CSSProperties = { padding: '8px 10px' }
const cuitBadge: React.CSSProperties = { marginLeft: 6, padding: '1px 6px', background: '#fef3c7', color: '#92400e', borderRadius: 10, fontSize: '0.7rem' }
