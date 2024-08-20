const { ARRAY, STRING, INTEGER } = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.addColumn('progress_criteria', 'courses_year_four', {
      type: ARRAY(STRING),
    })
    await queryInterface.addColumn('progress_criteria', 'courses_year_five', {
      type: ARRAY(STRING),
    })
    await queryInterface.addColumn('progress_criteria', 'courses_year_six', {
      type: ARRAY(STRING),
    })
    await queryInterface.addColumn('progress_criteria', 'credits_year_four', {
      type: INTEGER,
    })
    await queryInterface.addColumn('progress_criteria', 'credits_year_five', {
      type: INTEGER,
    })
    await queryInterface.addColumn('progress_criteria', 'credits_year_six', {
      type: INTEGER,
    })
  },
  down: async () => {},
}
