import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { createStripeCheckout } from '../utils/api'
import { STRIPE_AMOUNTS } from '../utils/formatters'

export default function StripeCheckout() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCheckout = async (amount) => {
    setLoading(true)
    setError(null)
    try {
      const amountInCents = amount * 100
      const { url } = await createStripeCheckout(amountInCents, 'cny')
      if (url) window.location.href = url
      else setError('未获取到支付链接')
    } catch (err) {
      setError(err.message || '支付请求失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="w-5 h-5 text-indigo-600" />
        <h3 className="font-semibold text-gray-900 dark:text-white">国际信用卡支付</h3>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2">
        {STRIPE_AMOUNTS.map((amount) => (
          <button
            key={amount}
            onClick={() => handleCheckout(amount)}
            disabled={loading}
            className="py-3 px-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg transition-colors text-sm cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
            ¥{amount}
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        通过 Stripe 安全支付，支持 Visa/Mastercard 等国际信用卡
      </p>
    </div>
  )
}
