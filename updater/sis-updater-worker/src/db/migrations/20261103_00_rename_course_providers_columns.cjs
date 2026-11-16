const columnRenames = [
  ['coursecode', 'course_group_id'],
  ['organizationcode', 'organization_id'],
]

const indexRenames = [
  ['course_providers_coursecode', 'course_providers_course_group_id'],
  ['course_providers_organizationcode', 'course_providers_organization_id'],
]

const constraintRenames = [
  ['course_providers_coursecode_organizationcode_unique', 'course_providers_course_group_id_organization_id_unique'],
  ['course_providers_organizationcode_fkey', 'course_providers_organization_id_fkey'],
]

const reversed = renames => renames.map(([from, to]) => [to, from])

const renameStatements = ({ columns, indexes, constraints }) =>
  [
    ...columns.map(([from, to]) => `ALTER TABLE course_providers RENAME COLUMN ${from} TO ${to};`),
    ...indexes.map(([from, to]) => `ALTER INDEX ${from} RENAME TO ${to};`),
    ...constraints.map(([from, to]) => `ALTER TABLE course_providers RENAME CONSTRAINT ${from} TO ${to};`),
  ].join('\n')

const runInTransaction = (queryInterface, sql) =>
  queryInterface.sequelize.transaction(transaction => queryInterface.sequelize.query(sql, { transaction }))

module.exports = {
  up: async queryInterface => {
    await runInTransaction(
      queryInterface,
      renameStatements({ columns: columnRenames, indexes: indexRenames, constraints: constraintRenames })
    )
  },
  down: async queryInterface => {
    await runInTransaction(
      queryInterface,
      renameStatements({
        columns: reversed(columnRenames),
        indexes: reversed(indexRenames),
        constraints: reversed(constraintRenames),
      })
    )
  },
}
