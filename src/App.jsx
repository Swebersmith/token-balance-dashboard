import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { BalanceProvider } from './context/BalanceContext'
import { AdminProvider } from './context/AdminContext'
import { Dashboard } from './pages/Dashboard'
import { Admin } from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <BalanceProvider>
        <AdminProvider>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </AdminProvider>
      </BalanceProvider>
    </BrowserRouter>
  )
}
