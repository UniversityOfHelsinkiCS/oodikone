const Sequelize = require('sequelize')
const Umzug = require('umzug')
const conf = require('../conf-backend')

const sequelize = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA,
  logging: false,
  operatorsAliases: false,
  dialectOptions: {
    prependSearchPath: true
  }
})

const sequelizeKone = new Sequelize(conf.DB_URL, {
  schema: conf.DB_SCHEMA_KONE,
  logging: false,
  operatorsAliases: false,
  searchPath: conf.DB_SCHEMA_KONE,
  dialectOptions: {
    prependSearchPath: true
  }
})

const runMigrations = async () => {
  try {
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

    console.log('Migrations up to date', migrations)
  } catch (e) {
    console.log('Migration error, message:', e)
  }
}

const runMigrationsKone = async () => {
  try {
    const migrator = new Umzug({
      storage: 'sequelize',
      storageOptions: {
        sequelize: sequelizeKone,
        tableName: 'migrations',
        schema: conf.DB_SCHEMA_KONE
      },
      logging: console.log,
      migrations: {
        params: [
          sequelizeKone.getQueryInterface(),
          sequelizeKone
        ],
        path: `${process.cwd()}/src/database/migrations_kone`,
        pattern: /\.js$/,
        schema: conf.DB_SCHEMA_KONE,
        wrap: fn => () => fn(sequelizeKone.getQueryInterface(), sequelizeKone)
      },
    })
    const migrations = await migrator.up()

    console.log('Kone Migrations up to date', migrations)
  } catch (e) {
    console.log('Kone Migration error, message:', e)
  }
}

const migrationPromise = !conf.isTest && conf.DB_SCHEMA === 'public' ? runMigrations().then(() => runMigrationsKone())
  : Promise.resolve()

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
  await sequelize.sync({ force: true, schema: conf.DB_SCHEMA, searchPath: conf.DB_SCHEMA })
  await sequelizeKone.sync({ force: true, schema: conf.DB_SCHEMA_KONE, searchPath: conf.DB_SCHEMA_KONE })
}

module.exports = {
  sequelize,
  sequelizeKone,
  migrationPromise,
  forceSyncDatabase
}