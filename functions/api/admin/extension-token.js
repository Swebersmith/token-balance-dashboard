import { createExtensionToken, hasExtensionToken, jsonError, requireAdmin, revokeExtensionToken, readJson } from './_auth.js'

export async function onRequestGet(context) {
  if (!await requireAdmin(context)) return jsonError('Unauthorized', 401)
  return Response.json({ configured: await hasExtensionToken(context.env) }, { headers: { 'Cache-Control': 'no-store' } })
}

export async function onRequestPost(context) {
  if (!await requireAdmin(context)) return jsonError('Unauthorized', 401)
  const body = await readJson(context.request)
  if (body?.action === 'revoke') {
    await revokeExtensionToken(context.env)
    return Response.json({ configured: false })
  }
  try {
    return Response.json({ token: await createExtensionToken(context.env), configured: true })
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to create extension token', 503)
  }
}
