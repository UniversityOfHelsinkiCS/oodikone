const _ = require('lodash')

const {
  getStudentsForProgrammeCourses,
  getCurrentStudyYearStartDate,
  getOwnStudentsForProgrammeCourses,
  getStudentsWithoutStudyrightForProgrammeCourses,
  getOtherStudentsForProgrammeCourses,
  getAllProgrammeCourses,
} = require('./studyprogramme')
const { mapToProviders } = require('../util/utils')

const getCurrentYearStartDate = () => {
  return new Date(new Date().getFullYear(), 0, 1)
}

const isOpenUniCourseCode = code => code.match(/^AY?(.+?)(?:en|fi|sv)?$/)

const getAllStudyprogrammeCourses = async studyprogramme => {
  const providerCode = mapToProviders([studyprogramme])[0]
  const normalCourses = await getAllProgrammeCourses(providerCode)
  return normalCourses.reduce((acc, curr) => {
    acc.push(curr.code)
    if (curr.substitutions && curr.substitutions.includes('AY' + curr.code)) {
      acc.push('AY' + curr.code)
    }
    return acc
  }, [])
}

const makeYearlyPromises = (years, academicYear, type, programmeCourses, studyprogramme) => {
  return years.map(
    year =>
      new Promise(async res => {
        const from = academicYear == 'true' ? new Date(year, 7, 1, 0, 0, 0) : new Date(year, 0, 1, 0, 0, 0)
        const to = academicYear == 'true' ? new Date(year + 1, 6, 31, 23, 59, 59) : new Date(year, 11, 31, 23, 59, 59)

        let result = null

        switch (type) {
          case 'allStudents':
            result = await getStudentsForProgrammeCourses(from, to, programmeCourses)
            break
          case 'ownStudents':
            result = await getOwnStudentsForProgrammeCourses(from, to, programmeCourses, studyprogramme)
            break
          case 'withoutStudyright':
            result = await getStudentsWithoutStudyrightForProgrammeCourses(from, to, programmeCourses)
            break
          case 'otherStudents':
            result = await getOtherStudentsForProgrammeCourses(from, to, programmeCourses, studyprogramme)
            break
          default:
            result = await getStudentsForProgrammeCourses(from, to, programmeCourses)
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

const getStudyprogrammeCoursesForStudytrack = async (unixMillis, studyprogramme, academicYear, programmeCourses) => {
  // const providerCode = mapToProviders([studyprogramme])[0]
  const startDate = academicYear == 'true' ? await getCurrentStudyYearStartDate(unixMillis) : getCurrentYearStartDate()
  const startYear = startDate.getFullYear()
  const yearRange = _.range(2017, startYear + 1)

  const yearlyStudentByCoursePromises = makeYearlyPromises(yearRange, academicYear, 'allStudents', programmeCourses)
  const yearlyProgrammeStudentsPromises = makeYearlyPromises(
    yearRange,
    academicYear,
    'ownStudents',
    programmeCourses,
    studyprogramme
  )
  const yearlyStudentsWithoutStudyrightPromises = makeYearlyPromises(
    yearRange,
    academicYear,
    'withoutStudyright',
    programmeCourses
  )
  const yearlyOtherProgrammeStudentsPromises = makeYearlyPromises(
    yearRange,
    academicYear,
    'otherStudents',
    programmeCourses,
    studyprogramme
  )

  const [
    yearlyStudentByCourse,
    yearlyProgrammeStudents,
    yearlyStudentsWithoutStudyright,
    yearlyOtherProgrammeStudents,
  ] = await Promise.all([
    Promise.all(yearlyStudentByCoursePromises),
    Promise.all(yearlyProgrammeStudentsPromises),
    Promise.all(yearlyStudentsWithoutStudyrightPromises),
    Promise.all(yearlyOtherProgrammeStudentsPromises),
  ])

  let maxYear = 0
  const allCourses = [
    ...yearlyStudentByCourse.flat(),
    ...yearlyProgrammeStudents.flat(),
    ...yearlyStudentsWithoutStudyright.flat(),
    ...yearlyOtherProgrammeStudents.flat(),
  ].reduce((acc, curr) => {
    if (curr.year > maxYear) maxYear = curr.year
    if (!acc[curr.code]) {
      acc[curr.code] = {
        code: curr.code,
        name: curr.name,
      }
    }
    if (!acc[curr.code][curr.year]) {
      acc[curr.code][curr.year] = {
        totalAllStudents: 0,
        totalAllCredits: 0,
        totalProgrammeStudents: 0,
        totalProgrammeCredits: 0,
        totalOtherProgrammeStudents: 0,
        totalOtherProgrammeCredits: 0,
        totalWithoutStudyrightStudents: 0,
        totalWithoutStudyrightCredits: 0,
      }
    }
    switch (curr.type) {
      case 'total':
        acc[curr.code][curr.year]['totalAllStudents'] += curr.totalAllStudents
        acc[curr.code][curr.year]['totalAllCredits'] += curr.totalAllcredits
        break
      case 'ownProgramme':
        acc[curr.code][curr.year]['totalProgrammeStudents'] += curr.totalProgrammeStudents
        acc[curr.code][curr.year]['totalProgrammeCredits'] += curr.totalProgrammeCredits
        break

      case 'otherProgramme':
        acc[curr.code][curr.year]['totalOtherProgrammeStudents'] += curr.totalOtherProgrammeStudents
        acc[curr.code][curr.year]['totalOtherProgrammeCredits'] += curr.totalOtherProgrammeCredits
        break

      case 'noStudyright':
        acc[curr.code][curr.year]['totalWithoutStudyrightStudents'] += curr.totalWithoutStudyrightStudents
        acc[curr.code][curr.year]['totalWithoutStudyrightCredits'] += curr.totalWithoutStudyrightCredits
        break
    }

    return acc
  }, {})
  const ayCourses = Object.keys(allCourses).filter(c => c.startsWith('AY'))
  const properties = [
    'totalAllStudents',
    'totalAllCredits',
    'totalProgrammeStudents',
    'totalProgrammeCredits',
    'totalOtherProgrammeStudents',
    'totalOtherProgrammeCredits',
    'totalWithoutStudyrightStudents',
    'totalWithoutStudyrightCredits',
  ]
  ayCourses.forEach(ayCourse => {
    const normCode = isOpenUniCourseCode(ayCourse)[1]

    if (allCourses[normCode]) {
      const mergedCourse = {}
      mergedCourse['code'] = allCourses[normCode].code
      mergedCourse['name'] = allCourses[normCode].name

      yearRange
        .filter(year => year <= maxYear)
        .forEach(year => {
          if (!allCourses[normCode][year]) {
            mergedCourse[year] = {
              totalAllStudents: 0,
              totalAllCredits: 0,
              totalProgrammeStudents: 0,
              totalProgrammeCredits: 0,
              totalOtherProgrammeStudents: 0,
              totalOtherProgrammeCredits: 0,
              totalWithoutStudyrightStudents: 0,
              totalWithoutStudyrightCredits: 0,
            }
          } else {
            mergedCourse[year] = { ...allCourses[normCode][year] }
          }

          if (allCourses[ayCourse][year]) {
            properties.forEach(prop => {
              mergedCourse[year][prop] = mergedCourse[year][prop] + allCourses[ayCourse][year][prop]
            })
          }
        })
      allCourses[normCode] = mergedCourse
      delete allCourses[ayCourse]
    }
  })
  return Object.values(allCourses)
}

module.exports = { getStudyprogrammeCoursesForStudytrack, getAllStudyprogrammeCourses }
