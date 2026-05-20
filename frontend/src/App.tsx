import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import RecipeFormPage from './pages/RecipeFormPage'
import RecipesPage from './pages/RecipesPage'
import CIQUALPage from './pages/CIQUALPage'
import CustomIngredientsPage from './pages/CustomIngredientsPage'
import GuidePage from './pages/GuidePage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="recette" element={<RecipeFormPage />} />
          <Route path="recette/:id" element={<RecipeFormPage />} />
          <Route path="recettes" element={<RecipesPage />} />
          <Route path="ciqual" element={<CIQUALPage />} />
          <Route path="ingredients" element={<CustomIngredientsPage />} />
          <Route path="guide" element={<GuidePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
