import { connect } from './dist/index.js'
import { fetch } from 'undici'

async function testblob(){

  const client = connect({url:'mysql://2cq1CrthsWhifF1.root:xxx@gateway01.us-east-1.dev.shared.aws.tidbcloud.com/test',fetch:fetch,arrayMode:true})

  const input = 'FSDF'
  console.log('input', input)
  const inputAsBuffer = Buffer.from(input,'base64')
  console.log('inputAsBuffer', inputAsBuffer)

  await client.execute('DELETE FROM `binary_test`')
  await client.execute('INSERT INTO `binary_test` (`id`, `bytes`) VALUES (1, ?)', [inputAsBuffer], {debug:true})
 //  await client.execute(`INSERT INTO binary_test (id, bytes) VALUES (1, 'a')`, null,{debug:true})
  const result = await client.execute('SELECT `id`, `bytes` FROM `binary_test`',null,{fullResult: true})

  console.log(result)
  let outputRaw = result.rows[0][1]
  console.log('outputRaw', outputRaw)
  console.log('typeof outputRaw', typeof outputRaw)

  const outputAsBuffer = Buffer.from(outputRaw)
  console.log('outputAsBuffer', outputAsBuffer)

  const output = outputAsBuffer.toString('base64')
  console.log('output', output)
  console.log('`input === output`', input === output)
}

await testblob()