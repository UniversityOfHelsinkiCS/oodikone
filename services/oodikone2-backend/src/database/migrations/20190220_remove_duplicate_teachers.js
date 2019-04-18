const doMigration = async sequelize => {
  const findDuplicates = () => sequelize.query(`
    SELECT t1.id
    FROM teacher t1
    INNER JOIN teacher t2
    ON t2.id = 9||t1.id
    ;`, {
    type: sequelize.QueryTypes.SELECT
  }).map(({ id }) => id)

  const removeCreditsFromTeacher = (teacher) => sequelize.query(`
    DELETE FROM credit_teachers
    WHERE teacher_id = ?
    ;`, {
    type: sequelize.QueryTypes.DELETE,
    replacements: [teacher]
  })

  const findMissingDuplicates = () => sequelize.query(`
    SELECT 9||t3.id AS id, t3.code AS code, t3.name AS name
    FROM teacher t3
    WHERE 9||t3.id IN (
        SELECT 9||t1.id
        FROM teacher t1
        WHERE t1.id NOT LIKE '9%'
        EXCEPT 
        SELECT t2.id
        FROM teacher t2
        WHERE t2.id LIKE '9%'
    )
    ;`, {
    type: sequelize.QueryTypes.SELECT
  })

  const insertTeacher = ({ id, code, name }) => sequelize.query(`
    INSERT INTO teacher (id, code, name) VALUES (?, ?, ?)
    ;`, {
    type: sequelize.QueryTypes.INSERT,
    replacements: [id, code, name]
  })

  const findOldCodeCreditTeachers = () => sequelize.query(`
    SELECT DISTINCT(teacher_id) AS id
    FROM credit_teachers
    WHERE teacher_id NOT LIKE '9%'
    ;`, {
    type: sequelize.QueryTypes.SELECT
  }).map(({ id }) => id)

  const updateCreditsForTeacher = teacher => sequelize.query(`
    UPDATE credit_teachers
    SET teacher_id = ?
    WHERE teacher_id = ?
    ;`, {
    type: sequelize.QueryTypes.UPDATE,
    replacements: [`9${teacher}`, teacher]
  })

  const findOldCourseGroupTeachers = () => sequelize.query(`
    SELECT teacher_id
    FROM teacher_course_group
    WHERE teacher_id NOT LIKE '9%'
    ;`, {
    type: sequelize.QueryTypes.SELECT
  }).map(({ teacher_id }) => teacher_id)

  const updateCourseGroupsForTeacher = teacher => sequelize.query(`
    UPDATE teacher_course_group
    SET teacher_id = ?
    WHERE teacher_id = ?
    ;`, {
    type: sequelize.QueryTypes.UPDATE,
    replacements: [`9${teacher}`, teacher]
  })

  const findTeachersWithOldCode = () => sequelize.query(`
    SELECT id
    FROM teacher
    WHERE id NOT LIKE '9%'
    ;`, {
    type: sequelize.QueryTypes.SELECT
  }).map(({ id }) => id)

  const deleteTeacher = id => sequelize.query(`
    DELETE FROM teacher
    WHERE id = ?
    `, {
    type: sequelize.QueryTypes.DELETE,
    replacements: [id]
  })

  const removeCreditsFromDuplicates = async () => {
    const duplicates = await findDuplicates()
    console.log('deleting credits from duplicate teachers')
    for (let [i, dupid] of duplicates.entries()) {
      !(i % 100) && console.log(`deleted credits: ${i} / ${duplicates.length}`)
      await removeCreditsFromTeacher(dupid)
    }
  }

  const createMissingDuplicateTeachers = async () => {
    const teachers = await findMissingDuplicates()
    for (let [i, teacher] of teachers.entries()) {
      !(i % 100) && console.log(`missing duplicates created: ${i} / ${teachers.length}`)
      await insertTeacher(teacher)
    }
  }

  const updateMissingCreditsToNewCodes = async () => {
    const codes = await findOldCodeCreditTeachers()
    for (let [i, teacherid] of codes.entries()) {
      !(i % 100) && console.log(`old teacher id credits updated: ${i} / ${codes.length}`)
      await updateCreditsForTeacher(teacherid)
    }
  }

  const updateCourseGroupsToNewCodes = async () => {
    const codes = await findOldCourseGroupTeachers()
    for (let [i, teacherid] of codes.entries()) {
      !(i % 100) && console.log(`old course group ids updated: ${i} / ${codes.length}`)
      await updateCourseGroupsForTeacher(teacherid)
    }
  }

  const removeTeachersWithOldCode = async () => {
    const codes = await findTeachersWithOldCode()
    for (let [i, teacherid] of codes.entries()) {
      !(i % 100) && console.log(`old teacher ids removed: ${i} / ${codes.length}`)
      await deleteTeacher(teacherid)
    }
  }

  await removeCreditsFromDuplicates()
  await createMissingDuplicateTeachers()
  await updateMissingCreditsToNewCodes()
  await updateCourseGroupsToNewCodes()
  await removeTeachersWithOldCode()
}

module.exports = {
  up: async (queryInterface) => {
    const { sequelize } = queryInterface
    await doMigration(sequelize)
  },
  down: async () => {}
}
