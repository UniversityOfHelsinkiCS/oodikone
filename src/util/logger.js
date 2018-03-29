const winston = require('winston')
require('winston-papertrail').Papertrail

const winstonPapertrail = new winston.transports.Papertrail({
  host: process.env.PAPERTRAIL_HOST,
  port: process.env.PAPERTRAIL_PORT,
  hostname: process.env.PAPERTRAIL_HOSTNAME
})

winstonPapertrail.on('error', function (err) {
  console.log(err)
})

const transports = {
  papertrail: winstonPapertrail,
  console: new winston.transports.Console({ level: 'debug' })
}

const loggerPapertrail = new winston.Logger({
  transports: [
    transports.papertrail, transports.console
  ]
})

transports.papertrail.level = 'info'

module.exports = loggerPapertrail
