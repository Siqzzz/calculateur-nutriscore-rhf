import { useState } from 'react'
import { RecipeForm } from './pages/RecipeForm'
import { RecipeList } from './pages/RecipeList'
import { CiqualBrowser } from './pages/CiqualBrowser'
import { IngredientManager } from './pages/IngredientManager'
import type { Recipe, RecipeType } from './types'

type TabKey = RecipeType | 'recettes' | 'ingredients' | 'ciqual'

const RECIPE_TABS: { key: RecipeType; label: string }[] = [
  { key: 'general',  label: '🍽 Général' },
  { key: 'viande',   label: '🥩 Viande' },
  { key: 'boissons', label: '🥤 Boissons' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('general')
  // Recette en cours d'édition (depuis la liste)
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null)

  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe)
    setActiveTab(recipe.type)
  }

  const handleTabChange = (tab: TabKey) => {
    // Si on quitte l'onglet d'une recette en cours d'édition, on efface
    if (editingRecipe && tab !== editingRecipe.type) {
      setEditingRecipe(null)
    }
    setActiveTab(tab)
  }

  const handleBackToList = () => {
    setEditingRecipe(null)
    setActiveTab('recettes')
  }

  // Clé unique pour forcer le remontage de RecipeForm quand la recette change
  const recipeFormKey = `${activeTab}-${editingRecipe?.id ?? 'new'}`

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', gap: 16 }}>
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

      {/* Navigation */}
      <nav style={navStyle}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px', display: 'flex', gap: 4 }}>
          {/* Onglets recettes */}
          {RECIPE_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
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

          {/* Séparateur */}
          <div style={{ width: 1, background: '#e0e0e0', margin: '8px 4px' }} />

          {/* Mes recettes */}
          <button
            onClick={() => handleTabChange('recettes')}
            style={{
              ...tabStyle,
              background: activeTab === 'recettes' ? 'white' : 'transparent',
              borderBottom: activeTab === 'recettes' ? '3px solid #7c3aed' : '3px solid transparent',
              color: activeTab === 'recettes' ? '#7c3aed' : '#555',
              fontWeight: activeTab === 'recettes' ? 600 : 400,
            }}
          >
            📋 Mes recettes
          </button>

          {/* Mes ingrédients */}
          <button
            onClick={() => handleTabChange('ingredients')}
            style={{
              ...tabStyle,
              background: activeTab === 'ingredients' ? 'white' : 'transparent',
              borderBottom: activeTab === 'ingredients' ? '3px solid #d97706' : '3px solid transparent',
              color: activeTab === 'ingredients' ? '#d97706' : '#555',
              fontWeight: activeTab === 'ingredients' ? 600 : 400,
            }}
          >
            🧪 Mes ingrédients
          </button>

          {/* Base CIQUAL */}
          <button
            onClick={() => handleTabChange('ciqual')}
            style={{
              ...tabStyle,
              background: activeTab === 'ciqual' ? 'white' : 'transparent',
              borderBottom: activeTab === 'ciqual' ? '3px solid #0891b2' : '3px solid transparent',
              color: activeTab === 'ciqual' ? '#0891b2' : '#555',
              fontWeight: activeTab === 'ciqual' ? 600 : 400,
            }}
          >
            🔬 Base CIQUAL
          </button>
        </div>
      </nav>

      {/* Contenu */}
      <main>
        {activeTab === 'recettes' && (
          <RecipeList onEdit={handleEditRecipe} />
        )}
        {activeTab === 'ingredients' && (
          <IngredientManager />
        )}
        {activeTab === 'ciqual' && (
          <CiqualBrowser />
        )}
        {(activeTab === 'general' || activeTab === 'viande' || activeTab === 'boissons') && (
          <RecipeForm
            key={recipeFormKey}
            type={activeTab}
            initialRecipe={editingRecipe ?? undefined}
            onBack={editingRecipe ? handleBackToList : undefined}
          />
        )}
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
  padding: '14px 18px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '0.875rem',
  transition: 'all 0.15s',
}
