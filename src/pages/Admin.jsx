import { useEffect, useState } from 'react'
import { ArrowLeft, Plus, Trash2, Save, Settings, DollarSign, Link, Database, RotateCcw, AlertTriangle } from 'lucide-react'
import { useAdmin } from '../context/AdminContext'
import Layout from '../components/Layout'
import { changeAdminPassword, createExtensionToken, deleteCustomProvider, getAdminSettings, getCustomProviders, getExtensionTokenStatus, loginAdmin, logoutAdmin, revokeExtensionToken, saveAdminProviderKey, saveCustomProvider } from '../utils/adminApi'

const BALANCE_CONFIG = {
  openai: {
    envKey: 'OPENAI_API_KEY',
    endpoint: 'https://api.openai.com/v1/organization/credit_grants',
  },
  anthropic: {
    envKey: 'ANTHROPIC_API_KEY',
    endpoint: 'https://api.anthropic.com/v1/organizations/{organization_id}/billing/credits',
    note: 'Requires an Anthropic Admin API key with billing access.',
  },
  deepseek: {
    envKey: 'DEEPSEEK_API_KEY',
    endpoint: 'https://api.deepseek.com/user/balance',
  },
  openrouter: {
    envKey: 'OPENROUTER_API_KEY',
    endpoint: 'https://openrouter.ai/api/v1/credits',
  },
  together: {
    envKey: 'TOGETHER_API_KEY',
    endpoint: 'https://api.together.xyz/v1/billing/credits',
  },
  google: {
    envKey: 'GOOGLE_AI_API_KEY',
    note: 'Google AI does not provide a key-scoped balance API.',
  },
  groq: {
    envKey: 'GROQ_API_KEY',
    note: 'Groq does not provide a key-scoped balance API.',
  },
}

function BalanceConfiguration({ providerId }) {
  const config = BALANCE_CONFIG[providerId]
  if (!config) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300">
        自定义服务商仅用于展示。接入余额查询需要在服务端新增对应的 Provider 实现，不能在浏览器中保存 API Key。
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-800 dark:border-indigo-900/50 dark:bg-indigo-900/20 dark:text-indigo-300">
      <p className="font-medium">余额查询由服务端托管</p>
      <p className="mt-1">环境变量：<code className="font-mono">{config.envKey}</code></p>
      {config.endpoint && <p className="mt-1 break-all">内置 API 地址：<code className="font-mono">{config.endpoint}</code></p>}
      <p className="mt-1">请在“API 密钥”标签中保存密钥。密钥只会写入服务端存储，不会显示回页面。</p>
      {config.note && <p className="mt-1">{config.note}</p>}
    </div>
  )
}

function AdminLogin({ onAuthenticated }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await loginAdmin(password)
      setPassword('')
      onAuthenticated()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-sm pt-10">
        <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white">后台登录</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">登录后可安全保存服务商 API 密钥。</p>
          <form onSubmit={submit} className="mt-5 space-y-3">
            <div>
              <label htmlFor="admin-password" className="mb-1 block text-xs font-medium text-gray-500">管理员密码</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}

