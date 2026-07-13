const { INTEGER, STRING, DATE } = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable('banners', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      text: {
        type: STRING,
        allowNull: false,
      },
      color: {
        type: STRING,
        allowNull: false,
      },
      lightness: {
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
      last_modified_by: {
        type: STRING,
        allowNull: false,
      },
      created_at: {
        type: DATE,
      },
      updated_at: {
        type: DATE,
      },
    })
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('banners')
  },
}
