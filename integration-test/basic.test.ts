import { connect,Row,FullResult } from '../dist/index'
import { fetch } from 'undici'
import * as dotenv from 'dotenv';

let databaseURL
const database = 'test_serverless_basic'
const table = 'employee'

const EmployeeTable = `CREATE TABLE ${database}.${table} (emp_no INT,first_name VARCHAR(255),last_name VARCHAR(255))`

beforeAll(async () => {
  dotenv.config();
  databaseURL = process.env.DATABASE_URL
  const con = connect({url: databaseURL, fetch})
  await con.execute(`DROP DATABASE IF EXISTS ${database}`)
  await con.execute(`CREATE DATABASE ${database}`)
  await con.execute(EmployeeTable)
  await con.execute(`insert into ${database}.${table} values (0, 'base', 'base')`)
},100000);

describe('basic', () => {
  test('ddl', async () => {
    const con = connect({url: databaseURL, database: database, fetch})
    const results = await con.execute(`SHOW TABLES`)
    expect(JSON.stringify(results)).toContain(`${table}`)
  })

  test('dml', async () => {
    const con = connect({url: databaseURL, database: database, fetch})
    await con.execute(`delete from ${table} where emp_no = 1`)

    await con.execute(`insert into ${table} values (1, 'John', 'Doe')`)
    const result1 =  await con.execute(`select * from ${table} where emp_no = 1`)
    expect(JSON.stringify(result1)).toContain('John')
    await con.execute(`update ${table} set first_name = 'Jane' where emp_no = 1`)
    const result2 =  await con.execute(`select * from ${table} where emp_no = 1`)
    expect(JSON.stringify(result2)).toContain('Jane')
    await con.execute(`delete from ${table} where emp_no = 1`)
    const result3 =  await con.execute(`select * from ${table} where emp_no = 1`) as Row[]
    expect(result3.length).toEqual(0)
  })

  test('option', async () => {
    const con = connect({url: databaseURL, database: database, fetch})
    const result1 = await con.execute(`select * from ${table} where emp_no=0`,null, {arrayMode: true})
    expect(result1 instanceof Array).toEqual(true)

    const result2 = await con.execute(`select * from ${table} where emp_no=0`,null, {fullResult: true})
    expect(result2 instanceof Array).toEqual(false)
    const except: FullResult = {
      statement: `select * from ${table} where emp_no=0`,
      types:{
        emp_no: 'INT',
        first_name: 'VARCHAR',
        last_name: 'VARCHAR'
      },
      rows: [{
        emp_no: 0,
        first_name: 'base',
        last_name: 'base'
      }],
      rowsAffected: 0,
      lastInsertId: null,
      rowCount: 1
    }
    expect(JSON.stringify(result2)).toEqual(JSON.stringify(except))
  })

  test('query with escape', async () => {
    const con = connect({url: databaseURL, database: database, fetch})
    await con.execute(`delete from ${table} where emp_no = 1 or emp_no = 2`)
    await con.execute(`insert into ${table} values (1, '\\'John\\'', 'Doe')`)
    await con.execute(`insert into ${table} values (2, '\\"John\\"', 'Doe')`)

    // "select * from employee where first_name = '\\'John\\''"
    const r1 = await con.execute('select * from employee where first_name = ?',["'John'"]) as Row[]
    // 'select * from employee where first_name = \'\\"John\\"\''
    const r2 = await con.execute('select * from employee where first_name =:name',{name: '"John"'}) as Row[]
    expect(r1.length).toEqual(1)
    expect(r2.length).toEqual(1)
    const row1 = r1[0] as Record<string, any>
    const row2 = r2[0] as Record<string, any>
    expect(row1.emp_no).toEqual(1)
    expect(row2.emp_no).toEqual(2)
  })

  test('transaction isolation', async () => {
    const con = connect({url: databaseURL, database: database, fetch})
    await con.execute(`delete from ${table} where emp_no = 1`)
    let tx
    try{
        tx = await con.begin()
        await tx.execute(`insert into ${table} values (1, 'John', 'Doe')`)
        const r1 = await tx.execute(`select * from ${table} where emp_no = 1`) as Row[]
        const r2 = await con.execute(`select * from ${table} where emp_no = 1`) as Row[]
        expect(r1.length).toEqual(1)
        expect(r2.length).toEqual(0)
        await tx.commit()
    } catch (e) {
      if (tx){
        tx.rollback()
      }
      throw e
    }
  })

  test('transaction rollback', async () => {
    const con = connect({url: databaseURL, database: database, fetch})
    await con.execute(`delete from ${table} where emp_no = 1`)

    let tx
    try {
      const tx = await con.begin()
      await tx.execute(`insert into ${table} values (1, 'John', 'Doe')`)
      await tx.execute(`update ${table} set first_name = 'Jane' where emp_no = 0`)
      await tx.rollback()
    } catch (e) {
      if (tx){
        tx.rollback()
      }
      throw e
    }

    const r = await con.execute(`select * from ${table} where emp_no = 0 or emp_no = 1`) as Row[]
    expect(r.length).toEqual(1)
    const row = r[0] as Record<string, any>
    expect(row.first_name).toEqual('base')
  })

  test('transaction isolation level', async () => {
    const con = connect({url: databaseURL, database: database, fetch})
    await con.execute(`delete from ${table} where emp_no = 1`)

    const tx = await con.begin({isolation:"READ COMMITTED"})
    const result1 = await tx.execute(`select * from ${table}`) as Row[]
    await con.execute(`insert into ${table} values (1, '\\"John\\"', 'Doe')`)
    const result2 =  await tx.execute(`select * from ${table}`) as Row[]
    await tx.commit()
    expect(result1.length+1).toEqual(result2.length)
  })
})

