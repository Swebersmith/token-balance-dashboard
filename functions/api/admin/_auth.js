const encoder = new TextEncoder()
const decoder = new TextDecoder()
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12
const PASSWORD_ITERATIONS = 100000

function toBase64Url(bytes) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64Url(value) {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4)
  const binary = atob(padded)
  return Uint8Array.from(binary, (char) => char.charCodeAt(0))
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false
  let result = 0
  for (let index = 0; index < left.length; index += 1) result |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return result === 0
}

async function derivePassword(password, salt, iterations = PASSWORD_ITERATIONS) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    key,
    256
  )
  return new Uint8Array(bits)
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  return toBase64Url(new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value))))
}

function getCookie(request, name) {
  const prefix = `${name}=`
  return (request.headers.get('Cookie') || '')
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix))
    ?.slice(prefix.length)
}

export function jsonError(message, status = 400) {
  return Response.json({ error: message }, { status })
}

export async function readJson(request) {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function createPasswordHash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derivePassword(password, salt)
  return `pbkdf2$${PASSWORD_ITERATIONS}$${toBase64Url(salt)}$${toBase64Url(hash)}`
}

export async function verifyPassword(password, storedHash) {
  const [algorithm, iterationValue, saltValue, hashValue] = (storedHash || '').split('$')
  if (algorithm !== 'pbkdf2' || !saltValue || !hashValue) return false
  const iterations = Number(iterationValue)
  if (!Number.isInteger(iterations) || iterations < 100000) return false

  const calculated = await derivePassword(password, fromBase64Url(saltValue), iterations)
  return constantTimeEqual(toBase64Url(calculated), hashValue)
}

export async function getAdminPasswordHash(env) {
  const stored = env.BALANCE_SETTINGS ? await env.BALANCE_SETTINGS.get('admin:passwordHash') : null
  return stored || env.ADMIN_PASSWORD_HASH || null
}

async function getSessionSecret(env) {
  const stored = env.BALANCE_SETTINGS ? await env.BALANCE_SETTINGS.get('admin:sessionSecret') : null
  return stored || env.ADMIN_SESSION_SECRET || null
}

export async function requireAdmin(context) {
  const { request, env } = context
  const secret = await getSessionSecret(env)
  const token = getCookie(request, 'admin_session')
  if (!secret || !token) return false

  const [payload, signature] = token.split('.')
  if (!payload || !signature || !constantTimeEqual(await sign(payload, secret), signature)) return false

  try {
    const session = JSON.parse(decoder.decode(fromBase64Url(payload)))
    return Number.isFinite(session.expiresAt) && session.expiresAt > Date.now()
  } catch {
    return false
  }
}

export async function createSessionCookie(request, env) {
  const secret = await getSessionSecret(env)
  if (!secret) throw new Error('Admin session secret is missing')
  const payload = toBase64Url(encoder.encode(JSON.stringify({ expiresAt: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 })))
  const token = `${payload}.${await sign(payload, secret)}`
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`
}

export function clearSessionCookie(request) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : ''
  return `admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`
}
