import { useBalance } from '../context/BalanceContext'
import { useRefreshTimer } from '../hooks/useRefreshTimer'
import Layout from '../components/Layout'
import BalanceOverview from '../components/BalanceOverview'
import ProviderGrid from '../components/ProviderGrid'
import PaymentPanel from '../components/PaymentPanel'
import PricingPanel from '../components/PricingPanel'
import { Info } from 'lucide-react'

export function Dashboard() {
  const { balances, loading, error, demoMode } = useBalance()
  useRefreshTimer()

  return (
    <Layout>
      {demoMode && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-900/30 rounded-xl p-3 sm:p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
              演示模式
            </p>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
              当前显示的是示例数据。在 Cloudflare Dashboard 中配置 API 密钥后将显示真实余额。
            </p>
          </div>
        </div>
      )}

      <BalanceOverview />

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 rounded-xl p-4 text-sm text-red-700 dark:text-red-400">
          连接失败: {error}（已切换到演示模式）
        </div>
      )}

      <section>
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
          服务商余额
          {loading && (
            <span className="ml-2 text-xs text-gray-500 font-normal">刷新中...</span>
          )}
        </h2>
        <ProviderGrid balances={balances} loading={loading} />
      </section>

      <section>
        <PaymentPanel />
      </section>

      <section>
        <PricingPanel />
      </section>
    </Layout>
  )
}
