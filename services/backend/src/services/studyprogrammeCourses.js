const _ = require('lodash')

const {
  getStudentsForProgrammeCourses,
  getCurrentStudyYearStartDate,
  getOwnStudentsForProgrammeCourses,
  getNotCompletedForProgrammeCourses,
  getStudentsWithoutStudyrightForProgrammeCourses,
  getTransferStudentsForProgrammeCourses,
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
        const from = academicYear === 'ACADEMIC_YEAR' ? new Date(year, 7, 1, 0, 0, 0) : new Date(year, 0, 1, 0, 0, 0)
        const to =
          academicYear === 'ACADEMIC_YEAR' ? new Date(year + 1, 6, 31, 23, 59, 59) : new Date(year, 11, 31, 23, 59, 59)
        let result = null

        switch (type) {
          case 'passed':
            result = await getStudentsForProgrammeCourses(from, to, programmeCourses)
            break
          case 'notCompleted':
            result = await getNotCompletedForProgrammeCourses(from, to, programmeCourses)
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
          case 'transfer':
            result = await getTransferStudentsForProgrammeCourses(from, to, programmeCourses)
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

const getStudyprogrammeCoursesForStudytrack = async (unixMillis, studyprogramme, academicYear, combinedProgramme) => {
  const startDate =
    academicYear === 'ACADEMIC_YEAR' ? await getCurrentStudyYearStartDate(unixMillis) : getCurrentYearStartDate()
  const startYear = startDate.getFullYear()
  const yearRange = _.range(2017, startYear + 1)
  const mainProgrammeCourses = await getAllStudyprogrammeCourses(studyprogramme)
  const secondProgrammeCourses = combinedProgramme ? await getAllStudyprogrammeCourses(combinedProgramme) : []
  const programmeCourses = [...mainProgrammeCourses, ...secondProgrammeCourses]

  const yearlyPassedStudentByCoursePromises = makeYearlyPromises(yearRange, academicYear, 'passed', programmeCourses)
  const yearlyNotCompletedStudentByCoursePromises = makeYearlyPromises(
    yearRange,
    academicYear,
    'notCompleted',
    programmeCourses
  )
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
  const yearlyTransferStudentsPromises = makeYearlyPromises(
    yearRange,
    academicYear,
    'transfer',
    programmeCourses,
    studyprogramme
  )

  const [
    yearlyPassedStudentByCourse,
    yearlyNotCompletedStudentByCourse,
    yearlyProgrammeStudents,
    yearlyStudentsWithoutStudyright,
    yearlyOtherProgrammeStudents,
    yearlyTransferStudents,
  ] = await Promise.all([
    Promise.all(yearlyPassedStudentByCoursePromises),
    Promise.all(yearlyNotCompletedStudentByCoursePromises),
    Promise.all(yearlyProgrammeStudentsPromises),
    Promise.all(yearlyStudentsWithoutStudyrightPromises),
    Promise.all(yearlyOtherProgrammeStudentsPromises),
    Promise.all(yearlyTransferStudentsPromises),
  ])
  let maxYear = 0
  const allCourses = [
    ...yearlyPassedStudentByCourse.flat(),
    ...yearlyNotCompletedStudentByCourse.flat(),
    ...yearlyProgrammeStudents.flat(),
    ...yearlyStudentsWithoutStudyright.flat(),
    ...yearlyOtherProgrammeStudents.flat(),
    ...yearlyTransferStudents.flat(),
  ].reduce((acc, curr) => {
    if (curr.year > maxYear) maxYear = curr.year
    if (!acc[curr.code]) {
      acc[curr.code] = {
        code: curr.code,
        name: curr.name,
        isStudyModule: curr.isStudyModule,
        years: {},
      }
    }

    if (!acc[curr.code]['years'][curr.year]) {
      acc[curr.code]['years'][curr.year] = {
        totalAllStudents: 0,
        totalPassed: 0,
        totalNotCompleted: 0,
        totalAllCredits: 0,
        totalProgrammeStudents: 0,
        totalProgrammeCredits: 0,
        totalOtherProgrammeStudents: 0,
        totalOtherProgrammeCredits: 0,
        totalWithoutStudyrightStudents: 0,
        totalWithoutStudyrightCredits: 0,
        totalTransferStudents: 0,
        totalTransferCredits: 0,
        isStudyModule: curr.isStudyModule,
      }
    }
    switch (curr.type) {
      case 'passed':
        acc[curr.code]['years'][curr.year]['totalPassed'] += curr.totalPassed
        acc[curr.code]['years'][curr.year]['totalAllStudents'] += acc[curr.code]['years'][curr.year]['totalPassed']
        acc[curr.code]['years'][curr.year]['totalAllCredits'] += curr.totalAllcredits
        break
      case 'notCompleted':
        acc[curr.code]['years'][curr.year]['totalNotCompleted'] += curr.totalNotCompleted
        acc[curr.code]['years'][curr.year]['totalAllStudents'] +=
          acc[curr.code]['years'][curr.year]['totalNotCompleted']
        break
      case 'ownProgramme':
        acc[curr.code]['years'][curr.year]['totalProgrammeStudents'] += curr.totalProgrammeStudents
        acc[curr.code]['years'][curr.year]['totalProgrammeCredits'] += curr.totalProgrammeCredits
        break
      case 'otherProgramme':
        acc[curr.code]['years'][curr.year]['totalOtherProgrammeStudents'] += curr.totalOtherProgrammeStudents
        acc[curr.code]['years'][curr.year]['totalOtherProgrammeCredits'] += curr.totalOtherProgrammeCredits
        break
      case 'noStudyright':
        acc[curr.code]['years'][curr.year]['totalWithoutStudyrightStudents'] += curr.totalWithoutStudyrightStudents
        acc[curr.code]['years'][curr.year]['totalWithoutStudyrightCredits'] += curr.totalWithoutStudyrightCredits
        break
      case 'transfer':
        acc[curr.code]['years'][curr.year]['totalTransferStudents'] += curr.totalTransferStudents
        acc[curr.code]['years'][curr.year]['totalTransferCredits'] += curr.totalTransferCredits
    }

    return acc
  }, {})
  const ayCourses = Object.keys(allCourses).filter(c => c.startsWith('AY'))
  const properties = [
    'totalAllStudents',
    'totalPassed',
    'totalNotCompleted',
    'totalAllCredits',
    'totalProgrammeStudents',
    'totalProgrammeCredits',
    'totalOtherProgrammeStudents',
    'totalOtherProgrammeCredits',
    'totalWithoutStudyrightStudents',
    'totalWithoutStudyrightCredits',
    'totalTransferCredits',
    'totalTransferStudents',
  ]
  ayCourses.forEach(ayCourse => {
    const normCode = isOpenUniCourseCode(ayCourse)[1]

    if (allCourses[normCode]) {
      const mergedCourse = {}
      mergedCourse['code'] = allCourses[normCode].code
      mergedCourse['name'] = allCourses[normCode].name
      mergedCourse['years'] = {}

      yearRange
        .filter(year => year <= maxYear)
        .forEach(year => {
          if (!allCourses[normCode]['years'][year]) {
            mergedCourse['years'][year] = {
              totalAllStudents: 0,
              totalPassed: 0,
              totalNotCompleted: 0,
              totalAllCredits: 0,
              totalProgrammeStudents: 0,
              totalProgrammeCredits: 0,
              totalOtherProgrammeStudents: 0,
              totalOtherProgrammeCredits: 0,
              totalWithoutStudyrightStudents: 0,
              totalWithoutStudyrightCredits: 0,
              totalTransferCredits: 0,
              totalTransferStudents: 0,
            }
          } else {
            mergedCourse['years'][year] = { ...allCourses[normCode]['years'][year] }
          }

          if (allCourses[ayCourse]['years'][year]) {
            properties.forEach(prop => {
              mergedCourse['years'][year][prop] =
                mergedCourse['years'][year][prop] + allCourses[ayCourse]['years'][year][prop]
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
