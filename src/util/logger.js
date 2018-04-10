const winston = require('winston')

require('winston-papertrail').Papertrail

const winstonPapertrail = new winston.transports.Papertrail({
  host: process.env.PAPERTRAIL_HOST ||'localhost',
  port: process.env.PAPERTRAIL_PORT || 12345,
  hostname: process.env.PAPERTRAIL_HOSTNAME || 'travis'
})

winstonPapertrail.on('error', function (err) {
  console.log(err)
})

const transports = {
  papertrail: winstonPapertrail,
  console: new winston.transports.Console({ level: 'debug' })
}

let loggerPapertrail = new winston.Logger({
  transports: [
    transports.papertrail, transports.console
  ]
})

if ( process.env.NODE_ENV === 'test' ) {
  console.log('logger for tests')
  loggerPapertrail = new winston.Logger({
    transports: [
      transports.console
    ]
  })
} else {
  loggerPapertrail = new winston.Logger({
    transports: [
      transports.papertrail, transports.console
    ]
  })
}

transports.papertrail.level = 'info'

module.exports = loggerPapertrail
