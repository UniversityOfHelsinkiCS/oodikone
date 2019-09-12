module.exports = {
  up: async (queryInterface) => {
    return new Promise(async (res) => { // eslint-disable-line
      // For some reason sequelize tried to create a new
      // access group with an already existing id (= 8).
      // Therefore we need to "update" sequelize's auto increment
      // by deleting the corrupted id.
      const buggedAccessGroup = (await queryInterface.sequelize.query(
        'SELECT * FROM access_groups WHERE id = ?', {
          replacements: [8],
          type: queryInterface.sequelize.QueryTypes.SELECT
        }
      ))[0]

      if (buggedAccessGroup) {
        queryInterface.bulkDelete('access_groups', { id: 8 })
        queryInterface.bulkInsert('access_groups', [
          {
            group_code: buggedAccessGroup.group_code,
            group_info: buggedAccessGroup.group_info,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ])
      }

      queryInterface.bulkInsert('access_groups', [
        {
          group_code: 'faculties',
          group_info: 'grants access to faculty statistics',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ])

      res()
    })
  },
  down: async () => {
  }
}
