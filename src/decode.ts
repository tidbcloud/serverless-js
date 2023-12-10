import { Field } from './index.js'

export function cast(field: Field, value: string | null): any {
  if (value === null) {
    return null
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
