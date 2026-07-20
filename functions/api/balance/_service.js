export const PROVIDERS = {
  openai: { envKey: 'OPENAI_API_KEY', currency: 'USD' },
  anthropic: { envKey: 'ANTHROPIC_API_KEY', currency: 'USD' },
  deepseek: { envKey: 'DEEPSEEK_API_KEY', currency: 'CNY' },
  google: { envKey: 'GOOGLE_AI_API_KEY', currency: 'USD' },
  groq: { envKey: 'GROQ_API_KEY', currency: 'USD' },
  openrouter: { envKey: 'OPENROUTER_API_KEY', currency: 'USD' },
  together: { envKey: 'TOGETHER_API_KEY', currency: 'USD' },
}

function jsonResponse(message, status) {
  return new Error(`${message} (${status})`)
}

function asAmount(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? amount : null
}

async function fetchJson(url, options, provider) {
  const response = await fetch(url, options)
  if (!response.ok) throw jsonResponse(`${provider} API request failed`, response.status)
  return response.json()
}

async function fetchOpenAI(key, orgId) {
  const headers = { Authorization: `Bearer ${key}` }
  if (orgId) headers['OpenAI-Organization'] = orgId

  const data = await fetchJson(
    'https://api.openai.com/v1/organization/credit_grants',
    { headers },
    'OpenAI'
  )
  const totalGranted = asAmount(data.total_granted)
  const totalUsed = asAmount(data.total_used)
  const balance = asAmount(data.total_available) ?? (
    totalGranted != null && totalUsed != null ? totalGranted - totalUsed : null
  )
  if (balance == null) throw new Error('OpenAI returned no readable credit balance')
  return { provider: 'openai', balance, currency: 'USD', status: 'ok' }
}

async function fetchAnthropic(key) {
  // Billing credits require an Admin API key; a standard API key cannot read them.
  const headers = {
    'x-api-key': key,
    'anthropic-version': '2023-06-01',
  }
  const organizations = await fetchJson('https://api.anthropic.com/v1/organizations', { headers }, 'Anthropic')
  const organization = organizations.data?.[0]
  if (!organization?.id) throw new Error('Anthropic returned no organization')

  const data = await fetchJson(
    `https://api.anthropic.com/v1/organizations/${organization.id}/billing/credits`,
    { headers },
    'Anthropic'
  )
  const balance = (data.data || []).reduce((total, credit) => {
    const granted = asAmount(credit.credit_amount)
    const used = asAmount(credit.used_amount)
    return granted != null && used != null ? total + granted - used : total
  }, 0)
  return { provider: 'anthropic', balance, currency: 'USD', status: 'ok' }
}

async function fetchDeepSeek(key) {
  const data = await fetchJson(
    'https://api.deepseek.com/user/balance',
    { headers: { Authorization: `Bearer ${key}` } },
    'DeepSeek'
  )
  const balanceInfo = data.balance_infos?.find((item) => item.currency === 'CNY') || data.balance_infos?.[0]
  const balance = asAmount(balanceInfo?.total_balance ?? data.balance ?? data.total_balance)
  if (balance == null) throw new Error('DeepSeek returned no readable balance')
  return { provider: 'deepseek', balance, currency: balanceInfo?.currency || 'CNY', status: 'ok' }
}

async function fetchOpenRouter(key) {
  const data = await fetchJson(
    'https://openrouter.ai/api/v1/credits',
    { headers: { Authorization: `Bearer ${key}` } },
    'OpenRouter'
  )
  const credits = data.data || data
  const total = asAmount(credits.total_credits)
  const used = asAmount(credits.total_usage)
  const balance = total != null && used != null ? total - used : null
  if (balance == null) throw new Error('OpenRouter returned no readable credit balance')
  return { provider: 'openrouter', balance, currency: 'USD', status: 'ok' }
}

async function fetchTogether(key) {
  const data = await fetchJson(
    'https://api.together.xyz/v1/billing/credits',
    { headers: { Authorization: `Bearer ${key}` } },
    'Together AI'
  )
  const balance = asAmount(data.credit_amount ?? data.credits ?? data.balance)
  if (balance == null) throw new Error('Together AI returned no readable credit balance')
  return { provider: 'together', balance, currency: 'USD', status: 'ok' }
}

const FETCHERS = {
  openai: fetchOpenAI,
  anthropic: fetchAnthropic,
  deepseek: fetchDeepSeek,
  openrouter: fetchOpenRouter,
  together: fetchTogether,
}

const UNSUPPORTED = {
  google: 'Google AI does not expose a balance endpoint for API keys.',
  groq: 'Groq does not expose a balance endpoint for API keys.',
}

const CUSTOM_PROVIDER_PREFIX = 'custom-provider:'

function asCustomProvider(record) {
  if (!record?.id || !record?.name || !['api', 'manual'].includes(record.mode)) return null
  return record
}

