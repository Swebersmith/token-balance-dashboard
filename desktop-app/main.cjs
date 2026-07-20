const { app, BrowserWindow, ipcMain, safeStorage, shell } = require('electron')
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

function extractPageData() {
  const text = document.body.innerText || ''
  const balanceMatch = text.match(/(?:账户)?余额\s*[:：]?\s*([￥¥$])?\s*([\d,]+(?:\.\d+)?)/i)
  const balance = balanceMatch ? Number(balanceMatch[2].replaceAll(',', '')) : null
  const currency = balanceMatch?.[1] === '￥' || balanceMatch?.[1] === '¥' ? 'CNY' : 'USD'
  const models = Array.from(document.querySelectorAll('table tr')).slice(1, 21).map((row) => {
    const values = row.innerText.split('\n').map((value) => value.trim()).filter(Boolean)
    return values.length >= 2 ? { name: values[0], price: values.slice(1).join(' ') } : null
  }).filter(Boolean)
  return { balance: Number.isFinite(balance) ? balance : null, currency, models }
}

async function ensureHiddenWebWindow(provider) {
  let window = hiddenWebWindows.get(provider.id)
  if (!window || window.isDestroyed()) {
    window = new BrowserWindow({
      show: false,
      webPreferences: { partition: `persist:token-balance-${provider.id}`, contextIsolation: true, nodeIntegration: false },
    })
    hiddenWebWindows.set(provider.id, window)
  }
  return window
}

async function fetchWeb(provider, previous = {}) {
  try {
    const window = await ensureHiddenWebWindow(provider)
    await window.loadURL(provider.balanceUrl)
    const data = await window.webContents.executeJavaScript(`(${extractPageData.toString()})()`, true)
    if (data.balance == null) return { ...provider, ...previous, status: 'needs_login', errorMessage: 'Open the provider session and sign in to refresh this balance.' }
    return { ...provider, ...previous, ...data, status: 'ok', updatedAt: new Date().toISOString() }
  } catch (error) {
    return { ...provider, ...previous, balance: previous.balance ?? null, status: 'needs_login', errorMessage: error.message }
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
    title: `${provider.name} session`,
    webPreferences: { partition: `persist:token-balance-${provider.id}`, contextIsolation: true, nodeIntegration: false },
  })
  await window.loadURL(url)
  window.on('closed', refreshAll)
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 900,
    minHeight: 620,
    title: 'Token Balance',
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true },
  })
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
}

ipcMain.handle('balances:get', refreshAll)
ipcMain.handle('balances:refresh', refreshAll)
ipcMain.handle('provider:open', (_, id, page) => openProviderPage(id, page))
ipcMain.handle('provider:save', async (_, input) => {
  const config = await readConfig()
  const credentials = await readCredentials()
  const existing = config.providers.find((provider) => provider.id === input.id)
  if (!existing) throw new Error('Unknown provider')
  Object.assign(existing, { manualBalance: input.manualBalance, currency: input.currency || existing.currency })
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

app.whenReady().then(async () => {
  createMainWindow()
  await refreshAll()
  setInterval(refreshAll, 5 * 60 * 1000)
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
