module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.query(
      `DELETE
            FROM studyright_elements a
                USING studyright_elements b
            WHERE
                a.id < b.id
                AND a."createdAt" < b."createdAt"
                AND a.studentnumber = b.studentnumber
                AND a.studyrightid = b.studyrightid
                AND a.code = b.code`,
      {
        raw: true,
        underscored: false,
      }
    )
    await queryInterface.removeIndex('studyright_elements', ['startdate', 'enddate', 'studyrightid', 'code'])
    await queryInterface.addIndex('studyright_elements', ['startdate', 'studyrightid', 'code', 'studentnumber'], {
      unique: true,
    })
  },
  down: async () => {},
}
