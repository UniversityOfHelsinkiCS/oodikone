module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tag', {
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      },
      tagname: {
        type: Sequelize.STRING,
      },
      tag_id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      studytrack: {
        type: Sequelize.STRING,
        primaryKey: true,
      }
    })
  },
  down: async () => {
  }
}