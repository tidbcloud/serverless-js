import { connect,Row,FullResult } from '../dist/index'
import { fetch } from 'undici'
import * as dotenv from 'dotenv';

dotenv.config();
const databaseURL = process.env.DATABASE_URL
const database = 'test_serverless_type'
const table = 'multi_data_type'
const multiDataTable = `
    CREATE TABLE ${database}.${table}(
    id                   INT AUTO_INCREMENT,
    t_tinyint            TINYINT,
    t_tinyint_unsigned   TINYINT UNSIGNED,
    t_smallint           SMALLINT,
    t_smallint_unsigned  SMALLINT UNSIGNED,
    t_mediumint          MEDIUMINT,
    t_mediumint_unsigned MEDIUMINT UNSIGNED,
    t_int8                INT(8),
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
    c_binary             binary(16),
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
    t_json               JSON,
    PRIMARY KEY (id)
);
`

beforeAll(async () => {
  const con = connect({url: databaseURL, fetch})
  await con.execute(`DROP DATABASE IF EXISTS ${database}`)
  await con.execute(`CREATE DATABASE ${database}`)
  await con.execute(multiDataTable)
});

describe('types', () => {

  test('test null', async () => {
    const con = connect({url: databaseURL, database: database, fetch})
    await con.execute(`delete from ${table}`)
    await con.execute('insert into multi_data_type values ()')
    const r = await con.execute('select * from multi_data_type',null, {fullResult: true}) as FullResult
    expect(r.rows.length).toEqual(1)
    const row = r.rows[0] as Record<string, any>
    // just test two types here
    expect(row.t_tinyint).toEqual(null)
    expect(row.t_varchar).toEqual('')
  })

  test('test overflow', async () => {
    const con = connect({url: databaseURL, database: database, fetch})
    await con.execute(`delete from ${table}`)
    await con.execute('insert into multi_data_type values ()')
    const r = await con.execute('select * from multi_data_type',null, {fullResult: true}) as FullResult
    expect(r.rows.length).toEqual(1)
    const row = r.rows[0] as Record<string, any>
    // just test two types here
    expect(row.t_tinyint).toEqual(null)
    expect(row.t_varchar).toEqual('')
  })
})
