import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { PROVIDERS } from '../utils/providers'

const AdminContext = createContext(null)

const DEFAULT_ADMIN = {
  providers: { ...PROVIDERS },
  customProviders: [],
}

function loadAdmin() {
  try {
    const saved = localStorage.getItem('token_dashboard_admin')
    if (saved) {
      const data = JSON.parse(saved)
      return {
        providers: { ...PROVIDERS, ...data.customProviders?.reduce((acc, p) => {
          acc[p.id] = p
          return acc
        }, {}) },
        customProviders: data.customProviders || [],
      }
    }
  } catch { /* ignore */ }
  return { providers: { ...PROVIDERS }, customProviders: [] }
}

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(loadAdmin)

  useEffect(() => {
    localStorage.setItem('token_dashboard_admin', JSON.stringify({
      customProviders: admin.customProviders,
    }))
  }, [admin.customProviders])

  const allProviders = useCallback(() => {
    const merged = { ...PROVIDERS }
    admin.customProviders.forEach(p => { merged[p.id] = p })
    return merged
  }, [admin.customProviders])

  const addProvider = useCallback((provider) => {
    setAdmin(prev => ({
      ...prev,
      customProviders: [...prev.customProviders.filter(p => p.id !== provider.id), provider],
      providers: { ...prev.providers, [provider.id]: provider },
    }))
  }, [])

  const removeProvider = useCallback((id) => {
    if (PROVIDERS[id]) return // Can't remove built-in
    setAdmin(prev => ({
      ...prev,
      customProviders: prev.customProviders.filter(p => p.id !== id),
      providers: Object.fromEntries(Object.entries(prev.providers).filter(([k]) => k !== id)),
    }))
  }, [])

  const updateProvider = useCallback((id, updates) => {
    setAdmin(prev => {
      const prov = { ...(prev.providers[id] || {}), ...updates }
      return {
        ...prev,
        providers: { ...prev.providers, [id]: prov },
        customProviders: PROVIDERS[id]
          ? prev.customProviders
          : prev.customProviders.map(p => p.id === id ? prov : p),
      }
    })
  }, [])

  return (
    <AdminContext.Provider value={{ ...admin, allProviders, addProvider, removeProvider, updateProvider }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
