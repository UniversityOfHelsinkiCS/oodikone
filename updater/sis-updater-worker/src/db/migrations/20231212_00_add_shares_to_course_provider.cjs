const { JSONB } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.query('ALTER TABLE course_providers DROP COLUMN IF EXISTS share')
    await queryInterface.addColumn('course_providers', 'shares', {
      type: JSONB,
    })
  },
  down: async queryInterface => {
    await queryInterface.deleteColumn('course_providers', 'shares')
  },
}
