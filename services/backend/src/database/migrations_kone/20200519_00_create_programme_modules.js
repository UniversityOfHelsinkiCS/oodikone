const { STRING, DATE, JSONB } = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable('programme_modules', {
      id: {
        primaryKey: true,
        type: STRING,
      },
      code: {
        type: STRING,
      },
      name: {
        type: JSONB,
      },
      type: {
        type: STRING,
      },
      created_at: {
        type: DATE,
      },
      updated_at: {
        type: DATE,
      },
    })
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
