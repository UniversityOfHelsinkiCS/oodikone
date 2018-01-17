const fs = require('fs')
const moment = require('moment')


const time = () => '[' + moment().format('DD.MM.YYYY hh:mm:ss') + ']'
const timeStamp = moment().format('MMYYYY')

const logError = process.env.NODE_ENV === 'dev' ?
  (msg) => console.log(time() + ' ERROR: ' + msg + '\n') :
  (msg) => {
    try {
      fs.appendFileSync('logs/update_error_log' + timeStamp +'.txt', time() + ' ERROR: ' + msg + '\n')
    } catch (e) {
      console.log('Writing to error log file failed')
      console.log(e)
    }
  }

const log = process.env.NODE_ENV === 'dev' ?
  (msg) => console.log(time() + ' LOG: ' + msg + '\n') :
  (msg) => {
    try {
      fs.appendFileSync('logs/update_full_log' + timeStamp +'.txt', time() + ' LOG: ' + msg + '\n')
    } catch (e) {
      console.log('Writing to log file failed')
      console.log(e)
    }
  }

module.exports = {
  logError, log
}