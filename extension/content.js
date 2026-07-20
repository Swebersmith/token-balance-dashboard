const PROVIDERS = {
  'right.codes': {
    provider: 'right-code',
    website: 'https://right.codes/',
    rechargeUrl: 'https://right.codes/subscribe',
    pricingUrl: 'https://right.codes/models',
  },
  'runapi.co': {
    provider: 'runapi',
    website: 'https://runapi.co/',
    rechargeUrl: 'https://runapi.co/console/topup',
    pricingUrl: 'https://runapi.co/pricing',
  },
}

function detectBalance(text) {
  const match = text.match(/(?:账户)?余额\s*[:：]?\s*([￥¥$])?\s*([\d,]+(?:\.\d+)?)/i)
  if (!match) return null
  const balance = Number(match[2].replaceAll(',', ''))
  if (!Number.isFinite(balance)) return null
  return { balance, currency: match[1] === '￥' || match[1] === '¥' ? 'CNY' : 'USD' }
}

function detectModels() {
  return Array.from(document.querySelectorAll('table tr')).slice(1, 31).map((row) => {
    const values = row.innerText.split('\n').map((value) => value.trim()).filter(Boolean)
    return values.length >= 2 ? { name: values[0], price: values.slice(1).join(' ') } : null
  }).filter(Boolean)
}

let lastSignature = ''
let timer
function report() {
  const config = PROVIDERS[location.hostname]
  if (!config) return
  const balance = detectBalance(document.body.innerText)
  const models = detectModels()
  if (!balance && models.length === 0) return
  const payload = { ...config, ...(balance || {}), models }
  const signature = JSON.stringify(payload)
  if (signature === lastSignature) return
  lastSignature = signature
  chrome.runtime.sendMessage({ type: 'balanceDetected', payload })
}

function scheduleReport() {
  clearTimeout(timer)
  timer = setTimeout(report, 1200)
}

new MutationObserver(scheduleReport).observe(document.documentElement, { childList: true, subtree: true, characterData: true })
scheduleReport()
