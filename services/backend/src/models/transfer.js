const { Model, DATE, STRING } = require('sequelize')

const { dbConnections } = require('../database/connection')

class Transfer extends Model {}

Transfer.init(
  {
    id: {
      type: STRING,
      primaryKey: true,
    },
    sourcecode: {
      type: STRING,
      references: {
        model: 'element_details',
        key: 'code',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
    },
    targetcode: {
      type: STRING,
      references: {
        model: 'element_details',
        key: 'code',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
    },
    transferdate: {
      type: DATE,
    },
    studentnumber: {
      type: STRING,
      references: {
        model: 'student',
        key: 'studentnumber',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
    },
    studyrightid: {
      type: STRING,
      references: {
        model: 'studyright',
        key: 'studyrightid',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
    },
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  },
  {
    underscored: true,
    sequelize: dbConnections.sequelize,
    modelName: 'transfer',
    tableName: 'transfers',
  }
)

module.exports = Transfer
