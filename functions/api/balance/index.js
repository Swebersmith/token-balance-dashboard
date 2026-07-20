import { configuredProviderIds, getProviderBalance } from './_service.js'

export async function onRequestGet({ env }) {
  const providerIds = await configuredProviderIds(env)
  const balances = await Promise.all(providerIds.map((provider) => getProviderBalance(env, provider)))

  return Response.json(balances, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
