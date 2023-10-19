const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('enrollment', 'studyright_id', {
      type: STRING,
      allowNull: true,
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('enrollment', 'studyright_id')
  },
}
