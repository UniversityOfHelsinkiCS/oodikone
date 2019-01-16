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

const AccessGroup = sequelize.define('access_group',
{
  id: {
    primaryKey: true,
    type: Sequelize.BIGINT,
    autoIncrement: true
  },
  group_code: {
    type: Sequelize.STRING,
    unique: true
  },
  group_info: {
    type: Sequelize.STRING
  },
  createdAt: {
    type: Sequelize.DATE
  },
  updatedAt: {
    type: Sequelize.DATE
  }
})


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

User.belongsToMany(AccessGroup, { through: 'user_accessgroup', as: 'accessgroup' })
AccessGroup.belongsToMany(User, { through: 'user_accessgroup' })

module.exports = {
  User,
  ElementDetails,
  Migration,
  AccessGroup
}