module.exports = {
  up: async queryInterface => {
    queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.addIndex('enrollment', ['studentnumber'], { transaction })
      await queryInterface.addIndex('studyplan', ['studentnumber'], { transaction })
      await queryInterface.addIndex('studyplan', ['sis_study_right_id'], { transaction })
    })
  },
  down: async queryInterface => {
    queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeIndex('enrollment', ['studentnumber'], { transaction })
      await queryInterface.removeIndex('studyplan', ['studentnumber'], { transaction })
      await queryInterface.removeIndex('studyplan', ['sis_study_right_id'], { transaction })
    })
  },
}
