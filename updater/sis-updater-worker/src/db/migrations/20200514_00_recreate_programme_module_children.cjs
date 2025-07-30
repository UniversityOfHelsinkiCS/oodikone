const { STRING, DATE } = require('sequelize')

// Creates the exact same table as in last migration, but because staging data was messed,
// this has to be done

module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('programme_module_children')
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
