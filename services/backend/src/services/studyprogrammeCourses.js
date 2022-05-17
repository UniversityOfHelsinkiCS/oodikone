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
  // console.log('normal courses: ', normalCourses)
  return normalCourses.reduce((acc, curr) => {
    acc.push(curr.code)
    if (curr.substitutions.includes('AY' + curr.code)) {
      acc.push('AY' + curr.code)
    }
    return acc
  }, [])
}

const makeYearlyPromises = (years, academicYear, type, programmeCourses, studyprogramme) => {
  // console.log('programme courses: ', programmeCourses)
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

  const allCourses = [
    ...yearlyStudentByCourse.flat(),
    ...yearlyProgrammeStudents.flat(),
    ...yearlyStudentsWithoutStudyright.flat(),
    ...yearlyOtherProgrammeStudents.flat(),
  ].reduce((acc, curr) => {
    if (!acc[curr.code + curr.year]) {
      acc[curr.code + curr.year] = {
        code: curr.code,
        name: curr.name,
        year: curr.year,
        totalAll: curr.totalAll | 0,
        totalOwn: curr.totalOwn | 0,
        totalWithout: curr.totalWithout | 0,
        totalOthers: curr.totalOthers | 0,
      }
    }
    acc[curr.code + curr.year] = _.merge(acc[curr.code + curr.year], curr)
    return acc
  }, {})

  // merge normal and AY codes if courses match
  const ayCourses = Object.keys(allCourses).filter(c => c.startsWith('AY'))

  ayCourses.forEach(ayCourse => {
    const normCode = isOpenUniCourseCode(ayCourse)[1]

    if (allCourses[normCode]) {
      allCourses[normCode] = {
        code: allCourses[normCode].code,
        name: allCourses[normCode].name,
        year: allCourses[normCode].year,
        totalAll: (allCourses[normCode].totalAll + allCourses[ayCourse].totalAll) | 0,
        totalOwn: (allCourses[normCode].totalOwn + allCourses[ayCourse].totalOwn) | 0,
        totalWithout: (allCourses[normCode].totalWithout + allCourses[ayCourse].totalWithout) | 0,
        totalOthers: (allCourses[normCode].totalOthers + allCourses[ayCourse].totaOthers) | 0,
      }
      delete allCourses[ayCourse]
    }
  })

  return Object.values(allCourses)
}

module.exports = { getStudyprogrammeCoursesForStudytrack, getAllStudyprogrammeCourses }
