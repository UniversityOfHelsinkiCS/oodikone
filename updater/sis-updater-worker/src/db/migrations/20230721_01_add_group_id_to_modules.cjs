const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('programme_modules', 'group_id', {
      type: STRING,
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('programme_modules', 'group_id')
  },
}
