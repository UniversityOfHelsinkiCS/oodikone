module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'course_groups',
      'programmeid',
      {
        type: Sequelize.STRING,
        defaultValue: 'KH60_001',
        references: {
          model: 'element_details',
          key: 'code'
        }
      }
    )
    await queryInterface.changeColumn('course_groups', 'programmeid', {
      type: Sequelize.STRING,
      defaultValue: null,
    })
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn(
      'course_groups',
      'programmeid'
    )
  }
}
