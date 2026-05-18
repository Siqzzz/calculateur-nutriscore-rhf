import { useState } from 'react'
import { RecipeForm } from './pages/RecipeForm'
import type { RecipeType } from './types'

const TABS: { key: RecipeType; label: string }[] = [
  { key: 'general', label: '🍽 Général' },
  { key: 'viande', label: '🥩 Viande' },
  { key: 'boissons', label: '🥤 Boissons' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<RecipeType>('general')

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={logoStyle}>NS</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>
              Calculateur Nutri-Score RHF
            </h1>
            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}>
              Restauration Hors Foyer — données CIQUAL
            </p>
          </div>
        </div>
      </header>

      {/* Navigation par onglets */}
      <nav style={navStyle}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', display: 'flex', gap: 4 }}>
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                ...tabStyle,
                background: activeTab === tab.key ? 'white' : 'transparent',
                borderBottom: activeTab === tab.key ? '3px solid #2563eb' : '3px solid transparent',
                color: activeTab === tab.key ? '#2563eb' : '#555',
                fontWeight: activeTab === tab.key ? 600 : 400,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Contenu */}
      <main>
        <RecipeForm key={activeTab} type={activeTab} />
      </main>
    </div>
  )
}

const headerStyle: React.CSSProperties = {
  background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
  color: 'white',
  padding: '16px 0',
  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
}

const logoStyle: React.CSSProperties = {
  width: 44,
  height: 44,
  background: 'white',
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 800,
  fontSize: '1.1rem',
  color: '#2563eb',
}

const navStyle: React.CSSProperties = {
  background: 'white',
  borderBottom: '1px solid #e0e0e0',
  marginBottom: 8,
}

const tabStyle: React.CSSProperties = {
  padding: '14px 20px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.9rem',
  transition: 'all 0.15s',
}
