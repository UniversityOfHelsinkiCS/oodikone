const { JSONB, DATE, INTEGER } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('credit_types', {
      credittypecode: {
        primaryKey: true,
        type: INTEGER,
      },
      name: {
        type: JSONB,
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
