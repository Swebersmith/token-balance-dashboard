const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:5173'

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`)
  return data
}

export function getAdminSettings() {
  return request('/api/admin/settings')
}

export function loginAdmin(password) {
  return request('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
}

export function logoutAdmin() {
  return request('/api/admin/logout', { method: 'POST' })
}

export function saveAdminProviderKey(provider, apiKey) {
  return request('/api/admin/settings', { method: 'POST', body: JSON.stringify({ provider, apiKey }) })
}

export function changeAdminPassword(currentPassword, newPassword) {
  return request('/api/admin/password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}

export function getCustomProviders() {
  return request('/api/admin/custom-providers')
}

export function saveCustomProvider(provider) {
  return request('/api/admin/custom-providers', { method: 'POST', body: JSON.stringify(provider) })
}

export function deleteCustomProvider(id) {
  return request('/api/admin/custom-providers', { method: 'DELETE', body: JSON.stringify({ id }) })
}
