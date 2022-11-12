const { BIGINT, STRING, DATE, ARRAY } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('open_uni_population_searches', {
      id: {
        type: BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: BIGINT,
      },
      name: {
        type: STRING,
        allowNull: false,
      },
      course_codes: {
        type: ARRAY(STRING),
      },
      created_at: DATE,
      updated_at: DATE,
    })
  },
  down: () => {},
}
