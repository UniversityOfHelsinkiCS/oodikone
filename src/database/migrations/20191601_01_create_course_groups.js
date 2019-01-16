module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('course_groups',
      {
        id: {
          primaryKey: true,
          type: Sequelize.BIGINT,
          autoIncrement: true
        },
        name: {
          type: Sequelize.STRING,
          unique: true
        },
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
        }
      })
    await queryInterface.createTable('teacher_course_group',
      {
        id: {
          primaryKey: true,
          type: Sequelize.BIGINT,
          autoIncrement: true
        },
        teacher_id: {
          type: Sequelize.STRING,
          references: {
            model: 'teacher',
            key: 'id'
          }

        },
        course_group_id: {
          type: Sequelize.BIGINT,
          references: {
            model: 'course_groups',
            key: 'id'
          }
        },
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
        }
      })
  },
  down: async () => {
  }
}