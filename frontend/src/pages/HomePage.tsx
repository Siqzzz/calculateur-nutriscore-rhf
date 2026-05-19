import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listRecipes, listCustomIngredients } from '../api/client'

const GRADE_COLOR: Record<string, string> = {
  A: 'bg-[#038141]', B: 'bg-[#85BB2F]', C: 'bg-[#FECB02]', D: 'bg-[#EE8100]', E: 'bg-[#E63312]',
}

export default function HomePage() {
  const [recipeCount, setRecipeCount] = useState<number | null>(null)
  const [customCount, setCustomCount] = useState<number | null>(null)

  useEffect(() => {
    listRecipes().then(r => setRecipeCount(r.length)).catch(() => setRecipeCount(0))
    listCustomIngredients().then(r => setCustomCount(r.total)).catch(() => setCustomCount(0))
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Outil de calcul du Nutri-Score</h1>
        <p className="text-slate-500 text-base">
          Calculez et affichez le Nutri-Score de vos recettes en quelques étapes simples.
        </p>
      </div>

      <div className="border-t border-slate-200 mb-8" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Calculer une recette */}
        <Link to="/recette" className="group relative bg-white rounded-2xl border-2 border-blue-500 p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-3">
          <span className="absolute top-4 right-4 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            Action principale
          </span>
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M16 3h5m0 0v5m0-5l-8 8" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-slate-800 text-base mb-1">Calculer une recette</h2>
            <p className="text-sm text-slate-500">Saisissez vos ingrédients et obtenez le Nutri-Score instantanément.</p>
          </div>
        </Link>

        {/* Mes recettes */}
        <Link to="/recettes" className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col gap-3">
          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 group-hover:bg-slate-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-800 text-base mb-1">Mes recettes</h2>
            <p className="text-sm text-slate-500">Retrouvez, modifiez et exportez vos recettes sauvegardées.</p>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-auto">
            <span className="text-xs text-slate-400">
              {recipeCount === null ? '…' : recipeCount} recette{recipeCount !== 1 ? 's' : ''} sauvegardée{recipeCount !== 1 ? 's' : ''}
            </span>
          </div>
        </Link>

        {/* Base CIQUAL */}
        <Link to="/ciqual" className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col gap-3">
          <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7zm0 5h16" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-800 text-base mb-1">Base CIQUAL</h2>
            <p className="text-sm text-slate-500">Explorez les valeurs nutritionnelles des aliments de référence.</p>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-auto">
            <span className="text-xs text-slate-400">11 800+ aliments disponibles</span>
          </div>
        </Link>

        {/* Mes ingrédients */}
        <Link to="/ingredients" className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col gap-3">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 group-hover:bg-orange-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-800 text-base mb-1">Mes ingrédients</h2>
            <p className="text-sm text-slate-500">Ajoutez vos propres ingrédients non présents dans le CIQUAL.</p>
          </div>
          <div className="border-t border-slate-100 pt-3 mt-auto">
            <span className="text-xs text-slate-400">
              {customCount === null ? '…' : customCount} ingrédient{customCount !== 1 ? 's' : ''} ajouté{customCount !== 1 ? 's' : ''}
            </span>
          </div>
        </Link>

        {/* Guide */}
        <Link to="/guide" className="group bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col gap-3">
          <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 group-hover:bg-teal-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-slate-800 text-base mb-1">Guide d'utilisation</h2>
            <p className="text-sm text-slate-500">Méthode de calcul, règles RHF et conseils d'utilisation.</p>
          </div>
        </Link>
      </div>

      {/* Dernières recettes avec grade */}
      <RecentGrades />
    </div>
  )
}

function RecentGrades() {
  const [recipes, setRecipes] = useState<Array<{ nom: string; gradeNutri: string | null; type: string }>>([])

  useEffect(() => {
    listRecipes()
      .then(r => setRecipes(r.filter(x => x.gradeNutri).slice(0, 5)))
      .catch(() => {})
  }, [])

  if (recipes.length === 0) return null

  return (
    <div className="mt-10">
      <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Derniers calculs</h2>
      <div className="flex flex-wrap gap-3">
        {recipes.map((r, i) => (
          <Link key={i} to="/recettes" className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm hover:border-slate-300 transition-colors shadow-sm">
            <span className={`w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center ${GRADE_COLOR[r.gradeNutri!] ?? 'bg-slate-400'}`}>
              {r.gradeNutri}
            </span>
            <span className="text-slate-700 font-medium truncate max-w-[160px]">{r.nom}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
