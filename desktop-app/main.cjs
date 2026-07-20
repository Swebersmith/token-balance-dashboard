const { app, BrowserWindow, ipcMain, Menu, nativeImage, safeStorage, session, shell, Tray } = require('electron')
const fs = require('fs/promises')
const path = require('path')

const DIRECT_PROVIDERS = {
  openai: { name: 'OpenAI', currency: 'USD', color: '#10a37f', endpoint: 'https://api.openai.com/v1/organization/credit_grants', rechargeUrl: 'https://platform.openai.com/settings/organization/billing', pricingUrl: 'https://openai.com/api/pricing/' },
  deepseek: { name: 'DeepSeek', currency: 'CNY', color: '#4f46e5', endpoint: 'https://api.deepseek.com/user/balance', rechargeUrl: 'https://platform.deepseek.com/top_up', pricingUrl: 'https://platform.deepseek.com/api-docs/pricing' },
  openrouter: { name: 'OpenRouter', currency: 'USD', color: '#6366f1', endpoint: 'https://openrouter.ai/api/v1/credits', rechargeUrl: 'https://openrouter.ai/credits', pricingUrl: 'https://openrouter.ai/models' },
  together: { name: 'Together AI', currency: 'USD', color: '#0891b2', endpoint: 'https://api.together.xyz/v1/billing/credits', rechargeUrl: 'https://api.together.xyz/settings/billing', pricingUrl: 'https://www.together.ai/pricing' },
}

const WEB_PROVIDERS = {
  'right-code': { name: 'Right Code', currency: 'USD', color: '#0f766e', website: 'https://right.codes/', balanceUrl: 'https://right.codes/home', rechargeUrl: 'https://right.codes/subscribe', pricingUrl: 'https://right.codes/models' },
  runapi: { name: 'RunAPI', currency: 'USD', color: '#2563eb', website: 'https://runapi.co/', balanceUrl: 'https://runapi.co/console/topup', rechargeUrl: 'https://runapi.co/console/topup', pricingUrl: 'https://runapi.co/pricing' },
}

let mainWindow
let tray
let isQuitting = false
const hiddenWebWindows = new Map()
let appState = { providers: [] }

function configPath() { return path.join(app.getPath('userData'), 'providers.json') }
function credentialsPath() { return path.join(app.getPath('userData'), 'credentials.bin') }

function defaults() {
  return [
    ...Object.entries(DIRECT_PROVIDERS).map(([id, provider]) => ({ id, kind: 'api', ...provider })),
    ...Object.entries(WEB_PROVIDERS).map(([id, provider]) => ({ id, kind: 'web', ...provider })),
  ]
}

async function readConfig() {
  try {
    const data = JSON.parse(await fs.readFile(configPath(), 'utf8'))
    return Array.isArray(data.providers) ? data : { providers: defaults() }
  } catch {
    return { providers: defaults() }
  }
}

async function writeConfig(config) {
  await fs.mkdir(app.getPath('userData'), { recursive: true })
  await fs.writeFile(configPath(), JSON.stringify(config, null, 2), 'utf8')
}

async function readCredentials() {
  try {
    const encrypted = await fs.readFile(credentialsPath())
    if (!safeStorage.isEncryptionAvailable()) return {}
    return JSON.parse(safeStorage.decryptString(encrypted))
  } catch {
    return {}
  }
}

async function writeCredentials(credentials) {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Windows encrypted storage is unavailable')
  await fs.mkdir(app.getPath('userData'), { recursive: true })
  await fs.writeFile(credentialsPath(), safeStorage.encryptString(JSON.stringify(credentials)))
}

function amount(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function webUrl(value, fallback = '') {
  if (typeof value !== 'string' || !value.trim()) return fallback
  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : fallback
  } catch {
    return fallback
  }
}

function webPreferencesFor(provider) {
  return { session: session.fromPartition(`persist:token-balance-${provider.id}`), contextIsolation: true, nodeIntegration: false }
}

async function fetchJson(url, options, provider) {
  const response = await fetch(url, options)
  if (!response.ok) throw new Error(`${provider} request failed (${response.status})`)
  return response.json()
}

