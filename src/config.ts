type Req = {
  method: string
  headers: Record<string, string>
  body: string
  signal?: any
  cache?: RequestCache
}

type Res = {
  ok: boolean
  status: number
  statusText: string
  headers: any
  json(): Promise<any>
  text(): Promise<string>
}

export interface Config {
  url?: string
  username?: string
  password?: string
  database?: string
  host?: string
  fetch?: (input: string, init?: Req) => Promise<Res>
  arrayMode?: boolean
  fullResult?: boolean
  decoders?: Decoders
  debug?: boolean
}

export interface ExecuteOptions {
  arrayMode?: boolean
  fullResult?: boolean
  decoders?: Decoders
  debug?: boolean
}

export interface TxOptions {
  isolation?: 'READ COMMITTED' | 'REPEATABLE READ'
}

export type ExecuteArgs = object | any[] | null

export const enum ColumnType {
  TINYINT = 'TINYINT',
  UNSIGNED_TINYINT = 'UNSIGNED TINYINT',
  SMALLINT = 'SMALLINT',
  UNSIGNED_SMALLINT = 'UNSIGNED SMALLINT',
  MEDIUMINT = 'MEDIUMINT',
  UNSIGNED_MEDIUMINT = 'UNSIGNED MEDIUMINT',
  INT = 'INT',
  UNSIGNED_INT = 'UNSIGNED INT',
  YEAR = 'YEAR',
  FLOAT = 'FLOAT',
  DOUBLE = 'DOUBLE',
  BIGINT = 'BIGINT',
  UNSIGNED_BIGINT = 'UNSIGNED BIGINT',
  DECIMAL = 'DECIMAL',
  CHAR = 'CHAR',
  VARCHAR = 'VARCHAR',
  BINARY = 'BINARY',
  VARBINARY = 'VARBINARY',
  TINYTEXT = 'TINYTEXT',
  TEXT = 'TEXT',
  MEDIUMTEXT = 'MEDIUMTEXT',
  LONGTEXT = 'LONGTEXT',
  TINYBLOB = 'TINYBLOB',
  BLOB = 'BLOB',
  MEDIUMBLOB = 'MEDIUMBLOB',
  LONGBLOB = 'LONGBLOB',
  DATE = 'DATE',
  TIME = 'TIME',
  DATETIME = 'DATETIME',
  TIMESTAMP = 'TIMESTAMP',
  BIT = 'BIT',
  JSON = 'JSON'
}

export type Decoders = {
  [P in ColumnType]?: (rawValue: string) => any
}
