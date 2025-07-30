const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('organization', 'parent_id', {
      type: STRING,
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('organization', 'parent_id')
  },
}
