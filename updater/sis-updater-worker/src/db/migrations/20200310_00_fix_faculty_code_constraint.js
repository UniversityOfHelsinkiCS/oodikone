module.exports = {
  up: async queryInterface => {
    await queryInterface.removeIndex('organization', ['code'])
    await queryInterface.addIndex('organization', ['code'], {
      unique: true,
    })
    await queryInterface.addConstraint('studyright', ['faculty_code'], {
      type: 'foreign key',
      name: 'faculty_code_fk',
      references: {
        table: 'organization',
        field: 'code',
      },
      onDelete: 'cascade',
      onUpdate: 'cascade',
    })
  },
  down: () => {},
}
