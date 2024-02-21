import { connect, Row, FullResult } from '../dist/index'
import { fetch } from 'undici'
import * as dotenv from 'dotenv'
import { uint8ArrayToHex } from '../src/format'

dotenv.config()
const databaseURL = process.env.DATABASE_URL
const database = 'test_serverless_type'
const table = 'multi_data_type'
const multiDataTable = `
    CREATE TABLE ${database}.${table}(
    t_tinyint            TINYINT,
    t_tinyint_unsigned   TINYINT UNSIGNED,
    t_smallint           SMALLINT,
    t_smallint_unsigned  SMALLINT UNSIGNED,
    t_mediumint          MEDIUMINT,
    t_mediumint_unsigned MEDIUMINT UNSIGNED,
    t_int                INT,
    t_int_unsigned       INT UNSIGNED,
    t_bigint             BIGINT,
    t_bigint_unsigned    BIGINT UNSIGNED,
    t_boolean            BOOLEAN,
    t_float              FLOAT(6, 2),
    t_double             DOUBLE(6, 2),
    t_decimal            DECIMAL(38, 19),
    t_char               CHAR,
    t_varchar            VARCHAR(10),
    c_binary             binary(3),
    c_varbinary          varbinary(16),
    t_tinytext           TINYTEXT,
    t_text               TEXT,
    t_mediumtext         MEDIUMTEXT,
    t_longtext           LONGTEXT,
    t_tinyblob           TINYBLOB,
    t_blob               BLOB,
    t_mediumblob         MEDIUMBLOB,
    t_longblob           LONGBLOB,
    t_date               DATE,
    t_datetime           DATETIME,
    t_timestamp          TIMESTAMP NULL,
    t_time               TIME,
    t_year               YEAR,
    t_enum               ENUM ('enum1', 'enum2', 'enum3'),
    t_set                SET ('a', 'b', 'c'),
    t_bit                BIT(64),
    t_json               JSON
);
`

const nullResult = {
  t_tinyint: null,
  t_tinyint_unsigned: null,
  t_smallint: null,
  t_smallint_unsigned: null,
  t_mediumint: null,
  t_mediumint_unsigned: null,
  t_int: null,
  t_int_unsigned: null,
  t_bigint: null,
  t_bigint_unsigned: null,
  t_boolean: null,
  t_float: null,
  t_double: null,
  t_decimal: null,
  t_char: null,
  t_varchar: null,
  c_binary: null,
  c_varbinary: null,
  t_tinytext: null,
  t_text: null,
  t_mediumtext: null,
  t_longtext: null,
  t_tinyblob: null,
  t_blob: null,
  t_mediumblob: null,
  t_longblob: null,
  t_date: null,
  t_datetime: null,
  t_timestamp: null,
  t_time: null,
  t_year: null,
  t_enum: null,
  t_set: null,
  t_bit: null,
  t_json: null
}

// binary: x'1520c5' is the hex of 'FSDF' decoded from base64 (1520c5 has 3 bytes)
// blob : assume tidb serverless decode them with utf8
// bit: b'01010101' convert to hex is 55 (85 in 10 base)
const insertSQL = `
INSERT INTO ${database}.${table}( t_tinyint, t_tinyint_unsigned, t_smallint, t_smallint_unsigned, t_mediumint
                           , t_mediumint_unsigned, t_int, t_int_unsigned, t_bigint, t_bigint_unsigned
                           , t_boolean, t_float, t_double, t_decimal
                           , t_char, t_varchar, c_binary, c_varbinary, t_tinytext, t_text, t_mediumtext, t_longtext
                           , t_tinyblob, t_blob, t_mediumblob, t_longblob
                           , t_date, t_datetime, t_timestamp, t_time, t_year
                           , t_enum,t_bit, t_set, t_json)
VALUES ( -128, 255, -32768, 65535, -8388608, 16777215, -2147483648, 1, -9223372036854775808, 18446744073709551615
       , true, 123.456, 123.123, 123456789012.123456789012
       , '测', '测试', x'1520c5', x'1520c5', '测试tinytext', '0', '测试mediumtext', '测试longtext'
       , 'tinyblob', 'blob', 'mediumblob', 'longblob'
       , '1977-01-01', '9999-12-31 23:59:59', '19731230153000', '23:59:59', '2154'
       , 'enum2',b'01010101', 'a,b','{"a":1,"b":"2"}')
`

