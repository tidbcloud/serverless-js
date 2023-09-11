# TiDB Cloud Serverless Driver for JavaScript

This driver is for serverless and edge compute platforms that require HTTP external connections, such as Vercel Edge Functions or Cloudflare Workers.

## Usage

**Install**

You can install the driver with npm:

```bash
npm install @tidbcloud/serverless
```

**Query**

To query from TiDB serverless, you need to create a connection first. Then you can use the connection to execute raw SQL queries. For example:

```ts
import { connect } from '@tidbcloud/serverless'

const conn = connect({url: 'mysql://username:password@host/database'})
const results = await conn.execute('select * from test where id = ?',[1])
```

**Transaction (Experimental)**

You can also perform interactive transactions with the TiDB serverless driver. For example:

```ts
import { connect } from '@tidbcloud/serverless'

const conn = connect({url: 'mysql://username:password@host/database'})
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

**Edge example**

The serverless driver is suitable for the edge environments. See how to use it with Vercel Edge Functions:

```
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { connect } from '@tidbcloud/serverless'
export const runtime = 'edge'

export async function GET(request: NextRequest) {
  const conn = connect({url: process.env.DATABASE_URL})
  const result = await conn.execute('show tables')
  return NextResponse.json({result});
}
```

See [TiDB serverless driver](https://docs.pingcap.com/tidbcloud/serverless-driver#edge-examples) documentation to learn more examples.

## Configuration

The following configurations are supported in connection level:

| name       | type      | default      | comment                                                          |
|------------|-----------|--------------|------------------------------------------------------------------|
| username   | string    | /            | Username of TiDB Severless                                       |
| password   | string    | /            | Password of TiDB Severless                                       |
| host       | string    | /            | Host of TiDB Severless                                           |
| database   | string    | test         | Database of TiDB Severless                                       |
| url        | string    | /            | A single url format as `mysql://username:password@host/database` |
| fetch      | function  | global fetch | Custom fetch function                                            |
| arrayMode  | bool      | false        | whether to return results as arrays instead of objects           |
| fullResult | bool      | false        | whether to return full result object instead of just rows        |

### Database URL

A single database URL value can be used to configure the `host`, `username`, `password` and `database` values. The following codes are equivalent:

```ts
const config = {
  host: '<host>',
  username: '<user>',
  password: '<password>',
  database: '<database>'
}

const conn = connect(config)
```

```ts
const conn = connect({url: process.env['DATABASE_URL'] || 'mysql://username:password@host/database'})
```

## Options

> Note: SQL level options priority is higher than connection level configurations.

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

## Documentation

See [TiDB serverless driver](https://docs.pingcap.com/tidbcloud/serverless-driver) documentation to learn more.

## License

Apache 2.0, see [LICENSE](./LICENSE).
