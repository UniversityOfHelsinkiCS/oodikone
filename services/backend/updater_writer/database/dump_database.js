const spawn = require('child_process').spawn
const fs = require('fs')
const { sync } = require('./force_sync_database')

const dumpDatabase = async () => {
  const { USER, HOST, DBNAME } = process.env
  const dumpOptions = ['-Fc', `-U${USER}`, `--host=${HOST}`, `${DBNAME}`]
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
      console.log('database dump created, force syncing database')
      await sync()
    }
  })
}
module.exports = { dumpDatabase }