const Sequelize = require('sequelize')
const conf = require('../conf')

const sequelize = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA,
  logging: false,
  operatorsAliases: false
})

const migrationPromise = conf.DB_SCHEMA === 'public' ? Promise.resolve()
  : Promise.resolve()

const forceSyncDatabase = async () => {
  await sequelize.sync({ force: true })
}

module.exports = { sequelize, migrationPromise, forceSyncDatabase }