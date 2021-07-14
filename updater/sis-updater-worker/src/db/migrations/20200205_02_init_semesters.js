const { STRING, DATE, JSONB, INTEGER } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('semesters', {
      composite: {
        type: STRING,
        primaryKey: true,
      },
      semestercode: {
        type: INTEGER,
      },
      name: {
        type: JSONB,
      },
      startdate: {
        type: DATE,
      },
      enddate: {
        type: DATE,
      },
      yearcode: {
        type: INTEGER,
      },
      org: {
        type: STRING,
      },
      yearname: {
        type: STRING,
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
