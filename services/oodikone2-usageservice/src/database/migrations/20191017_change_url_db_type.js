module.exports = {
  up: async queryInterface => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query(
        `
ALTER TABLE usage_statistics
ALTER COLUMN "URL" TYPE TEXT;
`,
        { transaction }
      )
    })
  },
  down: () => {}
}
