module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('filters', 'description',
      {
        type: Sequelize.STRING,
        defaultValue: ''
      })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('filters', 'description')
  }
}