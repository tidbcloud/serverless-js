export interface ServerlessError {
  message: string
  code: string
}

export class DatabaseError extends Error {
  details: ServerlessError | null
  status: number
  constructor(message: string, status: number, details: ServerlessError | null) {
    super(message)
    this.status = status
    this.details = details
  }
}
