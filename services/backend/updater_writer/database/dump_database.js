const spawn = require('child_process').spawn
const fs = require('fs')
const { DB_SCHEMA } = require('../conf-backend')

const dumpDatabase = async () => {
  const { DB_URL } = process.env
  const dumpOptions = ['-Fc', `-n${DB_SCHEMA}`, `${DB_URL}`]
  console.log(dumpOptions)
  const dumpProcess = spawn('pg_dump', dumpOptions, { stdio: ['ignore', 'pipe', 'inherit'] })
  dumpProcess.on('error', (err) => {
    console.log(' dump process error:', err)
  })
  const writeStream = fs.createWriteStream(`./dumps/oodidb_prod-${new Date().toISOString()}`)

  dumpProcess.stdout.pipe(writeStream)

  dumpProcess.on('exit', async (code) => {
    if (code !== 0) {
      throw new Error('pg_dump: Bad exit code (' + code + ')');
    } else {
      console.log('database dump created')
    }
  })
}
module.exports = { dumpDatabase }