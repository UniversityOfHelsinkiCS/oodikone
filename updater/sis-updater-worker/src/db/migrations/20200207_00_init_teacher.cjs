const { STRING, DATE } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('teacher', {
      id: {
        primaryKey: true,
        type: STRING,
      },
      name: {
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
