module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query('ALTER TABLE transfers DROP CONSTRAINT "transfers_studyrightid_fkey"', { transaction })
      await queryInterface.sequelize.query('ALTER TABLE transfers DROP CONSTRAINT "transfers_sourcecode_fkey"', { transaction })
      await queryInterface.sequelize.query('ALTER TABLE transfers DROP CONSTRAINT "transfers_studentnumber_fkey"', { transaction })
      await queryInterface.sequelize.query('ALTER TABLE transfers DROP CONSTRAINT "transfers_targetcode_fkey"', { transaction })
      await queryInterface.sequelize.query('ALTER TABLE transfers ADD CONSTRAINT "transfers_studyrightid_fkey" FOREIGN KEY (studyrightid) REFERENCES studyright(studyrightid) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE', { transaction })
      await queryInterface.sequelize.query('ALTER TABLE transfers ADD CONSTRAINT "transfers_sourcecode_fkey" FOREIGN KEY (sourcecode) REFERENCES element_details(code) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE', { transaction })
      await queryInterface.sequelize.query('ALTER TABLE transfers ADD CONSTRAINT "transfers_studentnumber_fkey" FOREIGN KEY (studentnumber) REFERENCES student(studentnumber) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE', { transaction })
      await queryInterface.sequelize.query('ALTER TABLE transfers ADD CONSTRAINT "transfers_targetcode_fkey" FOREIGN KEY (targetcode) REFERENCES element_details(code) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE', { transaction })
      await queryInterface.sequelize.query('DELETE FROM transfers WHERE studyrightid IS NULL OR sourcecode IS NULL OR studentnumber IS NULL OR targetcode IS NULL', { transaction })
    })
  },
  down: async () => {
  }
}