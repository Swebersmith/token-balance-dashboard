import { useState } from 'react'
import { ChevronDown, ChevronUp, ExternalLink, DollarSign } from 'lucide-react'
import { PROVIDERS } from '../utils/providers'

export default function PricingPanel() {
  const [expanded, setExpanded] = useState({})

  const toggle = (id) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">模型价格查询</h2>
      </div>

      <div className="space-y-2">
        {Object.values(PROVIDERS).map((p) => (
          <div key={p.id} className="border border-gray-100 dark:border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggle(p.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ backgroundColor: p.color }}
                >
                  {p.name[0]}
                </div>
                <div className="text-left">
                  <span className="font-medium text-sm text-gray-900 dark:text-white">{p.name}</span>
                  <span className="text-xs text-gray-400 ml-2">{p.nameZh}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={p.pricingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  官网价格
                  <ExternalLink className="w-3 h-3" />
                </a>
                {expanded[p.id] ? (
                  <ChevronUp className="w-4 h-4 text-gray-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                )}
              </div>
            </button>

            {expanded[p.id] && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-750 text-left">
                        <th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">模型</th>
                        <th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">输入价格</th>
                        <th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">输出价格</th>
                        <th className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400">单位</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.models.map((m, i) => (
                        <tr
                          key={m.name}
                          className={`${
                            i % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-750/30'
                          }`}
                        >
                          <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{m.name}</td>
                          <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">
                            ${m.input.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">
                            ${m.output.toFixed(2)}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{m.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
        价格为参考值，请以各服务商官网最新价格为准。价格单位：USD / 1M tokens (DeepSeek 为 CNY)
      </p>
    </div>
  )
}
