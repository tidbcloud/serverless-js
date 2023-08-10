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
}

export interface ExecuteOptions {
  arrayMode?: boolean
  fullResult?: boolean
}

export type ExecuteArgs = object | any[] | null
