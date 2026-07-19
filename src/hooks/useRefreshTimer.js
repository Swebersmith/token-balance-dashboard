import { useEffect, useRef } from 'react'
import { useBalance } from '../context/BalanceContext'

export function useRefreshTimer(intervalMs = 5 * 60 * 1000) {
  const { refresh, loading } = useBalance()
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      refresh()
      return
    }

    const timer = setInterval(() => {
      if (!loading) refresh()
    }, intervalMs)

    return () => clearInterval(timer)
  }, [refresh, intervalMs])
}
