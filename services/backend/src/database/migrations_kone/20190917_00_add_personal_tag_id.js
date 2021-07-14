module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tag', 'personal_user_id', {
      type: Sequelize.BIGINT,
    })
  },
  down: async () => {},
}