function customProviderResponse(provider, balance, status, extra = {}) {
  return {
    provider: provider.id,
    name: provider.name,
    color: provider.color || '#6366f1',
    website: provider.website || '',
    rechargeUrl: provider.rechargeUrl || '',
    pricingUrl: provider.pricingUrl || '',
    models: provider.models || [],
    balance,
    currency: provider.currency || 'USD',
    status,
    ...extra,
  }
}

function readJsonPath(value, path) {
  if (!/^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*$/.test(path || '')) return null
  return path.split('.').reduce((current, segment) => current?.[segment], value)
}

function isSafeRemoteUrl(value) {
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase()
    if (url.protocol !== 'https:' || host === 'localhost' || host.endsWith('.local')) return false
    if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) return false
    return true
  } catch {
    return false
  }
}

async function listCustomProviders(env) {
  if (!env.BALANCE_SETTINGS) return []
  const keys = await env.BALANCE_SETTINGS.list({ prefix: CUSTOM_PROVIDER_PREFIX })
  const records = await Promise.all(keys.keys.map((key) => env.BALANCE_SETTINGS.get(key.name, { type: 'json' })))
  return records.map(asCustomProvider).filter(Boolean)
}

async function getCustomProvider(env, id) {
  if (!env.BALANCE_SETTINGS || !id.startsWith('custom-')) return null
  return asCustomProvider(await env.BALANCE_SETTINGS.get(`${CUSTOM_PROVIDER_PREFIX}${id}`, { type: 'json' }))
}

async function getCustomProviderBalance(provider) {
  if (provider.mode === 'manual') {
    const balance = asAmount(provider.manualBalance)
    if (balance == null) return customProviderResponse(provider, null, 'error', { errorMessage: 'Manual balance is missing' })
    return customProviderResponse(provider, balance, 'ok', { source: provider.source || 'manual' })
  }

  if (!provider.apiKey) return customProviderResponse(provider, null, 'unconfigured')
  if (!isSafeRemoteUrl(provider.endpoint)) {
    return customProviderResponse(provider, null, 'error', { errorMessage: 'Custom balance URL must use public HTTPS' })
  }

  const headers = provider.authType === 'x-api-key'
    ? { 'X-API-Key': provider.apiKey }
    : { Authorization: `Bearer ${provider.apiKey}` }
  try {
    const data = await fetchJson(provider.endpoint, { headers }, provider.name)
    const balance = asAmount(readJsonPath(data, provider.jsonPath))
    if (balance == null) throw new Error(`No numeric value at ${provider.jsonPath}`)
    return customProviderResponse(provider, balance, 'ok', { source: 'api' })
  } catch (error) {
    return customProviderResponse(provider, null, 'error', {
      errorMessage: error instanceof Error ? error.message : 'Custom balance request failed',
    })
  }
}

export async function getCustomProviderSettings(env) {
  const providers = await listCustomProviders(env)
  return providers.map(({ apiKey, ...provider }) => ({ ...provider, configured: provider.mode === 'manual' || Boolean(apiKey) }))
}

export async function saveCustomProvider(env, input) {
  if (!env.BALANCE_SETTINGS) throw new Error('Configuration storage is not available')
  const name = typeof input?.name === 'string' ? input.name.trim() : ''
  const slug = typeof input?.id === 'string' ? input.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') : ''
  const id = slug.startsWith('custom-') ? slug : `custom-${slug}`
  const mode = input?.mode
  const currency = input?.currency === 'CNY' ? 'CNY' : 'USD'
  if (!name || name.length > 80 || !/^custom-[a-z0-9-]{1,60}$/.test(id) || !['api', 'manual'].includes(mode)) {
    throw new Error('Invalid custom provider configuration')
  }

  const existing = await getCustomProvider(env, id)
  const provider = {
    id,
    name,
    mode,
    currency,
    color: typeof input?.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(input.color) ? input.color : '#6366f1',
    website: typeof input?.website === 'string' ? input.website.slice(0, 300) : '',
    updatedAt: new Date().toISOString(),
  }

  if (mode === 'manual') {
    const manualBalance = asAmount(input?.manualBalance)
    if (manualBalance == null) throw new Error('Manual balance must be a number')
    provider.manualBalance = manualBalance
  } else {
    const endpoint = typeof input?.endpoint === 'string' ? input.endpoint.trim() : ''
    const jsonPath = typeof input?.jsonPath === 'string' ? input.jsonPath.trim() : ''
    const apiKey = typeof input?.apiKey === 'string' ? input.apiKey.trim() : existing?.apiKey
    if (!isSafeRemoteUrl(endpoint) || !/^[A-Za-z0-9_]+(?:\.[A-Za-z0-9_]+)*$/.test(jsonPath) || !apiKey || apiKey.length > 1024) {
      throw new Error('Invalid API balance configuration')
    }
    provider.endpoint = endpoint
    provider.jsonPath = jsonPath
    provider.authType = input?.authType === 'x-api-key' ? 'x-api-key' : 'bearer'
    provider.apiKey = apiKey
  }

  await env.BALANCE_SETTINGS.put(`${CUSTOM_PROVIDER_PREFIX}${id}`, JSON.stringify(provider))
  const { apiKey, ...publicProvider } = provider
  return { ...publicProvider, configured: mode === 'manual' || Boolean(apiKey) }
}

