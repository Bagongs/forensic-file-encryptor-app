import { Routes, Route, Outlet } from 'react-router-dom'
import HeaderBar from './components/HeaderBar'
import AboutButton from './components/common/AboutButton'

import ConverterHome from './pages/ConverterHome'
import AboutPage from './pages/AboutPage'

function AppLayout() {
  return (
    <div className="w-screen h-screen flex flex-col bg-cover bg-center overflow-hidden relative">
      {/* HeaderBar konsisten */}
      <div className="app-header shrink-0">
        <HeaderBar />
      </div>

      {/* Konten halaman */}
      <Outlet />

      {/* About button global */}
      <AboutButton />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<ConverterHome />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
    </Routes>
  )
}
