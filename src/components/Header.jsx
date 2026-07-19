import { RefreshCw, Wallet, Settings } from 'lucide-react'
import { useBalance } from '../context/BalanceContext'
import { formatTime } from '../utils/formatters'

export default function Header() {
  const { refresh, loading, lastUpdated } = useBalance()

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet className="w-7 h-7 text-indigo-600" />
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              AI 服务商余额看板
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lastUpdated ? `上次更新: ${formatTime(lastUpdated)}` : '等待首次加载...'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">后台</span>
          </a>
          <button
            onClick={refresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>
    </header>
  )
}
