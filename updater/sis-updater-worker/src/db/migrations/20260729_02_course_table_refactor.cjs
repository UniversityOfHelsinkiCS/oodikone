const { BOOLEAN, JSONB, STRING, TEXT } = require('sequelize')

/**
 * Add: groupId, validityPeriod, primary field
 * Remove: mainCourseCode, old substitutions
 * Additionally substitutionGroups now use the groupIds of course units, rather than the codes.
 */
module.exports = {
  up: async queryInterface => {
    await queryInterface.addColumn('course', 'group_id', STRING)
    await queryInterface.addColumn('course', 'validity_period', JSONB)
    await queryInterface.addColumn('course', 'is_primary', BOOLEAN)
    await queryInterface.removeColumn('course', 'main_course_code')
    await queryInterface.removeColumn('course', 'substitutions')
  },
  down: async queryInterface => {
    await queryInterface.removeColumn('course', 'group_id')
    await queryInterface.removeColumn('course', 'validity_period')
    await queryInterface.removeColumn('course', 'is_primary')
    await queryInterface.addColumn('course', 'main_course_code', TEXT)
    await queryInterface.addColumn('course', 'substitutions', JSONB)
  },
}
