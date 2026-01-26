# TiDB Cloud Serverless Driver for JavaScript

This driver is for serverless and edge compute platforms that require HTTP external connections, such as Vercel Edge Functions or Cloudflare Workers.

There are three ways to use the driver:

1. Stateless connection (default): each query is independent, ideal for edge environments with short-lived, frequently created connections.
2. Stateful connection (experimental): use it when you require session.
3. Transaction (experimental): use it when you require interactive transaction.

## Usage

**Install**

You can install the driver with npm:

```bash
npm install @tidbcloud/serverless
```

**Stateless Connection**

To query from TiDB Serverless, you need to create a connection first. Then you can use the connection to execute raw SQL queries.

```ts
import { connect } from '@tidbcloud/serverless'

const conn = connect({url: 'mysql://username:password@host/database'})
const results = await conn.execute('select * from test where id = ?',[1])
```

**Stateful Connection (experimental)**

If you want to keep session state across multiple queries, create a stateful connection. Remember to call `close()` to release the connection, or you may reach the connection limits.

> **Note:**
> 
> Connections idle for 10 minutes will be closed automatically.
> The Stateful connection is not concurrent-safe. You are not allowed to run SQLs parallel in the same stateful connection.

```ts
import { connect } from '@tidbcloud/serverless'

const conn = connect({url: 'mysql://username:password@host/database'})
const stateful = await conn.stateful()

try {
  const r1 = await stateful.execute('use db2')
  const r2 = await stateful.execute('select * from test where id = ?', [2])
} finally {
  await stateful.close()
}
```

**Transaction (experimental)**

You can also perform interactive transactions with the serverless driver. For example:

> **Note:**
> 
> Transactions idle for 10 minutes will be rolled back automatically if it has not been commited or rolled back.
> The transaction is not concurrent-safe. You are not allowed to run SQLs parallel in the same transaction.

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

See [TiDB Cloud Serverless Driver](https://docs.pingcap.com/tidbcloud/serverless-driver#edge-examples) documentation to learn more.

## Configuration

See [Configure TiDB Cloud Serverless Driver](https://docs.pingcap.com/tidbcloud/serverless-driver-config).

## License

Apache 2.0, see [LICENSE](./LICENSE).
