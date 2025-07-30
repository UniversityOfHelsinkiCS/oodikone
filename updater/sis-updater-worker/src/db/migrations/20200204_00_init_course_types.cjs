const { STRING, DATE, JSONB } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('course_types', {
      coursetypecode: {
        type: STRING,
        primaryKey: true,
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
