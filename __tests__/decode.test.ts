import type { Field } from '../src'
import { ColumnType, type DecodeConfig } from '../src/config'
import { cast } from '../src/decode'

describe('decode', () => {
  describe('cast', () => {
    test('use default decode method if config not provided', () => {
      expect(cast(makeField(ColumnType.BIGINT), '21412421321421521321', {})).toEqual('21412421321421521321')
      expect(cast(makeField(ColumnType.FLOAT), '1.2', {})).toEqual(1.2)
      expect(cast(makeField(ColumnType.INT), '1', {})).toEqual(1)
    })

    test('override default decode method if config provided', () => {
      const config: DecodeConfig = {
        [ColumnType.BIGINT]: BigInt,
        [ColumnType.FLOAT]: String
      }

      expect(cast(makeField(ColumnType.BIGINT), '21412421321421521321', config)).toEqual(21412421321421521321n)
      expect(cast(makeField(ColumnType.FLOAT), '1.2', config)).toEqual('1.2')
      expect(cast(makeField(ColumnType.INT), '1', config)).toEqual(1)
    })
  })
})

function makeField(type: ColumnType): Field {
  return {
    name: 'foo',
    type: type,
    nullable: false
  }
}
