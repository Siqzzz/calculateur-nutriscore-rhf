import { Link, Outlet, useLocation } from 'react-router-dom'

const BREADCRUMBS: Record<string, string> = {
  recette: 'Calculer une recette',
  recettes: 'Mes recettes',
  ciqual: 'Base CIQUAL',
  ingredients: 'Mes ingrédients',
  guide: "Guide d'utilisation",
}

export default function Layout() {
  const location = useLocation()
  const segment = location.pathname.split('/').filter(Boolean)[0]
  const label = segment ? BREADCRUMBS[segment] : null

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/" className="shrink-0">
            <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors">
              Nutri-Score RHF
            </span>
          </Link>
          {label && (
            <>
              <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="text-sm font-medium text-slate-700">{label}</span>
            </>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
