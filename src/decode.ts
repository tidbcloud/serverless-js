import type { DecodeConfig } from './config'
import { Field } from './index.js'

export function cast(field: Field, value: string | null, decode: DecodeConfig): any {
  if (value === null) {
    return null
  }

  // use user provided decoder if exists
  if (decode[field.type]) {
    return decode[field.type](value)
  }

  switch (field.type) {
    // bool will be converted to TINYINT
    case 'TINYINT':
    case 'UNSIGNED TINYINT':
    case 'SMALLINT':
    case 'UNSIGNED SMALLINT':
    case 'MEDIUMINT':
    case 'INT':
    case 'UNSIGNED INT':
    case 'YEAR':
      return parseInt(value, 10)
    case 'FLOAT':
    case 'DOUBLE':
      return parseFloat(value)
    // set and enum will be converted to char.
    case 'BIGINT':
    case 'UNSIGNED BIGINT':
    case 'DECIMAL':
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
      return value
    case 'JSON':
      return JSON.parse(value)
    default:
      return value
  }
}
