const { STRING, DATE, JSONB, INTEGER } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('semesters', {
      semestercode: {
        type: INTEGER,
        primaryKey: true
      },
      name: {
        type: JSONB
      },
      startdate: {
        type: DATE
      },
      enddate: {
        type: DATE
      },
      yearcode: {
        type: INTEGER,
        primaryKey: true
      },
      org: {
        type: STRING,
        primaryKey: true
      },
      yearname: {
        type: STRING
      },
      created_at: {
        type: DATE
      },
      updated_at: {
        type: DATE
      }
    })
  },
  down: async () => {}
}
