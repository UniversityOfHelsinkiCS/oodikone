const { STRING, DATE, JSONB } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('organization', {
      id: {
        type: STRING,
        primaryKey: true,
      },
      name: {
        type: JSONB,
      },
      code: {
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
