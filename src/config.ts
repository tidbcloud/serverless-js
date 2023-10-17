type Req = {
  method: string
  headers: Record<string, string>
  body: string
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
}

export interface ExecuteOptions {
  arrayMode?: boolean
  fullResult?: boolean
}

export enum IsolationLevel {
  ReadUncommitted = 'READ UNCOMMITTED',
  ReadCommitted = 'READ COMMITTED',
  RepeatableRead = 'REPEATABLE READ',
  Serializable = 'SERIALIZABLE'
}

export interface TxOptions {
  Isolation?: IsolationLevel
}

export type ExecuteArgs = object | any[] | null
