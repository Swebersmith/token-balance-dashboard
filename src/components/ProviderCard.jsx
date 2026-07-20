import { ExternalLink, RefreshCw, AlertCircle, CheckCircle, HelpCircle, TrendingDown } from 'lucide-react'
import { useBalance } from '../context/BalanceContext'
import { getProvider } from '../utils/providers'
import { formatCurrency } from '../utils/formatters'

function getBalanceLevel(balance, currency) {
  if (balance == null) return null
  const usdEq = currency === 'CNY' ? balance / 7.2 : balance
  if (usdEq < 5) return { level: 'low', color: 'text-red-600', barColor: 'bg-red-500', label: '余额不足' }
  if (usdEq < 20) return { level: 'warn', color: 'text-amber-600', barColor: 'bg-amber-500', label: '余额偏低' }
  return { level: 'good', color: 'text-emerald-600', barColor: 'bg-emerald-500', label: '充足' }
}

export default function ProviderCard({ data }) {
  const { refreshProvider, loading } = useBalance()
  const provider = getProvider(data.provider) || {
    name: data.name || data.provider,
    nameZh: data.source === 'manual' ? 'Manual balance' : 'Custom API',
    color: data.color || '#6366f1',
    currency: data.currency || 'USD',
    website: data.website || '',
    rechargeUrl: data.rechargeUrl || '',
  }

  const statusIcon = {
    ok: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    configured: <HelpCircle className="w-4 h-4 text-amber-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
    unsupported: <HelpCircle className="w-4 h-4 text-amber-500" />,
    unconfigured: <HelpCircle className="w-4 h-4 text-gray-400" />,
  }

  const statusText = {
    ok: '正常',
    configured: '已配置',
    error: '错误',
    unsupported: '不支持',
    unconfigured: '未配置',
  }

  const balanceLevel = getBalanceLevel(data.balance, data.currency || provider.currency)

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
            style={{ backgroundColor: provider.color }}
          >
            {provider.name[0]}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{provider.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{provider.nameZh}</p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {statusIcon[data.status] || statusIcon.unconfigured}
          <span className="text-xs text-gray-500 dark:text-gray-400">{statusText[data.status] || data.status}</span>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-3">
        {data.status === 'ok' && data.balance != null ? (
          <>
            <div className="flex items-baseline gap-1">
              <div className={`text-2xl font-bold ${balanceLevel?.color || 'text-gray-900 dark:text-white'}`}>
                {formatCurrency(data.balance, data.currency || provider.currency)}
              </div>
              {balanceLevel?.level === 'low' && (
                <TrendingDown className="w-4 h-4 text-red-500" />
              )}
            </div>

            {/* Balance bar */}
            <div className="mt-2 w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${balanceLevel?.barColor || 'bg-emerald-500'}`}
                style={{ width: `${Math.min(balanceLevel?.level === 'low' ? 8 : balanceLevel?.level === 'warn' ? 25 : 70, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs ${balanceLevel?.color || ''}`}>
                {balanceLevel?.label}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500">可用余额</span>
            </div>
          </>
        ) : data.status === 'error' ? (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
            {data.errorMessage || '查询失败'}
          </div>
        ) : data.status === 'configured' || data.status === 'unsupported' ? (
          <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
            {data.note || '请前往官网查看余额'}
          </div>
        ) : (
          <div className="text-sm text-gray-500 py-2">--</div>
        )}
      </div>

      {data.models?.length > 0 && (
        <div className="mb-3 border-t border-gray-100 pt-2 text-xs dark:border-gray-700">
          <div className="mb-1 text-gray-500 dark:text-gray-400">模型定价</div>
          <div className="space-y-1">
            {data.models.slice(0, 3).map((model) => (
              <div key={`${model.name}-${model.price}`} className="flex justify-between gap-2 text-gray-600 dark:text-gray-300">
                <span className="truncate">{model.name}</span>
                <span className="shrink-0 text-gray-500 dark:text-gray-400">{model.price}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => refreshProvider(data.provider)}
          disabled={loading}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          刷新
        </button>
        {provider.website && (
          <a
            href={provider.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ml-auto"
          >
            <ExternalLink className="w-3 h-3" />
            官网
          </a>
        )}
        {provider.rechargeUrl && (
          <a
            href={provider.rechargeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            充值
          </a>
        )}
      </div>
    </div>
  )
}
