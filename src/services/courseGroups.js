const Promise = require('bluebird')

const { sequelize } = require('../database/connection')

const EP_TEACHERS = ['017715', '019051', '053532', '028579', '036199', '083257', '089822', '128474']
const KP_TEACHERS = ['032147', '012926', '066993']

const COURSE_GROUP_NAMES = { 1: 'Erityispedagogiikka', 2: 'Kasvatuspsykologia' }
const STATISTICS_START_SEMESTER = 135

const getTeachersForCourseGroup = courseGroupId => {
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

module.exports = {
  getTeachersForCourseGroup,
  getCourseGroupsWithTotals
}
