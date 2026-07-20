const storageKey = 'tokenBalanceSyncSettings'
const dashboardUrl = document.getElementById('dashboardUrl')
const token = document.getElementById('token')
const status = document.getElementById('status')

async function load() {
  const { [storageKey]: settings, lastSync } = await chrome.storage.local.get([storageKey, 'lastSync'])
  dashboardUrl.value = settings?.dashboardUrl || ''
  token.value = settings?.token || ''
  if (lastSync?.at) status.textContent = lastSync.error ? `最近状态：${lastSync.error}` : `最近同步成功：${lastSync.provider}`
}

document.getElementById('save').addEventListener('click', async () => {
  try {
    const url = new URL(dashboardUrl.value.trim())
    const granted = await chrome.permissions.request({ origins: [`${url.origin}/*`] })
    if (!granted) throw new Error('请允许扩展访问余额站地址')
    if (!token.value.trim().startsWith('tbx_')) throw new Error('同步令牌格式不正确')
    await chrome.storage.local.set({ [storageKey]: { dashboardUrl: url.origin, token: token.value.trim() } })
    status.textContent = '已保存。打开已登录的服务商页面即可同步。'
  } catch (error) {
    status.textContent = error.message
  }
})

load()
