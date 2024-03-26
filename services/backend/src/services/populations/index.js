const { bottlenecksOf } = require('./bottlenecksOf')
const { getStudentsIncludeCoursesBetween } = require('./getStudentsIncludeCoursesBetween')
const { optimizedStatisticsOf } = require('./optimizedStatisticsOf')
const { studentnumbersWithAllStudyrightElements } = require('./studentnumbersWithAllStudyrightElements')
const { getEarliestYear } = require('./shared')
const { getStudentsCloseToGraduation } = require('./closeToGraduation')

module.exports = {
  bottlenecksOf,
  getStudentsIncludeCoursesBetween,
  optimizedStatisticsOf,
  studentnumbersWithAllStudyrightElements,
  getEarliestYear,
  getStudentsCloseToGraduation,
}
