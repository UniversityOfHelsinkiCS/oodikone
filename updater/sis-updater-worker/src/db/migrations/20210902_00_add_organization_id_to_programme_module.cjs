const { STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('programme_modules', 'organization_id', {
      type: STRING,
      references: {
        model: 'organization',
        key: 'id',
      },
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('programme_modules', 'organization_id')
  },
}
