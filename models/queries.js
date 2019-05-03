const { sequelize } = require('../database/connection')

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
  const result = await sequelize.query(
    `
SELECT cg.id AS id,cg.name AS name,
    COUNT(DISTINCT c.course_code) AS courses,
    COALESCE(SUM(credits), 0) AS credits,
    COUNT(DISTINCT student_studentnumber) AS students
FROM   course_groups cg
    left join teacher_course_group tcg
           ON tcg.course_group_id = cg.id
    left join credit_teachers ct
           ON ct.teacher_id = tcg.teacher_id
    left join credit c
           ON c.id = ct.credit_id
              AND c.semestercode >= :startSemester
              AND c.semestercode <= :endSemester
WHERE cg.programmeid = :programmeid
GROUP BY cg.programmeid,cg.id,cg.name`,
    {
      replacements: { startSemester, endSemester, programmeid },
      type: sequelize.QueryTypes.SELECT,
      logging: console.log
    }
  )
  return result
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
