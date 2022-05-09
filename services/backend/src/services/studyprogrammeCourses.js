const _ = require('lodash')

const { getStudentsForProgrammeCourses, getCurrentStudyYearStartDate } = require('./studyprogramme')
const { mapToProviders } = require('../util/utils')

const getCurrentYearStartDate = () => {
  return new Date(new Date().getFullYear(), 0, 1)
}

const makeYearlyCreditsPromises = (years, providerCode, academicYear) => {
  return years.map(
    year =>
      new Promise(async res => {
        const from = academicYear == 'true' ? new Date(year, 7, 1, 0, 0, 0) : new Date(year, 0, 1, 0, 0, 0)
        const to = academicYear == 'true' ? new Date(year + 1, 6, 31, 23, 59, 59) : new Date(year, 11, 31, 23, 59, 59)

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

const getStudyprogrammeCoursesForStudytrack = async (unixMillis, studyprogramme, academicYear) => {
  const providerCode = mapToProviders([studyprogramme])[0]
  const startDate = academicYear == 'true' ? await getCurrentStudyYearStartDate(unixMillis) : getCurrentYearStartDate()
  const startYear = startDate.getFullYear()
  const yearRange = _.range(2017, startYear + 1)

  const yearlyStudentByCoursePromises = makeYearlyCreditsPromises(yearRange, providerCode, academicYear)

  const [yearlyStudentByCourse] = await Promise.all([Promise.all(yearlyStudentByCoursePromises)])

  return yearlyStudentByCourse.flat()
}

module.exports = { getStudyprogrammeCoursesForStudytrack }
