import { useEffect, useRef, useState } from 'react'
import { browseIngredients, searchIngredients } from '../api/client'
import type { Ingredient } from '../types'

const LIMIT = 50

function fmt(v: number | null | undefined, unit = 'g') {
  if (v == null) return <span className="text-slate-300">—</span>
  return <>{v.toFixed(1)} {unit}</>
}

export default function CIQUALPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Ingredient[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Ingredient | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadingKey = useRef('')

  const loadBrowse = async (p: number) => {
    const key = `browse|${p}`
    if (loadingKey.current === key) return
    loadingKey.current = key
    setLoading(true)
    try {
      const res = await browseIngredients(p, LIMIT)
      setResults(res.data)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    loadBrowse(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Search with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      loadingKey.current = ''
      setPage(1)
      loadBrowse(1)
      return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }

    debounceRef.current = setTimeout(async () => {
      loadingKey.current = ''
      setPage(1)
      setLoading(true)
      try {
        const res = await searchIngredients(query, 1, LIMIT)
        setResults(res.data)
        setTotal(res.total)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query])

  // Page change (browse mode only)
  useEffect(() => {
    if (query.length >= 2) return
    loadingKey.current = ''
    loadBrowse(page)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))
  const isBrowse = query.length < 2

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Base CIQUAL</h1>
        <p className="text-slate-500 text-sm">Explorez les {loading && isBrowse ? '…' : total.toLocaleString('fr-FR')} aliments de référence.</p>
      </div>

      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher un aliment (ex : carotte, lait, bœuf…)"
          className="w-full pl-11 pr-10 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
        {query && !loading && (
          <button
            onClick={() => { setQuery(''); setPage(1) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors text-lg leading-none"
          >✕</button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Résultats */}
        <div>
          {loading && results.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
              Chargement…
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400 text-sm">
              {query.length >= 2 ? `Aucun résultat pour « ${query} »` : 'Base de données vide.'}
            </div>
          )}

          {results.length > 0 && (
            <>
              <p className="text-xs text-slate-400 mb-3">
                {isBrowse
                  ? `Page ${page}/${totalPages} · ${total.toLocaleString('fr-FR')} aliments`
                  : (total > LIMIT ? `${LIMIT} premiers résultats sur ${total.toLocaleString('fr-FR')}` : `${total} résultat${total > 1 ? 's' : ''}`)}
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

              {/* Pagination (browse mode) */}
              {isBrowse && totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <button disabled={page === 1} onClick={() => setPage(1)}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">«</button>
                  <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">‹</button>
                  <span className="px-4 py-1.5 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg">{page} / {totalPages}</span>
                  <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">›</button>
                  <button disabled={page === totalPages} onClick={() => setPage(totalPages)}
                    className="px-3 py-1.5 text-sm border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 transition-colors">»</button>
                </div>
              )}
            </>
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
              <div className="mt-4 flex flex-wrap gap-1.5">
                {selected.estViandeRouge && (
                  <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">
                    🥩 Viande rouge {selected.pctViandeRouge != null ? `(${selected.pctViandeRouge}%)` : ''}
                  </span>
                )}
                {selected.presenceEdulorant && (
                  <span className="inline-flex items-center gap-1 text-xs bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded-full">
                    Édulcorant présent
                  </span>
                )}
                {selected.fruitsLegumesPct != null && (
                  <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-600 border border-green-200 px-2 py-0.5 rounded-full">
                    🌿 FLN {selected.fruitsLegumesPct}%
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <p className="mt-6 text-center text-xs text-slate-300">Données CIQUAL — valeurs pour 100 g de produit</p>
    </div>
  )
}
