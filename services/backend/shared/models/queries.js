const { sequelize, sequelizeKone } = require('../database/connection')

const getStudentNumbers = () => sequelize.query(
  `select
      studentnumber
      from student
      order by studentnumber desc`,
  { type: sequelize.QueryTypes.SELECT }
)

const getCurrentAcademicYear = () => sequelize.query(
  `select
      semestercode,
      yearname
    from semesters
      where startdate <= now()
      and date_part('month', startdate) = 7
    order by startdate desc
    fetch first row only`,
  { type: sequelize.QueryTypes.SELECT }
)

const getAcademicYearsFrom = startSemesterCode => sequelize.query(
  `select
      distinct on (yearname) yearname,
      semestercode
    from semesters
    where semestercode >= :startSemesterCode
    and startdate <= now()
      order by yearname, semestercode`,
  {
    replacements: { startSemesterCode },
    type: sequelize.QueryTypes.SELECT
  }
)

const getAcademicYearStatistics = (teacherIds, startSemester) => {
  const endSemester = startSemester + 1
  return sequelize.query(
    `select
        count(distinct c.course_code) as courses,
        sum(credits) as credits,
        count(distinct student_studentnumber) as students
      from credit_teachers ct
        left join credit c on ct.credit_id = c.id
      where
        ct.teacher_id in (:teacherIds)
      and
        c.semestercode >= :startSemester
      and
        c.semestercode <= :endSemester`,
    {
      replacements: { teacherIds, startSemester, endSemester },
      type: sequelize.QueryTypes.SELECT
    }
  )
}

const getTeacherAcademicYearStatisticsByIds = (teacherIds, startSemester) => {
  const endSemester = startSemester + 1
  return sequelize.query(
    `select
        ct.teacher_id as id,
        count(distinct c.course_code) as courses,
        sum(credits) as credits,
        count(distinct student_studentnumber) as students
      from credit_teachers ct
        left join credit c on ct.credit_id = c.id
      where
        c.semestercode >= :startSemester
      and
        c.semestercode <= :endSemester
      and
        ct.teacher_id in (:teacherIds)
      group by ct.teacher_id`,
    {
      replacements: { teacherIds, startSemester, endSemester },
      type: sequelize.QueryTypes.SELECT
    }
  )
}

const getAcademicYearCoursesByTeacherIds = (teacherIds, startSemester) => {
  const endSemester = startSemester + 1
  return sequelize.query(
    `select
          course_code as coursecode,
          co.name as coursenames,
          t.code as teachercode,
          t.name as teachername,
          sum(credits) as credits,
          count(distinct student_studentnumber) as students
        from credit_teachers ct
          left join credit c on ct.credit_id = c.id
          left join teacher t on ct.teacher_id = t.id
          left join course co on c.course_code = co.code
        where
          c.semestercode >= :startSemester
        and
          c.semestercode <= :endSemester
        and
          ct.teacher_id in (:teacherIds)
        group by course_code, t.name, t.code, co.name`,
    {
      replacements: { teacherIds, startSemester, endSemester },
      type: sequelize.QueryTypes.SELECT
    }
  )
}

const getAcademicYearStatisticsForStudyProgramme = async (programmeid, startSemester) => {
  const endSemester = startSemester + 1
  const courseGroupData = await sequelizeKone.query(
    `
SELECT cg.id AS id, cg.name AS name, tcg.teacher_id as teacher_id, cg.programmeid as programmeid
FROM   course_groups cg
    left join teacher_course_groups tcg
           ON tcg.course_group_id = cg.id
WHERE cg.programmeid = :programmeid
`,
    {
      replacements: { programmeid },
      type: sequelize.QueryTypes.SELECT,
    }
  )

  const courseGroupIdToCGData = courseGroupData.reduce((acc, cgd) => {
    acc[cgd.id] = acc[cgd.id] || { name: cgd.name, id: cgd.id, programmeid: cgd.programmeid, teacherids: [] }
    if (cgd.teacher_id) acc[cgd.id].teacherids.push(cgd.teacher_id)
    return acc
  }, {})

  const resultPromises = Object.keys(courseGroupIdToCGData).map(async cgid => {
    const { name, id, programmeid, teacherids } = courseGroupIdToCGData[cgid]
    if (teacherids.length === 0) return { name, id, programmeid, courses: 0, credits: 0, students: 0 }
    const stats = await sequelize.query(
      `
SELECT
    COUNT(DISTINCT c.course_code) AS courses,
    COALESCE(SUM(credits), 0) AS credits,
    COUNT(DISTINCT student_studentnumber) AS students
FROM   credit_teachers ct
    left join credit c
            ON c.id = ct.credit_id
              AND c.semestercode >= :startSemester
              AND c.semestercode <= :endSemester
WHERE ct.teacher_id IN (:teacherids)
  `,
      {
        replacements: { startSemester, endSemester, teacherids },
        type: sequelize.QueryTypes.SELECT,
      }
    )
    if (stats.length !== 1) throw 'expecting single row'
    const { courses, credits, students } = stats[0]
    return { name, id, programmeid, courses, credits, students }
  })
  return Promise.all(resultPromises)
}

module.exports = {
  getStudentNumbers,
  getCurrentAcademicYear,
  getAcademicYearsFrom,
  getAcademicYearStatistics,
  getAcademicYearStatisticsForStudyProgramme,
  getTeacherAcademicYearStatisticsByIds,
  getAcademicYearCoursesByTeacherIds
}
