const { BIGINT, STRING, DATE, ARRAY } = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable('custom_population_searches', {
      id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: BIGINT,
      },
      name: {
        type: STRING,
        allowNull: false,
      },
      students: {
        type: ARRAY(STRING),
      },
      createdAt: DATE,
      updatedAt: DATE,
    })
  },
  down: () => {},
}
