const state = { providers: [] }
const providerGrid = document.getElementById('providers')
const summary = document.getElementById('summary')
const updated = document.getElementById('updated')
const dialog = document.getElementById('editor')
const manager = document.getElementById('manager')
const editorForm = document.getElementById('editorForm')
const editorFields = document.getElementById('editorFields')
const managerList = document.getElementById('managerList')
let editTarget = null
let editorMode = 'manual'

const text = {
  estimatedTotal: '\u4f30\u7b97\u603b\u4f59\u989d', updated: '\u5df2\u66f4\u65b0', needsLogin: '\u9700\u8981\u767b\u5f55', apiConfigured: '\u53ef\u914d\u7f6e API',
  normal: '\u6b63\u5e38', cached: '\u7f13\u5b58\u4f59\u989d', unconfigured: '\u672a\u914d\u7f6e', loginRequired: '\u9700\u8981\u767b\u5f55', failed: '\u67e5\u8be2\u5931\u8d25', unknown: '\u672a\u77e5\u72b6\u6001',
  updatedAt: '\u66f4\u65b0\u4e8e', notConfigured: '\u5c1a\u672a\u914d\u7f6e', modelPricing: '\u6a21\u578b\u5b9a\u4ef7',
  configure: '\u914d\u7f6e', loginSession: '\u767b\u5f55\u4f1a\u8bdd', recharge: '\u5145\u503c', pricing: '\u5b9a\u4ef7',
  configureTitle: '\u914d\u7f6e\u670d\u52a1\u5546', addManual: '\u6dfb\u52a0\u624b\u52a8\u4f59\u989d', addWeb: '\u6dfb\u52a0\u7f51\u7ad9\u670d\u52a1\u5546', name: '\u670d\u52a1\u5546\u540d\u79f0', balance: '\u5f53\u524d\u4f59\u989d', currency: '\u5e01\u79cd', website: '\u5b98\u7f51\uff08\u53ef\u9009\uff09',
  balancePage: '\u4f59\u989d\u9875\u7f51\u5740', rechargePage: '\u5145\u503c\u9875\u7f51\u5740\uff08\u53ef\u9009\uff09', pricingPage: '\u5b9a\u4ef7\u9875\u7f51\u5740\uff08\u53ef\u9009\uff09', balanceKeyword: '\u4f59\u989d\u5b57\u6bb5\u6587\u5b57\uff08\u53ef\u9009\uff09',
  keepKey: '\u7559\u7a7a\u4fdd\u7559\u73b0\u6709\u5bc6\u94a5', encrypted: '\u5bc6\u94a5\u7531 Windows \u52a0\u5bc6\u5b58\u50a8\uff0c\u4ec5\u672c\u673a\u5e94\u7528\u53ef\u8bfb\u53d6\u3002', webHint: '\u70b9\u51fb\u201c\u767b\u5f55\u4f1a\u8bdd\u201d\u540e\u5728\u5e94\u7528\u5185\u5b8c\u6210\u767b\u5f55\u3002\u4f1a\u8bdd\u4f1a\u4fdd\u5b58\u5728\u672c\u673a\uff0c\u4f59\u989d\u4f1a\u81ea\u52a8\u5237\u65b0\u3002',
  apiBalance: 'API \u4f59\u989d', webSession: '\u7f51\u9875\u767b\u5f55\u4f1a\u8bdd', manualBalance: '\u624b\u52a8\u4f59\u989d', recentRefresh: '\u6700\u8fd1\u5237\u65b0\uff1a', providerCount: '\u4e2a\u670d\u52a1\u5546',
}

const statusLabels = { ok: text.normal, cached: text.cached, unconfigured: text.unconfigured, needs_login: text.loginRequired, error: text.failed }
const currency = (value, code) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: code || 'USD' }).format(Number(value || 0))
const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])

