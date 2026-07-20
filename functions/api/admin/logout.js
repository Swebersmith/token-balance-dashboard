import { clearSessionCookie } from './_auth.js'

export async function onRequestPost(context) {
  return Response.json({ ok: true }, {
    headers: { 'Set-Cookie': clearSessionCookie(context.request) },
  })
}
