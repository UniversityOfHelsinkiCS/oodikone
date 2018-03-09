module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users')
    return queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      full_name: {
        type: Sequelize.STRING,
        defaultValue: 'Shibboleth toimii'
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      is_enabled: {
        type: Sequelize.STRING,
        defaultValue: false
      }
    })
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users')
    return queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      password: {
        type: Sequelize.STRING,
        defaultValue: 'Shibboleth toimii'
      },
      username: {
        type: Sequelize.STRING,
        allowNull: false
      },
      createddate: Sequelize.DATE,
      lastmodifieddate: Sequelize.DATE,
      is_enabled: {
        type: Sequelize.STRING,
        defaultValue: false
      }
    })
  }
}