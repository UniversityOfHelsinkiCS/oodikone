const Sequelize = require('sequelize')
const { sequelize } = require('./database/connection')

const UsageStatistic = sequelize.define(
  'usage_statistics',
  {
    id: {
      primaryKey: true,
      type: Sequelize.STRING
    },
    username: {
      type: Sequelize.STRING
    },
    name: {
      type: Sequelize.STRING
    },
    time: {
      type: Sequelize.INTEGER
    },
    admin: {
      type: Sequelize.BOOLEAN
    },
    method: {
      type: Sequelize.STRING
    },
    URL: {
      type: Sequelize.TEXT
    },
    status: {
      type: Sequelize.INTEGER
    },
    data: {
      type: Sequelize.JSONB
    }
  },
  {
    timestamps: false
  }
)

module.exports = {
  UsageStatistic,
  sequelize
}
