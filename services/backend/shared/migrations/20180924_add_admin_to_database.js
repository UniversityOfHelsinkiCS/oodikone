module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'admin',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'admin')
  }
}