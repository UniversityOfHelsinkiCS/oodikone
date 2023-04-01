const { STRING, DATE, ARRAY, INTEGER } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.dropTable('studyplan')
    await queryInterface.createTable('studyplan', {
      id: {
        primaryKey: true,
        type: STRING,
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
      studyrightid: {
        type: STRING,
        references: {
          model: 'studyright',
          key: 'studyrightid',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
        allowNull: false,
      },
      completed_credits: {
        type: INTEGER,
        allowNull: true,
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
  },
  down: async () => {},
}
