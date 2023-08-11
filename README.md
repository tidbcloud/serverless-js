# TiDB Cloud Serverless Driver for JavaScript

This driver is for serverless and edge compute platforms that require HTTP external connections, such as Vercel Edge Functions or Cloudflare Workers.


## Installation

```
npm install @tidbcloud/serverless
```

## Usage

```ts
import { connect } from '@tidbcloud/serverless'

const config = {
  host: '<host>',
  username: '<user>',
  password: '<password>'
}

const conn = connect(config)
const results = await conn.execute('select 1 from test')
```

Query with placeholder:

```ts
import { connect } from '@tidbcloud/serverless'

const config = {
  host: '<host>',
  username: '<user>',
  password: '<password>'
}

const conn = connect(config)
const results = await conn.execute('select 1 from test where id = ?', [1])
const results2 = await conn.execute('select 1 from test where id = :id', {id:1})
```


Use the `transaction` function to safely perform database transactions:

```ts
import { connect } from '@tidbcloud/serverless'

const config = {
  host: '<host>',
  username: '<user>',
  password: '<password>'
}
const conn = connect(config)
const tx = await conn.begin()
try {
  await tx.execute('insert into test values (1)')
  await tx.execute('select * from test')
  await tx.commit()
}catch (err) {
  await tx.rollback()
  throw err
}
```

## Configuration

The following configurations are supported in connection level:

| name     | type     | default      | comment                                                          |
|----------|----------|--------------|------------------------------------------------------------------|
| username | string   | /            | Username of TiDB Severless                                       |
| password | string   | /            | Password of TiDB Severless                                       |
| host     | string   | /            | Host of TiDB Severless                                           |
| database | string   | test         | Database of TiDB Severless                                       |
| url      | string   | /            | A single url format as `mysql://username:password@host/database` |
| fetch    | function | global fetch | Custom fetch function                                            |

### Database URL

A single database URL value can be used to configure the `host`, `username`, `password` and `database` values:

```ts
const conn = connect({url: process.env['DATABASE_URL'] || 'mysql://username:password@host/database'})
```

Database can be skipped to use the default one:

```ts
const conn = connect({url: process.env['DATABASE_URL'] || 'mysql://username:password@host'})
````

### Custom fetch function

You can custom fetch function instead of using the global one. It's useful when you run in the environment without a built-in global `fetch` function. For example, an older version of Node.js.

```ts
import { connect } from '@tidbcloud/serverless'
import { fetch } from 'undici'

const config = {
  fetch,
  url: process.env['DATABASE_URL'] || 'mysql://username:password@host/database'
}

const conn = connect(config)
const results = await conn.execute('select 1 from test')
```

## Options

The following options are supported in SQL level:

| option     | type | default | comment                                                   |
|------------|------|---------|-----------------------------------------------------------|
| arrayMode  | bool | false   | whether to return results as arrays instead of objects    |
| fullResult | bool | false   | whether to return full result object instead of just rows |


```ts
import { connect } from '@tidbcloud/serverless'

const config = {
  url: process.env['DATABASE_URL'] || 'mysql://username:password@host/database'
}

const conn = connect(config)
const results = await conn.execute('select 1 from test',null,{arrayMode:true,fullResult:true})
```

## Features

### Supported SQL

The following SQL statements are supported:  `Select`, `Show`, `Explain`, `Use`, `Insert`, `Update`, `Delete`, `Begin`, `Commit`, `Rollback`.

And most of the DDL are supported.

### Data Type

The type mapping between TiDB and Javascript:

| TiDB Type         | Javascript Type |
|-------------------|-----------------|
| TINYINT           | number          |
| UNSIGNED TINYINT  | number          |
| BOOL              | number          |
| SMALLINT          | number          |
| UNSIGNED SMALLINT | number          |
| MEDIUMINT         | number          |
| INT               | number          |
| UNSIGNED INT      | number          |
| YEAR              | number          |
| FLOAT             | number          |
| DOUBLE            | number          |
| BIGINT            | string          |
| UNSIGNED BIGINT   | string          |
| DECIMAL           | string          |
| CHAR              | string          |
| VARCHAR           | string          |
| BINARY            | string          |
| VARBINARY         | string          |
| TINYTEXT          | string          |
| TEXT              | string          |
| MEDIUMTEXT        | string          |
| LONGTEXT          | string          |
| TINYBLOB          | string          |
| BLOB              | string          |
| MEDIUMBLOB        | string          |
| LONGBLOB          | string          |
| DATE              | string          |
| TIME              | string          |
| DATETIME          | string          |
| TIMESTAMP         | string          |
| ENUM              | string          |
| SET               | string          |
| BIT               | string          |
| JSON              | any             |
| Others            | string          |

The following types can not be distinguished between empty string and null if it is nullable: `CHAR`, `VARCHAR`, `BINARY`, `VARBINARY`, `TINYTEXT`, `TEXT`, `MEDIUMTEXT`, `LONGTEXT`, `TINYBLOB`, `BLOB`, `MEDIUMBLOB`, `LONGBLOB`, `ENUM`, `SET`, `BIT`.
