export async function onRequest(context) {
  const { env, params } = context
  const providerId = params.provider

  const providerMap = {
    openai: { key: env.OPENAI_API_KEY, orgId: env.OPENAI_ORG_ID },
    anthropic: { key: env.ANTHROPIC_API_KEY },
    deepseek: { key: env.DEEPSEEK_API_KEY },
    google: { key: env.GOOGLE_AI_API_KEY },
    groq: { key: env.GROQ_API_KEY },
    openrouter: { key: env.OPENROUTER_API_KEY },
    together: { key: env.TOGETHER_API_KEY },
  }

  const config = providerMap[providerId]
  if (!config) {
    return new Response(JSON.stringify({ error: 'Unknown provider' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  if (!config.key) {
    return new Response(JSON.stringify({ provider: providerId, balance: null, status: 'unconfigured' }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Forward to the main balance fetcher for this specific provider
  const res = await fetch(new URL(`/api/balance`, context.request.url), {
    headers: context.request.headers,
  })

  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'Balance fetch failed' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const allBalances = await res.json()
  const providerBalance = allBalances.find(b => b.provider === providerId)

  return new Response(JSON.stringify(providerBalance || { provider: providerId, balance: null, status: 'not_found' }), {
    headers: { 'Content-Type': 'application/json' },
  })
}
