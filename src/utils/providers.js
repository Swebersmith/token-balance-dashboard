export const PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    nameZh: 'OpenAI',
    color: '#10a37f',
    currency: 'USD',
    hasBalanceApi: true,
    website: 'https://platform.openai.com',
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    nameZh: 'Anthropic',
    color: '#d97706',
    currency: 'USD',
    hasBalanceApi: true,
    website: 'https://console.anthropic.com',
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    nameZh: '深度求索',
    color: '#4f46e5',
    currency: 'CNY',
    hasBalanceApi: true,
    website: 'https://platform.deepseek.com',
  },
  google: {
    id: 'google',
    name: 'Google AI',
    nameZh: '谷歌 AI',
    color: '#4285f4',
    currency: 'USD',
    hasBalanceApi: false,
    website: 'https://aistudio.google.com',
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    nameZh: 'Groq',
    color: '#f97316',
    currency: 'USD',
    hasBalanceApi: false,
    website: 'https://console.groq.com',
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    nameZh: 'OpenRouter',
    color: '#6366f1',
    currency: 'USD',
    hasBalanceApi: true,
    website: 'https://openrouter.ai',
  },
  together: {
    id: 'together',
    name: 'Together AI',
    nameZh: 'Together AI',
    color: '#0891b2',
    currency: 'USD',
    hasBalanceApi: true,
    website: 'https://api.together.xyz',
  },
}

export function getProvider(id) {
  return PROVIDERS[id] || null
}

export function getConfiguredProviders(keys) {
  return Object.keys(PROVIDERS).filter(id => keys[id])
}
