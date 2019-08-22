module.exports = {
  up: async (queryInterface) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.sequelize.query('ALTER TABLE tag_student DROP CONSTRAINT "tag_student_tag_id_fkey"', { transaction })
      await queryInterface.sequelize.query('DELETE FROM tag_student WHERE tag_id IS NULL', { transaction })
      await queryInterface.removeConstraint('tag', 'tag_tag_id_key', { transaction })
      await queryInterface.addConstraint('tag', ['tag_id'], {
        type: 'primary key',
        transaction
      })
      await queryInterface.sequelize.query('ALTER TABLE tag_student ADD CONSTRAINT "tag_student_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tag(tag_id) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE', { transaction })
      await queryInterface.removeColumn('tag_student', 'id', { transaction })
      await queryInterface.addConstraint('tag_student', ['studentnumber', 'tag_id'], {
        type: 'primary key',
        transaction
      })
    })
  },
  down: async () => {
  }
}
