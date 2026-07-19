import { BalanceProvider } from './context/BalanceContext'
import { Dashboard } from './pages/Dashboard'

export default function App() {
  return (
    <BalanceProvider>
      <Dashboard />
    </BalanceProvider>
  )
}
