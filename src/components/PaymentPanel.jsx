import { useState } from 'react'
import StripeCheckout from './StripeCheckout'
import AlipayWechatInfo from './AlipayWechatInfo'

export default function PaymentPanel() {
  const [tab, setTab] = useState('stripe')

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">充值中心</h2>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
        <button
          onClick={() => setTab('stripe')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
            tab === 'stripe'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          国际信用卡
        </button>
        <button
          onClick={() => setTab('alipay')}
          className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
            tab === 'alipay'
              ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          支付宝 / 微信
        </button>
      </div>

      {tab === 'stripe' ? <StripeCheckout /> : <AlipayWechatInfo />}
    </div>
  )
}