function render(next) {
  state.providers = next.providers || []
  const available = state.providers.filter((provider) => provider.status === 'ok' || provider.status === 'cached')
  const total = available.reduce((sum, provider) => sum + (provider.currency === 'CNY' ? Number(provider.balance) / 7.2 : Number(provider.balance)), 0)
  summary.innerHTML = [
    [text.estimatedTotal, currency(total, 'USD')],
    [text.updated, `${available.length} ${text.providerCount}`],
    [text.needsLogin, `${state.providers.filter((provider) => provider.status === 'needs_login').length} ${text.providerCount}`],
    [text.apiConfigured, `${state.providers.filter((provider) => provider.kind === 'api').length} ${text.providerCount}`],
  ].map(([label, value]) => `<article class="summary-card"><span>${label}</span><strong>${value}</strong></article>`).join('')
  providerGrid.innerHTML = state.providers.map((provider) => {
    const models = (provider.models || []).slice(0, 3).map((model) => `<div class="model-row"><span>${escapeHtml(model.name)}</span><span>${escapeHtml(model.price)}</span></div>`).join('')
    const message = provider.status === 'ok' ? `${text.updatedAt} ${new Date(provider.updatedAt).toLocaleTimeString()}` : (provider.errorMessage || text.notConfigured)
    const canShowBalance = provider.balance != null && (provider.status === 'ok' || provider.status === 'cached')
    return `<article class="provider-card"><div class="card-head"><div class="provider-name"><i class="provider-dot" style="background:${escapeHtml(provider.color || '#6366f1')}"></i>${escapeHtml(provider.name)}</div><span class="status ${escapeHtml(provider.status)}">${statusLabels[provider.status] || text.unknown}</span></div><div class="balance">${canShowBalance ? currency(provider.balance, provider.currency) : '--'}</div><div class="message">${escapeHtml(message)}</div>${models ? `<div class="models"><div class="models-title">${text.modelPricing}</div>${models}</div>` : ''}<div class="card-actions"><button data-action="configure" data-id="${escapeHtml(provider.id)}">${text.configure}</button>${provider.kind === 'web' ? `<button data-action="session" data-id="${escapeHtml(provider.id)}">${text.loginSession}</button>` : ''}${provider.rechargeUrl ? `<button data-action="recharge" data-id="${escapeHtml(provider.id)}">${text.recharge}</button>` : ''}${provider.pricingUrl ? `<button data-action="pricing" data-id="${escapeHtml(provider.id)}">${text.pricing}</button>` : ''}</div></article>`
  }).join('')
  updated.textContent = `${text.recentRefresh}${new Date().toLocaleTimeString()}`
}

function field(label, control) { return `<div class="field"><label>${label}</label>${control}</div>` }

