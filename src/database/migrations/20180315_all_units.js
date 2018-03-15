module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('unit')
    // eslint-disable-next-line
    const rawFromDB = await queryInterface.sequelize.query(`select distinct highlevelname from studyright where highlevelname like 'Bachelor of%' or highlevelname like 'Master of%';`,
      { type: queryInterface.sequelize.QueryTypes.SELECT })
    const formatted = rawFromDB.map(studyright => ({ name: studyright.highlevelname }))
    await queryInterface.bulkInsert('unit', formatted)

    await queryInterface.addColumn(
      'unit',
      'enabled',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      }
    )

    // Bachelor's Programme is with like because SQL doesn't like escaping '.
    // eslint-disable-next-line
    return queryInterface.sequelize.query(`UPDATE unit SET enabled=true WHERE 
    name='Bachelor of Science, Mathematics' or 
    name='Bachelor of Science, Computer Science' or 
    name='Master of Science (science), Computer Science' or
    name like 'Bachelor of Science (Agriculture and Forestry), Bachelor_s Programme in Enviromental and Food Economics'`)
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('unit')
    await queryInterface.removeColumn('unit', 'enabled')
    return queryInterface.bulkInsert('unit', [
      { name: 'Bachelor of Science, Mathematics' },
      { name: 'Bachelor of Science, Computer Science' },
      { name: 'Master of Science (science), Computer Science' }
    ])
  }
}