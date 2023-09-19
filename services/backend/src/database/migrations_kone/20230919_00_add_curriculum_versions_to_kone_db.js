module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query('TRUNCATE TABLE progress_criteria')
    await queryInterface.sequelize.query('TRUNCATE TABLE excluded_courses')
    await queryInterface.removeConstraint('excluded_courses', 'excluded_courses_programme_code_course_code_key')
    await queryInterface.addColumn('progress_criteria', 'curriculum_version', {
      type: Sequelize.STRING,
    })
    await queryInterface.addColumn('excluded_courses', 'curriculum_version', {
      type: Sequelize.STRING,
    })
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('progress_criteria', 'curriculum_version')
    await queryInterface.removeColumn('excluded_courses', 'curriculum_version')
  },
}
