const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('studyright', 'acual_studyrightid', {
      type: STRING,
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('studyright', 'acual_studyrightid')
  },
}
