import { createSessionCookie, getAdminPasswordHash, jsonError, readJson, verifyPassword } from './_auth.js'

export async function onRequestPost(context) {
  const body = await readJson(context.request)
  const password = typeof body?.password === 'string' ? body.password : ''
  const passwordHash = await getAdminPasswordHash(context.env)
  if (!passwordHash) return jsonError('Admin authentication is not configured', 503)
  if (!await verifyPassword(password, passwordHash)) return jsonError('Invalid password', 401)

  return Response.json({ ok: true }, {
    headers: { 'Set-Cookie': await createSessionCookie(context.request, context.env) },
  })
}
