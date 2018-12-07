const { sequelize } = require('../database/connection')

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
  { replacements: { startSemesterCode },
    type: sequelize.QueryTypes.SELECT }
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
    { replacements: { teacherIds, startSemester, endSemester },
      type: sequelize.QueryTypes.SELECT }
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
    { replacements: { teacherIds, startSemester, endSemester },
      type: sequelize.QueryTypes.SELECT }
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
    { replacements: { teacherIds, startSemester, endSemester },
      type: sequelize.QueryTypes.SELECT }
  )
}

module.exports = {
  getCurrentAcademicYear,
  getAcademicYearsFrom,
  getAcademicYearStatistics,
  getTeacherAcademicYearStatisticsByIds,
  getAcademicYearCoursesByTeacherIds
}
