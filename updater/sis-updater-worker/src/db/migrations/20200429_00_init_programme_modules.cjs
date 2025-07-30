const { STRING, DATE, JSONB } = require('sequelize')

module.exports = {
  up: async queryInterface => {
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
  },
  down: async () => {},
}
