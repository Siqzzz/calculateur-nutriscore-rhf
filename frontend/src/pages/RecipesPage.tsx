import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteRecipe, listRecipes } from '../api/client'
import type { Recipe } from '../types'

const TYPE_ICON: Record<string, string> = { general: '🍽', viande: '🥩', boissons: '🥤' }
const GRADE_BG: Record<string, string> = {
  A: 'bg-[#038141]', B: 'bg-[#85BB2F]', C: 'bg-[#FECB02]', D: 'bg-[#EE8100]', E: 'bg-[#E63312]',
}
const GRADE_TEXT: Record<string, string> = { C: 'text-slate-800', default: 'text-white' }

function downloadJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    listRecipes().then(setRecipes).finally(() => setLoading(false))
  }, [])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.preventDefault()
    if (!confirm('Supprimer cette recette ?')) return
    setDeletingId(id)
    try {
      await deleteRecipe(id)
      setRecipes(r => r.filter(x => x.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const handleExportOne = (e: React.MouseEvent, recipe: Recipe) => {
    e.preventDefault()
    downloadJson(recipe, `recette-${recipe.nom.replace(/\s+/g, '_')}.json`)
  }

  const handleExportAll = () => {
    downloadJson(recipes, 'recettes.json')
  }

  if (loading) return <div className="text-center py-16 text-slate-400">Chargement…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Mes recettes</h1>
          <p className="text-slate-500 text-sm">{recipes.length} recette{recipes.length !== 1 ? 's' : ''} sauvegardée{recipes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          {recipes.length > 0 && (
            <button
              onClick={handleExportAll}
              className="border border-slate-300 hover:border-slate-400 text-slate-600 hover:text-slate-800 font-medium rounded-xl px-4 py-2.5 text-sm transition-colors"
              title="Exporter toutes les recettes"
            >
              ↓ Tout exporter
            </button>
          )}
          <Link
            to="/recette"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors"
          >
            + Nouvelle recette
          </Link>
        </div>
      </div>

      {recipes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-slate-500 text-sm mb-4">Aucune recette sauvegardée</p>
          <Link to="/recette" className="text-blue-600 hover:underline text-sm font-medium">
            Créer ma première recette →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map(recipe => (
            <Link
              key={recipe.id}
              to={`/recette/${recipe.id}`}
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{TYPE_ICON[recipe.type] ?? '🍽'}</span>
                  <span className="text-xs text-slate-500 font-medium capitalize">{recipe.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  {recipe.gradeNutri && (
                    <span className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center ${GRADE_BG[recipe.gradeNutri]} ${GRADE_TEXT[recipe.gradeNutri] ?? GRADE_TEXT.default}`}>
                      {recipe.gradeNutri}
                    </span>
                  )}
                  <button
                    onClick={e => handleExportOne(e, recipe)}
                    className="p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Exporter en JSON"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onClick={e => handleDelete(e, recipe.id)}
                    disabled={deletingId === recipe.id}
                    className="p-1.5 text-slate-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Supprimer"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              <p className="font-semibold text-slate-800 text-sm leading-snug">{recipe.nom}</p>

              <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs text-slate-400">
                <span>{recipe.ingredients.length} ingrédient{recipe.ingredients.length !== 1 ? 's' : ''}</span>
                <span>{new Date(recipe.updatedAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
