async function fetchOpenAI(key, orgId) {
  const headers = { Authorization: `Bearer ${key}` }
  if (orgId) headers['OpenAI-Organization'] = orgId

  const [creditRes, usageRes] = await Promise.allSettled([
    fetch('https://api.openai.com/v1/organization/credit_grants', { headers }),
    fetch('https://api.openai.com/v1/organization/costs?limit=1', { headers }),
  ])

  if (creditRes.status === 'rejected' && usageRes.status === 'rejected') {
    // Try simple models list as key validation
    const testRes = await fetch('https://api.openai.com/v1/models', { headers })
    if (!testRes.ok) throw new Error(`OpenAI 密钥验证失败 (${testRes.status})`)
    return { provider: 'openai', balance: null, currency: 'USD', status: 'configured' }
  }

  let balance = null
  if (creditRes.status === 'fulfilled' && creditRes.value.ok) {
    const data = await creditRes.value.json()
    balance = (data.total_granted || 0) - (data.total_used || 0)
  }

  return { provider: 'openai', balance, currency: 'USD', status: balance != null ? 'ok' : 'configured' }
}

async function fetchAnthropic(key) {
  const headers = { 'x-api-key': key, 'anthropic-version': '2023-06-01' }

  // Anthropic doesn't have a simple balance endpoint; validate the key instead
  const orgRes = await fetch('https://api.anthropic.com/v1/organizations', { headers })

  if (!orgRes.ok) {
    // Try a simple models list to validate key
    const modelsRes = await fetch('https://api.anthropic.com/v1/models', { headers })
    if (!modelsRes.ok) throw new Error(`Anthropic 密钥验证失败 (${modelsRes.status})`)
    return { provider: 'anthropic', balance: null, currency: 'USD', status: 'configured' }
  }

  const orgs = await orgRes.json()
  if (!orgs.data?.length) {
    return { provider: 'anthropic', balance: null, currency: 'USD', status: 'configured' }
  }

  const orgId = orgs.data[0].id
  try {
    const creditRes = await fetch(
      `https://api.anthropic.com/v1/organizations/${orgId}/billing/credits`,
      { headers }
    )
    if (creditRes.ok) {
      const credits = await creditRes.json()
      const total = (credits.data || []).reduce(
        (sum, c) => sum + (c.credit_amount || 0) - (c.used_amount || 0),
        0
      )
      return { provider: 'anthropic', balance: total, currency: 'USD', status: 'ok' }
    }
  } catch {
    // Fall through
  }

  return { provider: 'anthropic', balance: null, currency: 'USD', status: 'configured' }
}

async function fetchDeepSeek(key) {
  const res = await fetch('https://api.deepseek.com/user/balance', {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`DeepSeek API 错误 (${res.status})`)
  const data = await res.json()
  const balance = data.balance_infos?.[0]?.total_balance ?? data.balance ?? data.total_balance ?? null
  return { provider: 'deepseek', balance, currency: 'CNY', status: 'ok' }
}

async function fetchGoogleAI(key) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`
  )
  if (!res.ok) throw new Error(`Google AI 密钥验证失败 (${res.status})`)
  return { provider: 'google', balance: null, currency: 'USD', status: 'configured', note: '请前往 GCP 控制台查看余额' }
}

async function fetchGroq(key) {
  const res = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`Groq 密钥验证失败 (${res.status})`)
  return { provider: 'groq', balance: null, currency: 'USD', status: 'configured', note: '请前往 Groq Console 查看余额' }
}

async function fetchOpenRouter(key) {
  const res = await fetch('https://openrouter.ai/api/v1/credits', {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`OpenRouter API 错误 (${res.status})`)
  const data = await res.json()
  return {
    provider: 'openrouter',
    balance: data.data?.total_credits ?? data.total_credits ?? null,
    currency: 'USD',
    status: 'ok',
  }
}

async function fetchTogether(key) {
  const res = await fetch('https://api.together.xyz/v1/billing/credits', {
    headers: { Authorization: `Bearer ${key}` },
  })
  if (!res.ok) throw new Error(`Together AI API 错误 (${res.status})`)
  const data = await res.json()
  return {
    provider: 'together',
    balance: data.credit_amount ?? data.credits ?? data.balance ?? null,
    currency: 'USD',
    status: 'ok',
  }
}

const FETCHERS = {
  openai: fetchOpenAI,
  anthropic: fetchAnthropic,
  deepseek: fetchDeepSeek,
  google: fetchGoogleAI,
  groq: fetchGroq,
  openrouter: fetchOpenRouter,
  together: fetchTogether,
}

const PROVIDERS = [
  { id: 'openai', envKey: 'OPENAI_API_KEY', orgEnvKey: 'OPENAI_ORG_ID' },
  { id: 'anthropic', envKey: 'ANTHROPIC_API_KEY' },
  { id: 'deepseek', envKey: 'DEEPSEEK_API_KEY' },
  { id: 'google', envKey: 'GOOGLE_AI_API_KEY' },
  { id: 'groq', envKey: 'GROQ_API_KEY' },
  { id: 'openrouter', envKey: 'OPENROUTER_API_KEY' },
  { id: 'together', envKey: 'TOGETHER_API_KEY' },
]

export async function onRequest(context) {
  const { env } = context
  const providers = PROVIDERS
    .filter(p => env[p.envKey])
    .map(p => ({ id: p.id, key: env[p.envKey], orgId: p.orgEnvKey ? env[p.orgEnvKey] : null }))

  const results = await Promise.allSettled(
    providers.map(async (p) => {
      const fetcher = FETCHERS[p.id]
      if (!fetcher) return { provider: p.id, balance: null, status: 'unsupported' }
      try {
        return await fetcher(p.key, p.orgId)
      } catch (err) {
        return { provider: p.id, balance: null, currency: 'USD', status: 'error', errorMessage: err.message }
      }
    })
  )

  const balances = results.map((r, i) => {
    if (r.status === 'fulfilled') return r.value
    return {
      provider: providers[i].id,
      balance: null,
      currency: 'USD',
      status: 'error',
      errorMessage: r.reason?.message || '查询失败',
    }
  })

  return new Response(JSON.stringify(balances), {
    headers: { 'Content-Type': 'application/json' },
  })
}
