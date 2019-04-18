const { forceSyncDatabase } = require('../connection')

module.exports = {
  up: () => {
    return forceSyncDatabase()
  },
  down: () => {
    console.log('crashhh')
  }
}