import { useEffect, useRef, useState } from 'react'
import { searchIngredients } from '../api/client'
import type { Ingredient } from '../types'

interface Props {
  onSelect: (ingredient: Ingredient) => void
  placeholder?: string
}

export function IngredientSearch({ onSelect, placeholder = 'Rechercher un ingrédient...' }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (query.length < 2) {
      setResults([])
      setOpen(false)
      return
    }

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

  // Fermer si clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
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
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {loading && <span style={loadingStyle}>⏳</span>}

      {open && results.length > 0 && (
        <ul style={dropdownStyle}>
          {results.map(ing => (
            <li
              key={ing.id}
              style={itemStyle}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f7ff')}
              onMouseLeave={e => (e.currentTarget.style.background = 'white')}
              onMouseDown={() => handleSelect(ing)}
            >
              <span style={{ fontWeight: 500 }}>{ing.nom}</span>
              {ing.groupeNom && (
                <span style={{ fontSize: '0.75rem', color: '#666', marginLeft: 8 }}>
                  {ing.groupeNom}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {open && results.length === 0 && !loading && query.length >= 2 && (
        <div style={{ ...dropdownStyle, padding: '10px 14px', color: '#666' }}>
          Aucun résultat pour « {query} »
        </div>
      )}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  fontSize: '0.95rem',
  border: '1px solid #ccc',
  borderRadius: 6,
  boxSizing: 'border-box',
  outline: 'none',
}

const loadingStyle: React.CSSProperties = {
  position: 'absolute',
  right: 10,
  top: '50%',
  transform: 'translateY(-50%)',
}

const dropdownStyle: React.CSSProperties = {
  position: 'absolute',
  top: '100%',
  left: 0,
  right: 0,
  background: 'white',
  border: '1px solid #ccc',
  borderTop: 'none',
  borderRadius: '0 0 6px 6px',
  maxHeight: 280,
  overflowY: 'auto',
  listStyle: 'none',
  margin: 0,
  padding: 0,
  zIndex: 1000,
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
}

const itemStyle: React.CSSProperties = {
  padding: '8px 14px',
  cursor: 'pointer',
  borderBottom: '1px solid #f0f0f0',
  display: 'flex',
  alignItems: 'baseline',
  background: 'white',
}
