import type { NutriGrade, Nutrition100g } from '../types'

interface Props {
  grade: NutriGrade | null
  score: number | null
  nutrition: Nutrition100g | null
}

const GRADE_COLORS: Record<NutriGrade, { bg: string; text: string }> = {
  A: { bg: '#038141', text: 'white' },
  B: { bg: '#85BB2F', text: 'white' },
  C: { bg: '#FECB02', text: '#333' },
  D: { bg: '#EE8100', text: 'white' },
  E: { bg: '#E63312', text: 'white' },
}

export function NutriScoreDisplay({ grade, score, nutrition }: Props) {
  if (!grade) {
    return (
      <div style={emptyStyle}>
        Ajoutez des ingrédients et cliquez sur « Calculer le Nutri-Score »
      </div>
    )
  }

  const colors = GRADE_COLORS[grade]

  return (
    <div style={containerStyle}>
      <div style={badgeRowStyle}>
        {(['A', 'B', 'C', 'D', 'E'] as NutriGrade[]).map(g => {
          const c = GRADE_COLORS[g]
          const isActive = g === grade
          return (
            <div
              key={g}
              style={{
                background: c.bg,
                color: c.text,
                width: isActive ? 56 : 40,
                height: isActive ? 56 : 40,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: isActive ? '1.5rem' : '1rem',
                border: isActive ? `3px solid ${colors.bg}` : 'none',
                boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.25)' : 'none',
                transition: 'all 0.2s',
                opacity: isActive ? 1 : 0.4,
              }}
            >
              {g}
            </div>
          )
        })}
      </div>

      <p style={{ color: '#555', fontSize: '0.85rem', marginTop: 6 }}>
        Score : <strong>{score}</strong>
      </p>

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
  marginBottom: 12,
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
