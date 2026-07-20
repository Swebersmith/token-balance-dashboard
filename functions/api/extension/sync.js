import { jsonError, readJson, verifyExtensionToken } from '../admin/_auth.js'
import { syncExtensionProvider } from '../balance/_service.js'

export async function onRequestPost(context) {
  if (!await verifyExtensionToken(context.request, context.env)) return jsonError('Unauthorized', 401)
  try {
    return Response.json(await syncExtensionProvider(context.env, await readJson(context.request)))
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : 'Unable to sync provider balance')
  }
}
