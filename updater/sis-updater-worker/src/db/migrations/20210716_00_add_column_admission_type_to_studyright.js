const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('studyright', 'admission_type', STRING)
  },
  down: async () => {},
}
