import { Model, DATE, JSONB, STRING } from 'sequelize'

import { dbConnections } from '../connection'

class CurriculumPeriod extends Model {
  [key: string]: any
}

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
    sequelize: dbConnections.sequelize,
    modelName: 'curriculum_period',
    tableName: 'curriculum_periods',
  }
)

export default CurriculumPeriod
