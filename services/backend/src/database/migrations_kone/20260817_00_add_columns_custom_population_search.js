const { STRING, JSONB } = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.addColumn('custom_population_searches', 'mode', {
      type: STRING,
    })
    await queryInterface.addColumn('custom_population_searches', 'programmes', {
      type: JSONB,
    })
    await queryInterface.addColumn('custom_population_searches', 'year', {
      type: STRING,
    })

    await queryInterface.bulkUpdate('custom_population_searches', { mode: 'studentNumbers' }, {})
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.bulkDelete('custom_population_searches', [{ mode: 'programmes' }])
    await queryInterface.removeColumn('custom_population_searches', 'mode')
    await queryInterface.removeColumn('custom_population_searches', 'programmes')
    await queryInterface.removeColumn('custom_population_searches', 'year')
  },
}
