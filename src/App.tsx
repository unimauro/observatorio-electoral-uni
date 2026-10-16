import { HashRouter, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Lists, { ListDetail } from './pages/Lists'
import Directory from './pages/Directory'
import Profile from './pages/Profile'
import Plans from './pages/Plans'
import Compare from './pages/Compare'
import Matrix from './pages/Matrix'
import Degrees from './pages/Degrees'
import SearchPage from './pages/SearchPage'
import Retos from './pages/Retos'
import Incomes from './pages/Incomes'
import { Methodology, NotFoundPage, Privacy, Sources } from './pages/Static'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="listas" element={<Lists />} />
        <Route path="listas/:n" element={<ListDetail />} />
        <Route path="candidatos" element={<Directory />} />
        <Route path="candidatos/:slug" element={<Profile />} />
        <Route path="planes" element={<Plans />} />
        <Route path="grados" element={<Degrees />} />
        <Route path="buscar" element={<SearchPage />} />
        <Route path="retos" element={<Retos />} />
        <Route path="ingresos" element={<Incomes />} />
        <Route path="comparar" element={<Compare />} />
        <Route path="matriz" element={<Matrix />} />
        <Route path="fuentes" element={<Sources />} />
        <Route path="metodologia" element={<Methodology />} />
        <Route path="privacidad" element={<Privacy />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

// Rutas hash (#/candidatos/...): funcionan en GitHub Pages sin reescrituras del servidor y sobreviven a la recarga.
export default function App() {
  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  )
}
