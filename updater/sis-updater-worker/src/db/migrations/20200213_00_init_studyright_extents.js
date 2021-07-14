const { DATE, JSONB, INTEGER } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('studyright_extents', {
      extentcode: {
        type: INTEGER,
        primaryKey: true,
      },
      name: {
        type: JSONB,
      },
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
