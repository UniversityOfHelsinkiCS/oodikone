import moment from 'moment'
import Datetime from 'react-datetime'
import { filter, maxBy, sortBy, intersection } from 'lodash'
import pathToRegexp from 'path-to-regexp'
import { API_DATE_FORMAT, DISPLAY_DATE_FORMAT } from '../constants'
import toskaLogo from '../assets/toska.png'
import irtomikko from '../assets/irtomikko.png'

export const textAndDescriptionSearch = (dropDownOptions, param) =>
  filter(dropDownOptions, option =>
    option.text
      ? option.text.toLowerCase().concat(option.description.toLowerCase()).includes(param.toLowerCase())
      : null
  )

export const images = {
  toskaLogo,
  irtomikko,
}

export const checkUserAccess = (requiredRoles, roles) => {
  return intersection(requiredRoles, roles).length > 0
}

export const containsOnlyNumbers = str => str.match('^\\d+$')

export const momentFromFormat = (date, format) => moment(date, format)

export const reformatDate = (date, outputFormat) => (!date ? 'Unavailable' : moment(date).local().format(outputFormat))

export const isInDateFormat = (date, format) => moment(date, format, true).isValid()
export const isValidYear = year =>
  year.isSameOrBefore(Datetime.moment(), 'year') && year.isAfter(Datetime.moment('1900', 'YYYY'), 'year')
export const dateFromApiToDisplay = date => moment(date, API_DATE_FORMAT).format(DISPLAY_DATE_FORMAT)

export const sortDatesWithFormat = (d1, d2, dateFormat) => moment(d1, dateFormat) - moment(d2, dateFormat)

export const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date)

export const byName = (a, b) => a.name.localeCompare(b.name)

export const byCodeDesc = (a, b) => b.code.localeCompare(a.code)

export const studyRightRegex = new RegExp(/.*master|bachelor|doctor|licentiate|specialist.*/)

export const studyrightElementTypes = { programme: 20, speciality: 30 }

export const getStudentTotalCredits = (student, includeTransferredCredits = true) => {
  const passedCourses = includeTransferredCredits
    ? student.courses.filter(c => c.passed && !c.isStudyModuleCredit)
    : student.courses.filter(c => c.passed && !c.isStudyModuleCredit && c.credittypecode !== 9)
  return passedCourses.reduce((a, b) => a + b.credits, 0)
}

const getGradedCourses = (student, includeTransferredCredits = true) =>
  includeTransferredCredits
    ? student.courses.filter(c => Number(c.grade) && !c.isStudyModuleCredit)
    : student.courses.filter(c => Number(c.grade) && !c.isStudyModuleCredit && c.credittypecode !== 9)

export const getStudentGradeMean = (student, includeTransferredCredits = true) => {
  const courses = getGradedCourses(student, includeTransferredCredits)
  const gradeTotal = courses.reduce((a, b) => a + Number(b.grade), 0)
  const mean = gradeTotal / courses.length || 0
  return mean
}

export const getStudentGradeMeanWeightedByCredits = (student, includeTransferredCredits = true) => {
  const courses = getGradedCourses(student, includeTransferredCredits)
  const gradeTotal = courses.reduce((a, b) => a + Number(b.grade) * Number(b.credits), 0)
  const sumWeights = courses.reduce((a, b) => a + Number(b.credits), 0)
  const mean = gradeTotal / sumWeights || 0
  return mean
}

export const getStudentTotalCreditsFromMandatory = (student, mandatoryCourses) =>
  student.courses
    .filter(c => c.passed && !c.isStudyModuleCredit && mandatoryCourses.find(cr => cr.code === c.code))
    .reduce((a, b) => a + b.credits, 0)

export const getTotalCreditsFromCourses = courses =>
  courses.filter(c => c.passed && !c.isStudyModuleCredit).reduce((a, b) => a + b.credits, 0)

export const copyToClipboard = text => {
  const textField = document.createElement('textarea')
  textField.innerText = text
  document.body.appendChild(textField)
  textField.select()
  document.execCommand('copy')
  textField.remove()
}

export const getCompiledPath = (template, parameters) => {
  const toPath = pathToRegexp.compile(template)
  return toPath(parameters)
}

export const getTextIn = (texts, language) => {
  if (texts) {
    return texts[language] || texts.fi || texts.en || texts.sv || Object.values(texts)[0]
  }
  return null
}

export const getUnifyTextIn = unifyCourses => {
  switch (unifyCourses) {
    case 'reqularStats':
      return '(normal)'

    case 'openStats':
      return '(open)'

    case 'unifyStats':
      return '(open and normal)'

    default:
      return ''
  }
}

export const cancelablePromise = promise => {
  let hasCanceled = false

  const wrappedPromise = new Promise(async (res, rej) => {
    // eslint-disable-line no-async-promise-executor
    try {
      await promise
      if (hasCanceled) res(false)
      res(true)
    } catch (e) {
      console.log('e', e) // eslint-disable-line no-console
      rej(e)
    }
  })

  return {
    promise: wrappedPromise,
    cancel: () => {
      hasCanceled = true
    },
  }
}

