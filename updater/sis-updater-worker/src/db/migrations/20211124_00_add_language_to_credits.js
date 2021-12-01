const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('credit', 'language', {
      type: STRING,
    })
  },
  down: async () => {},
}
