export async function onRequest(context) {
  const { env, request } = context

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const stripeKey = env.STRIPE_SECRET_KEY
  if (!stripeKey) {
    return new Response(JSON.stringify({ error: 'Stripe not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { amount, currency = 'cny' } = body
  if (!amount || amount < 1) {
    return new Response(JSON.stringify({ error: 'Invalid amount' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const siteUrl = env.SITE_URL || new URL(request.url).origin

  try {
    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'line_items[0][price_data][currency]': currency,
        'line_items[0][price_data][product_data][name]': 'AI 服务商账户充值',
        'line_items[0][price_data][unit_amount]': String(amount),
        'line_items[0][quantity]': '1',
        mode: 'payment',
        success_url: `${siteUrl}?payment=success`,
        cancel_url: `${siteUrl}?payment=cancel`,
      }),
    })

    if (!stripeRes.ok) {
      const err = await stripeRes.text()
      throw new Error(`Stripe error: ${err}`)
    }

    const session = await stripeRes.json()
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
