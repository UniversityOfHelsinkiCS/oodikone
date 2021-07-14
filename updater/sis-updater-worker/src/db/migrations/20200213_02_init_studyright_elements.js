const { DATE, STRING } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.createTable('studyright_elements', {
      id: {
        type: STRING,
        primaryKey: true,
      },
      startdate: {
        type: DATE,
      },
      enddate: {
        type: DATE,
      },
      studyrightid: {
        type: STRING,
        references: {
          model: 'studyright',
          key: 'studyrightid',
        },
      },
      code: {
        type: STRING,
        references: {
          model: 'element_details',
          key: 'code',
        },
      },
      studentnumber: {
        type: STRING,
        references: {
          model: 'student',
          key: 'studentnumber',
        },
      },
      createdAt: {
        type: DATE,
      },
      updatedAt: {
        type: DATE,
      },
    })
  },
  down: async () => {},
}
