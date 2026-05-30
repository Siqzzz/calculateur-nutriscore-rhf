import type { NutriGrade, Nutrition100g } from '../types'

interface Props {
  grade: NutriGrade | null
  score: number | null
  nutrition: Nutrition100g | null
}

const GRADES: NutriGrade[] = ['A', 'B', 'C', 'D', 'E']

const GRADE_COLORS: Record<NutriGrade, string> = {
  A: '#038141',
  B: '#85BB2F',
  C: '#FECB02',
  D: '#EE8100',
  E: '#E63312',
}

// Échelle des scores : min = -15, max = 40  (total = 55 unités)
// Bornes de chaque grade (borne haute exclusive sauf E)
const SCALE_MIN = -15
const SCALE_MAX = 40
const SCALE_RANGE = SCALE_MAX - SCALE_MIN

const GRADE_BOUNDS: Record<NutriGrade, [number, number]> = {
  A: [-15,  1],   // < 1
  B: [  1,  3],   // 1–2
  C: [  3, 11],   // 3–10
  D: [ 11, 19],   // 11–18
  E: [ 19, 40],   // ≥ 19
}

function scoreToPercent(score: number): number {
  const clamped = Math.max(SCALE_MIN, Math.min(SCALE_MAX, score))
  return ((clamped - SCALE_MIN) / SCALE_RANGE) * 100
}

export function NutriScoreDisplay({ grade, score, nutrition }: Props) {
  if (!grade) {
    return (
      <div style={emptyStyle}>
        Ajoutez des ingrédients et cliquez sur « Calculer le Nutri-Score »
      </div>
    )
  }

  const needlePos = score !== null ? scoreToPercent(score) : null

  return (
    <div style={containerStyle}>
      {/* Badges A–E */}
      <div style={badgeRowStyle}>
        {GRADES.map(g => {
          const isActive = g === grade
          return (
            <div
              key={g}
              style={{
                background: GRADE_COLORS[g],
                color: g === 'C' ? '#333' : 'white',
                width: isActive ? 56 : 40,
                height: isActive ? 56 : 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: isActive ? '1.5rem' : '1rem',
                boxShadow: isActive ? '0 2px 10px rgba(0,0,0,0.3)' : 'none',
                transition: 'all 0.2s',
                opacity: isActive ? 1 : 0.35,
                flexShrink: 0,
              }}
            >
              {g}
            </div>
          )
        })}
      </div>

      {/* Barre colorée avec indicateur */}
      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <div style={{ position: 'relative' }}>
          {/* Barre segmentée */}
          <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden' }}>
            {GRADES.map(g => {
              const [lo, hi] = GRADE_BOUNDS[g]
              const width = ((hi - lo) / SCALE_RANGE) * 100
              return (
                <div
                  key={g}
                  style={{
                    background: GRADE_COLORS[g],
                    width: `${width}%`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.6rem',
                    color: g === 'C' ? '#555' : 'rgba(255,255,255,0.8)',
                    fontWeight: 700,
                    letterSpacing: 0.5,
                  }}
                >
                  {g}
                </div>
              )
            })}
          </div>

          {/* Indicateur (triangle + ligne) */}
          {needlePos !== null && (
            <div
              style={{
                position: 'absolute',
                left: `${needlePos}%`,
                top: -10,
                transform: 'translateX(-50%)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              {/* Score */}
              <span style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                color: GRADE_COLORS[grade],
                marginBottom: 1,
                whiteSpace: 'nowrap',
              }}>
                {score}
              </span>
              {/* Triangle */}
              <div style={{
                width: 0,
                height: 0,
                borderLeft: '5px solid transparent',
                borderRight: '5px solid transparent',
                borderTop: `6px solid ${GRADE_COLORS[grade]}`,
              }} />
            </div>
          )}
        </div>

        {/* Légende des bornes */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: '0.65rem', color: '#999' }}>
          <span>{SCALE_MIN}</span>
          <span>0</span>
          <span>3</span>
          <span>11</span>
          <span>19</span>
          <span>{SCALE_MAX}</span>
        </div>
      </div>

      {/* Tableau valeurs nutritionnelles */}
      {nutrition && (
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Nutriment</th>
              <th style={{ ...thStyle, textAlign: 'right' }}>Pour 100g</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Énergie', `${nutrition.energieKj ?? '-'} kJ / ${nutrition.energieKcal ?? '-'} kcal`],
              ['Lipides', fmt(nutrition.lipides, 'g')],
              ['dont Acides gras saturés', fmt(nutrition.acideGrasSatures, 'g')],
              ['Glucides', fmt(nutrition.glucides, 'g')],
              ['dont Sucres', fmt(nutrition.sucres, 'g')],
              ['Fibres alimentaires', fmt(nutrition.fibres, 'g')],
              ['Protéines', fmt(nutrition.proteines, 'g')],
              ['Sel', fmt(nutrition.sel, 'g')],
            ].map(([label, value]) => (
              <tr key={label as string}>
                <td style={tdStyle}>{label}</td>
                <td style={{ ...tdStyle, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

function fmt(v: number | null | undefined, unit: string): string {
  if (v === null || v === undefined) return '-'
  return `${v.toFixed(2)} ${unit}`
}

const containerStyle: React.CSSProperties = {
  background: '#fafafa',
  border: '1px solid #e0e0e0',
  borderRadius: 10,
  padding: '20px 24px',
}

const emptyStyle: React.CSSProperties = {
  background: '#f5f5f5',
  borderRadius: 10,
  padding: '24px',
  textAlign: 'center',
  color: '#888',
  fontSize: '0.9rem',
}

const badgeRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  justifyContent: 'center',
  marginBottom: 4,
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: 16,
  fontSize: '0.875rem',
}

const thStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '2px solid #ddd',
  textAlign: 'left',
  fontWeight: 600,
  color: '#333',
}

const tdStyle: React.CSSProperties = {
  padding: '5px 8px',
  borderBottom: '1px solid #eee',
}
