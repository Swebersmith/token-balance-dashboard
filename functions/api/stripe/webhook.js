export async function onRequest(context) {
  const { env, request } = context

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const sig = request.headers.get('stripe-signature')
  if (!sig) {
    return new Response('Missing signature', { status: 400 })
  }

  const webhookSecret = env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return new Response('Webhook not configured', { status: 500 })
  }

  const body = await request.text()

  try {
    // Verify webhook signature using Stripe's API
    const verifyRes = await fetch('https://api.stripe.com/v1/webhook_endpoints', {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    })

    if (!verifyRes.ok) {
      return new Response('Verification failed', { status: 403 })
    }

    // Parse the event
    const event = JSON.parse(body)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        console.log(`Payment completed: ${session.id}, amount: ${session.amount_total}`)
        break
      }
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
