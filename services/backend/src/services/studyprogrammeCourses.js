const _ = require('lodash')
const { getStudentsForProgrammeCourses, getCurrentStudyYearStartDate } = require('./studyprogramme')
const { mapToProviders } = require('../util/utils')

const getCurrentYearStartDate = () => {
  return new Date(new Date().getFullYear(), 0, 1)
}

const makeYearlyCreditsPromises = (currentYear, years, getRange, providerCode) => {
  return years.map(
    year =>
      new Promise(async res => {
        const diff = currentYear - year
        const { from, to } = getRange(diff)
        const studentsByCourse = await getStudentsForProgrammeCourses(from, to, providerCode)

        res(
          studentsByCourse.map(c => {
            c['year'] = year
            return c
          })
        )
      })
  )
}

const getStudyprogrammeCoursesForStudytrack = async (unixMillis, studyprogramme, showByYear) => {
  const YEAR_TO_MILLISECONDS = 31556952000
  const providerCode = mapToProviders([studyprogramme])[0]
  const startDate = showByYear === 'true' ? getCurrentYearStartDate() : await getCurrentStudyYearStartDate(unixMillis)
  const startYear = startDate.getFullYear()
  const startTime = startDate.getTime()
  const yearRange = _.range(2017, startYear + 1)

  const getRangeAcc = diff => ({
    from: new Date(startTime - diff * YEAR_TO_MILLISECONDS),
    to:
      showByYear === 'true'
        ? new Date(startTime - (diff - 1) * YEAR_TO_MILLISECONDS)
        : new Date(unixMillis - diff * YEAR_TO_MILLISECONDS),
  })

  /* const getRangeTotal = diff => ({
    from: new Date(startTime - diff * YEAR_TO_MILLISECONDS),
    to: new Date(startTime - (diff - 1) * YEAR_TO_MILLISECONDS),
  }) */

  const yearlyStudentByCoursePromises = makeYearlyCreditsPromises(startYear, yearRange, getRangeAcc, providerCode)
  // console.log('yearly student by course promises: ', yearlyStudentByCoursePromises)

  const [yearlyStudentByCourse] = await Promise.all([Promise.all(yearlyStudentByCoursePromises)])

  return yearlyStudentByCourse
}

module.exports = { getStudyprogrammeCoursesForStudytrack }
