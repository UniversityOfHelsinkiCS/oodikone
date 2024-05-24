const { BIGINT, STRING, ARRAY, DATE } = require('sequelize')
const { sequelizeUser } = require('../database/connection')

const User = sequelizeUser.define(
  'users',
  {
    id: {
      primaryKey: true,
      type: BIGINT,
      autoIncrement: true,
    },
    fullName: STRING,
    username: {
      type: STRING,
      unique: true,
    },
    email: STRING,
    language: STRING,
    sisuPersonId: STRING,
    lastLogin: DATE,
    roles: {
      type: ARRAY(STRING),
      allowNull: false,
      defaultValue: [],
    },
    programmeRights: {
      type: ARRAY(STRING),
      allowNull: false,
      defaultValue: [],
    },
  },
  {
    tableName: 'users',
    timestamps: false,
    underscored: true,
  }
)

module.exports = {
  User,
}
