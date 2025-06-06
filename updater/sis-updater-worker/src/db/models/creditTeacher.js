import { Model, DATE, STRING } from 'sequelize'

import { sequelize } from '../connection.js'

class CreditTeacher extends Model {}

CreditTeacher.init(
  {
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
    sequelize,
    modelName: 'credit_teacher',
    tableName: 'credit_teachers',
  }
)

export default CreditTeacher
