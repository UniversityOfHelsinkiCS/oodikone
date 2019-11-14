const Sequelize = require('sequelize')
const { sequelize } = require('../database/connection')

const Throughput = sequelize.define(
  'throughput',
  {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    data: Sequelize.JSONB,
    status: Sequelize.STRING
  },
  {
    timestamps: true,
    tableName: 'throughput'
  }
)

const Productivity = sequelize.define(
  'productivity',
  {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    data: Sequelize.JSONB,
    status: Sequelize.STRING
  },
  {
    timestamps: true,
    tableName: 'productivity'
  }
)

const FacultyStats = sequelize.define(
  'facultystats',
  {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    data: Sequelize.JSONB
  },
  {
    timestamps: true,
    tableName: 'facultystats'
  }
)

const NonGraduatedStudents = sequelize.define(
  'nongraduatedstudents',
  {
    id: {
      type: Sequelize.STRING,
      primaryKey: true
    },
    data: Sequelize.JSONB
  },
  {
    timestamps: true,
    tableName: 'nongraduatedstudents'
  }
)

module.exports = {
  Throughput,
  Productivity,
  FacultyStats,
  NonGraduatedStudents
}
