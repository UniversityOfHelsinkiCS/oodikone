const { STRING, DATE, JSONB } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('curriculum_periods', {
      id: {
        primaryKey: true,
        type: STRING,
      },
      name: {
        type: JSONB,
        allowNull: false,
      },
      university_org_id: {
        type: STRING,
        allowNull: false,
      },
      start_date: {
        type: DATE,
        allowNull: false,
      },
      end_date: {
        type: DATE,
        allowNull: false,
      },
      created_at: {
        type: DATE,
        allowNull: false,
      },
      updated_at: {
        type: DATE,
        allowNull: false,
      },
    })
  },
  down: async queryInterface => {
    await queryInterface.dropTable('curriculum_periods')
  },
}
