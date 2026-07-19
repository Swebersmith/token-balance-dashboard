export const PROVIDERS = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    nameZh: 'OpenAI',
    color: '#10a37f',
    currency: 'USD',
    hasBalanceApi: true,
    website: 'https://platform.openai.com',
    rechargeUrl: 'https://platform.openai.com/settings/organization/billing',
    pricingUrl: 'https://openai.com/api/pricing/',
    models: [
      { name: 'GPT-4o', input: 2.50, output: 10.00, unit: '1M tokens' },
      { name: 'GPT-4o-mini', input: 0.15, output: 0.60, unit: '1M tokens' },
      { name: 'o4-mini', input: 1.10, output: 4.40, unit: '1M tokens' },
      { name: 'GPT-4.1', input: 2.00, output: 8.00, unit: '1M tokens' },
    ],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    nameZh: 'Anthropic',
    color: '#d97706',
    currency: 'USD',
    hasBalanceApi: true,
    website: 'https://console.anthropic.com',
    rechargeUrl: 'https://console.anthropic.com/settings/plans',
    pricingUrl: 'https://www.anthropic.com/pricing',
    models: [
      { name: 'Claude Opus 4', input: 15.00, output: 75.00, unit: '1M tokens' },
      { name: 'Claude Sonnet 4', input: 3.00, output: 15.00, unit: '1M tokens' },
      { name: 'Claude Haiku 3.5', input: 0.80, output: 4.00, unit: '1M tokens' },
      { name: 'Claude Opus 4.5', input: 5.00, output: 25.00, unit: '1M tokens' },
    ],
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    nameZh: '深度求索',
    color: '#4f46e5',
    currency: 'CNY',
    hasBalanceApi: true,
    website: 'https://platform.deepseek.com',
    rechargeUrl: 'https://platform.deepseek.com/top_up',
    pricingUrl: 'https://platform.deepseek.com/api-docs/pricing',
    models: [
      { name: 'DeepSeek-V3', input: 2.00, output: 8.00, unit: '1M tokens' },
      { name: 'DeepSeek-R1', input: 4.00, output: 16.00, unit: '1M tokens' },
      { name: 'DeepSeek-V2.5', input: 1.33, output: 5.33, unit: '1M tokens' },
    ],
  },
  google: {
    id: 'google',
    name: 'Google AI',
    nameZh: '谷歌 AI',
    color: '#4285f4',
    currency: 'USD',
    hasBalanceApi: false,
    website: 'https://aistudio.google.com',
    rechargeUrl: 'https://aistudio.google.com/plan',
    pricingUrl: 'https://ai.google.dev/pricing',
    models: [
      { name: 'Gemini 2.5 Pro', input: 1.25, output: 10.00, unit: '1M tokens' },
      { name: 'Gemini 2.5 Flash', input: 0.15, output: 0.60, unit: '1M tokens' },
      { name: 'Gemini 2.0 Flash', input: 0.10, output: 0.40, unit: '1M tokens' },
    ],
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    nameZh: 'Groq',
    color: '#f97316',
    currency: 'USD',
    hasBalanceApi: false,
    website: 'https://console.groq.com',
    rechargeUrl: 'https://console.groq.com/settings/billing',
    pricingUrl: 'https://console.groq.com/settings/billing',
    models: [
      { name: 'Llama 4 Maverick', input: 0.20, output: 0.60, unit: '1M tokens' },
      { name: 'Llama 3.3 70B', input: 0.59, output: 0.79, unit: '1M tokens' },
      { name: 'Mixtral 8x7B', input: 0.24, output: 0.24, unit: '1M tokens' },
    ],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    nameZh: 'OpenRouter',
    color: '#6366f1',
    currency: 'USD',
    hasBalanceApi: true,
    website: 'https://openrouter.ai',
    rechargeUrl: 'https://openrouter.ai/credits',
    pricingUrl: 'https://openrouter.ai/models',
    models: [
      { name: 'GPT-4o (via OR)', input: 2.50, output: 10.00, unit: '1M tokens' },
      { name: 'Claude Sonnet 4 (via OR)', input: 3.00, output: 15.00, unit: '1M tokens' },
      { name: 'Gemini 2.5 Flash (via OR)', input: 0.15, output: 0.60, unit: '1M tokens' },
    ],
  },
  together: {
    id: 'together',
    name: 'Together AI',
    nameZh: 'Together AI',
    color: '#0891b2',
    currency: 'USD',
    hasBalanceApi: true,
    website: 'https://api.together.xyz',
    rechargeUrl: 'https://api.together.xyz/settings/billing',
    pricingUrl: 'https://www.together.ai/pricing',
    models: [
      { name: 'Llama 4 Maverick', input: 0.20, output: 0.60, unit: '1M tokens' },
      { name: 'DeepSeek-V3', input: 1.25, output: 1.25, unit: '1M tokens' },
      { name: 'Qwen 3 235B', input: 0.90, output: 0.90, unit: '1M tokens' },
    ],
  },
}

export function getProvider(id) {
  return PROVIDERS[id] || null
}

export function getConfiguredProviders(keys) {
  return Object.keys(PROVIDERS).filter(id => keys[id])
}
