module.exports = {
  up: async ({ context: queryInterface }) => {
    return queryInterface.sequelize.transaction(async transaction => {
      await queryInterface.removeConstraint('tag_student', 'tag_student_tag_id_fkey', { transaction })
      await queryInterface.sequelize.query('DELETE FROM tag_student WHERE tag_id IS NULL', { transaction })
      await queryInterface.removeConstraint('tag', 'tag_tag_id_key', { transaction })
      await queryInterface.addConstraint('tag', {
        type: 'primary key',
        fields: ['tag_id'],
        transaction,
      })
      await queryInterface.sequelize.query(
        'ALTER TABLE tag_student ADD CONSTRAINT "tag_student_tag_id_fkey" FOREIGN KEY (tag_id) REFERENCES tag(tag_id) ON UPDATE CASCADE ON DELETE CASCADE NOT DEFERRABLE',
        { transaction }
      )
      await queryInterface.removeColumn('tag_student', 'id', { transaction })
      await queryInterface.addConstraint('tag_student', {
        type: 'primary key',
        fields: ['studentnumber', 'tag_id'],
        transaction,
      })
    })
  },
  down: async () => {},
}
