const DEFAULT_BASE_URL = 'https://api.godaddy.com'

export class GoDaddyApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message)
    this.name = 'GoDaddyApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function requireToken(token) {
  if (!token || !token.trim()) {
    throw new GoDaddyApiError(
      'GODADDY_PAT is not configured. Add a newly generated token to .env.local.',
    )
  }

  return token.trim()
}

async function readResponse(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

export function createGoDaddyClient({
  token = process.env.GODADDY_PAT,
  fetchImpl = globalThis.fetch,
  baseUrl = DEFAULT_BASE_URL,
} = {}) {
  const accessToken = requireToken(token)

  if (typeof fetchImpl !== 'function') {
    throw new GoDaddyApiError('A Fetch API implementation is required.')
  }

  async function request(path, { method = 'GET', body, signal } = {}) {
    if (typeof path !== 'string' || !path.startsWith('/')) {
      throw new GoDaddyApiError('GoDaddy API paths must start with "/".')
    }

    const response = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    })

    const payload = await readResponse(response)

    if (!response.ok) {
      const code =
        payload && typeof payload === 'object' && 'code' in payload
          ? payload.code
          : undefined
      const apiMessage =
        payload && typeof payload === 'object' && 'message' in payload
          ? payload.message
          : `GoDaddy API returned HTTP ${response.status}.`

      throw new GoDaddyApiError(apiMessage, {
        status: response.status,
        code,
        details: payload,
      })
    }

    return payload
  }

  return {
    request,
    listDomains({ limit = 1 } = {}) {
      const safeLimit = Math.max(1, Math.min(1000, Number(limit) || 1))
      return request(`/v1/domains?limit=${safeLimit}`)
    },
  }
}
