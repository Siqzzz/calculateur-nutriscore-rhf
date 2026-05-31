import { useEffect, useRef, useState } from 'react'
import type { Ingredient } from '../types'
import {
  createCustomIngredient,
  deleteCustomIngredient,
  listCustomIngredients,
  updateCustomIngredient,
  type CustomIngredientPayload,
} from '../api/client'

// CSS pour masquer les flèches des inputs number (tous navigateurs)
const NO_SPINNER_CSS = `
  input.rhf-no-spinner::-webkit-outer-spin-button,
  input.rhf-no-spinner::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  input.rhf-no-spinner { -moz-appearance: textfield; }
`

// ─── État du formulaire ──────────────────────────────────────────────────────

interface FormState {
  nom: string
  energieKj: string
  lipides: string
  acideGrasSatures: string
  glucides: string
  sucres: string
  fibres: string
  proteines: string
  sel: string
  fruitsLegumesPct: string
  partComestible: string
  rendementCuisson: string
  estViandeRouge: boolean
  pctViandeRouge: string
  presenceEdulorant: boolean
}

const EMPTY_FORM: FormState = {
  nom: '', energieKj: '', lipides: '', acideGrasSatures: '',
  glucides: '', sucres: '', fibres: '', proteines: '', sel: '',
  fruitsLegumesPct: '', partComestible: '', rendementCuisson: '',
  estViandeRouge: false, pctViandeRouge: '', presenceEdulorant: false,
}

function ingredientToForm(ing: Ingredient): FormState {
  const s = (v: number | null | undefined) => (v !== null && v !== undefined ? String(v) : '')
  return {
    nom: ing.nom,
    energieKj: s(ing.energieKj),
    lipides: s(ing.lipides),
    acideGrasSatures: s(ing.acideGrasSatures),
    glucides: s(ing.glucides),
    sucres: s(ing.sucres),
    fibres: s(ing.fibres),
    proteines: s(ing.proteines),
    sel: s(ing.sel),
    fruitsLegumesPct: s(ing.fruitsLegumesPct),
    partComestible: s(ing.partComestible),
    rendementCuisson: s(ing.rendementCuisson),
    estViandeRouge: ing.estViandeRouge,
    pctViandeRouge: s(ing.pctViandeRouge),
    presenceEdulorant: ing.presenceEdulorant,
  }
}

function formToPayload(f: FormState): CustomIngredientPayload {
  const n = (v: string): number | null => v.trim() === '' ? null : parseFloat(v)
  return {
    nom: f.nom.trim(),
    energieKj: n(f.energieKj),
    lipides: n(f.lipides),
    acideGrasSatures: n(f.acideGrasSatures),
    glucides: n(f.glucides),
    sucres: n(f.sucres),
    fibres: n(f.fibres),
    proteines: n(f.proteines),
    sel: n(f.sel),
    fruitsLegumesPct: n(f.fruitsLegumesPct),
    partComestible: n(f.partComestible),
    rendementCuisson: n(f.rendementCuisson),
    estViandeRouge: f.estViandeRouge,
    pctViandeRouge: f.estViandeRouge ? n(f.pctViandeRouge) : null,
    presenceEdulorant: f.presenceEdulorant,
  }
}

// ─── Composant principal ─────────────────────────────────────────────────────