const fullTypeResult = {
  t_tinyint: -128,
  t_tinyint_unsigned: 255,
  t_smallint: -32768,
  t_smallint_unsigned: 65535,
  t_mediumint: -8388608,
  t_mediumint_unsigned: 16777215,
  t_int: -2147483648,
  t_int_unsigned: 1,
  t_bigint: '-9223372036854775808',
  t_bigint_unsigned: '18446744073709551615',
  t_boolean: 1,
  t_float: 123.46,
  t_double: 123.12,
  t_decimal: '123456789012.1234567890120000000',
  t_char: '测',
  t_varchar: '测试',
  c_binary: 'FSDF',
  c_varbinary: 'FSDF',
  t_tinytext: '测试tinytext',
  t_text: '0',
  t_mediumtext: '测试mediumtext',
  t_longtext: '测试longtext',
  t_tinyblob: 'tinyblob',
  t_blob: 'blob',
  t_mediumblob: 'mediumblob',
  t_longblob: 'longblob',
  t_date: '1977-01-01',
  t_datetime: '9999-12-31 23:59:59',
  t_timestamp: '1973-12-30 15:30:00',
  t_time: '23:59:59',
  t_year: 2154,
  t_enum: 'enum2',
  t_set: 'a,b',
  t_bit: '0x0000000000000055',
  t_json: { a: 1, b: '2' }
}

beforeAll(async () => {
  const con = connect({ url: databaseURL, fetch, debug: true })
  await con.execute(`DROP DATABASE IF EXISTS ${database}`)
  await con.execute(`CREATE DATABASE ${database}`)
  await con.execute(multiDataTable)
}, 20000)

describe('types', () => {
  test('test null', async () => {
    const con = connect({ url: databaseURL, database: database, fetch, debug: true })
    await con.execute(`delete from ${table}`)
    await con.execute('insert into multi_data_type values ()')
    const r = (await con.execute('select * from multi_data_type', null, { fullResult: true })) as FullResult
    expect(r.rows.length).toEqual(1)
    expect(JSON.stringify(r.rows[0])).toEqual(JSON.stringify(nullResult))
  })

  test('test all types', async () => {
    const con = connect({ url: databaseURL, database: database, fetch })
    await con.execute(`delete from ${table}`)
    await con.execute(insertSQL)
    const rows = (await con.execute('select * from multi_data_type')) as Row[]
    expect(rows.length).toEqual(1)
    // binary type returns Uint8Array, encode with base64
    rows[0]['c_binary'] = Buffer.from(rows[0]['c_binary']).toString('base64')
    rows[0]['c_varbinary'] = Buffer.from(rows[0]['c_varbinary']).toString('base64')
    // blob type returns Uint8Array, encode with utf8
    rows[0]['t_tinyblob'] = Buffer.from(rows[0]['t_tinyblob']).toString()
    rows[0]['t_blob'] = Buffer.from(rows[0]['t_blob']).toString()
    rows[0]['t_mediumblob'] = Buffer.from(rows[0]['t_mediumblob']).toString()
    rows[0]['t_longblob'] = Buffer.from(rows[0]['t_longblob']).toString()
    // bit type returns Uint8Array, get it with hex
    rows[0]['t_bit'] = uint8ArrayToHex(rows[0]['t_bit'])

    expect(JSON.stringify(rows[0])).toEqual(JSON.stringify(fullTypeResult))
  })
})
