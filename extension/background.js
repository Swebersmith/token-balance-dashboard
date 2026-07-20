const storageKey = 'tokenBalanceSyncSettings'

async function sync(payload) {
  const { [storageKey]: settings } = await chrome.storage.local.get(storageKey)
  if (!settings?.dashboardUrl || !settings?.token) return

  try {
    const response = await fetch(`${settings.dashboardUrl.replace(/\/$/, '')}/api/extension/sync`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
    if (!response.ok) throw new Error(`Sync failed: ${response.status}`)
    await chrome.storage.local.set({ lastSync: { provider: payload.provider, at: new Date().toISOString(), error: '' } })
  } catch (error) {
    await chrome.storage.local.set({ lastSync: { provider: payload.provider, at: new Date().toISOString(), error: error.message } })
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'balanceDetected') sync(message.payload)
})
