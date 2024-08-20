module.exports = {
  up: async ({ context: queryInterface }) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        'ALTER TABLE user_accessgroup DROP CONSTRAINT IF EXISTS "user_accessgroup_accessGroupId_fkey"',
        { transaction }
      )

      await queryInterface.sequelize.query(
        'ALTER TABLE user_accessgroup ADD CONSTRAINT "user_accessgroup_accessGroupId_fkey" FOREIGN KEY ("accessGroupId") REFERENCES access_groups(id) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE',
        { transaction }
      )
    })
  },
  down: async () => {},
}
