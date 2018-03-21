const winston = require('winston')
require('winston-papertrail').Papertrail

const winstonPapertrail = new winston.transports.Papertrail({
  host: process.env.PAPERTRAIL_HOST,
  port: process.env.PAPERTRAIL_PORT
})

winstonPapertrail.on('error', function (err) {
  console.log(err)
})

const logger = new winston.Logger({
  transports: [
    winstonPapertrail,
    new winston.transports.Console()
  ]
})

module.exports = logger