export const flattenStudyrights = (studyrights, programme) => {
  const studyrightcodes = []
  studyrights.forEach(sr => {
    if (sr.studyright_elements.map(srE => srE.code).includes(programme)) {
      const programmeStartdate = sr.studyright_elements.find(srE => srE.code === programme).startdate
      const currentStudytracks = sr.studyright_elements.reduce((acc, curr) => {
        if (curr.element_detail.type === 30 && !(curr.startdate < programmeStartdate)) acc.push(curr)
        return acc
      }, [])

      if (currentStudytracks.length > 0) studyrightcodes.push(sortBy(currentStudytracks, 'startdate').reverse()[0].code)
    }
  })
  return studyrightcodes
}

export const getStudentToTargetCourseDateMap = (students, codes) => {
  const codeSet = new Set(codes)
  return students.reduce((acc, student) => {
    const targetCourse = student.courses
      .filter(c => codeSet.has(c.course_code))
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    acc[student.studentNumber] = targetCourse ? targetCourse.date : null
    return acc
  }, {})
}

export const getNewestProgramme = (studyrights, studentNumber, studentToTargetCourseDateMap, elementDetails) => {
  const studyprogrammes = []
  studyrights.forEach(sr => {
    const facultyCode = sr.faculty_code
    const studyrightElements = sr.studyright_elements.filter(
      srE =>
        elementDetails[srE.code] &&
        elementDetails[srE.code].type === 20 &&
        (studentToTargetCourseDateMap && studentNumber
          ? moment(studentToTargetCourseDateMap[studentNumber]).isBetween(srE.startdate, srE.enddate, 'day', '[]')
          : true)
    )
    if (studyrightElements.length > 0) {
      const newestStudyrightElement = studyrightElements.sort(
        (a, b) => new Date(b.startdate) - new Date(a.startdate) + (new Date(b.enddate) - new Date(a.enddate))
      )[0]
      studyprogrammes.push({
        name: elementDetails[newestStudyrightElement.code].name,
        startdate: newestStudyrightElement.startdate,
        code: newestStudyrightElement.code,
        facultyCode,
      })
    }
  })
  const programme = studyprogrammes.sort((a, b) => new Date(b.startdate) - new Date(a.startdate))[0]
  if (programme) {
    return programme
  }

  if (studentToTargetCourseDateMap) {
    return {
      name: { en: 'No programme at the time of attainment', fi: 'Ei ohjelmaa suorituksen hetkellä' },
      startdate: '',
      code: '00000',
    }
  }

  return { name: { en: 'No programme', fi: 'Ei ohjelmaa' }, startdate: '', code: '00000' }
}

export const getHighestGradeOfCourseBetweenRange = (courses, lowerBound, upperBound) => {
  const grades = []
  courses.forEach(course => {
    if (
      new Date(lowerBound).getTime() <= new Date(course.date).getTime() &&
      new Date(course.date).getTime() <= new Date(upperBound).getTime()
    ) {
      if (course.grade === 'Hyv.') {
        grades.push({ grade: course.grade, value: 1 })
      } else if (!Number(course.grade)) {
        grades.push({ grade: course.grade, value: 0 })
      } else {
        grades.push({ grade: course.grade, value: Number(course.grade) })
      }
    }
  })
  return maxBy(grades, grade => grade.value)
}

export const validateInputLength = (input, minLength) => input && input.trim().length >= minLength

export const splitByEmptySpace = str => str.replace(/\s\s+/g, ' ').split(' ')

export const isNewHYStudyProgramme = code => !!(code && code.match(/^[A-Z]*[0-9]*_[0-9]*$/))

// These are the new Bachelor's programmes in Matlu, that have BH possibility
export const bachelorHonoursProgrammes = [
  'KH50_001',
  'KH50_002',
  'KH50_003',
  'KH50_004',
  'KH50_005',
  'KH50_006',
  'KH50_007',
  'KH50_008',
]

// Basic modules from Sisu programme structures. All modules that can be found for the past years' structures
// taken into account
export const bachelorHonoursBasicModules = {
  KH50_001: ['MAT110', 'MAT120', 'MAT130', 'MAT120', 'TKT1'],
  KH50_002: ['FYS1100', 'FYS1200'],
  KH50_003: ['KEK100'],
  KH50_004: ['MAT110', 'FYS1100', 'FYS1200', 'KEK100'],
  KH50_005: ['TKT1'],
  KH50_006: ['GEOK_100'],
  KH50_007: ['MAA-100'],
  KH50_008: ['BSCH1000', 'BSCS1000', 'BSMA1000', 'BSMS1000', 'BSPH1000'],
}

// Similarly intermediate modules from Sisu programme structures. All modules that can be found for the past years' structures
// taken into account
export const bachelorHonoursIntermediateModules = {
  KH50_001: ['mat217', 'MAT210', 'MAT220', 'MAT240', 'MAT213', 'MAT230', 'MAT218', 'MAT011'],
  KH50_002: ['FYS2100', 'FYS2200', 'FYS2300', 'FYS2400', 'FYS2500', 'FYS2600'],
  KH50_003: ['KEK200'],
  KH50_004: ['MFK-M200', 'MFK-F200', 'MFK-K200'],
  KH50_005: ['TKT2'],
  KH50_006: ['GEOK_200'],
  KH50_007: ['MAA-200'],
  KH50_008: ['BSCH2000', 'BSCS2000', 'BSMA2000', 'BSMS2000', 'BSPH2000'],
}

export const languageAbbreviations = {
  fi: 'finnish',
  sv: 'swedish',
  en: 'english',
}

export const showAsUserKey = 'showAsUser'
