const state = { providers: [] }
const providerGrid = document.getElementById('providers')
const summary = document.getElementById('summary')
const updated = document.getElementById('updated')
const dialog = document.getElementById('editor')
const editorForm = document.getElementById('editorForm')
const editorFields = document.getElementById('editorFields')
let editTarget = null

const currency = (value, code) => new Intl.NumberFormat('zh-CN', { style: 'currency', currency: code || 'USD' }).format(Number(value || 0))
const escapeHtml = (value) => String(value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character])

function render(next) {
  state.providers = next.providers || []
  const ok = state.providers.filter((provider) => provider.status === 'ok')
  const total = ok.reduce((sum, provider) => sum + (provider.currency === 'CNY' ? Number(provider.balance) / 7.2 : Number(provider.balance)), 0)
  summary.innerHTML = [
    ['估算总余额', currency(total, 'USD')],
    ['已更新', `${ok.length} 个服务商`],
    ['需要登录', `${state.providers.filter((provider) => provider.status === 'needs_login').length} 个服务商`],
    ['配置 API', `${state.providers.filter((provider) => provider.kind === 'api').length} 个服务商`],
  ].map(([label, value]) => `<article class="summary-card"><span>${label}</span><strong>${value}</strong></article>`).join('')
  providerGrid.innerHTML = state.providers.map((provider) => {
    const models = (provider.models || []).slice(0, 3).map((model) => `<div class="model-row"><span>${escapeHtml(model.name)}</span><span>${escapeHtml(model.price)}</span></div>`).join('')
    const message = provider.status === 'ok' ? `更新于 ${new Date(provider.updatedAt).toLocaleTimeString()}` : (provider.errorMessage || '尚未配置')
    return `<article class="provider-card"><div class="card-head"><div class="provider-name"><i class="provider-dot" style="background:${escapeHtml(provider.color || '#6366f1')}"></i>${escapeHtml(provider.name)}</div><span class="status ${escapeHtml(provider.status)}">${escapeHtml(provider.status)}</span></div><div class="balance">${provider.status === 'ok' ? currency(provider.balance, provider.currency) : '--'}</div><div class="message">${escapeHtml(message)}</div>${models ? `<div class="models"><div class="models-title">模型定价</div>${models}</div>` : ''}<div class="card-actions"><button data-action="configure" data-id="${escapeHtml(provider.id)}">配置</button>${provider.kind === 'web' ? '<button data-action="session" data-id="' + escapeHtml(provider.id) + '">登录会话</button>' : ''}${provider.rechargeUrl ? '<button data-action="recharge" data-id="' + escapeHtml(provider.id) + '">充值</button>' : ''}${provider.pricingUrl ? '<button data-action="pricing" data-id="' + escapeHtml(provider.id) + '">定价</button>' : ''}</div></article>`
  }).join('')
  updated.textContent = `最近刷新：${new Date().toLocaleTimeString()}`
}

function showEditor(provider, manualOnly = false) {
  editTarget = provider
  document.getElementById('editorTitle').textContent = provider ? `配置 ${provider.name}` : '添加手动余额'
  if (manualOnly) {
    editorFields.innerHTML = `<div class="field"><label>服务商名称</label><input name="name" required /></div><div class="field"><label>当前余额</label><input name="manualBalance" type="number" step="0.0001" required /></div><div class="field"><label>币种</label><select name="currency"><option value="USD">USD</option><option value="CNY">CNY</option></select></div><div class="field"><label>官网（可选）</label><input name="website" type="url" /></div>`
  } else {
    const apiField = provider.kind === 'api' ? `<div class="field"><label>API Key</label><input name="apiKey" type="password" placeholder="留空保留现有密钥" /><p class="hint">密钥由 Windows 加密存储，仅本机应用可读取。</p></div>` : ''
    const manualField = provider.kind === 'manual' ? `<div class="field"><label>当前余额</label><input name="manualBalance" type="number" step="0.0001" value="${escapeHtml(provider.manualBalance)}" /></div>` : ''
    const webHint = provider.kind === 'web' ? '<p class="hint">点击“登录会话”后在应用内完成登录。会话会保存在本机，应用将定期读取余额页。</p>' : ''
    editorFields.innerHTML = `${apiField}${manualField}<div class="field"><label>币种</label><select name="currency"><option value="USD" ${provider.currency === 'USD' ? 'selected' : ''}>USD</option><option value="CNY" ${provider.currency === 'CNY' ? 'selected' : ''}>CNY</option></select></div>${webHint}`
  }
  dialog.showModal()
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

document.getElementById('addManual').addEventListener('click', () => showEditor(null, true))
document.getElementById('refresh').addEventListener('click', () => window.desktop.refreshBalances())
document.getElementById('closeEditor').addEventListener('click', () => dialog.close())
document.getElementById('cancelEditor').addEventListener('click', () => dialog.close())
editorForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  const data = Object.fromEntries(new FormData(editorForm).entries())
  try {
    if (!editTarget) await window.desktop.addManualProvider(data)
    else await window.desktop.saveProvider({ id: editTarget.id, ...data, manualBalance: data.manualBalance === undefined ? undefined : Number(data.manualBalance) })
    dialog.close()
  } catch (error) {
    alert(error.message)
  }
})

window.desktop.onBalancesUpdated(render)
window.desktop.getBalances().then(render).catch((error) => { updated.textContent = error.message })
