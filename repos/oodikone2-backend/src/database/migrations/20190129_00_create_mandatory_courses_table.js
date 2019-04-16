module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('mandatory_courses',
      {
        id: {
          primaryKey: true,
          type: Sequelize.BIGINT,
          autoIncrement: true
        },
        course_code: {
          type: Sequelize.STRING,
          references: {
            model: 'course',
            key: 'code'
          }
        },
        studyprogramme_id: {
          type: Sequelize.STRING,
        },
        createdAt: {
          type: Sequelize.DATE
        },
        updatedAt: {
          type: Sequelize.DATE
        }
      })  },
  down: queryInterface => {
    queryInterface.dropTable('mandatory_courses')
  }
}
