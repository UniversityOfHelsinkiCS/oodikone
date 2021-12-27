module.exports = {
  up: (queryInterface, Sequelize) => {
    const Op = Sequelize.Op
    return queryInterface.bulkDelete('access_groups', [
      {
        group_code: { [Op.in]: ['dev', 'users', 'cooldata', 'studyprogramme'] },
      },
    ])
  },
}
