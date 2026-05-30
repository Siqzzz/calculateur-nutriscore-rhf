import { useEffect, useState } from 'react'
import type { NutriGrade, Recipe, RecipeType } from '../types'
import { deleteRecipe, listRecipes } from '../api/client'

const TYPE_LABELS: Record<RecipeType, string> = {
  general: '🍽 Général',
  viande: '🥩 Viande',
  boissons: '🥤 Boissons',
}

const TYPE_COLORS: Record<RecipeType, { bg: string; color: string }> = {
  general: { bg: '#f0fdf4', color: '#166534' },
  viande:  { bg: '#fef3c7', color: '#92400e' },
  boissons:{ bg: '#eff6ff', color: '#1d4ed8' },
}

const GRADE_COLORS: Record<NutriGrade, string> = {
  A: '#038141', B: '#85BB2F', C: '#FECB02', D: '#EE8100', E: '#E63312',
}

interface Props {
  onEdit: (recipe: Recipe) => void
}

export function RecipeList({ onEdit }: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => { loadRecipes() }, [])

  const loadRecipes = async () => {
    setLoading(true)
    try {
      setRecipes(await listRecipes())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number, nom: string) => {
    if (!window.confirm(`Supprimer la recette "${nom}" ? Cette action est irréversible.`)) return
    setDeleting(id)
    try {
      await deleteRecipe(id)
      setRecipes(prev => prev.filter(r => r.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de suppression')
    } finally {
      setDeleting(null)
    }
  }

  const exportRecipe = (recipe: Recipe) => {
    const blob = new Blob([JSON.stringify(recipe, null, 2)], { type: 'application/json' })
    triggerDownload(blob, `${recipe.nom.replace(/[^a-z0-9]/gi, '_')}_nutriscore.json`)
  }

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: 'application/json' })
    triggerDownload(blob, 'recettes_nutriscore.json')
  }

  if (loading) {
    return (
      <div style={pageStyle}>
        <p style={{ color: '#666', textAlign: 'center', paddingTop: 40 }}>⏳ Chargement des recettes…</p>
      </div>
    )
  }

  return (
    <div style={pageStyle}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>
          Mes recettes
          <span style={{ marginLeft: 10, fontSize: '0.85rem', fontWeight: 400, color: '#888' }}>
            ({recipes.length})
          </span>
        </h2>
        {recipes.length > 0 && (
          <button onClick={exportAll} style={btnExportAllStyle} title="Exporter toutes les recettes en JSON">
            ⬇ Tout exporter
          </button>
        )}
      </div>

      {error && <div style={errorStyle}>{error}</div>}

      {recipes.length === 0 ? (
        <div style={emptyStyle}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🍽</div>
          <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 6 }}>Aucune recette enregistrée</p>
          <p style={{ color: '#888', fontSize: '0.9rem' }}>
            Créez une recette depuis les onglets <strong>Général</strong>, <strong>Viande</strong> ou <strong>Boissons</strong>.
          </p>
        </div>
      ) : (
        <div style={gridStyle}>
          {recipes.map(recipe => {
            const tc = TYPE_COLORS[recipe.type]
            return (
              <div key={recipe.id} style={cardStyle}>
                {/* Titre + grade */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6, wordBreak: 'break-word' }}>
                      {recipe.nom}
                    </div>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: tc.bg, color: tc.color }}>
                      {TYPE_LABELS[recipe.type]}
                    </span>
                  </div>
                  {recipe.gradeNutri ? (
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: GRADE_COLORS[recipe.gradeNutri],
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: recipe.gradeNutri === 'C' ? '#333' : 'white',
                      fontWeight: 800, fontSize: '1.25rem', flexShrink: 0,
                    }}>
                      {recipe.gradeNutri}
                    </div>
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: '50%', border: '2px dashed #d1d5db', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', color: '#aaa', textAlign: 'center', flexShrink: 0 }}>
                      N/A
                    </div>
                  )}
                </div>

                {/* Méta */}
                <div style={{ fontSize: '0.8rem', color: '#999', marginBottom: 14 }}>
                  {recipe.ingredients.length} ingrédient{recipe.ingredients.length !== 1 ? 's' : ''}
                  {recipe.scoreNutri !== null && (
                    <> · Score {recipe.scoreNutri}</>
                  )}
                  {' · '}
                  {new Date(recipe.createdAt).toLocaleDateString('fr-FR')}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
                  <button
                    onClick={() => exportRecipe(recipe)}
                    style={btnActionStyle}
                    title="Télécharger en JSON"
                  >
                    ⬇ Export
                  </button>
                  <button
                    onClick={() => onEdit(recipe)}
                    style={{ ...btnActionStyle, color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}
                    title="Ouvrir et modifier"
                  >
                    ✏️ Ouvrir
                  </button>
                  <button
                    onClick={() => handleDelete(recipe.id, recipe.nom)}
                    disabled={deleting === recipe.id}
                    style={{ ...btnActionStyle, color: '#dc2626', borderColor: '#fca5a5', background: '#fee2e2', marginLeft: 'auto' }}
                    title="Supprimer"
                  >
                    {deleting === recipe.id ? '⏳' : '🗑'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const pageStyle: React.CSSProperties = { maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: 16 }
const cardStyle: React.CSSProperties = { background: 'white', border: '1px solid #e0e0e0', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }
const emptyStyle: React.CSSProperties = { background: '#f9fafb', borderRadius: 12, padding: '50px 40px', textAlign: 'center', color: '#555', border: '2px dashed #d1d5db' }
const errorStyle: React.CSSProperties = { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 16px', color: '#dc2626', marginBottom: 16 }
const btnActionStyle: React.CSSProperties = { padding: '5px 12px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', background: '#f9fafb', color: '#374151' }
const btnExportAllStyle: React.CSSProperties = { padding: '8px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }
