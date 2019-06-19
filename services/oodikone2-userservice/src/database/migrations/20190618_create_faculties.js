module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_faculties',
    {
      userId: {
        primaryKey: true,
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      faculty_code: {
        primaryKey: true,
        type: Sequelize.STRING,
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    })
    await queryInterface.createTable('faculty_programmes',
    {
      faculty_code: {
        primaryKey: true,
        type: Sequelize.STRING,
      },
      programme_code: {
        primaryKey: true,
        type: Sequelize.STRING,
        references: {
          model: 'element_details',
          key: 'code'
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