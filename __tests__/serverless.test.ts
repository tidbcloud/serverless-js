import { connect } from '../dist/index'

const host = 'gateway01.us-east-1.prod.aws.tidbcloud.com'

function mockFetch() {
  return jest.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => 'session-token' },
    json: async () => ({ types: [], rows: [] })
  })
}

describe('gateway credential confinement', () => {
  test.each([
    'gateway.tidbcloud.com@evil.com',
    'evil.com',
    'tidbcloud.com.evil.com',
    'evil-tidbcloud.com',
    'tidbcloud.com',
    'gateway.tidbcloud.com:443',
    'gateway.tidbcloud.com/path',
    'gateway.tidbcloud.com?query',
    'gateway.tidbcloud.com#fragment',
    'gateway.tidbcloud.com\\@evil.com',
    'gateway.tidbcloud.com%40evil.com',
    'gateway%2etidbcloud.com',
    'https://gateway.tidbcloud.com',
    ' gateway.tidbcloud.com',
    'gateway.tidbcloud.com\n',
    'gateway.tidbcloud.com.',
    'gateway..tidbcloud.com',
    '-gateway.tidbcloud.com',
    'gateway-.tidbcloud.com',
    'gate_way.tidbcloud.com',
    '127.0.0.1',
    '[::1]',
    'gаteway.tidbcloud.com', // Cyrillic a
    `${'a'.repeat(59)}.tidbcloud.com`,
    `gateway.${'a'.repeat(64)}.tidbcloud.com`,
    undefined,
    ''
  ])('rejects %s before calling fetch', async (invalidHost) => {
    const fetch = mockFetch()
    const conn = connect({ host: invalidHost, username: 'user', password: 'secret', fetch })
    await expect(conn.execute('select sensitive_data')).rejects.toThrow('Invalid host')
    expect(fetch).not.toHaveBeenCalled()
  })

  test.each([host, host.toUpperCase(), `${'a'.repeat(58)}.tidbcloud.com`])('accepts valid host %s', async (validHost) => {
    const fetch = mockFetch()
    const conn = connect({ host: validHost, username: 'user', password: 'secret', fetch })
    await expect(conn.execute('select 1')).resolves.toEqual([])
    expect(fetch).toHaveBeenCalledWith(
      `https://http-${validHost.toLowerCase()}/v1beta/sql`,
      expect.objectContaining({
        redirect: 'error',
        body: JSON.stringify({ query: 'select 1' }),
        headers: expect.objectContaining({ Authorization: `Basic ${btoa('user:secret')}` })
      })
    )
  })

  test('validates the hostname extracted from a connection URL', async () => {
    const fetch = mockFetch()
    const conn = connect({ url: 'mysql://user:secret@gateway.tidbcloud.com@evil.com/db', fetch })
    await expect(conn.execute('select 1')).rejects.toThrow('Invalid host')
    expect(fetch).not.toHaveBeenCalled()
  })

  test('accepts a valid connection URL', async () => {
    const fetch = mockFetch()
    const conn = connect({ url: `mysql://user:secret@${host}:4000/db`, fetch })
    await expect(conn.execute('select 1')).resolves.toEqual([])
    expect(fetch.mock.calls[0][0]).toBe(`https://http-${host}/v1beta/sql`)
  })

  test('revalidates mutated config before sending credentials, session or SQL', async () => {
    const fetch = mockFetch()
    const conn = connect({ host, username: 'user', password: 'secret', fetch })
    await conn.execute('select 1')
    fetch.mockClear()
    conn.getConfig().host = 'gateway.tidbcloud.com@evil.com'
    await expect(conn.execute('select sensitive_data')).rejects.toThrow('Invalid host')
    await expect(conn.begin()).rejects.toThrow('Invalid host')
    await expect(conn.persist()).rejects.toThrow('Invalid host')
    expect(fetch).not.toHaveBeenCalled()
  })
})
