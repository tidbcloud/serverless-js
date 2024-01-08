import { Config } from './config.js'
import { DatabaseError } from './error.js'
import { Version } from './version.js'
export async function postQuery<T>(config: Config, body, session = '', isolationLevel = null, debug): Promise<T> {
  let fetchCacheOption: Record<string, any> = { cache: 'no-store' }
  // Cloudflare Workers does not support cache now https://github.com/cloudflare/workerd/issues/69
  try {
    new Request('x:', fetchCacheOption)
  } catch (err) {
    fetchCacheOption = {}
  }

  // generate request Id
  const requestId = generateUniqueId()
  if (debug) {
    console.log(`[serverless-js debug] request id: ${requestId}`)
  }

  const url = new URL('/v1beta/sql', `https://http-${config.host}`)
  const auth = btoa(`${config.username}:${config.password}`)
  const { fetch } = config
  const database = config.database ?? ''
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': `serverless-js/${Version}`,
    Authorization: `Basic ${auth}`,
    'TiDB-Database': database,
    'TiDB-Session': session,
    'X-Debug-Trace-Id': requestId
  }
  if (isolationLevel) {
    headers['TiDB-Isolation-Level'] = isolationLevel
  }
  const response = await fetch(url.toString(), {
    method: 'POST',
    body: body,
    headers,
    ...fetchCacheOption
  })

  if (debug) {
    const traceId = response?.headers?.get('X-Debug-Trace-Id')
    console.log(`[serverless-js debug] response id: ${traceId}`)
  }

  if (response.ok) {
    const resp = await response.json()
    const session = response.headers.get('TiDB-Session')
    resp.session = session ?? ''
    return resp
  } else {
    let error
    try {
      const e = await response.json()
      error = new DatabaseError(e.message, response.status, e)
    } catch {
      error = new DatabaseError(response.statusText, response.status, null)
    }
    throw error
  }
}

// simulate xid
function generateUniqueId() {
  const datetime = new Date().toISOString().replace(/[^\d]/g, '').slice(0, 14)
  return `${datetime}${randomString(20)}`
}

function randomString(n) {
  let result = ''
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const l = characters.length
  for (let i = 0; i < n; i++) {
    result += characters[Math.floor(Math.random() * l)]
  }
  return result
}
