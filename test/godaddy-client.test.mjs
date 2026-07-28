import assert from 'node:assert/strict'
import test from 'node:test'

import {
  createGoDaddyClient,
  GoDaddyApiError,
} from '../scripts/godaddy-client.mjs'

function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

test('requires a GoDaddy personal access token', () => {
  assert.throws(
    () => createGoDaddyClient({ token: '' }),
    (error) =>
      error instanceof GoDaddyApiError &&
      error.message.includes('GODADDY_PAT'),
  )
})

test('uses bearer authentication and the production API endpoint', async () => {
  let capturedUrl
  let capturedOptions
  const fetchImpl = async (url, options) => {
    capturedUrl = url
    capturedOptions = options
    return jsonResponse([])
  }

  const client = createGoDaddyClient({
    token: 'replacement-test-token',
    fetchImpl,
  })
  await client.listDomains({ limit: 2 })

  assert.equal(capturedUrl, 'https://api.godaddy.com/v1/domains?limit=2')
  assert.equal(
    capturedOptions.headers.Authorization,
    'Bearer replacement-test-token',
  )
  assert.equal(capturedOptions.method, 'GET')
})

test('clamps the domain-list limit to the supported range', async () => {
  let capturedUrl
  const client = createGoDaddyClient({
    token: 'replacement-test-token',
    fetchImpl: async (url) => {
      capturedUrl = url
      return jsonResponse([])
    },
  })

  await client.listDomains({ limit: 5000 })
  assert.equal(capturedUrl, 'https://api.godaddy.com/v1/domains?limit=1000')
})

test('returns structured API errors without including the token', async () => {
  const token = 'replacement-test-token'
  const client = createGoDaddyClient({
    token,
    fetchImpl: async () =>
      jsonResponse(
        { code: 'UNAUTHORIZED', message: 'Authentication failed.' },
        { status: 401 },
      ),
  })

  await assert.rejects(
    client.listDomains(),
    (error) =>
      error instanceof GoDaddyApiError &&
      error.status === 401 &&
      error.code === 'UNAUTHORIZED' &&
      !error.message.includes(token),
  )
})