async function fetchDirect(provider, apiKey) {
  if (!apiKey) return { ...provider, balance: null, status: 'unconfigured' }
  try {
    if (provider.id === 'openai') {
      const data = await fetchJson(provider.endpoint, { headers: { Authorization: `Bearer ${apiKey}` } }, provider.name)
      const balance = amount(data.total_available) ?? (amount(data.total_granted) - amount(data.total_used))
      if (balance == null) throw new Error('No readable credit balance')
      return { ...provider, balance, status: 'ok', updatedAt: new Date().toISOString() }
    }
    if (provider.id === 'deepseek') {
      const data = await fetchJson(provider.endpoint, { headers: { Authorization: `Bearer ${apiKey}` } }, provider.name)
      const info = data.balance_infos?.find((item) => item.currency === 'CNY') || data.balance_infos?.[0]
      const balance = amount(info?.total_balance ?? data.balance)
      if (balance == null) throw new Error('No readable balance')
      return { ...provider, balance, currency: info?.currency || provider.currency, status: 'ok', updatedAt: new Date().toISOString() }
    }
    if (provider.id === 'openrouter') {
      const data = await fetchJson(provider.endpoint, { headers: { Authorization: `Bearer ${apiKey}` } }, provider.name)
      const credits = data.data || data
      const balance = amount(credits.total_credits) - amount(credits.total_usage)
      if (balance == null) throw new Error('No readable credit balance')
      return { ...provider, balance, status: 'ok', updatedAt: new Date().toISOString() }
    }
    const data = await fetchJson(provider.endpoint, { headers: { Authorization: `Bearer ${apiKey}` } }, provider.name)
    const balance = amount(data.credit_amount ?? data.credits ?? data.balance)
    if (balance == null) throw new Error('No readable credit balance')
    return { ...provider, balance, status: 'ok', updatedAt: new Date().toISOString() }
  } catch (error) {
    return { ...provider, balance: null, status: 'error', errorMessage: error.message }
  }
}

function extractPageData(balanceKeyword = '') {
  const text = document.body.innerText || ''
  const keyword = typeof balanceKeyword === 'string' ? balanceKeyword.trim() : ''
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const patterns = [
    /(?:\u8d26\u6237)?\u4f59\u989d\s*[:\uff1a]?\s*([\u00a5\uffe5$])?\s*([\d,]+(?:\.\d+)?)/i,
    /(?:account\s*)?balance\s*[:\uff1a]?\s*([\u00a5\uffe5$])?\s*([\d,]+(?:\.\d+)?)/i,
    /(?:available\s*)?credits?\s*[:\uff1a]?\s*([\u00a5\uffe5$])?\s*([\d,]+(?:\.\d+)?)/i,
    /remaining\s*(?:balance|credits?)\s*[:\uff1a]?\s*([\u00a5\uffe5$])?\s*([\d,]+(?:\.\d+)?)/i,
  ]
  if (escapedKeyword) patterns.unshift(new RegExp(`${escapedKeyword}\\s*[:\\uff1a]?\\s*([\\u00a5\\uffe5$])?\\s*([\\d,]+(?:\\.\\d+)?)`, 'i'))
  const balanceMatch = patterns.map((pattern) => text.match(pattern)).find(Boolean)
  const balance = balanceMatch ? Number(balanceMatch[2].replaceAll(',', '')) : null
  const currency = balanceMatch?.[1] === '\u00a5' || balanceMatch?.[1] === '\uffe5' ? 'CNY' : 'USD'
  const models = Array.from(document.querySelectorAll('table tr')).slice(1, 21).map((row) => {
    const values = row.innerText.split('\n').map((value) => value.trim()).filter(Boolean)
    return values.length >= 2 ? { name: values[0], price: values.slice(1).join(' ') } : null
  }).filter(Boolean)
  return { balance: Number.isFinite(balance) ? balance : null, currency, models }
}

async function extractRunapiData() {
  const parseStorage = (key) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
  }
  const token = localStorage.getItem('token') || ''
  const headers = token ? { Authorization: `Bearer ${token}` } : {}
  let profile = null
  try {
    const profileResponse = await fetch('/api/user/self', { credentials: 'include', headers })
    profile = await profileResponse.json()
  } catch {}
  const savedUser = parseStorage('user')
  const candidates = [profile?.data?.user, profile?.data, profile, savedUser?.data?.user, savedUser?.data, savedUser]
  const user = candidates.find((candidate) => Number.isFinite(Number(candidate?.quota)))
  const quota = Number(user?.quota)
  if (!Number.isFinite(quota)) throw new Error('RunAPI \u5df2\u767b\u5f55\uff0c\u4f46\u672a\u8bfb\u5230\u8d26\u6237\u989d\u5ea6')
  let quotaPerUnit = Number(localStorage.getItem('quota_per_unit'))
  let status = parseStorage('status')
  try {
    const statusResponse = await fetch('/api/status', { credentials: 'include', headers })
    status = await statusResponse.json()
    quotaPerUnit = Number(status?.data?.quota_per_unit) || quotaPerUnit
  } catch {}
  if (!Number.isFinite(quotaPerUnit) || quotaPerUnit <= 0) throw new Error('RunAPI \u672a\u8bfb\u5230\u4f59\u989d\u6362\u7b97\u89c4\u5219')
  const displayType = localStorage.getItem('quota_display_type') || 'USD'
  if (displayType === 'CNY') {
    const exchangeRate = Number(status?.data?.usd_exchange_rate) || 1
    return { balance: quota / quotaPerUnit * exchangeRate, currency: 'CNY', models: [] }
  }
  return { balance: quota / quotaPerUnit, currency: 'USD', models: [] }
}

