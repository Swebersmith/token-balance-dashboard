export function formatCurrency(amount, currency = 'USD') {
  if (amount == null || isNaN(amount)) return '--'
  const locale = currency === 'CNY' ? 'zh-CN' : 'en-US'
  const opts = {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }
  try {
    return new Intl.NumberFormat(locale, opts).format(amount)
  } catch {
    return `${currency} ${amount.toFixed(2)}`
  }
}

export function formatTime(date) {
  if (!date) return '--'
  const now = new Date()
  const diff = now - date
  if (diff < 60_000) return '刚刚'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

export const STRIPE_AMOUNTS = [50, 100, 200, 500]
