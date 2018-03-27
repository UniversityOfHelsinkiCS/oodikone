const winston = require('winston')
require('winston-papertrail').Papertrail

const winstonPapertrail = new winston.transports.Papertrail({
  host: 'logs4.papertrailapp.com',
  port: 24439
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