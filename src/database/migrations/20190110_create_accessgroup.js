module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('access_groups',
    {
      id: {
        primaryKey: true,
        type: Sequelize.BIGINT,
        autoIncrement: true
      },
      group_code: {
        type: Sequelize.STRING,
        unique: true
      },
      group_info: {
        type: Sequelize.STRING
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    })
    await queryInterface.createTable('user_accessgroup',
    {
      id: {
        primaryKey: true,
        type: Sequelize.BIGINT,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'users',
          key: 'id'
        }

      },
      accessGroupId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'access_groups',
          key: 'id'
        }
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    })
    
  },
  down: async () => {
  }
}