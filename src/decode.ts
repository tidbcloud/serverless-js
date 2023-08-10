import { Field } from './index.js'

const decoder = new TextDecoder('utf-8')

export function decode(text: string | null): string {
  return text ? decoder.decode(Uint8Array.from(bytes(text))) : ''
}

function bytes(text: string): number[] {
  return text.split('').map((c) => c.charCodeAt(0))
}

export function cast(field: Field, value: string | null): any {
  if (value === '' || value == null) {
    return value
  }

  switch (field.type) {
    case 'INT':
    case 'INT8':
    case 'INT16':
    case 'INT24':
    case 'INT32':
    case 'UINT8':
    case 'UINT16':
    case 'UINT24':
    case 'UINT32':
    case 'YEAR':
      return parseInt(value, 10)
    case 'FLOAT32':
    case 'FLOAT64':
      return parseFloat(value)
    case 'DECIMAL':
    case 'INT64':
    case 'UINT64':
    case 'DATE':
    case 'TIME':
    case 'DATETIME':
    case 'TIMESTAMP':
    case 'BLOB':
    case 'BIT':
    case 'VARBINARY':
    case 'BINARY':
      return value
    case 'JSON':
      return JSON.parse(decode(value))
    default:
      return decode(value)
  }
}
