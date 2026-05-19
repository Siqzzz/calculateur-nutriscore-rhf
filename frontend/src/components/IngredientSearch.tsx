import { useEffect, useRef, useState } from 'react'
import { searchIngredients } from '../api/client'
import type { Ingredient } from '../types'

interface Props {
  onSelect: (ingredient: Ingredient) => void
  placeholder?: string
}

export function IngredientSearch({ onSelect, placeholder = 'Rechercher un ingrédient…' }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.length < 2) { setResults([]); setOpen(false); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await searchIngredients(query, 1, 20)
        setResults(res.data)
        setOpen(true)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelect = (ing: Ingredient) => {
    onSelect(ing)
    setQuery('')
    setOpen(false)
    setResults([])
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {open && (
        <ul className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {results.length > 0 ? results.map(ing => (
            <li
              key={ing.id}
              onMouseDown={() => handleSelect(ing)}
              className="flex items-baseline gap-2 px-4 py-2.5 cursor-pointer hover:bg-slate-50 border-b border-slate-100 last:border-0"
            >
              <span className="text-sm font-medium text-slate-800 truncate">{ing.nom}</span>
              {ing.groupeNom && (
                <span className="text-xs text-slate-400 truncate shrink-0">{ing.groupeNom}</span>
              )}
            </li>
          )) : (
            <li className="px-4 py-3 text-sm text-slate-400 text-center">
              Aucun résultat pour « {query} »
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
