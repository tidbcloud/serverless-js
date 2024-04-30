# TiDB Cloud Serverless Driver for JavaScript

This driver is for serverless and edge compute platforms that require HTTP external connections, such as Vercel Edge Functions or Cloudflare Workers.

## Usage

**Install**

You can install the driver with npm:

```bash
npm install @tidbcloud/serverless
```

**Query**

To query from TiDB Serverless, you need to create a connection first. Then you can use the connection to execute raw SQL queries. For example:

```ts
import { connect } from '@tidbcloud/serverless'

const conn = connect({url: 'mysql://username:password@host/database'})
const results = await conn.execute('select * from test where id = ?',[1])
```

**Transaction (Experimental)**

You can also perform interactive transactions with the serverless driver. For example:

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

> **Note:**
> 
> The transaction is not concurrent-safe. You are not allowed to run SQLs parallel in the same transaction.

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
