const { ARRAY, STRING } = require('sequelize')

const YEARS = ['one', 'two', 'three', 'four', 'five', 'six']

// Migration step 1 of 2
module.exports = {
  up: async ({ context: queryInterface }) => {
    for (const year of YEARS) {
      await queryInterface.addColumn('progress_criteria', `course_group_ids_year_${year}`, {
        type: ARRAY(STRING),
      })
    }
  },

  down: async ({ context: queryInterface }) => {
    for (const year of YEARS) {
      await queryInterface.removeColumn('progress_criteria', `course_group_ids_year_${year}`)
    }
  },
}
