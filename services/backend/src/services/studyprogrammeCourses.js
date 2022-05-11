const _ = require('lodash')

const {
  getStudentsForProgrammeCourses,
  getCurrentStudyYearStartDate,
  getOwnStudentsForProgrammeCourses,
} = require('./studyprogramme')
const { mapToProviders } = require('../util/utils')

const getCurrentYearStartDate = () => {
  return new Date(new Date().getFullYear(), 0, 1)
}

const makeYearlyPromises = (years, providerCode, academicYear, type, studyprogramme) => {
  return years.map(
    year =>
      new Promise(async res => {
        const from = academicYear == 'true' ? new Date(year, 7, 1, 0, 0, 0) : new Date(year, 0, 1, 0, 0, 0)
        const to = academicYear == 'true' ? new Date(year + 1, 6, 31, 23, 59, 59) : new Date(year, 11, 31, 23, 59, 59)

        let result = null

        switch (type) {
          case 'allStudents':
            result = await getStudentsForProgrammeCourses(from, to, providerCode)
            break
          case 'ownStudents':
            result = await getOwnStudentsForProgrammeCourses(from, to, providerCode, studyprogramme)
            break
          default:
            result = await getStudentsForProgrammeCourses(from, to, providerCode)
        }

        res(
          result.map(c => {
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

  const yearlyStudentByCoursePromises = makeYearlyPromises(yearRange, providerCode, academicYear, 'allStudents')
  const yearlyProgrammeStudentsPromises = makeYearlyPromises(
    yearRange,
    providerCode,
    academicYear,
    'ownStudents',
    studyprogramme
  )

  const [yearlyStudentByCourse, yearlyProgrammeStudents] = await Promise.all([
    Promise.all(yearlyStudentByCoursePromises),
    Promise.all(yearlyProgrammeStudentsPromises),
  ])

  const res = [...yearlyStudentByCourse.flat(), ...yearlyProgrammeStudents.flat()].reduce((acc, curr) => {
    if (!acc[curr.code + curr.year]) {
      acc[curr.code + curr.year] = { ...curr }
    }
    acc[curr.code + curr.year] = _.merge(acc[curr.code + curr.year], curr)
    return acc
  }, {})
  return Object.values(res)
}

module.exports = { getStudyprogrammeCoursesForStudytrack }
