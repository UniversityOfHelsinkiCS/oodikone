const { Model, DATE, STRING } = require('sequelize')

const { dbConnections } = require('../connection')

class StudyrightElement extends Model {}

StudyrightElement.init(
  {
    id: {
      type: STRING,
      primaryKey: true,
    },
    startdate: {
      type: DATE,
    },
    enddate: {
      type: DATE,
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
    code: {
      type: STRING,
      references: {
        model: 'element_details',
        key: 'code',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
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
    createdAt: {
      type: DATE,
    },
    updatedAt: {
      type: DATE,
    },
  },
  {
    underscored: false,
    sequelize: dbConnections.sequelize,
    modelName: 'studyright_element',
    tableName: 'studyright_elements',
  }
)

module.exports = StudyrightElement
