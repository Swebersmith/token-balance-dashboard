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
  return providers.filter(Boolean)
}

export async function getProviderBalance(env, provider) {
  const config = PROVIDERS[provider]
  if (!config) return null

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
