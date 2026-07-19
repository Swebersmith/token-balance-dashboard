import ProviderCard from './ProviderCard'
import ProviderCardSkeleton from './ProviderCardSkeleton'

export default function ProviderGrid({ balances, loading }) {
  if (loading && balances.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProviderCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (!balances.length) {
    return (
      <div className="text-center py-16 text-gray-500 dark:text-gray-400">
        <p className="text-lg mb-2">未配置任何服务商</p>
        <p className="text-sm">请在 Cloudflare 环境变量中设置 API 密钥</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {balances.map((b) => (
        <ProviderCard key={b.provider} data={b} />
      ))}
    </div>
  )
}
