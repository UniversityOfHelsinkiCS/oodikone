const Sequelize = require('sequelize')
const Umzug = require('umzug')
const conf = require('../conf-backend')

const sequelize = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA,
  logging: false,
  operatorsAliases: false
})

const runMigrations = async () => {
  try {
    try {
      await sequelize.getQueryInterface().createSchema(conf.DB_SCHEMA)
    } catch (e) {
      // not an error, schema already existed
    }
    const migrator = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: sequelize,
        tableName: 'migrations'
      },
      logging: console.log,
      migrations: {
        params: [
          sequelize.getQueryInterface(),
          Sequelize
        ],
        path: `${process.cwd()}/src/database/migrations`,
        pattern: /\.js$/,
      }
    })
    const migrations = await migrator.up()
    console.log('MIGRATION COMPLEETED', migrations)
  } catch (e) {
    console.log('WE DIDN\'T DO IT BOSS', e)
  }
}

runMigrations()

module.exports = sequelize