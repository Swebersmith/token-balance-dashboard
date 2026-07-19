import { DollarSign, CheckCircle, AlertCircle, Database } from 'lucide-react'
import { useBalance } from '../context/BalanceContext'
import { formatCurrency } from '../utils/formatters'

export default function BalanceOverview() {
  const { balances } = useBalance()

  const totalBalance = balances.reduce((sum, b) => {
    if (b.balance != null) return sum + (b.currency === 'CNY' ? b.balance / 7.2 : b.balance)
    return sum
  }, 0)

  const okCount = balances.filter((b) => b.status === 'ok').length
  const configuredCount = balances.filter((b) => b.status === 'configured').length
  const errorCount = balances.filter((b) => b.status === 'error').length

  const cards = [
    { label: '预估总余额', value: `≈ ${formatCurrency(totalBalance, 'USD')}`, icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20' },
    { label: '正常连接', value: `${okCount} 个服务商`, icon: CheckCircle, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
    { label: '已配置', value: `${configuredCount} 个服务商`, icon: Database, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
    { label: '异常', value: `${errorCount} 个服务商`, icon: AlertCircle, color: errorCount > 0 ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : 'text-gray-400 bg-gray-50 dark:bg-gray-800' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className={`inline-flex p-2 rounded-lg ${c.color} mb-2`}>
            <c.icon className="w-4 h-4" />
          </div>
          <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{c.value}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{c.label}</div>
        </div>
      ))}
    </div>
  )
}