async function readWebBalance(provider, contents) {
  if (provider.id === 'runapi') return contents.executeJavaScript(`(${extractRunapiData.toString()})()`, true)
  return contents.executeJavaScript(`(${extractPageData.toString()})(${JSON.stringify(provider.balanceKeyword || '')})`, true)
}

async function ensureHiddenWebWindow(provider) {
  let window = hiddenWebWindows.get(provider.id)
  if (!window || window.isDestroyed()) {
    window = new BrowserWindow({
      show: false,
      webPreferences: webPreferencesFor(provider),
    })
    hiddenWebWindows.set(provider.id, window)
  }
  return window
}

async function fetchWeb(provider, previous = {}) {
  try {
    const window = await ensureHiddenWebWindow(provider)
    await window.loadURL(provider.balanceUrl)
    const data = await readWebBalance(provider, window.webContents)
    if (data.balance == null) {
      return {
        ...provider,
        ...previous,
        status: previous.balance != null ? 'cached' : 'needs_login',
        errorMessage: previous.balance != null ? '已显示上次同步的余额。请打开登录会话重新同步。' : '请打开登录会话并完成登录。',
      }
    }
    return { ...provider, ...previous, ...data, status: 'ok', updatedAt: new Date().toISOString() }
  } catch (error) {
    return { ...provider, ...previous, balance: previous.balance ?? null, status: 'needs_login', errorMessage: error.message }
  }
}

async function captureVisibleWebBalance(provider, contents) {
  try {
    const data = await readWebBalance(provider, contents)
    if (data.balance == null) return false
    const providers = appState.providers.map((item) => item.id === provider.id
      ? { ...provider, ...item, ...data, status: 'ok', updatedAt: new Date().toISOString(), errorMessage: '' }
      : item)
    appState = { providers }
    mainWindow?.webContents.send('balances-updated', appState)
    return true
  } catch {
    return false
  }
}

async function refreshAll() {
  const config = await readConfig()
  const credentials = await readCredentials()
  const previous = Object.fromEntries(appState.providers.map((provider) => [provider.id, provider]))
  const providers = await Promise.all(config.providers.map(async (provider) => {
    if (provider.kind === 'api') return fetchDirect(provider, credentials[provider.id])
    if (provider.kind === 'manual') return { ...provider, balance: amount(provider.manualBalance), status: 'ok', updatedAt: new Date().toISOString() }
    return fetchWeb(provider, previous[provider.id])
  }))
  appState = { providers }
  mainWindow?.webContents.send('balances-updated', appState)
  return appState
}

async function openProviderPage(id, page) {
  const config = await readConfig()
  const provider = config.providers.find((item) => item.id === id)
  if (!provider) throw new Error('Unknown provider')
  const url = page === 'pricing' ? provider.pricingUrl : page === 'recharge' ? provider.rechargeUrl : provider.balanceUrl || provider.website
  if (provider.kind !== 'web') return shell.openExternal(url)
  const window = new BrowserWindow({
    width: 1180,
    height: 820,
    title: `${provider.name} \u767b\u5f55\u4f1a\u8bdd`,
    webPreferences: webPreferencesFor(provider),
  })
  const providerSession = window.webContents.session
  window.webContents.on('did-finish-load', () => captureVisibleWebBalance(provider, window.webContents))
  await window.loadURL(url)
  window.on('closed', async () => {
    await providerSession.cookies.flushStore().catch(() => {})
    await refreshAll()
  })
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 900,
    minHeight: 620,
    title: '\u4f59\u989d\u4e2d\u5fc3',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
  mainWindow.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
    mainWindow.hide()
  })
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) createMainWindow()
  if (mainWindow.isMinimized()) mainWindow.restore()
  mainWindow.show()
  mainWindow.focus()
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'renderer', 'tray-icon.svg'))
  tray = new Tray(icon)
  tray.setToolTip('\u4f59\u989d\u4e2d\u5fc3\u6b63\u5728\u540e\u53f0\u8fd0\u884c')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: '\u663e\u793a\u4f59\u989d\u4e2d\u5fc3', click: showMainWindow },
    { label: '\u7acb\u5373\u5237\u65b0\u4f59\u989d', click: () => refreshAll() },
    { type: 'separator' },
    { label: '\u9000\u51fa\u7a0b\u5e8f', click: () => { isQuitting = true; app.quit() } },
  ]))
  tray.on('click', showMainWindow)
}

