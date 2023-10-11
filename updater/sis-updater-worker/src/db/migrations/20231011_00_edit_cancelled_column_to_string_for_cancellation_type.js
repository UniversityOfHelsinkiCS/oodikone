const { STRING, BOOLEAN } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    // Alter the table and change the "cancelled" column type to STRING
    await queryInterface.changeColumn('studyright', 'cancelled', {
      type: STRING,
      allowNull: true,
    })
  },

  down: async queryInterface => {
    // Revert the changes in case of a rollback
    await queryInterface.changeColumn('studyright', 'cancelled', {
      type: BOOLEAN,
      allowNull: false,
    })
  },
}
