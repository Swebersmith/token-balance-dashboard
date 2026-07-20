import { createPasswordHash, getAdminPasswordHash, jsonError, requireAdmin, readJson, verifyPassword } from './_auth.js'

export async function onRequestPost(context) {
  if (!await requireAdmin(context)) return jsonError('Unauthorized', 401)
  if (!context.env.BALANCE_SETTINGS) return jsonError('Configuration storage is not available', 503)

  const body = await readJson(context.request)
  const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : ''
  const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : ''
  if (newPassword.length < 12) return jsonError('New password must be at least 12 characters long')
  if (!await verifyPassword(currentPassword, await getAdminPasswordHash(context.env))) {
    return jsonError('Current password is incorrect', 401)
  }

  await context.env.BALANCE_SETTINGS.put('admin:passwordHash', await createPasswordHash(newPassword))
  return Response.json({ ok: true })
}
