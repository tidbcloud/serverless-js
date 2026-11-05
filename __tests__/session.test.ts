import { connect, Config } from '../dist/index'

function response(session: string) {
  return {
    ok: true,
    headers: { get: () => session },
    json: async () => ({ types: [], rows: [] })
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

function connection(fetch: Config['fetch']) {
  return connect({ host: 'gateway.example.com', username: 'user', password: 'secret', fetch })
}

describe('connection concurrency', () => {
  test('rejects overlap without sending another query and preserves the returned session', async () => {
    const pending = deferred<ReturnType<typeof response>>()
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(response('initial'))
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(response('next'))
    const conn = connection(fetch)
    await conn.execute('select 1')
    const first = conn.execute('select 2')
    try {
      await expect(conn.execute('select 3')).rejects.toThrow('already in progress')
      expect(fetch).toHaveBeenCalledTimes(2)
      expect(fetch.mock.calls[1][1].headers['TiDB-Session']).toBe('initial')
    } finally {
      pending.resolve(response('updated'))
      await first
    }
    await conn.execute('select 4')
    expect(fetch.mock.calls[2][1].headers['TiDB-Session']).toBe('updated')
  })

  test('allows retry after a failed request', async () => {
    const pending = deferred<ReturnType<typeof response>>()
    const fetch = jest.fn().mockReturnValueOnce(pending.promise).mockResolvedValue(response('recovered'))
    const conn = connection(fetch)
    const first = conn.execute('select 1')
    const failure = expect(first).rejects.toThrow('network failure')
    pending.reject(new Error('network failure'))
    await failure
    await expect(conn.execute('select 2')).resolves.toEqual([])
  })

  test('allows retry after an invalid session response', async () => {
    const fetch = jest.fn().mockResolvedValueOnce(response('')).mockResolvedValue(response('recovered'))
    const conn = connection(fetch)
    await expect(conn.execute('select 1')).rejects.toThrow('empty session')
    await expect(conn.execute('select 2')).resolves.toEqual([])
  })

  test.each(['commit', 'rollback'] as const)('rejects overlapping transaction %s', async (operation) => {
    const pending = deferred<ReturnType<typeof response>>()
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(response('transaction'))
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(response('done'))
    const tx = await connection(fetch).begin()
    const first = tx.execute('select 1')
    try {
      await expect(tx[operation]()).rejects.toThrow('already in progress')
      expect(fetch).toHaveBeenCalledTimes(2)
    } finally {
      pending.resolve(response('transaction-updated'))
      await first
    }
    await tx[operation]()
    expect(fetch.mock.calls[2][1].headers['TiDB-Session']).toBe('transaction-updated')
  })

  test('rejects overlapping stateful close', async () => {
    const pending = deferred<ReturnType<typeof response>>()
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(response('stateful'))
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(response('done'))
    const stateful = await connection(fetch).persist()
    const first = stateful.execute('select 1')
    try {
      await expect(stateful.close()).rejects.toThrow('already in progress')
      expect(fetch).toHaveBeenCalledTimes(2)
    } finally {
      pending.resolve(response('stateful-updated'))
      await first
    }
    await stateful.close()
    expect(fetch.mock.calls[2][1].headers['TiDB-Session']).toBe('stateful-updated')
  })

  test('allows independent transaction and stateful connections to run concurrently', async () => {
    const pending = deferred<ReturnType<typeof response>>()
    const fetch = jest
      .fn()
      .mockResolvedValueOnce(response('tx'))
      .mockResolvedValueOnce(response('stateful'))
      .mockReturnValueOnce(pending.promise)
      .mockResolvedValue(response('other'))
    const conn = connection(fetch)
    const tx = await conn.begin()
    const stateful = await conn.persist()
    const first = tx.execute('select 1')
    try {
      await expect(stateful.execute('select 2')).resolves.toEqual([])
      await expect(conn.execute('select 3')).resolves.toEqual([])
      expect(fetch.mock.calls[2][1].headers['TiDB-Session']).toBe('tx')
      expect(fetch.mock.calls[3][1].headers['TiDB-Session']).toBe('stateful')
      expect(fetch.mock.calls[4][1].headers['TiDB-Session']).toBe('')
    } finally {
      pending.resolve(response('tx-updated'))
      await first
    }
  })
})
