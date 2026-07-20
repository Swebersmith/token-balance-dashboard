import { jsonError, requireAdmin, readJson } from './_auth.js'
import { getProviderConfiguration, getProviderSettings, isKnownProvider, saveProviderKey } from '../balance/_service.js'

function storageUnavailable(env) {
  return !env.BALANCE_SETTINGS ? jsonError('Configuration storage is not available', 503) : null
}

export async function onRequestGet(context) {
  if (!await requireAdmin(context)) return jsonError('Unauthorized', 401)
  const unavailable = storageUnavailable(context.env)
  if (unavailable) return unavailable
  return Response.json({ providers: await getProviderSettings(context.env) }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function onRequestPost(context) {
  if (!await requireAdmin(context)) return jsonError('Unauthorized', 401)
  const unavailable = storageUnavailable(context.env)
  if (unavailable) return unavailable

  const body = await readJson(context.request)
  const provider = typeof body?.provider === 'string' ? body.provider : ''
  const apiKey = typeof body?.apiKey === 'string' ? body.apiKey.trim() : ''
  if (!isKnownProvider(provider)) return jsonError('Unknown provider', 404)
  if (apiKey.length > 1024) return jsonError('API key is too long')

  await saveProviderKey(context.env, provider, apiKey)
  return Response.json({ provider, ...await getProviderConfiguration(context.env, provider) })
}
