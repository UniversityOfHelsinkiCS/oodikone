const Sequelize = require('sequelize')
const { sequelize } = require('../database/connection')

const UserElementDetails = sequelize.define(
  'user_elementdetails',
  {
    userId: {
      primaryKey: true,
      type: Sequelize.BIGINT,
    },
    elementDetailCode: {
      primaryKey: true,
      type: Sequelize.STRING,
    },
  },
  {
    tablename: 'user_elementdetails',
  }
)

const AccessGroup = sequelize.define('access_group', {
  id: {
    primaryKey: true,
    type: Sequelize.BIGINT,
    autoIncrement: true,
  },
  group_code: {
    type: Sequelize.STRING,
    unique: true,
  },
  group_info: {
    type: Sequelize.STRING,
  },
  createdAt: {
    type: Sequelize.DATE,
  },
  updatedAt: {
    type: Sequelize.DATE,
  },
})

const UserFaculties = sequelize.define('user_faculties', {
  userId: {
    primaryKey: true,
    type: Sequelize.BIGINT,
    references: {
      model: 'users',
      key: 'id',
    },
  },
  faculty_code: {
    primaryKey: true,
    type: Sequelize.STRING,
  },
  createdAt: {
    type: Sequelize.DATE,
  },
  updatedAt: {
    type: Sequelize.DATE,
  },
})

const User = sequelize.define(
  'users',
  {
    id: {
      primaryKey: true,
      type: Sequelize.BIGINT,
      autoIncrement: true,
    },
    full_name: { type: Sequelize.STRING },
    username: {
      type: Sequelize.STRING,
      unique: true,
    },
    email: { type: Sequelize.STRING },
    language: { type: Sequelize.STRING },
    sisu_person_id: { type: Sequelize.STRING },
    last_login: { type: Sequelize.DATE },
  },
  {
    tableName: 'users',
    timestamps: false,
  }
)
const HyGroup = sequelize.define('hy_group', {
  id: {
    primaryKey: true,
    type: Sequelize.BIGINT,
    autoIncrement: true,
  },

  code: { type: Sequelize.STRING },

  createdAt: {
    type: Sequelize.DATE,
  },

  updatedAt: {
    type: Sequelize.DATE,
  },
})

const Affiliation = sequelize.define('affiliations', {
  id: {
    primaryKey: true,
    type: Sequelize.BIGINT,
    autoIncrement: true,
  },

  code: { type: Sequelize.STRING },

  createdAt: {
    type: Sequelize.DATE,
  },

  updatedAt: {
    type: Sequelize.DATE,
  },
})

User.hasMany(UserElementDetails, { as: 'programme' })
UserElementDetails.belongsTo(User)

User.belongsToMany(AccessGroup, {
  through: 'user_accessgroup',
  as: 'accessgroup',
})
AccessGroup.belongsToMany(User, { through: 'user_accessgroup' })

User.belongsToMany(HyGroup, { through: 'user_hy_group', as: 'hy_group' })
HyGroup.belongsToMany(User, { through: 'user_hy_group' })

User.belongsToMany(Affiliation, {
  through: 'user_affiliation',
  as: 'affiliation',
})
Affiliation.belongsToMany(User, { through: 'user_affiliation' })

User.hasMany(UserFaculties, { as: 'faculty', foreignKey: 'userId' })

module.exports = {
  User,
  UserElementDetails,
  AccessGroup,
  HyGroup,
  Affiliation,
  UserFaculties,
  sequelize,
}
