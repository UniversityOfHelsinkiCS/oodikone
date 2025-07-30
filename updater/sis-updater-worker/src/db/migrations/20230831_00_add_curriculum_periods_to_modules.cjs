const { ARRAY, TEXT } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('programme_modules', 'curriculum_period_ids', {
      type: ARRAY(TEXT),
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('programme_modules', 'curriculum_period_ids')
  },
}
