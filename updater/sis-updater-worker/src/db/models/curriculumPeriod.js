const { Model, DATE, JSONB, STRING } = require('sequelize')

const { dbConnections } = require('../connection')

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
    sequelize: dbConnections.sequelize,
    modelName: 'curriculum_period',
    tableName: 'curriculum_periods',
  }
)

module.exports = CurriculumPeriod
