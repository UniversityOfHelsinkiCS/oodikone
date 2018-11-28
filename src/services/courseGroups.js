const Promise = require('bluebird')

const { sequelize } = require('../database/connection')

const { sequelize } = require('../database/connection')
const { Op } = require('sequelize')
const { Teacher } = require('../models/index')


const EP_TEACHERS = ['017715', '019051', '053532', '028579', '036199', '083257', '089822', '128474']
const KP_TEACHERS = ['032147', '012926', '066993']

const COURSE_GROUP_NAMES = { 1: 'Erityispedagogiikka', 2: 'Kasvatuspsykologia' }
const STATISTICS_START_SEMESTER = 135

const getTeachersForCourseGroup = courseGroupId => {
const getTeachersForCourseGroup = (courseGroupId) => {
  if (courseGroupId === 1) {
    return EP_TEACHERS
  }

  if (courseGroupId === 2) {
    return KP_TEACHERS
  }
}

const getCourseGroupsWithTotals = () => {
  const courseGroupIds = [1, 2]

  return Promise.map(courseGroupIds, async (courseGroupId) => {
    const teachers = getTeachersForCourseGroup(courseGroupId)
    const name = COURSE_GROUP_NAMES[courseGroupId]

    const statistics = await sequelize.query(
      `select
        sum(credits) as credits,
        count(distinct student_studentnumber) as students
      from credit_teachers ct
      left join credit c on ct.credit_id = c.id
      where
        ct.teacher_id in (:teachers)
      and
        c.semestercode >= ${STATISTICS_START_SEMESTER}`,
      { replacements: { teachers }, type: sequelize.QueryTypes.SELECT })

    return {
      id: courseGroupId,
      name,
      credits: statistics[0].credits,
      students: Number(statistics[0].students)
    }
  })
}

const getTeachersByIds = teacherIds => Teacher.findAll({
  attributes: ['name', 'code', 'id'],
  where: {
    id: {
      [Op.in]: teacherIds
    }
  }
})


const getCourseGroup = async (courseGroupId) => {
  if (courseGroupId === 1) {
    return {
      id: 1,
      name: 'Erityispedagogiikka',
      totalStudents: 10,
      totalCredits: 100,
      totalCourses: 1000,
      teachers: await getTeachersByIds(EP_TEACHERS)
    }
  }

  if (courseGroupId === 2) {
    return {
      id: 2,
      name: 'Kasvatuspsykologia',
      totalStudents: 10,
      totalCredits: 100,
      totalCourses: 1000,
      teachers: await getTeachersByIds(KP_TEACHERS)
    }
  }
}

const STATISTICS_START_SEMESTER = 135
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
  getCourseGroupsWithTotals
  getTeachersForCourseGroup,
  getCourseGroup,
  getCoursesByTeachers
}
