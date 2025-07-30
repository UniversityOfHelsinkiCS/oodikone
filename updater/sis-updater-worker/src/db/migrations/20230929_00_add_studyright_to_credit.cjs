const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('credit', 'studyright_id', {
      type: STRING,
      allowNull: true,
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('credit', 'studyright_id')
  },
}
