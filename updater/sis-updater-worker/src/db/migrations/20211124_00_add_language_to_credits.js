const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('credits', 'language', {
      type: STRING,
    })
  },
  down: async () => {},
}