function showEditor(provider, mode = 'manual') {
  editTarget = provider
  editorMode = mode
  document.getElementById('editorTitle').textContent = provider ? `${text.configureTitle} ${provider.name}` : (mode === 'web' ? text.addWeb : text.addManual)
  if (!provider && mode === 'manual') {
    editorFields.innerHTML = `${field(text.name, '<input name="name" required />')}${field(text.balance, '<input name="manualBalance" type="number" step="0.0001" required />')}${field(text.currency, '<select name="currency"><option value="USD">USD</option><option value="CNY">CNY</option></select>')}${field(text.website, '<input name="website" type="url" />')}`
  } else if (!provider && mode === 'web') {
    editorFields.innerHTML = `${field(text.name, '<input name="name" required />')}${field(text.website, '<input name="website" type="url" placeholder="https://example.com" />')}${field(text.balancePage, '<input name="balanceUrl" type="url" required placeholder="https://example.com/account" />')}${field(text.balanceKeyword, '<input name="balanceKeyword" placeholder="Balance / 余额 / Credits" />')}${field(text.currency, '<select name="currency"><option value="USD">USD</option><option value="CNY">CNY</option></select>')}${field(text.rechargePage, '<input name="rechargeUrl" type="url" />')}${field(text.pricingPage, '<input name="pricingUrl" type="url" />')}`
  } else {
    const apiField = provider.kind === 'api' ? field('API Key', `<input name="apiKey" type="password" placeholder="${text.keepKey}" /><p class="hint">${text.encrypted}</p>`) : ''
    const manualField = provider.kind === 'manual' ? field(text.balance, `<input name="manualBalance" type="number" step="0.0001" value="${escapeHtml(provider.manualBalance)}" />`) : ''
    const webHint = provider.kind === 'web' ? `<p class="hint">${text.webHint}</p>` : ''
    const nameField = field(text.name, `<input name="name" value="${escapeHtml(provider.name)}" required />`)
    const websiteField = provider.kind !== 'api' ? field(text.website, `<input name="website" type="url" value="${escapeHtml(provider.website)}" />`) : ''
    const webFields = provider.kind === 'web' ? `${field(text.balancePage, `<input name="balanceUrl" type="url" value="${escapeHtml(provider.balanceUrl)}" required />`)}${field(text.balanceKeyword, `<input name="balanceKeyword" value="${escapeHtml(provider.balanceKeyword)}" placeholder="Balance / 余额 / Credits" />`)}${field(text.rechargePage, `<input name="rechargeUrl" type="url" value="${escapeHtml(provider.rechargeUrl)}" />`)}${field(text.pricingPage, `<input name="pricingUrl" type="url" value="${escapeHtml(provider.pricingUrl)}" />`)}` : ''
    editorFields.innerHTML = `${nameField}${apiField}${manualField}${websiteField}${webFields}${field(text.currency, `<select name="currency"><option value="USD" ${provider.currency === 'USD' ? 'selected' : ''}>USD</option><option value="CNY" ${provider.currency === 'CNY' ? 'selected' : ''}>CNY</option></select>`)}${webHint}`
  }
  dialog.showModal()
}

function showManager() {
  managerList.innerHTML = state.providers.map((provider) => `<div class="manager-row"><i class="provider-dot" style="background:${escapeHtml(provider.color || '#6366f1')}"></i><strong>${escapeHtml(provider.name)}</strong><span>${provider.kind === 'api' ? text.apiBalance : provider.kind === 'web' ? text.webSession : text.manualBalance}</span><button class="secondary" data-config-id="${escapeHtml(provider.id)}">${text.configure}</button></div>`).join('')
  manager.showModal()
}

providerGrid.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]')
  if (!button) return
  const provider = state.providers.find((item) => item.id === button.dataset.id)
  if (!provider) return
  if (button.dataset.action === 'configure') showEditor(provider)
  if (button.dataset.action === 'session') await window.desktop.openProvider(provider.id, 'account')
  if (button.dataset.action === 'recharge') await window.desktop.openProvider(provider.id, 'recharge')
  if (button.dataset.action === 'pricing') await window.desktop.openProvider(provider.id, 'pricing')
})

document.getElementById('addManual').addEventListener('click', () => showEditor(null, 'manual'))
document.getElementById('addWeb').addEventListener('click', () => showEditor(null, 'web'))
document.getElementById('manageProviders').addEventListener('click', showManager)
document.getElementById('closeManager').addEventListener('click', () => manager.close())
managerList.addEventListener('click', (event) => {
  const provider = state.providers.find((item) => item.id === event.target.dataset.configId)
  if (!provider) return
  manager.close()
  showEditor(provider)
})
document.getElementById('refresh').addEventListener('click', () => window.desktop.refreshBalances())
document.getElementById('closeEditor').addEventListener('click', () => dialog.close())
document.getElementById('cancelEditor').addEventListener('click', () => dialog.close())
editorForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const data = Object.fromEntries(new FormData(editorForm).entries())
  try {
    if (!editTarget && editorMode === 'web') await window.desktop.addWebProvider(data)
    else if (!editTarget) await window.desktop.addManualProvider(data)
    else await window.desktop.saveProvider({ id: editTarget.id, ...data, manualBalance: data.manualBalance === undefined ? undefined : Number(data.manualBalance) })
    dialog.close()
  } catch (error) {
    alert(error.message)
  }
})

window.desktop.onBalancesUpdated(render)
window.desktop.getBalances().then(render).catch((error) => { updated.textContent = error.message })
