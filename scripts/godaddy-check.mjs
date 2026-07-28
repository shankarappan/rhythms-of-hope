import { loadEnvFile } from 'node:process'

import { createGoDaddyClient, GoDaddyApiError } from './godaddy-client.mjs'

try {
  loadEnvFile('.env.local')
} catch (error) {
  if (error?.code !== 'ENOENT') {
    throw error
  }
}

try {
  const client = createGoDaddyClient()
  const domains = await client.listDomains({ limit: 1 })
  const returned = Array.isArray(domains) ? domains.length : 0

  console.log(
    `GoDaddy API connection succeeded (${returned} domain record${returned === 1 ? '' : 's'} returned by the access check).`,
  )
} catch (error) {
  if (error instanceof GoDaddyApiError) {
    const context = [
      error.status ? `HTTP ${error.status}` : null,
      error.code || null,
    ]
      .filter(Boolean)
      .join(' / ')

    console.error(
      `GoDaddy API connection failed${context ? ` (${context})` : ''}: ${error.message}`,
    )
    process.exitCode = 1
  } else {
    throw error
  }
}
