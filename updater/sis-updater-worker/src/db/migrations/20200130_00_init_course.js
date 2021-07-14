const { STRING, DATE, JSONB, BOOLEAN } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('course', {
      id: {
        type: STRING,
        primaryKey: true,
      },
      name: {
        type: JSONB,
      },
      code: {
        type: STRING,
      },
      latest_instance_date: {
        type: DATE,
      },
      is_study_module: {
        type: BOOLEAN,
      },
      coursetypecode: {
        type: STRING,
      },
      startdate: {
        type: DATE,
      },
      enddate: {
        type: DATE,
      },
      max_attainment_date: {
        type: DATE,
      },
      min_attainment_date: {
        type: DATE,
      },
      created_at: {
        type: DATE,
      },
      updated_at: {
        type: DATE,
      },
    })
  },
  down: async () => {},
}
