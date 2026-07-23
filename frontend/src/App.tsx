import { Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { BrewList } from '@/pages/BrewList'
import { BrewDetail } from '@/pages/BrewDetail'
import { BrewCreate } from '@/pages/BrewCreate'
import { RecipeList } from '@/pages/RecipeList'
import { PriceBook } from '@/pages/PriceBook'

function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<BrewList />} />
        <Route path="/brews/new" element={<BrewCreate />} />
        <Route path="/brews/:id" element={<BrewDetail />} />
        <Route path="/recipes" element={<RecipeList />} />
        <Route path="/prices" element={<PriceBook />} />
      </Route>
    </Routes>
  )
}

export default App
