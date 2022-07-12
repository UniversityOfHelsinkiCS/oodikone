const Sequelize = require('sequelize')
const { sequelizeUser } = require('../database/connection')

const UserElementDetails = sequelizeUser.define(
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

const AccessGroup = sequelizeUser.define('access_group', {
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

const UserFaculties = sequelizeUser.define('user_faculties', {
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

const User = sequelizeUser.define(
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
    iam_groups: {
      type: Sequelize.ARRAY(Sequelize.STRING),
      allowNull: false,
      defaultValue: [],
    },
    last_login: { type: Sequelize.DATE },
  },
  {
    tableName: 'users',
    timestamps: false,
  }
)

User.hasMany(UserElementDetails, { as: 'programme' })
UserElementDetails.belongsTo(User)

User.belongsToMany(AccessGroup, {
  through: 'user_accessgroup',
  as: 'accessgroup',
})
AccessGroup.belongsToMany(User, { through: 'user_accessgroup' })

User.hasMany(UserFaculties, { as: 'faculty', foreignKey: 'userId' })

module.exports = {
  User,
  UserElementDetails,
  AccessGroup,
  UserFaculties,
  sequelizeUser,
}