ipcMain.handle('balances:get', refreshAll)
ipcMain.handle('balances:refresh', refreshAll)
ipcMain.handle('provider:open', (_, id, page) => openProviderPage(id, page))
ipcMain.handle('provider:save', async (_, input) => {
  const config = await readConfig()
  const credentials = await readCredentials()
  const existing = config.providers.find((provider) => provider.id === input.id)
  if (!existing) throw new Error('Unknown provider')
  if (typeof input.name === 'string' && input.name.trim()) existing.name = input.name.trim()
  if (input.manualBalance !== undefined) existing.manualBalance = input.manualBalance
  existing.currency = input.currency || existing.currency
  if (typeof input.website === 'string') existing.website = webUrl(input.website, existing.website)
  if (existing.kind === 'web') {
    if (typeof input.balanceUrl === 'string') existing.balanceUrl = webUrl(input.balanceUrl, existing.balanceUrl || existing.website)
    if (typeof input.rechargeUrl === 'string') existing.rechargeUrl = webUrl(input.rechargeUrl)
    if (typeof input.pricingUrl === 'string') existing.pricingUrl = webUrl(input.pricingUrl)
    if (typeof input.balanceKeyword === 'string') existing.balanceKeyword = input.balanceKeyword.trim().slice(0, 80)
  }
  if (typeof input.apiKey === 'string' && input.apiKey) credentials[input.id] = input.apiKey
  if (input.clearApiKey) delete credentials[input.id]
  await writeConfig(config)
  await writeCredentials(credentials)
  return refreshAll()
})
ipcMain.handle('provider:add-manual', async (_, input) => {
  const name = typeof input?.name === 'string' ? input.name.trim() : ''
  const balance = amount(input?.manualBalance)
  if (!name || balance == null) throw new Error('Name and balance are required')
  const config = await readConfig()
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-') || `source-${Date.now()}`
  const id = `manual-${slug}-${Date.now().toString().slice(-5)}`
  config.providers.push({
    id,
    name,
    kind: 'manual',
    manualBalance: balance,
    currency: input?.currency === 'CNY' ? 'CNY' : 'USD',
    color: '#7c3aed',
    website: typeof input?.website === 'string' ? input.website.trim() : '',
  })
  await writeConfig(config)
  return refreshAll()
})
ipcMain.handle('provider:add-web', async (_, input) => {
  const name = typeof input?.name === 'string' ? input.name.trim() : ''
  const website = webUrl(input?.website)
  const balanceUrl = webUrl(input?.balanceUrl, website)
  if (!name || !balanceUrl) throw new Error('A provider name and balance page URL are required')
  const config = await readConfig()
  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, '-') || `source-${Date.now()}`
  const id = `web-${slug}-${Date.now().toString().slice(-5)}`
  config.providers.push({
    id,
    name,
    kind: 'web',
    currency: input?.currency === 'CNY' ? 'CNY' : 'USD',
    color: '#d946ef',
    website: website || balanceUrl,
    balanceUrl,
    rechargeUrl: webUrl(input?.rechargeUrl),
    pricingUrl: webUrl(input?.pricingUrl),
    balanceKeyword: typeof input?.balanceKeyword === 'string' ? input.balanceKeyword.trim().slice(0, 80) : '',
  })
  await writeConfig(config)
  return refreshAll()
})
ipcMain.handle('provider:delete', async (_, id) => {
  const config = await readConfig()
  const provider = config.providers.find((item) => item.id === id)
  if (!provider) throw new Error('Unknown provider')
  config.providers = config.providers.filter((item) => item.id !== id)
  const credentials = await readCredentials()
  delete credentials[id]
  const hiddenWindow = hiddenWebWindows.get(id)
  if (hiddenWindow && !hiddenWindow.isDestroyed()) hiddenWindow.destroy()
  hiddenWebWindows.delete(id)
  await writeConfig(config)
  await writeCredentials(credentials)
  return refreshAll()
})

app.whenReady().then(async () => {
  createMainWindow()
  createTray()
  await refreshAll()
  setInterval(refreshAll, 5 * 60 * 1000)
})

app.on('before-quit', () => { isQuitting = true })

app.on('window-all-closed', () => {
  if (process.platform === 'darwin') app.dock?.hide()
})
