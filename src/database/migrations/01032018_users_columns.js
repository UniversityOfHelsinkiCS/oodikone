module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.removeColumn('users', 'password'),
      queryInterface.addColumn('users', 'full_name', {
        type: Sequelize.STRING,
        defaultValue: null,
        allowNull: true
      }),
      queryInterface.addColumn('users', 'is_enabled', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false
      }),
    ])
  },

  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.addColumn('users', 'password', {
        type: Sequelize.STRING,
        defaultValue: 'pw',
        allowNull: false
      }),
      queryInterface.removeColumn('users', 'is_enabled'),
      queryInterface.removeColumn('users', 'full_name')
    ])
  }
}