const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('credit', 'studyright_id', {
      type: STRING,
      allowNull: true,
      references: {
        model: 'studyright',
        key: 'studyrightid',
      },
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('credit', 'studyright_id')
  },
}
