const express = require('express')
const conf = require('./src/conf-usageservice')
const { PORT } = conf
const router = require('./src/routes')
const { initializeDatabaseConnection } = require('./src/database/connection')

initializeDatabaseConnection().then(() => {
  const app = express()

  app.use(router)

  const server = app.listen(PORT, () => console.log(`Usageservice listening on port ${PORT}!`))
  process.on('SIGTERM', () => {
    server.close(() => {
      console.log('Process terminated')
    })
  })
}).catch(e => {
  process.exitCode = 1
  console.log(e)
})
