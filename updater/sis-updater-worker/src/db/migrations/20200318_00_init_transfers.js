const { DATE, STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('transfers', {
      id: {
        type: STRING,
        primaryKey: true,
      },
      sourcecode: {
        type: STRING,
        references: {
          model: 'element_details',
          key: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      targetcode: {
        type: STRING,
        references: {
          model: 'element_details',
          key: 'code',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      transferdate: {
        type: DATE,
      },
      studentnumber: {
        type: STRING,
        references: {
          model: 'student',
          key: 'studentnumber',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      studyrightid: {
        type: STRING,
        references: {
          model: 'studyright',
          key: 'studyrightid',
        },
        onUpdate: 'cascade',
        onDelete: 'cascade',
      },
      created_at: {
        type: DATE,
      },
      updated_at: {
        type: DATE,
      },
    })

    await queryInterface.addIndex('transfers', ['studentnumber'])
    await queryInterface.addIndex('transfers', ['sourcecode'])
    await queryInterface.addIndex('transfers', ['targetcode'])
  },
  down: async () => {},
}
