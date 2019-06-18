const Sequelize = require('sequelize')
const conf = require('../conf-backend')

const sequelize = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA,
  searchPath: conf.DB_SCHEMA,
  logging: false,
  operatorsAliases: false
})
sequelize.query(`SET SESSION search_path to ${conf.DB_SCHEMA}`)

const sequelizeKone = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA_KONE,
  searchPath: conf.DB_SCHEMA_KONE,
  logging: false,
  operatorsAliases: false
})
sequelizeKone.query(`SET SESSION search_path to ${conf.DB_SCHEMA_KONE}`)
// See https://github.com/sequelize/sequelize/issues/10875


const forceSyncDatabase = async () => {
  try {
    await sequelize.getQueryInterface().createSchema(conf.DB_SCHEMA)
  } catch (e) {
    // console.log(e)
  }
  try {
    await sequelizeKone.getQueryInterface().createSchema(conf.DB_SCHEMA_KONE)
  } catch (e) {
    // console.log(e)
  }
  console.log('OODI SYNC')
  await sequelize.sync({ force: true })
  console.log('KONE SYNC')
  await sequelizeKone.sync({ force: true })
}

module.exports = {
  sequelize,
  sequelizeKone,
  forceSyncDatabase
}