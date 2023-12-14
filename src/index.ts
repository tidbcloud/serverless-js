import { format } from './format.js'
import { cast } from './decode.js'
import { DatabaseError } from './error.js'
import { Config, ExecuteOptions, ExecuteArgs, TxOptions } from './config.js'
import { postQuery } from './serverless.js'

export { Config, ExecuteOptions, ExecuteArgs, DatabaseError }

// serverless driver returns a full result by default
export type Row = Record<string, any> | any[]
export type Types = Record<string, string>
export interface FullResult {
  types: Types | null
  rows: Row[] | null
  statement: string
  rowCount: number | null
  rowsAffected: number | null
  lastInsertId: number | null
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
  lastInsertID: number | null
}

const defaultExecuteOptions: ExecuteOptions = {
  arrayMode: false,
  fullResult: false
}

export class Tx {
  private conn: Connection

  constructor(conn: Connection) {
    this.conn = conn
  }

  async execute(
    query: string,
    args: ExecuteArgs = null,
    options: ExecuteOptions = defaultExecuteOptions,
    txOptions: TxOptions = {}
  ): Promise<FullResult | Row[]> {
    return this.conn.execute(query, args, options, txOptions)
  }

  async commit(): Promise<FullResult | Row[]> {
    return this.conn.execute('COMMIT')
  }

  async rollback(): Promise<FullResult | Row[]> {
    return this.conn.execute('ROLLBACK')
  }
}

export class Connection {
  private config: Config
  private session: Session

  constructor(config: Config) {
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

  async begin(txOptions: TxOptions = {}): Promise<Tx> {
    const conn = new Connection(this.config)
    const tx = new Tx(conn)
    await tx.execute('BEGIN', undefined, undefined, txOptions)
    return tx
  }

  async execute(
    query: string,
    args: ExecuteArgs = null,
    options: ExecuteOptions = defaultExecuteOptions,
    txOptions: TxOptions = {}
  ): Promise<FullResult | Row[]> {
    const sql = args ? format(query, args) : query
    const body = JSON.stringify({ query: sql })
    const resp = await postQuery<QueryExecuteResponse>(this.config, body, this.session ?? '', sql == 'BEGIN' ? txOptions.isolation : null)

    this.session = resp?.session ?? null
    if (this.session === null || this.session === '') {
      throw new DatabaseError('empty session, please try again', 500, null)
    }

    const arrayMode = options.arrayMode ?? this.config.arrayMode ?? false
    const fullResult = options.fullResult ?? this.config.arrayMode ?? false

    const fields = resp?.types ?? []
    const rows = resp ? parse(fields, resp?.rows ?? [], cast, arrayMode) : []

    if (fullResult) {
      const rowsAffected = resp?.rowsAffected ?? 0
      const lastInsertId = resp?.lastInsertID ?? null
      const typeByName = (acc, { name, type }) => ({ ...acc, [name]: type })
      const types = fields.reduce<Types>(typeByName, {})
      return {
        statement: sql,
        types,
        rows,
        rowsAffected,
        lastInsertId,
        rowCount: rows.length
      }
    }
    return rows
  }
}

export function connect(config: Config): Connection {
  return new Connection(config)
}

type Cast = typeof cast
function parseArrayRow(fields: Field[], rawRow: string[], cast: Cast): Row {
  return fields.map((field, ix) => {
    return cast(field, rawRow[ix])
  })
}

function parseObjectRow(fields: Field[], rawRow: string[], cast: Cast): Row {
  return fields.reduce((acc, field, ix) => {
    acc[field.name] = cast(field, rawRow[ix])
    return acc
  }, {} as Row)
}

function parse(fields: Field[], rows: string[][], cast: Cast, arrayMode: boolean): Row[] {
  return rows.map((row) => (arrayMode === true ? parseArrayRow(fields, row, cast) : parseObjectRow(fields, row, cast)))
}
