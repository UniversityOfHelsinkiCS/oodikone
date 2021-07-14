module.exports = {
  up: async queryInterface => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addIndex('course_disciplines', ['course_id'], { transaction })
      await queryInterface.addIndex('element_details', ['type'], { transaction })
      await queryInterface.addIndex('studyright', ['canceldate'], { transaction })
      await queryInterface.addIndex('studyright', ['extentcode'], { transaction })
      await queryInterface.addIndex('studyright_elements', ['studentnumber'], { transaction })
      await queryInterface.addIndex('studyright_elements', ['studyrightid'], { transaction })
      await queryInterface.addIndex('studyright_elements', ['code'], { transaction })
      await queryInterface.addIndex('transfers', ['sourcecode'], { transaction })
      await queryInterface.addIndex('transfers', ['targetcode'], { transaction })
    })
  },
  down: async () => {},
}
