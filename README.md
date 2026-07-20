# Token Balance Dashboard

Cloudflare Pages dashboard for checking AI provider credit balances. Provider API keys remain server-side in Cloudflare Pages environment variables and are never sent to the browser.

## Configure

Copy `.dev.vars.example` to `.dev.vars` and set only the provider keys you use. For deployment, add the same variables under Cloudflare Pages > Settings > Variables and Secrets.

```powershell
Copy-Item .dev.vars.example .dev.vars
npm install
npm run dev:pages
```

The local site and API are then available at `http://localhost:8788`. `npm run dev` starts only Vite's frontend server, so use `dev:pages` when testing API-backed balances.

## Web Admin

The deployed site has a protected `/admin` page. Sign in with the administrator password, open the `API 密钥` tab, paste a provider key, and click `保存`. The key is stored in Cloudflare KV and becomes available to the balance API immediately; it is never returned to the browser after saving. You can configure or replace keys from this page at any time without editing a file or visiting Cloudflare.

The balance API URLs are built in. The server configuration uses these variable names internally:

| Provider | Environment variable | Built-in balance API |
| --- | --- | --- |
| OpenAI | `OPENAI_API_KEY` | `https://api.openai.com/v1/organization/credit_grants` |
| Anthropic | `ANTHROPIC_API_KEY` | Admin billing credits API (requires an Admin API key) |
| DeepSeek | `DEEPSEEK_API_KEY` | `https://api.deepseek.com/user/balance` |
| OpenRouter | `OPENROUTER_API_KEY` | `https://openrouter.ai/api/v1/credits` |
| Together AI | `TOGETHER_API_KEY` | `https://api.together.xyz/v1/billing/credits` |

For local-only development, `.dev.vars` remains supported as a fallback when no KV binding is available.

## Balance API

`GET /api/balance` returns balances for configured providers.

`GET /api/balance/:provider` returns one provider. Supported identifiers are `openai`, `anthropic`, `deepseek`, `google`, `groq`, `openrouter`, and `together`.

```json
{
  "provider": "deepseek",
  "balance": 12.34,
  "currency": "CNY",
  "status": "ok"
}
```

Possible statuses: `ok`, `unconfigured`, `unsupported`, and `error`. `error` includes `errorMessage` and never exposes a provider API key.

Google AI and Groq do not provide a key-scoped balance API. Anthropic balance lookup requires an Admin API key with billing access; a standard Anthropic API key will return `error` rather than a fabricated balance.
