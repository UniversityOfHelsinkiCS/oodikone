module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'email',
      {
        type: Sequelize.STRING
      })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'email')
  }
}