export async function deleteCustomProvider(env, id) {
  if (!env.BALANCE_SETTINGS || !id.startsWith('custom-')) throw new Error('Unknown custom provider')
  await env.BALANCE_SETTINGS.delete(`${CUSTOM_PROVIDER_PREFIX}${id}`)
}

export async function syncExtensionProvider(env, input) {
  if (!env.BALANCE_SETTINGS) throw new Error('Configuration storage is not available')
  const rawId = typeof input?.provider === 'string' ? input.provider.toLowerCase().replace(/[^a-z0-9-]/g, '-') : ''
  const presets = {
    'right-code': { name: 'Right Code', website: 'https://right.codes/', rechargeUrl: 'https://right.codes/subscribe', pricingUrl: 'https://right.codes/models' },
    runapi: { name: 'RunAPI', website: 'https://runapi.co/', rechargeUrl: 'https://runapi.co/console/topup', pricingUrl: 'https://runapi.co/pricing' },
  }
  const preset = presets[rawId]
  if (!preset) throw new Error('Unsupported extension provider')

  const id = `custom-${rawId}`
  const existing = await getCustomProvider(env, id)
  const balance = input?.balance == null ? existing?.manualBalance : asAmount(input.balance)
  if (balance == null) throw new Error('No readable balance was detected')
  const currency = input?.currency === 'CNY' ? 'CNY' : input?.currency === 'USD' ? 'USD' : existing?.currency || 'USD'
  const models = Array.isArray(input?.models)
    ? input.models.slice(0, 30).map((model) => ({
      name: typeof model?.name === 'string' ? model.name.slice(0, 100) : '',
      price: typeof model?.price === 'string' ? model.price.slice(0, 160) : '',
    })).filter((model) => model.name && model.price)
    : existing?.models || []
  const provider = {
    ...preset,
    id,
    mode: 'manual',
    source: 'extension',
    currency,
    color: rawId === 'right-code' ? '#0f766e' : '#2563eb',
    manualBalance: balance,
    models,
    updatedAt: new Date().toISOString(),
  }
  await env.BALANCE_SETTINGS.put(`${CUSTOM_PROVIDER_PREFIX}${id}`, JSON.stringify(provider))
  return customProviderResponse(provider, balance, 'ok', { source: 'extension' })
}

export function isKnownProvider(provider) {
  return Boolean(PROVIDERS[provider])
}

async function getProviderKey(env, provider) {
  const config = PROVIDERS[provider]
  if (!config) return null
  const stored = env.BALANCE_SETTINGS
    ? await env.BALANCE_SETTINGS.get(`provider:${provider}`, { type: 'json' })
    : null
  return stored?.apiKey || env[config.envKey] || null
}

export async function getProviderConfiguration(env, provider) {
  const config = PROVIDERS[provider]
  if (!config) return null
  return { envKey: config.envKey, configured: Boolean(await getProviderKey(env, provider)) }
}

export async function getProviderSettings(env) {
  const entries = await Promise.all(Object.keys(PROVIDERS).map(async (provider) => [
    provider,
    await getProviderConfiguration(env, provider),
  ]))
  return Object.fromEntries(entries)
}

export async function saveProviderKey(env, provider, apiKey) {
  if (!env.BALANCE_SETTINGS || !isKnownProvider(provider)) throw new Error('Configuration storage is not available')
  const storageKey = `provider:${provider}`
  if (!apiKey) {
    await env.BALANCE_SETTINGS.delete(storageKey)
    return
  }
  await env.BALANCE_SETTINGS.put(storageKey, JSON.stringify({ apiKey, updatedAt: new Date().toISOString() }))
}

export async function configuredProviderIds(env) {
  const providers = await Promise.all(Object.keys(PROVIDERS).map(async (provider) => (
    await getProviderKey(env, provider) ? provider : null
  )))
  const customProviders = await listCustomProviders(env)
  return [...providers.filter(Boolean), ...customProviders.map((provider) => provider.id)]
}

export async function getProviderBalance(env, provider) {
  const config = PROVIDERS[provider]
  if (!config) {
    const customProvider = await getCustomProvider(env, provider)
    return customProvider ? getCustomProviderBalance(customProvider) : null
  }

  const key = await getProviderKey(env, provider)
  if (!key) {
    return { provider, balance: null, currency: config.currency, status: 'unconfigured' }
  }

  if (UNSUPPORTED[provider]) {
    return {
      provider,
      balance: null,
      currency: config.currency,
      status: 'unsupported',
      note: UNSUPPORTED[provider],
    }
  }

  try {
    return await FETCHERS[provider](key, env.OPENAI_ORG_ID)
  } catch (error) {
    return {
      provider,
      balance: null,
      currency: config.currency,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Balance request failed',
    }
  }
}
