const { STRING, DATE } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('programme_module_children', {
      composite: {
        type: STRING,
        primaryKey: true,
      },
      parent_id: {
        type: STRING,
        references: {
          model: 'programme_modules',
          key: 'id',
        },
      },
      child_id: {
        type: STRING,
        references: {
          model: 'programme_modules',
          key: 'id',
        },
      },
      created_at: {
        type: DATE,
      },
      updated_at: {
        type: DATE,
      },
    })
  },
  down: async () => {},
}
