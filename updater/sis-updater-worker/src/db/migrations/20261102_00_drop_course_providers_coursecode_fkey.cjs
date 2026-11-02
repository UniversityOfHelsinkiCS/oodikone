module.exports = {
  up: async queryInterface => {
    await queryInterface.removeConstraint('course_providers', 'course_providers_coursecode_fkey')
  },
  // NB: Fails if course_providers contains group ids that aren't course ids.
  down: async queryInterface => {
    await queryInterface.sequelize.query(
      `alter table course_providers
        add constraint course_providers_coursecode_fkey foreign key("coursecode") references "course" ("id")
        on delete cascade on update cascade`
    )
  },
}
