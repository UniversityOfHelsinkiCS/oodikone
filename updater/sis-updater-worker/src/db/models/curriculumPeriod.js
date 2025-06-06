import { Model, DATE, JSONB, STRING } from 'sequelize'

import { sequelize } from '../connection.js'

class CurriculumPeriod extends Model {}

CurriculumPeriod.init(
  {
    id: {
      primaryKey: true,
      type: STRING,
    },
    name: {
      type: JSONB,
      allowNull: false,
    },
    universityOrgId: {
      type: STRING,
      allowNull: false,
    },
    startDate: {
      type: DATE,
      allowNull: false,
    },
    endDate: {
      type: DATE,
      allowNull: false,
    },
    createdAt: {
      type: DATE,
      allowNull: false,
    },
    updatedAt: {
      type: DATE,
      allowNull: false,
    },
  },
  {
    underscored: true,
    sequelize,
    modelName: 'curriculum_period',
    tableName: 'curriculum_periods',
  }
)

export default CurriculumPeriod
