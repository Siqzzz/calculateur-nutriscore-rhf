import { useEffect, useRef, useState } from 'react'
import type { Ingredient } from '../types'
import { searchIngredients } from '../api/client'

const LIMIT = 50

export function CiqualBrowser() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Chargement initial (base complète, page 1)
  useEffect(() => {
    load('', 1)
  }, [])

  // Recherche avec debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      load(query, 1)
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  // Changement de page
  useEffect(() => {
    load(query, page)
  }, [page])

  const load = async (q: string, p: number) => {
    setLoading(true)
    try {
      const res = await searchIngredients(q, p, LIMIT)
      setIngredients(res.data)
      setTotal(res.total)
    } catch {
      setIngredients([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / LIMIT))

  return (
    <div style={pageStyle}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ margin: 0 }}>Base CIQUAL</h2>
        <span style={{ color: '#666', fontSize: '0.9rem' }}>
          {total.toLocaleString('fr-FR')} ingrédients
        </span>
      </div>

      {/* Barre de recherche */}
      <div style={{ position: 'relative', marginBottom: 16 }}>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Rechercher par nom (ex: carotte, lait, bœuf…)"
          style={inputStyle}
        />
        {loading && (
          <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#888' }}>
            ⏳
          </span>
        )}
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{ position: 'absolute', right: loading ? 36 : 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#888', fontSize: '1rem', lineHeight: 1 }}
            title="Effacer"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tableau */}
      <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
        {loading && ingredients.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>⏳ Chargement de la base de données…</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: '#f5f7fa' }}>
                  <th style={thStyle}>Aliment</th>
                  <th style={thStyle}>Groupe</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Énergie (kJ)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Protéines (g)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Glucides (g)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Lipides (g)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Sucres (g)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Fibres (g)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Sel (g)</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ padding: 24, textAlign: 'center', color: '#888' }}>
                      Aucun résultat pour « {query} »
                    </td>
                  </tr>
                ) : (
                  ingredients.map(ing => (
                    <tr
                      key={ing.id}
                      style={{ borderBottom: '1px solid #f0f0f0' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#fafbfc')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                    >
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{ing.nom}</span>
                        {ing.sousGroupeNom && (
                          <span style={{ display: 'block', fontSize: '0.72rem', color: '#aaa', marginTop: 1 }}>
                            {ing.sousGroupeNom}
                          </span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '0.8rem', color: '#777', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {ing.groupeNom ?? '—'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(ing.energieKj)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(ing.proteines)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(ing.glucides)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(ing.lipides)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(ing.sucres)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(ing.fibres)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{fmt(ing.sel)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 20 }}>
          <button disabled={page === 1} onClick={() => setPage(1)} style={btnPageStyle}>«</button>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)} style={btnPageStyle}>‹ Précédent</button>
          <span style={{ padding: '6px 14px', fontSize: '0.875rem', color: '#555', background: 'white', border: '1px solid #e0e0e0', borderRadius: 6 }}>
            {page} / {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} style={btnPageStyle}>Suivant ›</button>
          <button disabled={page === totalPages} onClick={() => setPage(totalPages)} style={btnPageStyle}>»</button>
        </div>
      )}

      {/* Légende */}
      <p style={{ marginTop: 16, fontSize: '0.78rem', color: '#bbb', textAlign: 'center' }}>
        Données CIQUAL — valeurs pour 100 g de produit
      </p>
    </div>
  )
}

function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  return v.toFixed(2)
}

const pageStyle: React.CSSProperties = { maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 40px 10px 14px', fontSize: '0.95rem', border: '1px solid #d1d5db', borderRadius: 8, boxSizing: 'border-box', outline: 'none' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }
const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: '7px 12px' }
const btnPageStyle: React.CSSProperties = { padding: '6px 12px', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', background: 'white', fontSize: '0.85rem', color: '#374151' }
