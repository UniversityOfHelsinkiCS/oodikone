const { INTEGER, STRING, DATE } = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable(
      'excluded_courses',
      {
        id: {
          primaryKey: true,
          type: INTEGER,
          autoIncrement: true,
        },
        programme_code: {
          type: STRING,
        },
        course_code: {
          type: STRING,
        },
        created_at: {
          type: DATE,
        },
        updated_at: {
          type: DATE,
        },
      },
      {
        uniqueKeys: {
          Items_unique: {
            fields: ['programme_code', 'course_code'],
          },
        },
      }
    )
  },
  down: async () => {},
}
