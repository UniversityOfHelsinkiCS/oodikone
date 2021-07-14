const { DATE, STRING, JSONB, INTEGER } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('element_details', {
      //irtisanomisperuste
      code: { type: STRING, primaryKey: true },
      name: { type: JSONB },
      type: { type: INTEGER },
      createdAt: {
        type: DATE,
      },
      updatedAt: {
        type: DATE,
      },
    })
  },
  down: async () => {},
}
