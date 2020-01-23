const { dbConnections } = require('./db/connection')

dbConnections.connect()
dbConnections.on('connected', () => {
  console.log('Database connections established successfully')
})
