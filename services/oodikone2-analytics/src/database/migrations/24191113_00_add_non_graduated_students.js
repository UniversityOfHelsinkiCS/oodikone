module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('nongraduatedstudents', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      data: Sequelize.JSONB,
      createdAt: Sequelize.DATE,
      updatedAt: Sequelize.DATE
    })
  },
  down: () => {}
}
