module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.query(`
      ALTER TABLE studyplan
      ALTER COLUMN included_modules TYPE TEXT[]
      USING included_modules::TEXT[]
    `)
  },
  down: async queryInterface => {
    await queryInterface.sequelize.query(`
      ALTER TABLE studyplan
      ALTER COLUMN included_modules TYPE TEXT
      USING included_modules::TEXT
    `)
  },
}
