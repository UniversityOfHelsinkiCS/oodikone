module.exports = {
  up: async queryInterface => {
    await queryInterface.removeColumn('student', 'home_county_id')
  },
  down: async () => {},
}
