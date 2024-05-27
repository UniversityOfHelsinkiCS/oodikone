const { Model, STRING, DATE } = require('sequelize')

const { dbConnections } = require('../connection')

class CreditTeacher extends Model {}

CreditTeacher.init(
  {
    composite: {
      type: STRING,
      unique: true,
    },
    credit_id: {
      type: STRING,
      references: {
        model: 'credit',
        key: 'id',
      },
      onUpdate: 'cascade',
      onDelete: 'cascade',
    },
    teacher_id: {
      type: STRING,
      references: {
        model: 'teacher',
        key: 'id',
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
    modelName: 'credit_teacher',
    tableName: 'credit_teachers',
  }
)

module.exports = CreditTeacher
