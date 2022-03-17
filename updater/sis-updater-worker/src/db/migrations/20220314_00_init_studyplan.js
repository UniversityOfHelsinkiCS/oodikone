const { STRING, DATE, ARRAY, INTEGER } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('studyplan', {
      id: {
        type: INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      studentnumber: {
        type: STRING,
        references: {
          model: 'student',
          key: 'studentnumber',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        allowNull: false,
      },
      programme_code: {
        type: STRING,
        allowNull: false,
      },
      included_courses: {
        type: ARRAY(STRING),
      },
      createdAt: {
        type: DATE,
      },
      updatedAt: {
        type: DATE,
      },
    })
    await queryInterface.addConstraint('studyplan', {
      fields: ['studentnumber', 'programme_code'],
      type: 'unique',
      name: 'source',
    })
  },
  down: async () => {},
}
