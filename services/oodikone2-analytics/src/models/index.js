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

const ThroughputV2 = sequelize.define(
  'throughput_v2',
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
    tableName: 'throughput_v2'
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

const ProductivityV2 = sequelize.define(
  'productivity_v2',
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
    tableName: 'productivity_v2'
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
  ThroughputV2,
  Productivity,
  ProductivityV2,
  FacultyStats,
  NonGraduatedStudents
}
