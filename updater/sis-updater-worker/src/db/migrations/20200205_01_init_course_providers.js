const { STRING, DATE } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('course_providers', {
      composite: {
        type: STRING,
        primaryKey: true,
      },
      coursecode: {
        type: STRING,
        references: {
          model: 'course',
          key: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      organizationcode: {
        type: STRING,
        references: {
          model: 'organization',
          key: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      created_at: {
        type: DATE,
      },
      updated_at: {
        type: DATE,
      },
    })

    await queryInterface.addIndex('course_providers', ['coursecode', 'organizationcode'], { unique: true })
  },
  down: async () => {},
}
