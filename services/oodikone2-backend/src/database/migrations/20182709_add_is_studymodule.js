module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.addColumn('credit', 'isStudyModule',
      {
        type: Sequelize.BOOLEAN
      })
  },
  down: (queryInterface) => {
    return queryInterface.removeColumn('credit', 'isStudyModule')
  }
}