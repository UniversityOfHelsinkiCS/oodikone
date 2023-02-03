const { INTEGER, STRING, ARRAY, DATE } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('progress_criteria', {
      code: {
        type: STRING,
        primaryKey: true,
      },
      courses_year_one: {
        type: ARRAY(STRING),
      },
      courses_year_two: {
        type: ARRAY(STRING),
      },
      courses_year_three: {
        type: ARRAY(STRING),
      },
      credits_year_one: {
        type: INTEGER,
      },
      credits_year_two: {
        type: INTEGER,
      },
      credits_year_three: {
        type: INTEGER,
      },
      created_at: DATE,
      updated_at: DATE,
    })
  },
  down: () => {},
}
