import { useEffect, useRef, useState } from 'react'
import { searchIngredients } from '../api/client'
import type { Ingredient } from '../types'

function fmt(v: number | null | undefined, unit = 'g') {
  if (v == null) return <span className="text-slate-300">—</span>
  return <>{v.toFixed(1)} {unit}</>
}

export default function CIQUALPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Ingredient[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Ingredient | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) { setResults([]); setTotal(0); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchIngredients(query, 1, 30)
        setResults(res.data)
        setTotal(res.total)
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Base CIQUAL</h1>
        <p className="text-slate-500 text-sm">Explorez les valeurs nutritionnelles des aliments de référence.</p>
      </div>

      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher un aliment (min. 2 caractères)…"
          className="w-full pl-11 pr-4 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Résultats */}
        <div>
          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
              Aucun résultat pour « {query} »
            </div>
          )}

          {results.length > 0 && (
            <>
              <p className="text-xs text-slate-400 mb-3">
                {total > 30 ? `30 premiers résultats sur ${total}` : `${total} résultat${total > 1 ? 's' : ''}`}
              </p>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
                {results.map(ing => (
                  <button
                    key={ing.id}
                    onClick={() => setSelected(ing)}
                    className={`w-full text-left px-5 py-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4 ${selected?.id === ing.id ? 'bg-blue-50' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{ing.nom}</p>
                      {ing.groupeNom && <p className="text-xs text-slate-400 truncate">{ing.groupeNom}</p>}
                    </div>
                    <div className="shrink-0 text-right text-xs text-slate-500 font-mono">
                      {ing.energieKcal != null ? `${ing.energieKcal.toFixed(0)} kcal` : '—'}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {query.length < 2 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p className="text-slate-400 text-sm">Saisissez au moins 2 caractères pour rechercher</p>
            </div>
          )}
        </div>

        {/* Fiche nutritionnelle */}
        {selected && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sticky top-20">
            <div className="mb-4">
              <h2 className="font-semibold text-slate-900 text-sm leading-snug mb-1">{selected.nom}</h2>
              {selected.groupeNom && <p className="text-xs text-slate-400">{selected.groupeNom}</p>}
              {selected.alimentCode && <p className="text-xs text-slate-300 font-mono">Code: {selected.alimentCode}</p>}
            </div>

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Valeurs pour 100g</p>

            <div className="space-y-2 text-sm">
              {[
                ['Énergie', selected.energieKcal != null || selected.energieKj != null
                  ? <>{selected.energieKcal?.toFixed(0) ?? '—'} kcal / {selected.energieKj?.toFixed(0) ?? '—'} kJ</>
                  : <span className="text-slate-300">—</span>],
                ['Lipides', fmt(selected.lipides)],
                ['dont AGS', fmt(selected.acideGrasSatures)],
                ['Glucides', fmt(selected.glucides)],
                ['dont Sucres', fmt(selected.sucres)],
                ['Fibres', fmt(selected.fibres)],
                ['Protéines', fmt(selected.proteines)],
                ['Sel', fmt(selected.sel)],
              ].map(([label, value]) => (
                <div key={label as string} className="flex justify-between items-baseline border-b border-slate-50 pb-2">
                  <span className="text-slate-600">{label}</span>
                  <span className="font-mono text-slate-800 text-xs">{value}</span>
                </div>
              ))}
            </div>

            {(selected.estViandeRouge || selected.presenceEdulorant || selected.fruitsLegumesPct) && (
              <div className="mt-4 space-y-1.5">
                {selected.estViandeRouge && (
                  <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                    🥩 Viande rouge {selected.pctViandeRouge != null ? `(${selected.pctViandeRouge}%)` : ''}
                  </span>
                )}
                {selected.presenceEdulorant && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full ml-1">
                    Édulcorant présent
                  </span>
                )}
                {selected.fruitsLegumesPct != null && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full ml-1">
                    🌿 FLN {selected.fruitsLegumesPct}%
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
