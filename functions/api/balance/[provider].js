import { getProviderBalance } from './_service.js'

export async function onRequestGet({ env, params }) {
  const balance = await getProviderBalance(env, params.provider)
  if (!balance) {
    return Response.json({ error: 'Unknown provider' }, { status: 404 })
  }

  return Response.json(balance, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}
