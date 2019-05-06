const Sequelize = require('sequelize')
const conf = require('../conf-backend')

const sequelize = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA,
  logging: false,
  operatorsAliases: false
})

const forceSyncDatabase = async () => {
  await sequelize.sync({ force: true })
}

module.exports = { sequelize, forceSyncDatabase }