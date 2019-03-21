module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('thesis_courses', {
      programmeCode: {
        primaryKey: true,
        type: Sequelize.STRING,
        references: {
          model: 'element_details',
          key: 'code'
        }
      },
      courseCode: {
        primaryKey: true,
        type: Sequelize.STRING,
        references: {
          model: 'course',
          key: 'code'
        }
      },
      thesisType: {
        type: Sequelize.ENUM(['BACHELOR', 'MASTER'])
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    })
  },
  down: queryInterface => {
    queryInterface.dropTable('thesis_courses')
  }
}
  