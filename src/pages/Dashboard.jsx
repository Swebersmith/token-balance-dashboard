import { useBalance } from '../context/BalanceContext'
import { useRefreshTimer } from '../hooks/useRefreshTimer'
import Layout from '../components/Layout'
import BalanceOverview from '../components/BalanceOverview'
import ProviderGrid from '../components/ProviderGrid'
import PaymentPanel from '../components/PaymentPanel'
import PricingPanel from '../components/PricingPanel'

export function Dashboard() {
  const { balances, loading, error } = useBalance()
  useRefreshTimer()

  return (
    <Layout>
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
