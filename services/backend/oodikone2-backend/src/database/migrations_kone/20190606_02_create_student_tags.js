module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tag_students', {
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      },
      tag_id: {
        type: Sequelize.STRING,
        primaryKey: true,
        reference: {
          model: 'tag',
          key: 'tag_id'
        }
      },
      studentnumber: {
        type: Sequelize.STRING
      }
    })
  },
  down: async () => {
  }
}
