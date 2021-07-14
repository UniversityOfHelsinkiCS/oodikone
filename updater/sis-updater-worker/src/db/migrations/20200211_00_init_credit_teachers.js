const { DATE, STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('credit_teachers', {
      composite: {
        type: STRING,
        primaryKey: true,
      },
      credit_id: {
        type: STRING,
        references: {
          model: 'credit',
          key: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      teacher_id: {
        type: STRING,
        references: {
          model: 'teacher',
          key: 'id',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
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
