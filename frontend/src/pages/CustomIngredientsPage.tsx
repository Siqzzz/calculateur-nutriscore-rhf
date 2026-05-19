import { useEffect, useState } from 'react'
import { createCustomIngredient, deleteCustomIngredient, listCustomIngredients } from '../api/client'
import type { CreateIngredientPayload, Ingredient } from '../types'

const FIELDS: { key: keyof CreateIngredientPayload; label: string; unit?: string }[] = [
  { key: 'energieKcal',       label: 'Énergie',             unit: 'kcal/100g' },
  { key: 'energieKj',         label: 'Énergie (kJ)',         unit: 'kJ/100g'  },
  { key: 'proteines',         label: 'Protéines',            unit: 'g/100g'   },
  { key: 'glucides',          label: 'Glucides',             unit: 'g/100g'   },
  { key: 'lipides',           label: 'Lipides',              unit: 'g/100g'   },
  { key: 'sucres',            label: 'Sucres',               unit: 'g/100g'   },
  { key: 'fibres',            label: 'Fibres',               unit: 'g/100g'   },
  { key: 'acideGrasSatures',  label: 'Acides gras saturés',  unit: 'g/100g'   },
  { key: 'sel',               label: 'Sel',                  unit: 'g/100g'   },
  { key: 'fruitsLegumesPct',  label: '% Fruits/Légumes',     unit: '%'        },
]

const EMPTY_FORM: CreateIngredientPayload = { nom: '', groupeNom: '' }

export default function CustomIngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<CreateIngredientPayload>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  useEffect(() => {
    listCustomIngredients()
      .then(r => setIngredients(r.data))
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      const ing = await createCustomIngredient(form)
      setIngredients(prev => [...prev, ing])
      setForm(EMPTY_FORM)
      setShowForm(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet ingrédient ?')) return
    setDeletingId(id)
    try {
      await deleteCustomIngredient(id)
      setIngredients(prev => prev.filter(i => i.id !== id))
    } finally {
      setDeletingId(null)
    }
  }

  const setField = (key: keyof CreateIngredientPayload, value: string | boolean) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  if (loading) return <div className="text-center py-16 text-slate-400">Chargement…</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Mes ingrédients</h1>
          <p className="text-slate-500 text-sm">Ajoutez des aliments non présents dans la base CIQUAL.</p>
        </div>
        <button
          onClick={() => { setShowForm(s => !s); setError(null) }}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors"
        >
          {showForm ? '✕ Annuler' : '+ Ajouter un ingrédient'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-6">
          <h2 className="font-semibold text-slate-800 mb-5">Nouvel ingrédient</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Nom *</label>
              <input
                type="text"
                required
                value={form.nom}
                onChange={e => setField('nom', e.target.value)}
                placeholder="Ex : Farine de sarrasin complète"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Catégorie</label>
              <input
                type="text"
                value={form.groupeNom ?? ''}
                onChange={e => setField('groupeNom', e.target.value)}
                placeholder="Ex : Céréales"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Valeurs nutritionnelles (pour 100g)</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="block text-xs text-slate-500 mb-1">{f.label}</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0" step="0.01"
                    value={(form[f.key] as number | undefined) ?? ''}
                    onChange={e => setField(f.key, e.target.value === '' ? '' : parseFloat(e.target.value) as never)}
                    placeholder="0"
                    className="w-full border border-slate-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-8"
                  />
                  {f.unit && (
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">
                      {f.unit.split('/')[0]}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-4 mb-5 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.estViandeRouge ?? false}
                onChange={e => setField('estViandeRouge', e.target.checked)}
                className="w-4 h-4 accent-blue-600" />
              <span className="text-slate-700">Viande rouge</span>
            </label>
            {form.estViandeRouge && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600">% viande rouge</label>
                <input type="number" min="0" max="100" step="0.1"
                  value={form.pctViandeRouge ?? ''}
                  onChange={e => setField('pctViandeRouge', parseFloat(e.target.value) as never)}
                  className="w-20 border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.presenceEdulorant ?? false}
                onChange={e => setField('presenceEdulorant', e.target.checked)}
                className="w-4 h-4 accent-blue-600" />
              <span className="text-slate-700">Présence édulcorant</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer l\'ingrédient'}
          </button>
        </form>
      )}

      {/* Liste */}
      {ingredients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-14 text-center">
          <svg className="w-12 h-12 mx-auto mb-4 text-slate-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-slate-400 text-sm">Aucun ingrédient personnalisé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100">
          {ingredients.map(ing => (
            <div key={ing.id} className="flex items-center gap-4 px-5 py-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">{ing.nom}</p>
                {ing.groupeNom && <p className="text-xs text-slate-400">{ing.groupeNom}</p>}
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-500 font-mono shrink-0">
                {ing.energieKcal != null && <span>{ing.energieKcal.toFixed(0)} kcal</span>}
                {ing.proteines != null && <span className="hidden sm:block">P: {ing.proteines.toFixed(1)}g</span>}
                {ing.glucides != null && <span className="hidden sm:block">G: {ing.glucides.toFixed(1)}g</span>}
                {ing.lipides != null && <span className="hidden sm:block">L: {ing.lipides.toFixed(1)}g</span>}
              </div>
              <button
                onClick={() => handleDelete(ing.id)}
                disabled={deletingId === ing.id}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                title="Supprimer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