function ApiKeySettings() {
  const [settings, setSettings] = useState({})
  const [drafts, setDrafts] = useState({})
  const [busyProvider, setBusyProvider] = useState(null)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [passwords, setPasswords] = useState({ current: '', next: '' })
  const [changingPassword, setChangingPassword] = useState(false)

  const refresh = async () => {
    try {
      const data = await getAdminSettings()
      setSettings(data.providers)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const saveKey = async (provider) => {
    setBusyProvider(provider)
    setError('')
    setMessage('')
    try {
      const data = await saveAdminProviderKey(provider, drafts[provider] || '')
      setSettings((current) => ({ ...current, [provider]: data }))
      setDrafts((current) => ({ ...current, [provider]: '' }))
      setMessage(`${BALANCE_CONFIG[provider].envKey} 已保存`)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusyProvider(null)
    }
  }

  const updatePassword = async (event) => {
    event.preventDefault()
    setChangingPassword(true)
    setError('')
    setMessage('')
    try {
      await changeAdminPassword(passwords.current, passwords.next)
      setPasswords({ current: '', next: '' })
      setMessage('管理员密码已更新')
    } catch (err) {
      setError(err.message)
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">密钥保存到 Cloudflare KV，仅服务端余额查询可读取。已保存的密钥不会再次显示；清空输入框并保存可删除该服务商密钥。</p>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
      {message && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">{message}</p>}
      {Object.entries(BALANCE_CONFIG).map(([provider, config]) => (
        <div key={provider} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{provider}</h2>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{config.endpoint || config.note}</p>
            </div>
            <span className={`shrink-0 text-xs ${settings[provider]?.configured ? 'text-emerald-600' : 'text-gray-400'}`}>
              {settings[provider]?.configured ? '已配置' : '未配置'}
            </span>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="password"
              autoComplete="off"
              value={drafts[provider] || ''}
              onChange={(event) => setDrafts((current) => ({ ...current, [provider]: event.target.value }))}
              placeholder={`输入 ${config.envKey}`}
              className="min-w-0 flex-1 rounded-lg border px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="button"
              onClick={() => saveKey(provider)}
              disabled={busyProvider === provider}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {busyProvider === provider ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      ))}
      <form onSubmit={updatePassword} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">修改管理员密码</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            type="password"
            autoComplete="current-password"
            value={passwords.current}
            onChange={(event) => setPasswords((current) => ({ ...current, current: event.target.value }))}
            placeholder="当前密码"
            required
            className="rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
          <input
            type="password"
            autoComplete="new-password"
            value={passwords.next}
            onChange={(event) => setPasswords((current) => ({ ...current, next: event.target.value }))}
            placeholder="新密码，至少 12 位"
            minLength={12}
            required
            className="rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <button type="submit" disabled={changingPassword} className="mt-3 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
          {changingPassword ? '更新中...' : '更新密码'}
        </button>
      </form>
      <ExtensionSettings />
      <CustomProviderSettings />
    </div>
  )
}

function ExtensionSettings() {
  const [configured, setConfigured] = useState(false)
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    getExtensionTokenStatus()
      .then((data) => setConfigured(data.configured))
      .catch((err) => setError(err.message))
  }, [])

  const generate = async () => {
    setError('')
    setMessage('')
    try {
      const data = await createExtensionToken()
      setToken(data.token)
      setConfigured(true)
      setMessage('请立即复制此同步令牌。关闭或刷新后无法再次查看。')
    } catch (err) {
      setError(err.message)
    }
  }

  const revoke = async () => {
    setError('')
    try {
      await revokeExtensionToken()
      setConfigured(false)
      setToken('')
      setMessage('同步令牌已撤销，扩展将不能再写入余额。')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="border-t border-gray-200 pt-6 dark:border-gray-700">
      <h2 className="text-base font-semibold text-gray-900 dark:text-white">浏览器自动同步</h2>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Chrome 扩展在你已登录 Right Code 或 RunAPI 页面时本地识别余额并同步到本站，不上传 Cookie 或账号信息。</p>
      {error && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
      {message && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">{message}</p>}
      {token && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input readOnly value={token} className="min-w-0 flex-1 rounded-lg border bg-gray-50 px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <button type="button" onClick={() => navigator.clipboard.writeText(token)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">复制令牌</button>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={generate} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">{configured ? '重新生成令牌' : '生成同步令牌'}</button>
        {configured && <button type="button" onClick={revoke} className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-900/20">撤销令牌</button>}
      </div>
      <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-gray-600 dark:text-gray-300">
        <li>在 Chrome 打开扩展管理页并启用“开发者模式”。</li>
        <li>选择“加载已解压的扩展程序”，选中项目中的 <code className="font-mono">extension</code> 文件夹。</li>
        <li>打开扩展，填写本站地址和刚生成的同步令牌。</li>
        <li>正常登录服务商官网；打开其账户、充值或模型页面后会自动同步可识别数据。</li>
      </ol>
    </section>
  )
}

function CustomProviderSettings() {
  const [providers, setProviders] = useState([])
  const [mode, setMode] = useState('manual')
  const [form, setForm] = useState({
    name: '',
    currency: 'USD',
    color: '#6366f1',
    website: '',
    manualBalance: '',
    endpoint: '',
    authType: 'bearer',
    apiKey: '',
    jsonPath: 'data.balance',
  })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  const refresh = async () => {
    try {
      const data = await getCustomProviders()
      setProviders(data.providers)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }))

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const id = `custom-${form.name.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-')}`
      await saveCustomProvider({ ...form, id, mode, manualBalance: Number(form.manualBalance) })
      setForm({ name: '', currency: 'USD', color: '#6366f1', website: '', manualBalance: '', endpoint: '', authType: 'bearer', apiKey: '', jsonPath: 'data.balance' })
      await refresh()
      setMessage('自定义余额来源已保存')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id) => {
    if (!confirm('删除后将停止显示此服务商余额，是否继续？')) return
    setError('')
    try {
      await deleteCustomProvider(id)
      await refresh()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="border-t border-gray-200 pt-6 dark:border-gray-700">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">自定义余额来源</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">没有公开余额 API 时可使用手动余额；有 API 时填写 HTTPS 地址、认证方式和返回余额的 JSON 字段路径。</p>
      </div>
      {error && <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</p>}
      {message && <p className="mb-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300">{message}</p>}
      <form onSubmit={submit} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
        <div className="grid gap-3 sm:grid-cols-2">
          <input required value={form.name} onChange={(event) => update('name', event.target.value)} placeholder="服务商名称，例如 RunAPI" className="rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          <select value={mode} onChange={(event) => setMode(event.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="manual">手动余额</option>
            <option value="api">API 查询</option>
          </select>
          <select value={form.currency} onChange={(event) => update('currency', event.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
            <option value="USD">USD</option>
            <option value="CNY">CNY</option>
          </select>
          <input value={form.website} onChange={(event) => update('website', event.target.value)} placeholder="服务商网站（可选）" className="rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
        </div>
        {mode === 'manual' ? (
          <input required type="number" step="0.0001" value={form.manualBalance} onChange={(event) => update('manualBalance', event.target.value)} placeholder="当前余额" className="w-full rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <input required type="url" value={form.endpoint} onChange={(event) => update('endpoint', event.target.value)} placeholder="HTTPS 余额 API 地址" className="sm:col-span-2 rounded-lg border px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            <input required type="password" value={form.apiKey} onChange={(event) => update('apiKey', event.target.value)} placeholder="API Key 或账户 Access Token" className="rounded-lg border px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            <select value={form.authType} onChange={(event) => update('authType', event.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="bearer">Authorization: Bearer</option>
              <option value="x-api-key">X-API-Key</option>
            </select>
            <input required value={form.jsonPath} onChange={(event) => update('jsonPath', event.target.value)} placeholder="余额 JSON 字段，例如 data.balance" className="sm:col-span-2 rounded-lg border px-3 py-2 font-mono text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
        )}
        <button type="submit" disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
          {saving ? '保存中...' : '保存并显示'}
        </button>
      </form>
      {providers.length > 0 && (
        <div className="mt-3 space-y-2">
          {providers.map((provider) => (
            <div key={provider.id} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: provider.color }} />
              <span className="font-medium text-gray-900 dark:text-white">{provider.name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{provider.mode === 'manual' ? '手动余额' : provider.jsonPath}</span>
              <button type="button" onClick={() => remove(provider.id)} className="ml-auto text-xs text-red-600 hover:text-red-700">删除</button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function ProviderEditor({ provider, onSave, onDelete }) {
  const [edit, setEdit] = useState({ ...provider })

  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 space-y-3">
      <BalanceConfiguration providerId={provider.id} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">ID</label>
          <input
            value={edit.id}
            onChange={e => setEdit(p => ({ ...p, id: e.target.value }))}
            disabled
            className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">名称</label>
          <input
            value={edit.name}
            onChange={e => setEdit(p => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">中文名</label>
          <input
            value={edit.nameZh}
            onChange={e => setEdit(p => ({ ...p, nameZh: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">品牌色</label>
          <div className="flex gap-2">
            <input
              value={edit.color}
              onChange={e => setEdit(p => ({ ...p, color: e.target.value }))}
              className="flex-1 px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <span className="w-8 h-8 rounded-lg shrink-0" style={{ backgroundColor: edit.color }} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">币种</label>
          <select
            value={edit.currency}
            onChange={e => setEdit(p => ({ ...p, currency: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="USD">USD</option>
            <option value="CNY">CNY</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">官网地址</label>
          <input
            value={edit.website}
            onChange={e => setEdit(p => ({ ...p, website: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">充值地址</label>
          <input
            value={edit.rechargeUrl}
            onChange={e => setEdit(p => ({ ...p, rechargeUrl: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">价格页地址</label>
          <input
            value={edit.pricingUrl}
            onChange={e => setEdit(p => ({ ...p, pricingUrl: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      </div>

      {/* Models */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">模型价格</label>
        <div className="space-y-1.5">
          {(edit.models || []).map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                value={m.name}
                onChange={e => {
                  const models = [...edit.models]
                  models[i] = { ...models[i], name: e.target.value }
                  setEdit(p => ({ ...p, models }))
                }}
                placeholder="模型名"
                className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <input
                type="number"
                step="0.01"
                value={m.input}
                onChange={e => {
                  const models = [...edit.models]
                  models[i] = { ...models[i], input: parseFloat(e.target.value) || 0 }
                  setEdit(p => ({ ...p, models }))
                }}
                placeholder="输入$"
                className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <input
                type="number"
                step="0.01"
                value={m.output}
                onChange={e => {
                  const models = [...edit.models]
                  models[i] = { ...models[i], output: parseFloat(e.target.value) || 0 }
                  setEdit(p => ({ ...p, models }))
                }}
                placeholder="输出$"
                className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={() => setEdit(p => ({ ...p, models: edit.models.filter((_, j) => j !== i) }))}
                className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          <button
            onClick={() => setEdit(p => ({ ...p, models: [...(p.models || []), { name: '', input: 0, output: 0, unit: '1M tokens' }] }))}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 cursor-pointer"
          >
            <Plus className="w-3 h-3" /> 添加模型
          </button>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => onSave(edit)}
          className="flex items-center gap-1 px-4 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 cursor-pointer"
        >
          <Save className="w-3 h-3" /> 保存
        </button>
        <button
          onClick={() => { if (confirm(`确定删除 ${edit.name}？`)) onDelete(edit.id) }}
          className="flex items-center gap-1 px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 cursor-pointer"
        >
          <Trash2 className="w-3 h-3" /> 删除
        </button>
      </div>
    </div>
  )
}

export function Admin() {
  const { providers, removedBuiltins, addProvider, removeProvider, updateProvider, restoreBuiltins } = useAdmin()
  const [tab, setTab] = useState('api-keys')
  const [newId, setNewId] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [authState, setAuthState] = useState('loading')

  useEffect(() => {
    getAdminSettings()
      .then(() => setAuthState('authenticated'))
      .catch(() => setAuthState('unauthenticated'))
  }, [])

  if (authState === 'loading') {
    return <Layout><p className="py-12 text-center text-sm text-gray-500">正在验证后台会话...</p></Layout>
  }

  if (authState === 'unauthenticated') {
    return <AdminLogin onAuthenticated={() => setAuthState('authenticated')} />
  }

  const handleAdd = () => {
    if (!newId.trim()) return
    addProvider({
      id: newId.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newId.trim(),
      nameZh: newId.trim(),
      color: '#6366f1',
      currency: 'USD',
      hasBalanceApi: true,
      website: '',
      rechargeUrl: '',
      pricingUrl: '',
      models: [],
    })
    setNewId('')
  }

  return (
    <Layout>
      <div className="flex items-center gap-3 mb-6">
        <a href="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg cursor-pointer">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </a>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">后台管理</h1>
        <button
          type="button"
          onClick={async () => { await logoutAdmin(); setAuthState('unauthenticated') }}
          className="ml-auto rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700"
        >
          退出登录
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
        {[
          { id: 'api-keys', label: 'API 密钥', icon: Settings },
          { id: 'providers', label: '服务商管理', icon: Database },
          { id: 'pricing', label: '模型价格', icon: DollarSign },
          { id: 'recharge', label: '充值链接', icon: Link },
          { id: 'settings', label: '显示设置', icon: Settings },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              tab === t.id
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'api-keys' && <ApiKeySettings />}

      {/* Provider Management */}
      {tab === 'providers' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              value={newId}
              onChange={e => setNewId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="输入新服务商名称..."
              className="flex-1 px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <button
              onClick={handleAdd}
              className="flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> 添加
            </button>
          </div>

          {removedBuiltins.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700 dark:text-amber-400">
                已删除 {removedBuiltins.length} 个内置服务商
              </span>
              <button
                onClick={restoreBuiltins}
                className="ml-auto flex items-center gap-1 px-3 py-1 text-sm bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" /> 恢复全部
              </button>
            </div>
          )}

          <div className="space-y-3">
            {Object.values(providers).map((p) => (
              <div key={p.id}>
                <div className="flex items-center p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <div
                    onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                    className="flex items-center gap-3 flex-1 cursor-pointer min-w-0"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: p.color }}>
                      {p.name[0]}
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.name}</span>
                      <span className="text-xs text-gray-400 ml-2">{p.nameZh}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-xs text-gray-400">{editingId === p.id ? '收起' : '编辑'}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); if (confirm(`确定删除 ${p.name}？`)) removeProvider(p.id) }}
                      className="p-1 text-red-400 hover:text-red-600 cursor-pointer"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {editingId === p.id && (
                  <div className="mt-2">
                    <ProviderEditor
                      provider={p}
                      onSave={(updated) => { updateProvider(p.id, updated); setEditingId(null) }}
                      onDelete={(id) => { removeProvider(id); setEditingId(null) }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing Editor */}
      {tab === 'pricing' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">编辑各服务商的模型价格表，点击展开编辑</p>
          {Object.values(providers).map((p) => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: p.color }}>{p.name[0]}</div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
              </div>
              <div className="space-y-1.5">
                {(p.models || []).map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input value={m.name} onChange={e => {
                      const models = [...(p.models || [])]
                      models[i] = { ...models[i], name: e.target.value }
                      updateProvider(p.id, { models })
                    }} className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                    <input type="number" step="0.01" value={m.input} onChange={e => {
                      const models = [...(p.models || [])]
                      models[i] = { ...models[i], input: parseFloat(e.target.value) || 0 }
                      updateProvider(p.id, { models })
                    }} className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="输入$" />
                    <input type="number" step="0.01" value={m.output} onChange={e => {
                      const models = [...(p.models || [])]
                      models[i] = { ...models[i], output: parseFloat(e.target.value) || 0 }
                      updateProvider(p.id, { models })
                    }} className="w-20 px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="输出$" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recharge Links */}
      {tab === 'recharge' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">编辑各服务商的充值和价格页面链接</p>
          {Object.values(providers).map((p) => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: p.color }}>{p.name[0]}</div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">充值地址</label>
                  <input
                    value={p.rechargeUrl}
                    onChange={e => updateProvider(p.id, { rechargeUrl: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">价格页面地址</label>
                  <input
                    value={p.pricingUrl}
                    onChange={e => updateProvider(p.id, { pricingUrl: e.target.value })}
                    className="w-full px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Display Settings */}
      {tab === 'settings' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">配置余额显示相关设置</p>
          <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">刷新间隔（分钟）</label>
              <input
                type="number"
                defaultValue={5}
                min={1}
                max={60}
                className="w-32 px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                onChange={e => localStorage.setItem('token_dashboard_refresh', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">低余额警告阈值 (USD 等值)</label>
              <input
                type="number"
                defaultValue={5}
                min={0}
                className="w-32 px-3 py-1.5 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                onChange={e => localStorage.setItem('token_dashboard_low_threshold', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}
