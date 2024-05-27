const { bottlenecksOf } = require('./bottlenecksOf')
const { getStudentsCloseToGraduation } = require('./closeToGraduation')
const { getStudentsIncludeCoursesBetween } = require('./getStudentsIncludeCoursesBetween')
const { optimizedStatisticsOf } = require('./optimizedStatisticsOf')
const { getEarliestYear } = require('./shared')
const { studentnumbersWithAllStudyrightElements } = require('./studentnumbersWithAllStudyrightElements')

module.exports = {
  bottlenecksOf,
  getStudentsIncludeCoursesBetween,
  optimizedStatisticsOf,
  studentnumbersWithAllStudyrightElements,
  getEarliestYear,
  getStudentsCloseToGraduation,
}
