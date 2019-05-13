const Sequelize = require('sequelize')
const conf = require('../conf-backend')

console.log('SCHEMA', conf.DB_SCHEMA)

const sequelize = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA,
  logging: false,
  operatorsAliases: false
})

const createSchemaIfNotExists = async schema => {
  try {
    await sequelize.createSchema(schema)
  } catch (e) {
    return
  }

}

const forceSyncDatabase = async () => {
  await createSchemaIfNotExists(conf.DB_SCHEMA)
  await sequelize.sync({ force: true })
}

module.exports = { sequelize, forceSyncDatabase }