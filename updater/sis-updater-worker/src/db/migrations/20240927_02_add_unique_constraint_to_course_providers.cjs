module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS course_providers_coursecode_organizationcode')

    await queryInterface.addConstraint('course_providers', {
      fields: ['coursecode', 'organizationcode'],
      type: 'unique',
      name: 'course_providers_coursecode_organizationcode_unique',
    })
  },
  down: async queryInterface => {
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX IF NOT EXISTS course_providers_coursecode_organizationcode ON course_providers (coursecode, organizationcode)'
    )
    await queryInterface.sequelize.query(
      'ALTER TABLE course_providers DROP CONSTRAINT IF EXISTS course_providers_coursecode_organizationcode_unique'
    )
  },
}
