const { DATE } = require('sequelize')

module.exports = {
  up: async queryInterface => {
    await queryInterface.removeColumn('course', 'startdate')
    await queryInterface.removeColumn('course', 'enddate')
    await queryInterface.removeColumn('course', 'latest_instance_date')
  },
  down: async queryInterface => {
    await queryInterface.addColumn('course', 'startdate', {
      type: DATE,
    })
    await queryInterface.addColumn('course', 'enddate', {
      type: DATE,
    })
    await queryInterface.addColumn('course', 'latest_instance_date', {
      type: DATE,
    })
  },
}
