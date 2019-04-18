module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('users', 'czar',
      {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('users', 'czar')
  }
}