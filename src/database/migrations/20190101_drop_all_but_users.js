module.exports = {
  up: async (queryInterface) => {
    await queryInterface.dropTable('course', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('course_disciplines', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('course_enrollments', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('course_providers', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('course_types', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('courserealisation_types', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('courserealisations', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('credit', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('credit_teachers', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('credit_types', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('disciplines', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('filters', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('ldapuser', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('migrations', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('organization', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('providers', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('semester_enrollments', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('semesters', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('student', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('student_list', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('tag', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('tag_student', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('teacher', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('transfers', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('unit', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('unit_tag', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('usage_statistics', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('studyright', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('studyright_elements', {
      force: true,
      cascade: false,
    })
    await queryInterface.dropTable('studyright_extents', {
      force: true,
      cascade: false,
    })
  },
  down: async () => {
  }
}