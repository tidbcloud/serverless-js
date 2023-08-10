import { Field } from './index.js'

const decoder = new TextDecoder('utf-8')

export function decode(text: string | null): string {
  return text ? decoder.decode(Uint8Array.from(bytes(text))) : ''
}

function bytes(text: string): number[] {
  return text.split('').map((c) => c.charCodeAt(0))
}

export function cast(field: Field, value: string | null): any {
  if (value == null) {
    return null
  }

  switch (field.type) {
    case 'TINYINT':
    case 'UNSIGNED TINYINT':
    case 'SMALLINT':
    case 'UNSIGNED SMALLINT':
    case 'MEDIUMINT':
    case 'INT':
    case 'UNSIGNED INT':
    case 'YEAR':
      if (value === '') {
        return null
      }
      return parseInt(value, 10)
    case 'FLOAT':
    case 'DOUBLE':
      if (value === '') {
        return null
      }
      return parseFloat(value)
    case 'DECIMAL':
    case 'BIGINT':
    case 'UNSIGNED BIGINT':
    case 'CHAR':
    case 'VARCHAR':
    case 'BINARY':
    case 'VARBINARY':
    case 'TINYTEXT':
    case 'TEXT':
    case 'MEDIUMTEXT':
    case 'LONGTEXT':
    case 'TINYBLOB':
    case 'BLOB':
    case 'MEDIUMBLOB':
    case 'LONGBLOB':
    case 'DATE':
    case 'TIME':
    case 'DATETIME':
    case 'TIMESTAMP':
    case 'BIT':
      // can not distinguish between empty string and null for nullable fields now.
      if (value === '' && !field.nullable) {
        return null
      }
      return value
    case 'JSON':
      if (value === '') {
        return null
      }
      return JSON.parse(decode(value))
    default:
      return decode(value)
  }
}
