const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5173'

export async function fetchBalances() {
  const res = await fetch(`${BASE_URL}/api/balance`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchProviderBalance(providerId) {
  const res = await fetch(`${BASE_URL}/api/balance/${providerId}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function createStripeCheckout(amount, currency = 'cny') {
  const res = await fetch(`${BASE_URL}/api/stripe/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, currency }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function verifyApiKey(providerId) {
  const res = await fetch(`${BASE_URL}/api/balance/${providerId}`)
  return { provider: providerId, ok: res.ok }
}
