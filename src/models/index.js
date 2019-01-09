const Sequelize = require('sequelize')
const { sequelize, migrationPromise } = require('../database/connection')

const ElementDetails = sequelize.define('element_details',
  {
    code: {
      primaryKey: true,
      type: Sequelize.STRING
    },
    name: { type: Sequelize.JSONB },
    type: { type: Sequelize.INTEGER }
  },
  {
    tablename: 'element_details'
  }
)

const User = sequelize.define('users',
  {
    id: {
      primaryKey: true,
      type: Sequelize.BIGINT,
      autoIncrement: true
    },
    full_name: { type: Sequelize.STRING },
    is_enabled: { type: Sequelize.BOOLEAN },
    username: {
      type: Sequelize.STRING,
      unique: true
    },
    email: { type: Sequelize.STRING },
    language: { type: Sequelize.STRING },
    admin: { type: Sequelize.BOOLEAN },
    czar: { type: Sequelize.BOOLEAN }
  },
  {
    tableName: 'users',
    timestamps: false,
  }
)

const Migration = sequelize.define('migrations', {
  name: {
    type: Sequelize.STRING,
    primaryKey: true
  }
}, {
    tablename: 'migrations',
    timestamps: false
  })


User.belongsToMany(ElementDetails, { through: 'user_elementdetails', as: 'elementdetails' })
ElementDetails.belongsToMany(User, { through: 'user_elementdetails' })

module.exports = {
  User,
  ElementDetails,
  Migration
}