export function IngredientManager() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Formulaire
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)

  const importRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const res = await listCustomIngredients()
      setIngredients(res.data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const notify = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  const set = (field: keyof FormState, value: string | boolean) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async () => {
    if (!form.nom.trim()) return setError('Le nom est requis.')
    setError(null)
    setSaving(true)
    try {
      const payload = formToPayload(form)
      if (editingId !== null) {
        const updated = await updateCustomIngredient(editingId, payload)
        setIngredients(prev => prev.map(i => (i.id === editingId ? updated : i)))
        notify(`"${updated.nom}" modifié avec succès.`)
      } else {
        const created = await createCustomIngredient(payload)
        setIngredients(prev => [...prev, created].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')))
        notify(`"${created.nom}" ajouté avec succès.`)
      }
      resetForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (ing: Ingredient) => {
    setForm(ingredientToForm(ing))
    setEditingId(ing.id)
    setShowForm(true)
    setError(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: number, nom: string) => {
    if (!window.confirm(`Supprimer l'ingrédient "${nom}" ?`)) return
    try {
      await deleteCustomIngredient(id)
      setIngredients(prev => prev.filter(i => i.id !== id))
      if (editingId === id) resetForm()
      notify(`"${nom}" supprimé.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de suppression')
    }
  }

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setShowForm(false)
    setError(null)
  }

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(ingredients, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'mes_ingredients.json'
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Import ──────────────────────────────────────────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = '' // reset input so same file can be re-imported

    let parsed: unknown
    try {
      parsed = JSON.parse(await file.text())
    } catch {
      return setError('Fichier JSON invalide.')
    }

    if (!Array.isArray(parsed)) return setError('Le fichier doit contenir un tableau d\'ingrédients.')

    setError(null)
    setSaving(true)
    let added = 0
    let skipped = 0

    for (const item of parsed as Record<string, unknown>[]) {
      if (typeof item.nom !== 'string' || !item.nom.trim()) { skipped++; continue }
      try {
        const payload = formToPayload(ingredientToForm(item as unknown as Ingredient))
        const created = await createCustomIngredient(payload)
        setIngredients(prev => [...prev, created].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')))
        added++
      } catch {
        skipped++ // nom en double ou autre erreur
      }
    }

    setSaving(false)
    notify(`Import terminé : ${added} ajouté(s), ${skipped} ignoré(s).`)
  }

  // ────────────────────────────────────────────────────────────────────────────

  return (
    <div style={pageStyle}>
      <style>{NO_SPINNER_CSS}</style>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h2 style={{ margin: 0 }}>
          Mes ingrédients
          <span style={{ marginLeft: 10, fontSize: '0.85rem', fontWeight: 400, color: '#888' }}>
            ({ingredients.length})
          </span>
        </h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />
          <button onClick={() => importRef.current?.click()} style={btnImportStyle} disabled={saving}>
            ⬆ Importer
          </button>
          <button onClick={handleExport} disabled={ingredients.length === 0} style={btnExportStyle}>
            ⬇ Exporter
          </button>
          <button
            onClick={() => { if (showForm && !editingId) { resetForm() } else { resetForm(); setShowForm(true) } }}
            style={btnPrimaryStyle}
          >
            {showForm && !editingId ? '✕ Annuler' : '+ Ajouter'}
          </button>
        </div>
      </div>

      {/* Messages */}
      {error   && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>✓ {success}</div>}
      {saving  && <div style={infoStyle}>⏳ Sauvegarde en cours…</div>}

      {/* Formulaire ajout / modification */}
      {showForm && (
        <div style={cardStyle}>
          <h3 style={sectionTitle}>
            {editingId !== null ? '✏️ Modifier l\'ingrédient' : '+ Nouvel ingrédient'}
          </h3>

          {/* Nom */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>
              Nom de l'ingrédient <span style={{ color: '#e63312' }}>*</span>
              <input
                type="text"
                value={form.nom}
                onChange={e => set('nom', e.target.value)}
                placeholder="Ex : Vinaigrette maison"
                style={{ ...inputStyle, marginTop: 4 }}
                autoFocus
              />
            </label>
          </div>

          {/* Valeurs nutritionnelles — grille 3 colonnes */}
          <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', color: '#888', fontStyle: 'italic' }}>
            Valeurs pour 100 g de produit
          </p>
          <div style={gridStyle}>
            <NutriField label="Énergie (kJ)"                value={form.energieKj}         onChange={v => set('energieKj', v)} />
            <NutriField label="Matières grasses (g)"        value={form.lipides}            onChange={v => set('lipides', v)} />
            <NutriField label="dont Acides gras saturés (g)"value={form.acideGrasSatures}   onChange={v => set('acideGrasSatures', v)} indent />
            <NutriField label="Glucides (g)"                value={form.glucides}           onChange={v => set('glucides', v)} />
            <NutriField label="dont Sucres (g)"             value={form.sucres}             onChange={v => set('sucres', v)} indent />
            <NutriField label="Fibres alimentaires (g)"     value={form.fibres}             onChange={v => set('fibres', v)} />
            <NutriField label="Protéines (g)"               value={form.proteines}          onChange={v => set('proteines', v)} />
            <NutriField label="Sel (g)"                     value={form.sel}               onChange={v => set('sel', v)} />
            <NutriField label="% Fruits, légumes, légumineuses" value={form.fruitsLegumesPct} onChange={v => set('fruitsLegumesPct', v)} />
          </div>

          {/* Part comestible / Rendement */}
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 16, paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <NutriField label="Part comestible (%)"   value={form.partComestible}   onChange={v => set('partComestible', v)} />
            <NutriField label="Rendement cuisson (%)" value={form.rendementCuisson} onChange={v => set('rendementCuisson', v)} />
          </div>

          {/* Viande rouge / Édulcorant */}
          <div style={{ borderTop: '1px solid #f0f0f0', marginTop: 16, paddingTop: 16, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.estViandeRouge} onChange={e => set('estViandeRouge', e.target.checked)} />
              <span>Viande rouge</span>
            </label>
            {form.estViandeRouge && (
              <NutriField label="% viande rouge" value={form.pctViandeRouge} onChange={v => set('pctViandeRouge', v)} />
            )}
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.presenceEdulorant} onChange={e => set('presenceEdulorant', e.target.checked)} />
              <span>Présence d'édulcorant</span>
            </label>
          </div>

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button onClick={resetForm} style={btnCancelStyle}>Annuler</button>
            <button onClick={handleSubmit} disabled={saving} style={btnPrimaryStyle}>
              {saving ? '⏳…' : editingId !== null ? '✓ Enregistrer les modifications' : '+ Ajouter l\'ingrédient'}
            </button>
          </div>
        </div>
      )}

      {/* Tableau */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>⏳ Chargement…</div>
      ) : ingredients.length === 0 ? (
        <div style={emptyStyle}>
          <div style={{ fontSize: '2rem', marginBottom: 10 }}>🧪</div>
          <p style={{ fontWeight: 600, marginBottom: 4 }}>Aucun ingrédient personnalisé</p>
          <p style={{ color: '#888', fontSize: '0.875rem' }}>
            Cliquez sur <strong>+ Ajouter</strong> pour créer un ingrédient ou <strong>⬆ Importer</strong> pour charger un fichier JSON.
          </p>
        </div>
      ) : (
        <div style={{ background: 'white', border: '1px solid #e0e0e0', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={tableStyle}>
              <thead>
                <tr style={{ background: '#f5f7fa' }}>
                  <th style={thStyle}>Nom</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Énergie (kJ)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>MG (g)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>AGS (g)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Glucides (g)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Sucres (g)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Fibres (g)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Protéines (g)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Sel (g)</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>%FLN</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map(ing => (
                  <tr
                    key={ing.id}
                    style={{ borderBottom: '1px solid #f0f0f0', background: editingId === ing.id ? '#fffbeb' : 'white' }}
                    onMouseEnter={e => { if (editingId !== ing.id) e.currentTarget.style.background = '#fafbfc' }}
                    onMouseLeave={e => { if (editingId !== ing.id) e.currentTarget.style.background = 'white' }}
                  >
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500 }}>{ing.nom}</span>
                      <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                        {ing.estViandeRouge && <span style={tagStyle('#fef3c7', '#92400e')}>🥩 V.rouge</span>}
                        {ing.presenceEdulorant && <span style={tagStyle('#eff6ff', '#1d4ed8')}>🧃 Édul.</span>}
                      </div>
                    </td>
                    <td style={numTd}>{fmt(ing.energieKj)}</td>
                    <td style={numTd}>{fmt(ing.lipides)}</td>
                    <td style={numTd}>{fmt(ing.acideGrasSatures)}</td>
                    <td style={numTd}>{fmt(ing.glucides)}</td>
                    <td style={numTd}>{fmt(ing.sucres)}</td>
                    <td style={numTd}>{fmt(ing.fibres)}</td>
                    <td style={numTd}>{fmt(ing.proteines)}</td>
                    <td style={numTd}>{fmt(ing.sel)}</td>
                    <td style={numTd}>{fmt(ing.fruitsLegumesPct)}</td>
                    <td style={{ ...tdStyle, textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEdit(ing)}
                          style={btnEditStyle}
                          title="Modifier"
                        >
                          ✏️ Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(ing.id, ing.nom)}
                          style={btnDeleteStyle}
                          title="Supprimer"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Sous-composant champ nutritionnel ───────────────────────────────────────

function NutriField({ label, value, onChange, indent }: {
  label: string
  value: string
  onChange: (v: string) => void
  indent?: boolean
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', fontSize: '0.8rem', color: indent ? '#666' : '#333' }}>
      <span style={{ marginBottom: 3 }}>{indent && <span style={{ color: '#bbb', marginRight: 4 }}>└</span>}{label}</span>
      <input
        type="number"
        className="rhf-no-spinner"
        value={value}
        onChange={e => onChange(e.target.value)}
        step="any"
        min="0"
        placeholder="—"
        style={numInputStyle}
      />
    </label>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—'
  // Affiche jusqu'à 4 décimales significatives, supprime les zéros trailing
  return parseFloat(v.toFixed(4)).toString()
}

function tagStyle(bg: string, color: string): React.CSSProperties {
  return { padding: '1px 6px', borderRadius: 10, fontSize: '0.68rem', background: bg, color, fontWeight: 600 }
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const pageStyle: React.CSSProperties = { maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }
const cardStyle: React.CSSProperties = { background: 'white', border: '1px solid #e0e0e0', borderRadius: 10, padding: '20px 24px', marginBottom: 20 }
const sectionTitle: React.CSSProperties = { marginTop: 0, marginBottom: 16, fontSize: '1rem', color: '#333' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }
const inputStyle: React.CSSProperties = { padding: '8px 12px', fontSize: '0.9rem', border: '1px solid #d1d5db', borderRadius: 6, outline: 'none', width: '100%', boxSizing: 'border-box' }
const numInputStyle: React.CSSProperties = { padding: '6px 10px', fontSize: '0.875rem', border: '1px solid #d1d5db', borderRadius: 6, outline: 'none', width: '100%', boxSizing: 'border-box' }
const labelStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', fontSize: '0.875rem', color: '#333' }
const emptyStyle: React.CSSProperties = { background: '#f9fafb', borderRadius: 12, padding: '50px 40px', textAlign: 'center', color: '#555', border: '2px dashed #d1d5db' }
const errorStyle: React.CSSProperties = { background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 6, padding: '10px 16px', color: '#dc2626', marginBottom: 16 }
const successStyle: React.CSSProperties = { background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 6, padding: '10px 16px', color: '#15803d', marginBottom: 16 }
const infoStyle: React.CSSProperties = { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '10px 16px', color: '#1d4ed8', marginBottom: 16 }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }
const thStyle: React.CSSProperties = { padding: '10px 10px', textAlign: 'left', fontWeight: 600, color: '#555', borderBottom: '2px solid #e0e0e0', whiteSpace: 'nowrap' }
const tdStyle: React.CSSProperties = { padding: '8px 10px', verticalAlign: 'middle' }
const numTd: React.CSSProperties = { padding: '8px 10px', textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: '#444' }
const btnPrimaryStyle: React.CSSProperties = { padding: '8px 18px', background: '#2563eb', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }
const btnCancelStyle: React.CSSProperties = { padding: '8px 16px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }
const btnEditStyle: React.CSSProperties = { padding: '4px 10px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 5, cursor: 'pointer', fontSize: '0.8rem' }
const btnDeleteStyle: React.CSSProperties = { padding: '4px 8px', background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: 5, cursor: 'pointer', fontSize: '0.8rem' }
const btnImportStyle: React.CSSProperties = { padding: '8px 14px', background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }
const btnExportStyle: React.CSSProperties = { padding: '8px 14px', background: '#f0fdf4', color: '#15803d', border: '1px solid #86efac', borderRadius: 6, cursor: 'pointer', fontSize: '0.875rem' }
