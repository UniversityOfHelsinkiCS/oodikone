module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('unit', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      }
    })
    await queryInterface.bulkInsert('unit', [
      { name: 'Bachelor of Science, Mathematics' },
      { name: 'Bachelor of Science, Computer Science' },
      { name: 'Master of Science (science), Computer Science' }
    ])
    await queryInterface.createTable('user_unit', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      user_id: {
        type: Sequelize.BIGINT,
        references: { model: 'users', key: 'id' }
      },
      unit_id: {
        type: Sequelize.BIGINT,
        references: { model: 'unit', key: 'id' }
      }
    })
    return queryInterface.createTable('unit_tag', {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      unit_id: {
        type: Sequelize.BIGINT,
        references: { model: 'unit', key: 'id' }
      },
      tag_id: {
        type: Sequelize.BIGINT,
        references: { model: 'tag', key: 'tagname' }
      }
    })
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('user_unit')
    await queryInterface.dropTable('unit_tag')
    return queryInterface.dropTable('unit')
  }
}