module.exports = {
  up: async queryInterface => {
    await queryInterface.bulkDelete('studyright_elements')
  },
  down: async () => {},
}
