import { useState } from 'react'
import { ArrowLeft, Plus, Trash2, Save, Settings, DollarSign, Link, Database, RotateCcw, AlertTriangle } from 'lucide-react'
import { useAdmin } from '../context/AdminContext'
import Layout from '../components/Layout'

function ProviderEditor({ provider, onSave, onDelete }) {
  const [edit, setEdit] = useState({ ...provider })

  return (
    <div className="bg-gray-50 dark:bg-gray-750 rounded-lg p-4 space-y-3">
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
          <label className="block text-xs font-medium text-gray-500 mb-1">余额 API 地址</label>
          <input
            value={edit.balanceApi || ''}
            onChange={e => setEdit(p => ({ ...p, balanceApi: e.target.value }))}
            placeholder="https://api.xxx.com/v1/balance"
            className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
          />
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
        <div className="col-span-full">
          <label className="block text-xs font-medium text-gray-500 mb-1">API Key 环境变量名</label>
          <input
            value={edit.envKey || ''}
            onChange={e => setEdit(p => ({ ...p, envKey: e.target.value }))}
            placeholder="例如: MYPROVIDER_API_KEY"
            className="w-full px-3 py-1.5 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white font-mono"
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
  const [tab, setTab] = useState('providers')
  const [newId, setNewId] = useState('')
  const [editingId, setEditingId] = useState(null)

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
      balanceApi: '',
      envKey: '',
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
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 mb-6">
        {[
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
            <div className="flex items-center gap-2">
              <input type="checkbox" id="showDemo" defaultChecked className="rounded"
                onChange={e => localStorage.setItem('token_dashboard_show_demo', e.target.checked)}
              />
              <label htmlFor="showDemo" className="text-sm text-gray-900 dark:text-white">无 API 密钥时显示演示数据</label>
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
