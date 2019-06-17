const conf = require('../../conf-backend')

module.exports = {
  up: async (queryInterface, Sequelize) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.createTable(
        'mandatory_course_labels',
        {
          studyprogramme_id: {
            type: Sequelize.STRING
          },
          id: {
            primaryKey: true,
            type: Sequelize.BIGINT,
            autoIncrement: true
          },
          label: {
            type: Sequelize.STRING
          },
          orderNumber: {
            type: Sequelize.INTEGER
          },
          createdAt: {
            type: Sequelize.DATE
          },
          updatedAt: {
            type: Sequelize.DATE
          }
        },
        { transaction }
      )
      await queryInterface.addIndex('mandatory_course_labels', ['studyprogramme_id'], { transaction })
      // Temporarily hardcode schema here since sequelize has issues:
      // https://github.com/sequelize/sequelize/issues/10875
      await queryInterface.removeColumn({ tableName: 'mandatory_courses', schema: conf.DB_SCHEMA_KONE },
        'label', { transaction, }
      )
      await queryInterface.addColumn(
        { tableName: 'mandatory_courses', schema: 'kone_data' },
        'label',
        {
          type: Sequelize.BIGINT,
          references: {
            model: 'mandatory_course_labels',
            key: 'id'
          },
          onDelete: 'SET NULL',
          onUpdate: 'CASCADE'
        },
        { transaction }
      )
    })
  },

  down: async () => {
  }
}
