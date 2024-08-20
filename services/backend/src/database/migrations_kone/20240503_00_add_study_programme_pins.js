const Sequelize = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.createTable('study_programme_pins', {
      user_id: {
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      study_programmes: {
        type: Sequelize.ARRAY(Sequelize.STRING),
      },
    })
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.dropTable('study_programme_pins')
  },
}
