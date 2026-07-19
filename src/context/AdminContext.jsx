import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { PROVIDERS } from '../utils/providers'

const AdminContext = createContext(null)

function loadAdmin() {
  try {
    const saved = localStorage.getItem('token_dashboard_admin')
    if (saved) {
      const data = JSON.parse(saved)
      const removedBuiltins = data.removedBuiltins || []
      const customProviders = data.customProviders || []
      const providers = { ...PROVIDERS }
      // Apply custom providers (add/override)
      customProviders.forEach(p => { providers[p.id] = p })
      // Remove hidden builtins
      removedBuiltins.forEach(id => { delete providers[id] })
      return { providers, customProviders, removedBuiltins }
    }
  } catch { /* ignore */ }
  return { providers: { ...PROVIDERS }, customProviders: [], removedBuiltins: [] }
}

export function AdminProvider({ children }) {
  const [admin, setAdmin] = useState(loadAdmin)

  useEffect(() => {
    localStorage.setItem('token_dashboard_admin', JSON.stringify({
      customProviders: admin.customProviders,
      removedBuiltins: admin.removedBuiltins,
    }))
  }, [admin.customProviders, admin.removedBuiltins])

  const addProvider = useCallback((provider) => {
    setAdmin(prev => ({
      ...prev,
      customProviders: [...prev.customProviders.filter(p => p.id !== provider.id), provider],
      providers: { ...prev.providers, [provider.id]: provider },
      removedBuiltins: prev.removedBuiltins.filter(id => id !== provider.id),
    }))
  }, [])

  const removeProvider = useCallback((id) => {
    setAdmin(prev => {
      const isBuiltin = !!PROVIDERS[id]
      return {
        ...prev,
        customProviders: prev.customProviders.filter(p => p.id !== id),
        providers: Object.fromEntries(Object.entries(prev.providers).filter(([k]) => k !== id)),
        removedBuiltins: isBuiltin
          ? [...new Set([...prev.removedBuiltins, id])]
          : prev.removedBuiltins,
      }
    })
  }, [])

  const restoreBuiltins = useCallback(() => {
    setAdmin(prev => ({
      ...prev,
      providers: { ...PROVIDERS, ...Object.fromEntries(prev.customProviders.map(p => [p.id, p])) },
      removedBuiltins: [],
    }))
  }, [])

  const updateProvider = useCallback((id, updates) => {
    setAdmin(prev => {
      const prov = { ...(PROVIDERS[id] || {}), ...(prev.providers[id] || {}), ...updates }
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
    <AdminContext.Provider value={{
      ...admin, addProvider, removeProvider, restoreBuiltins, updateProvider,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
