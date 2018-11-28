const Promise = require('bluebird')
const { sequelize } = require('../database/connection')

const EP_TEACHERS = ['017715', '019051', '053532', '028579', '036199', '083257', '089822', '128474']
const KP_TEACHERS = ['032147', '012926', '066993']

const COURSE_GROUP_NAMES = { 1: 'Erityispedagogiikka', 2: 'Kasvatuspsykologia' }
const STATISTICS_START_SEMESTER = 135

const getTeachersForCourseGroup = (courseGroupId) => {
  if (courseGroupId === 1) {
    return EP_TEACHERS
  }

  if (courseGroupId === 2) {
    return KP_TEACHERS
  }
}

const getCourseGroupInfoByTeacherIds = teacherIds => sequelize.query(
  `select
        count(distinct c.course_code) as courses,
        sum(credits) as credits,
        count(distinct student_studentnumber) as students
      from credit_teachers ct
        left join credit c on ct.credit_id = c.id
      where
        ct.teacher_id in (:teacherIds)
      and
        c.semestercode >= ${STATISTICS_START_SEMESTER}`,
  { replacements: { teacherIds }, type: sequelize.QueryTypes.SELECT }
)

const getCourseGroupsWithTotals = () => {
  const courseGroupIds = [1, 2]

  return Promise.map(courseGroupIds, async (courseGroupId) => {
    const teachers = getTeachersForCourseGroup(courseGroupId)
    const name = COURSE_GROUP_NAMES[courseGroupId]

    const statistics = await getCourseGroupInfoByTeacherIds(teachers)

    return {
      id: courseGroupId,
      name,
      credits: statistics[0].credits,
      students: Number(statistics[0].students)
    }
  })
}

const getTeachersByIds = async teacherIds => sequelize.query(
  `select        
        t.id as id,
        t.code as code,
        t.name as name,
        count(distinct c.course_code) as courses,
        sum(credits) as credits,
        count(distinct student_studentnumber) as students
      from credit_teachers ct
        left join credit c on ct.credit_id = c.id
        left join teacher t on ct.teacher_id = t.id     
      where
        semestercode >= ${STATISTICS_START_SEMESTER}
      and
        ct.teacher_id in (:teacherIds)
      group by t.id, t.name, t.code`,
  { replacements: { teacherIds }, type: sequelize.QueryTypes.SELECT }
)

const getCourseGroup = async (courseGroupId) => {
  const teacherIds = getTeachersForCourseGroup(courseGroupId)
  const name = COURSE_GROUP_NAMES[courseGroupId]
  const statistics = await getCourseGroupInfoByTeacherIds(teacherIds)
  const teachers = await getTeachersByIds(teacherIds)

  const { credits, students, courses } = statistics[0]

  return {
    id: courseGroupId,
    name,
    teachers,
    totalCredits: credits,
    totalStudents: students,
    totalCourses: courses
  }
}

const getCoursesByTeachers = async teacherIds => sequelize.query(
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
        semestercode >= ${STATISTICS_START_SEMESTER}
      and
        ct.teacher_id in (:teacherIds)
      group by course_code, t.name, t.code, co.name`,
  { replacements: { teacherIds }, type: sequelize.QueryTypes.SELECT }
)


module.exports = {
  getTeachersForCourseGroup,
  getCourseGroupsWithTotals,
  getCourseGroup,
  getCoursesByTeachers
}
