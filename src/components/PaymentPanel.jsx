import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import StripeCheckout from './StripeCheckout'
import AlipayWechatInfo from './AlipayWechatInfo'
import { PROVIDERS } from '../utils/providers'

function OfficialRecharge() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
        直接跳转到各服务商官方充值页面，使用服务商支持的方式支付
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {Object.values(PROVIDERS).map((p) => (
          <a
            key={p.id}
            href={p.rechargeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-all group"
          >
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
              style={{ backgroundColor: p.color }}
            >
              {p.name[0]}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">官方充值入口</div>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 shrink-0" />
          </a>
        ))}
      </div>
    </div>
  )
}

export default function PaymentPanel() {
  const [tab, setTab] = useState('official')

  const tabs = [
    { id: 'official', label: '官方充值' },
    { id: 'stripe', label: '国际信用卡' },
    { id: 'alipay', label: '支付宝 / 微信' },
  ]

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">充值中心</h2>

      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              tab === t.id
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'official' && <OfficialRecharge />}
      {tab === 'stripe' && <StripeCheckout />}
      {tab === 'alipay' && <AlipayWechatInfo />}
    </div>
  )
}
