module.exports = {
  up: async queryInterface => {
    // STUDYRIGHT
    await queryInterface.sequelize.query('alter table studyright drop constraint studyright_extentcode_fkey')
    await queryInterface.sequelize.query(
      `alter table studyright
        add constraint studyright_extentcode_fkey foreign key("extentcode") references "studyright_extents" ("extentcode")
        on delete cascade on update cascade`
    )

    await queryInterface.sequelize.query('alter table studyright drop constraint studyright_student_studentnumber_fkey')
    await queryInterface.sequelize.query(
      `alter table studyright
        add constraint studyright_student_studentnumber_fkey foreign key("student_studentnumber") references "student" ("studentnumber")
        on delete cascade on update cascade`
    )

    // STUDYRIGHT_ELEMENTS
    await queryInterface.sequelize.query(
      'alter table studyright_elements drop constraint studyright_elements_code_fkey'
    )
    await queryInterface.sequelize.query(
      `alter table studyright_elements
        add constraint studyright_elements_code_fkey foreign key("code") references "element_details" ("code")
        on delete cascade on update cascade`
    )

    await queryInterface.sequelize.query(
      'alter table studyright_elements drop constraint studyright_elements_studentnumber_fkey'
    )
    await queryInterface.sequelize.query(
      `alter table studyright_elements
        add constraint studyright_elements_studentnumber_fkey foreign key("studentnumber") references "student" ("studentnumber")
        on delete cascade on update cascade`
    )

    await queryInterface.sequelize.query(
      'alter table studyright_elements drop constraint studyright_elements_studyrightid_fkey'
    )
    await queryInterface.sequelize.query(
      `alter table studyright_elements
        add constraint studyright_elements_studyrightid_fkey foreign key("studyrightid") references "studyright" ("studyrightid")
        on delete cascade on update cascade`
    )

    // CREDIT
    await queryInterface.sequelize.query('alter table credit drop constraint credit_course_id_fkey')
    await queryInterface.sequelize.query(
      `alter table credit
        add constraint credit_course_id_fkey foreign key("course_id") references "course" ("id")
        on delete cascade on update cascade`
    )

    await queryInterface.sequelize.query('alter table credit drop constraint credit_credittypecode_fkey')
    await queryInterface.sequelize.query(
      `alter table credit
        add constraint credit_credittypecode_fkey foreign key("credittypecode") references "credit_types" ("credittypecode")
        on delete cascade on update cascade`
    )

    await queryInterface.sequelize.query('alter table credit drop constraint credit_semester_composite_fkey')
    await queryInterface.sequelize.query(
      `alter table credit
        add constraint credit_semester_composite_fkey foreign key("semester_composite") references "semesters" ("composite")
        on delete cascade on update cascade`
    )

    await queryInterface.sequelize.query('alter table credit drop constraint credit_student_studentnumber_fkey')
    await queryInterface.sequelize.query(
      `alter table credit
        add constraint credit_student_studentnumber_fkey foreign key("student_studentnumber") references "student" ("studentnumber")
        on delete cascade on update cascade`
    )
  },
  down: async () => {},
}
