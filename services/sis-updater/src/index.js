const { dbConnections } = require('./db/connection')

dbConnections.connect()

dbConnections.on('error', e => {
  console.log('Some database connections failed', e)
})

dbConnections.on('connected', () => {
  console.log('Both database connections established successfully')
})
