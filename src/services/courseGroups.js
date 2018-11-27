const Promise = require('bluebird')

const { sequelize } = require('../database/connection')

const EP_TEACHERS = ['017715', '019051', '053532', '028579', '036199', '083257', '089822', '128474']
const KP_TEACHERS = ['032147', '012926', '066993']

const COURSE_GROUP_NAMES = { 1: 'Erityispedagogiikka', 2: 'Kasvatuspsykologia' }

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
    const stats = await sequelize.query(
      `select sum(credits)
      from credit_teachers ct
      left join credit c on ct.credit_id=c.id where teacher_id in (?)`,
      { replacements: teachers, type: sequelize.QueryTypes.SELECT })

    return {
      id: courseGroupId,
      name,
      credits: stats[0].sum
    }
  })
}

module.exports = {
  getTeachersForCourseGroup,
  getCourseGroupsWithTotals
}
