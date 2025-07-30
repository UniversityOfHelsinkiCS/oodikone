module.exports = {
  up: async queryInterface => {
    await queryInterface.addIndex('enrollment', ['course_id'])
  },
  down: async queryInterface => {
    await queryInterface.removeIndex('enrollment', ['course_id'])
  },
}
