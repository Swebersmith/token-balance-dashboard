import { createContext, useContext, useReducer, useCallback } from 'react'
import { fetchBalances, fetchProviderBalance } from '../utils/api'

const BalanceContext = createContext(null)

const DEMO_BALANCES = [
  { provider: 'openai', balance: 3.50, currency: 'USD', status: 'ok' },
  { provider: 'anthropic', balance: 150.00, currency: 'USD', status: 'ok' },
  { provider: 'deepseek', balance: 15.42, currency: 'CNY', status: 'ok' },
  { provider: 'google', balance: null, currency: 'USD', status: 'configured', note: '请前往 GCP 控制台查看余额' },
  { provider: 'groq', balance: null, currency: 'USD', status: 'configured', note: '请前往 Groq Console 查看余额' },
  { provider: 'openrouter', balance: 8.90, currency: 'USD', status: 'ok' },
  { provider: 'together', balance: 45.00, currency: 'USD', status: 'ok' },
]

const initialState = {
  balances: [],
  loading: false,
  error: null,
  lastUpdated: null,
  demoMode: false,
}

function reducer(state, action) {
  switch (action.type) {
    case 'REFRESH_START':
      return { ...state, loading: true, error: null }
    case 'REFRESH_SUCCESS': {
      const hasRealData = action.payload.some(
        (b) => b.status === 'ok' || b.status === 'configured'
      )
      return {
        ...state,
        loading: false,
        balances: hasRealData ? action.payload : DEMO_BALANCES,
        lastUpdated: new Date(),
        error: null,
        demoMode: !hasRealData,
      }
    }
    case 'REFRESH_ERROR':
      return {
        ...state,
        loading: false,
        balances: DEMO_BALANCES,
        lastUpdated: new Date(),
        error: action.payload,
        demoMode: true,
      }
    case 'UPDATE_PROVIDER':
      return {
        ...state,
        balances: state.balances.map((b) =>
          b.provider === action.payload.provider ? { ...b, ...action.payload } : b
        ),
      }
    default:
      return state
  }
}

export function BalanceProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const refresh = useCallback(async () => {
    dispatch({ type: 'REFRESH_START' })
    try {
      const data = await fetchBalances()
      dispatch({ type: 'REFRESH_SUCCESS', payload: data })
    } catch (err) {
      dispatch({ type: 'REFRESH_ERROR', payload: err.message })
    }
  }, [])

  const refreshProvider = useCallback(async (providerId) => {
    try {
      const data = await fetchProviderBalance(providerId)
      dispatch({ type: 'UPDATE_PROVIDER', payload: data })
    } catch {
      // Single provider error is non-fatal, keep stale data
    }
  }, [])

  return (
    <BalanceContext.Provider value={{ ...state, refresh, refreshProvider }}>
      {children}
    </BalanceContext.Provider>
  )
}

export function useBalance() {
  const ctx = useContext(BalanceContext)
  if (!ctx) throw new Error('useBalance must be used within BalanceProvider')
  return ctx
}
