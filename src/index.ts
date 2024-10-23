import { format } from './format.js'
import { cast } from './decode.js'
import { DatabaseError } from './error.js'
import { Config, ExecuteOptions, ExecuteArgs, TxOptions, Decoders, ColumnType } from './config.js'
import { postQuery } from './serverless.js'

export { Config, ExecuteOptions, ExecuteArgs, DatabaseError, Decoders, ColumnType }

// serverless driver returns a full result by default
export type Row = Record<string, any> | any[]
export type Types = Record<string, string>
export interface FullResult {
  types: Types | null
  rows: Row[] | null
  statement: string
  rowCount: number | null
  rowsAffected: number | null
  lastInsertId: string | null
}

// serverless backend results
type Session = string | null
export interface Field {
  name: string
  type: string
  nullable: boolean
}
interface QueryExecuteResponse {
  session: Session
  types: Field[] | null
  rows: string[][] | null
  rowsAffected: number | null
  sLastInsertID: string | null
}

const defaultExecuteOptions: ExecuteOptions = {}

export class Tx<T extends Config> {
  private conn: Connection<T>

  constructor(conn: Connection<T>) {
    this.conn = conn
  }

  async execute<E extends ExecuteOptions>(
    query: string,
    args: ExecuteArgs = null,
    options: E = defaultExecuteOptions as E,
    txOptions: TxOptions = {}
  ): Promise<
    E extends { fullResult: boolean }
      ? E['fullResult'] extends true
        ? FullResult
        : Row[]
      : T['fullResult'] extends true
      ? FullResult
      : Row[]
  > {
    return this.conn.execute(query, args, options, txOptions)
  }

  async commit(): Promise<T['fullResult'] extends true ? FullResult : Row[]> {
    return this.conn.execute('COMMIT')
  }

  async rollback(): Promise<T['fullResult'] extends true ? FullResult : Row[]> {
    return this.conn.execute('ROLLBACK')
  }
}

export class Connection<T extends Config> {
  private config: T
  private session: Session

  constructor(config: T) {
    this.session = null
    this.config = { ...config }

    if (typeof fetch !== 'undefined') {
      this.config.fetch ||= fetch
    }

    if (config.url) {
      const url = new URL(config.url)
      if (!this.config.username) {
        this.config.username = decodeURIComponent(url.username)
      }
      if (!this.config.password) {
        this.config.password = decodeURIComponent(url.password)
      }
      if (!this.config.host) {
        this.config.host = url.hostname
      }
      if (!this.config.database) {
        this.config.database = decodeURIComponent(url.pathname.slice(1))
      }
    }
  }

  getConfig(): Config {
    return this.config
  }

  async begin(txOptions: TxOptions = {}) {
    const conn = new Connection<T>(this.config)
    const tx = new Tx<T>(conn)
    await tx.execute<T>('BEGIN', undefined, undefined, txOptions)
    return tx
  }

  async execute<E extends ExecuteOptions>(
    query: string,
    args: ExecuteArgs = null,
    options: E = defaultExecuteOptions as E,
    txOptions: TxOptions = {}
  ): Promise<
    E extends { fullResult: boolean }
      ? E['fullResult'] extends true
        ? FullResult
        : Row[]
      : T['fullResult'] extends true
      ? FullResult
      : Row[]
  > {
    const sql = args ? format(query, args) : query
    const body = JSON.stringify({ query: sql })
    const debug = options.debug ?? this.config.debug ?? false
    if (debug) {
      console.log(`[serverless-js debug] sql: ${sql}`)
    }
    const resp = await postQuery<QueryExecuteResponse>(
      this.config,
      body,
      this.session ?? '',
      sql == 'BEGIN' ? txOptions.isolation : null,
      debug
    )

    this.session = resp?.session ?? null
    if (this.session === null || this.session === '') {
      throw new DatabaseError('empty session, please try again', 500, null)
    }

    const arrayMode = options.arrayMode ?? this.config.arrayMode ?? false
    const fullResult = options.fullResult ?? this.config.fullResult ?? false
    const decoders = { ...this.config.decoders, ...options.decoders }

    const fields = resp?.types ?? []
    const rows = resp ? parse(fields, resp?.rows ?? [], cast, arrayMode, decoders) : []

    if (fullResult) {
      const rowsAffected = resp?.rowsAffected ?? null
      const lastInsertId = resp?.sLastInsertID ?? null
      const typeByName = (acc, { name, type }) => ({ ...acc, [name]: type })
      const types = fields.reduce<Types>(typeByName, {})
      return {
        statement: sql,
        types,
        rows,
        rowsAffected,
        lastInsertId,
        rowCount: rows.length
      } as any
    }

    return rows as any
  }
}

export function connect<T extends Config>(config: T): Connection<T> {
  return new Connection<T>(config)
}

type Cast = typeof cast

function parseArrayRow(fields: Field[], rawRow: string[], cast: Cast, decoders: Decoders): Row {
  return fields.map((field, ix) => {
    return cast(field, rawRow[ix], decoders)
  })
}

function parseObjectRow(fields: Field[], rawRow: string[], cast: Cast, decoders: Decoders): Row {
  return fields.reduce((acc, field, ix) => {
    acc[field.name] = cast(field, rawRow[ix], decoders)
    return acc
  }, {} as Row)
}

function parse(fields: Field[], rows: string[][], cast: Cast, arrayMode: boolean, decode: Decoders): Row[] {
  return rows.map((row) => (arrayMode === true ? parseArrayRow(fields, row, cast, decode) : parseObjectRow(fields, row, cast, decode)))
}
