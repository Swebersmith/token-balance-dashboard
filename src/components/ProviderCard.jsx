import { ExternalLink, RefreshCw, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react'
import { useBalance } from '../context/BalanceContext'
import { getProvider } from '../utils/providers'
import { formatCurrency } from '../utils/formatters'

export default function ProviderCard({ data }) {
  const { refreshProvider, loading } = useBalance()
  const provider = getProvider(data.provider)
  if (!provider) return null

  const statusIcon = {
    ok: <CheckCircle className="w-4 h-4 text-emerald-500" />,
    configured: <HelpCircle className="w-4 h-4 text-amber-500" />,
    error: <AlertCircle className="w-4 h-4 text-red-500" />,
    unconfigured: <HelpCircle className="w-4 h-4 text-gray-400" />,
  }

  const statusText = {
    ok: '正常',
    configured: '已配置',
    error: '错误',
    unconfigured: '未配置',
  }

  return (
    <div
      className="relative bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow"
      style={{ borderTopColor: data.status === 'ok' ? provider.color : undefined, borderTopWidth: data.status === 'ok' ? '3px' : undefined }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: provider.color }}
          >
            {provider.name[0]}
          </div>
          <div>
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{provider.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{provider.nameZh}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {statusIcon[data.status] || statusIcon.unconfigured}
          <span className="text-xs text-gray-500 dark:text-gray-400">{statusText[data.status] || data.status}</span>
        </div>
      </div>

      {/* Balance */}
      <div className="mb-3">
        {data.status === 'ok' && data.balance != null ? (
          <>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(data.balance, data.currency || provider.currency)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">可用余额</div>
          </>
        ) : data.status === 'error' ? (
          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
            {data.errorMessage || '查询失败'}
          </div>
        ) : data.status === 'configured' ? (
          <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-2">
            {data.note || '请前往官网查看余额'}
          </div>
        ) : (
          <div className="text-sm text-gray-500">--</div>
        )}
      </div>

      {/* Loading skeleton state handled by parent already */}

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
        <a
          href={provider.website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors ml-auto"
        >
          <ExternalLink className="w-3 h-3" />
          官网
        </a>
      </div>
    </div>
  )
}
