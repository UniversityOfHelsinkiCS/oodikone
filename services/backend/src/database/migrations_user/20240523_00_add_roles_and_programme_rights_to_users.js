const { ARRAY, STRING } = require('sequelize')

module.exports = {
  up: async ({ context: queryInterface }) => {
    await queryInterface.addColumn('users', 'roles', {
      type: ARRAY(STRING),
      allowNull: false,
      defaultValue: [],
    })
    await queryInterface.sequelize.query(`
      UPDATE users
      SET roles = COALESCE(subquery.roles, '{}')
      FROM (
        SELECT uag."userId" AS "userId", ARRAY_AGG(ag.group_code) AS roles
        FROM user_accessgroup uag
        JOIN access_groups ag ON uag."accessGroupId" = ag.id
        GROUP BY uag."userId"
      ) AS subquery
      WHERE users.id = subquery."userId"
    `)
    await queryInterface.addColumn('users', 'programme_rights', {
      type: ARRAY(STRING),
      allowNull: false,
      defaultValue: [],
    })
    await queryInterface.sequelize.query(`
      UPDATE users
      SET programme_rights = subquery.programme_rights
      FROM (
        SELECT "userId", ARRAY_AGG("elementDetailCode") AS programme_rights
        FROM "user_elementdetails"
        GROUP BY "userId"
      ) AS subquery
      WHERE users.id = subquery."userId"
    `)
  },
  down: async ({ context: queryInterface }) => {
    await queryInterface.removeColumn('users', 'roles')
    await queryInterface.removeColumn('users', 'programme_rights')
  },
}
