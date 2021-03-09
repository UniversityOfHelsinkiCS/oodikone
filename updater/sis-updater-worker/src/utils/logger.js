const winston = require('winston')
const { combine, timestamp, printf, splat } = winston.format

const customFormat = printf(({ level, message, timestamp, ...rest }) => {
  return `${timestamp} ${level}: ${message} ${JSON.stringify(rest)}`
})

const transports = []

if (process.env.NODE_ENV !== 'test') {
  transports.push(new winston.transports.File({ filename: 'debug.log' }))
}

transports.push(
  new winston.transports.Console({
    level: 'debug',
    format: combine(splat(), timestamp(), customFormat)
  })
)

const logger = winston.createLogger({ transports })

module.exports = {
  logger
}
