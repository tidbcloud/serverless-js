import { format } from './format.js'
import { cast } from './decode.js'
import { DatabaseError } from './error.js'
import { Config, ExecuteOptions, ExecuteArgs } from './config.js'
import { postQuery } from './serverless.js'

// serverless driver returns a full result by default
type Row = Record<string, any> | any[]
type Types = Record<string, string>
interface FullResult {
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

class Tx {
  private conn: Connection

  constructor(conn: Connection) {
    this.conn = conn
  }

  async execute(query: string, args: ExecuteArgs = null, options: ExecuteOptions = defaultExecuteOptions): Promise<FullResult | Row[]> {
    return this.conn.execute(query, args, options)
  }

  async commit(): Promise<FullResult | Row[]> {
    return this.conn.execute('COMMIT')
  }

  async rollback(): Promise<FullResult | Row[]> {
    return this.conn.execute('ROLLBACK')
  }
}

class Connection {
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
      this.config.username = url.username
      this.config.password = url.password
      this.config.host = url.hostname
      this.config.database = url.pathname.slice(1)
    }
  }

  async begin(): Promise<Tx> {
    const conn = new Connection(this.config)
    const tx = new Tx(conn)
    await tx.execute('BEGIN')
    return tx
  }

  async execute(query: string, args: ExecuteArgs = null, options: ExecuteOptions = defaultExecuteOptions): Promise<FullResult | Row[]> {
    const sql = args ? format(query, args) : query
    const body = JSON.stringify({ query: sql })
    const resp = await postQuery<QueryExecuteResponse>(this.config, body, this.session ?? '')

    this.session = resp?.session ?? null
    if (this.session === null) {
      throw new DatabaseError('empty session, please try again', 500, null)
    }
    const rowsAffected = resp?.rowsAffected ?? 0
    const lastInsertId = resp?.lastInsertID ?? null

    const fields = resp?.types ?? []
    const typeByName = (acc, { name, type }) => ({ ...acc, [name]: type })
    const types = fields.reduce<Types>(typeByName, {})

    const datas = resp?.rows ?? []
    const rows = resp ? parse(fields, datas, cast, options.arrayMode || false) : []

    if (options.fullResult) {
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
