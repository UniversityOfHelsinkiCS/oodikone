module.exports = {
  up: async queryInterface => {
    await queryInterface.sequelize.query(
      `DELETE
            FROM transfers a
                USING transfers b
            WHERE
                a.id > b.id
                AND a.transferdate = b.transferdate
                AND a.studentnumber = b.studentnumber
                AND a.studyrightid = b.studyrightid
                AND a.sourcecode = b.sourcecode
                AND a.targetcode = b.targetcode`,
      {
        raw: true
      }
    )
    await queryInterface.addIndex(
      'transfers',
      ['studyrightid', 'sourcecode', 'targetcode', 'transferdate', 'studentnumber'],
      {
        unique: true
      }
    )
  },
  down: async () => {}
}
