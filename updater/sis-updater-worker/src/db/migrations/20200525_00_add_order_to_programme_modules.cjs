const { INTEGER } = require('sequelize')

// Creates the exact same table as in last migration, but because staging data was messed,
// this has to be done

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('programme_modules', 'order', {
      type: INTEGER,
    })
  },
  down: async () => {},
}
