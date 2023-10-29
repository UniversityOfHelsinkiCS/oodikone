const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('studyright', 'actual_studyrightid', {
      type: STRING,
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('studyright', 'actual_studyrightid')
  },
}
