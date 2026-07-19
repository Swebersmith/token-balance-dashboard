const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
}

export async function onRequest(context) {
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { headers: CORS })
  }
  const res = await context.next()
  const modified = new Response(res.body, res)
  for (const [k, v] of Object.entries(CORS)) {
    modified.headers.set(k, v)
  }
  return modified
}
