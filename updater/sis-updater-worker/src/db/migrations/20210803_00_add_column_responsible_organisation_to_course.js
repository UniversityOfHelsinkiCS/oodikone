const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('course', 'responsible_organisation', STRING)
  },
  down: async () => {},
}
