const { sequelize } = require('../../models/index')

const options = { force: true }

const sync = async () => {
  await sequelize.sync(options)
  process.exit(0)
}

sync()