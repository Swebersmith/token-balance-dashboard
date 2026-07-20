import { deleteCustomProvider, getCustomProviderSettings, saveCustomProvider } from '../balance/_service.js'
import { jsonError, requireAdmin, readJson } from './_auth.js'

function storageUnavailable(env) {
  return !env.BALANCE_SETTINGS ? jsonError('Configuration storage is not available', 503) : null
}

export async function onRequestGet(context) {
  if (!await requireAdmin(context)) return jsonError('Unauthorized', 401)
  const unavailable = storageUnavailable(context.env)
  if (unavailable) return unavailable
  return Response.json({ providers: await getCustomProviderSettings(context.env) }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function onRequestPost(context) {
  if (!await requireAdmin(context)) return jsonError('Unauthorized', 401)
  const unavailable = storageUnavailable(context.env)
  if (unavailable) return unavailable
  try {
    return Response.json(await saveCustomProvider(context.env, await readJson(context.request)))
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to save custom provider')
  }
}

export async function onRequestDelete(context) {
  if (!await requireAdmin(context)) return jsonError('Unauthorized', 401)
  const unavailable = storageUnavailable(context.env)
  if (unavailable) return unavailable
  const body = await readJson(context.request)
  try {
    await deleteCustomProvider(context.env, body?.id || '')
    return Response.json({ ok: true })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to delete custom provider', 404)
  }
}
