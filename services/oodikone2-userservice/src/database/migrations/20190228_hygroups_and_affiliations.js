module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('hy_groups',
    {
      id: {
        primaryKey: true,
        type: Sequelize.BIGINT,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING,
        unique: true
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    })
    await queryInterface.createTable('user_hy_group',
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
      hyGroupId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'hy_groups',
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

    await queryInterface.createTable('affiliations',
    {
      id: {
        primaryKey: true,
        type: Sequelize.BIGINT,
        autoIncrement: true
      },
      code: {
        type: Sequelize.STRING,
        unique: true
      },
      createdAt: {
        type: Sequelize.DATE
      },
      updatedAt: {
        type: Sequelize.DATE
      }
    })
    await queryInterface.createTable('user_affiliation',
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
      affiliationId: {
        type: Sequelize.BIGINT,
        references: {
          model: 'affiliations',
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