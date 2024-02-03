const { bottlenecksOf } = require('./bottlenecksOf')
const { getStudentsIncludeCoursesBetween } = require('./getStudentsIncludeCoursesBetween')
const { optimizedStatisticsOf } = require('./optimizedStatisticsOf')
const { studentnumbersWithAllStudyrightElements } = require('./studentnumbersWithAllStudyrightElements')
const { getEarliestYear } = require('./shared')

module.exports = {
  bottlenecksOf,
  getStudentsIncludeCoursesBetween,
  optimizedStatisticsOf,
  studentnumbersWithAllStudyrightElements,
  getEarliestYear,
}
