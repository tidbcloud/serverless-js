import { connect } from '../dist/index'

const host = 'gateway01.us-east-1.prod.aws.tidbcloud.com'

function mockFetch() {
  return jest.fn().mockResolvedValue({
    ok: true,
    headers: { get: () => 'session-token' },
    json: async () => ({ types: [], rows: [] })
  })
}

test.each([
  ["SELECT 'Are you sure?', ?", [' OR 1=1 -- '], "SELECT 'Are you sure?', ' OR 1=1 -- '"],
  ["SELECT '00:00:00', :id", { '00': ' OR 1=1 -- ', id: 5 }, "SELECT '00:00:00', 5"]
])('sends SQL with only unquoted placeholders substituted: %s', async (query, args, expected) => {
  const fetch = mockFetch()
  const conn = connect({ host, username: 'user', password: 'secret', fetch })
  await conn.execute(query, args)
  expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ query: expected })
})

describe('gateway hostname validation', () => {
  test.each([
    'gateway.tidbcloud.com@evil.com',
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
    'gateway..tidbcloud.com',
    '-gateway.tidbcloud.com',
    'gateway-.tidbcloud.com',
    'gate_way.tidbcloud.com',
    '[::1]',
    'gаteway.tidbcloud.com', // Cyrillic a
    `${'a'.repeat(59)}.example.com`,
    `${'a'.repeat(58)}.${('a'.repeat(63) + '.').repeat(3)}example.com`,
    `gateway.${'a'.repeat(64)}.tidbcloud.com`,
    undefined,
    ''
  ])('rejects %s before calling fetch', async (invalidHost) => {
    const fetch = mockFetch()
    const conn = connect({ host: invalidHost, username: 'user', password: 'secret', fetch })
    await expect(conn.execute('select sensitive_data')).rejects.toThrow('Invalid host')
    expect(fetch).not.toHaveBeenCalled()
  })

  test.each([host, host.toUpperCase(), 'gateway.example.com', 'gateway.example.com.', 'localhost', `${'a'.repeat(58)}.example.com`])(
    'accepts valid host %s',
    async (validHost) => {
      const fetch = mockFetch()
      const conn = connect({ host: validHost, username: 'user', password: 'secret', fetch })
      await expect(conn.execute('select 1')).resolves.toEqual([])
      expect(fetch).toHaveBeenCalledWith(
        `https://http-${validHost.toLowerCase()}/v1beta/sql`,
        expect.objectContaining({
          body: JSON.stringify({ query: 'select 1' }),
          headers: expect.objectContaining({ Authorization: `Basic ${btoa('user:secret')}` })
        })
      )
    }
  )

  test.each([host, 'gateway.example.com'])('accepts a connection URL with host %s', async (urlHost) => {
    const fetch = mockFetch()
    const conn = connect({ url: `mysql://user:secret@${urlHost}:4000/db`, fetch })
    await expect(conn.execute('select 1')).resolves.toEqual([])
    expect(fetch.mock.calls[0][0]).toBe(`https://http-${urlHost}/v1beta/sql`)
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
