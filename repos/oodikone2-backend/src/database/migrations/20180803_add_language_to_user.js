module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'language',
      {
        type: Sequelize.STRING,
        defaultValue: 'fi'
      })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'language')
  }
}