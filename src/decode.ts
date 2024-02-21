import {Decoders} from './config'
import {Field} from './index.js'

export function cast(field: Field, value: string | null, decoder: Decoders): any {
  if (value === null) {
    return null
  }

  // use user provided decoder if exists
  if (decoder[field.type]) {
    return decoder[field.type](value)
  }

  switch (field.type) {
    // bool will be converted to TINYINT
    case 'TINYINT':
    case 'UNSIGNED TINYINT':
    case 'SMALLINT':
    case 'UNSIGNED SMALLINT':
    case 'MEDIUMINT':
    case 'UNSIGNED MEDIUMINT':
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
    case 'TEXT':
    case 'MEDIUMTEXT':
    case 'LONGTEXT':
    case 'TINYTEXT':
    case 'DATE':
    case 'TIME':
    case 'DATETIME':
    case 'TIMESTAMP':
      return value
    case 'BLOB':
    case 'TINYBLOB':
    case 'MEDIUMBLOB':
    case 'LONGBLOB':
    case 'BINARY':
    case 'VARBINARY':
    case 'BIT':
      return hexToUint8Array(value)
    case 'JSON':
      return JSON.parse(value)
    default:
      return value
  }
}

function hexToUint8Array(hexString: string): Uint8Array {
  const uint8Array = new Uint8Array(hexString.length / 2);
  for (let i = 0; i < hexString.length; i += 2) {
    uint8Array[i / 2] = parseInt(hexString.substring(i, i + 2), 16);
  }
  return uint8Array;
}