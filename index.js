const express = require('express')
const conf = require('./src/conf-usageservice')
const { PORT } = conf
const router = require('./src/routes')
const app = express()

app.use(router)

module.exports = app.listen(PORT, () => {
  console.log('Example app listening on port ' + PORT + '!')
})
