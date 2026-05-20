import type { NutriGrade, Nutrition100g } from '../types'

interface Props {
  grade: NutriGrade | null
  score: number | null
  nutrition: Nutrition100g | null
}

const GRADES: NutriGrade[] = ['A', 'B', 'C', 'D', 'E']

const GRADE_STYLE: Record<NutriGrade, { bg: string; text: string }> = {
  A: { bg: '#038141', text: 'white' },
  B: { bg: '#85BB2F', text: 'white' },
  C: { bg: '#FECB02', text: '#333' },
  D: { bg: '#EE8100', text: 'white' },
  E: { bg: '#E63312', text: 'white' },
}

function fmt(v: number | null | undefined, unit: string): string {
  if (v == null) return '—'
  return `${v.toFixed(2)} ${unit}`
}

export function NutriScoreDisplay({ grade, score, nutrition }: Props) {
  if (!grade) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center gap-3">
        <svg className="w-12 h-12 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7H6a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-3M16 3h5m0 0v5m0-5l-8 8" />
        </svg>
        <p className="text-sm">Ajoutez des ingrédients et cliquez sur « Calculer le Nutri-Score »</p>
      </div>
    )
  }

  return (
    <div>
      {/* Badges A-E */}
      <div className="flex items-end justify-center gap-2 mb-4">
        {GRADES.map(g => {
          const isActive = g === grade
          const s = GRADE_STYLE[g]
          return (
            <div
              key={g}
              style={{ background: s.bg, color: s.text, opacity: isActive ? 1 : 0.35 }}
              className={`rounded-full flex items-center justify-center font-bold transition-all ${
                isActive ? 'w-14 h-14 text-2xl shadow-lg' : 'w-9 h-9 text-base'
              }`}
            >
              {g}
            </div>
          )
        })}
      </div>

      <p className="text-center text-sm text-slate-500 mb-5">
        Score Nutri-Score : <span className="font-bold text-slate-800">{score}</span>
      </p>

      {nutrition && (
        <div className="border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Pour 100g de plat fini</p>
          <div className="space-y-1.5 text-sm">
            {[
              ['Énergie', nutrition.energieKcal != null || nutrition.energieKj != null
                ? `${nutrition.energieKcal?.toFixed(0) ?? '—'} kcal / ${nutrition.energieKj?.toFixed(0) ?? '—'} kJ`
                : '—'],
              ['Lipides', fmt(nutrition.lipides, 'g')],
              ['dont Acides gras saturés', fmt(nutrition.acideGrasSatures, 'g')],
              ['Glucides', fmt(nutrition.glucides, 'g')],
              ['dont Sucres', fmt(nutrition.sucres, 'g')],
              ['Fibres alimentaires', fmt(nutrition.fibres, 'g')],
              ['Protéines', fmt(nutrition.proteines, 'g')],
              ['Sel', fmt(nutrition.sel, 'g')],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between border-b border-slate-50 pb-1.5">
                <span className="text-slate-600">{label}</span>
                <span className="font-mono text-slate-800 text-xs">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
