/**
 * coursecode holds the course group id and organizationcode holds the organization id. Rename them accordingly.
 * Index and constraint names are renamed too, guarded so missing names don't fail the migration.
 */
const renames = [
  ['course_providers_coursecode', 'course_providers_course_group_id'],
  ['course_providers_organizationcode', 'course_providers_organization_id'],
  ['course_providers_coursecode_organizationcode_unique', 'course_providers_course_group_id_organization_id_unique'],
]

const renameForeignKey = (from, to) => `
  DO $$
  BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = '${from}') THEN
      ALTER TABLE course_providers RENAME CONSTRAINT ${from} TO ${to};
    END IF;
  END $$;
`

module.exports = {
  up: async queryInterface => {
    await queryInterface.renameColumn('course_providers', 'coursecode', 'course_group_id')
    await queryInterface.renameColumn('course_providers', 'organizationcode', 'organization_id')
    await Promise.all(
      renames.map(([from, to]) => queryInterface.sequelize.query(`ALTER INDEX IF EXISTS ${from} RENAME TO ${to}`))
    )
    await queryInterface.sequelize.query(
      renameForeignKey('course_providers_organizationcode_fkey', 'course_providers_organization_id_fkey')
    )
  },
  down: async queryInterface => {
    await queryInterface.sequelize.query(
      renameForeignKey('course_providers_organization_id_fkey', 'course_providers_organizationcode_fkey')
    )
    await Promise.all(
      renames.map(([from, to]) => queryInterface.sequelize.query(`ALTER INDEX IF EXISTS ${to} RENAME TO ${from}`))
    )
    await queryInterface.renameColumn('course_providers', 'organization_id', 'organizationcode')
    await queryInterface.renameColumn('course_providers', 'course_group_id', 'coursecode')
  },
}
