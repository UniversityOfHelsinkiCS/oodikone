import { filter, intersection, maxBy, range } from 'lodash'
import moment from 'moment'

import irtomikko from '@/assets/irtomikko.png'
import toskaLogo from '@/assets/toska.svg'
import { serviceProvider } from '@/conf'

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

export const getGraduationGraphTitle = (studyProgramme, doCombo = false) => {
  if (!studyProgramme) return ''
  if (['MH30_001', 'MH30_003'].includes(studyProgramme)) return 'Licenciate studyright'
  if (doCombo && studyProgramme === 'MH90_001') return 'Bachelor + licentiate studyright'
  if (doCombo && studyProgramme.includes('MH')) return 'Bachelor + master studyright'
  if (studyProgramme.includes('KH')) return 'Bachelor studyright'
  if (studyProgramme.includes('MH')) return 'Master studyright'
  return 'Doctoral studyright'
}

export const getUnifiedProgrammeName = (bachelor, masterLisentiate, language) => {
  if (language === 'fi')
    return `${bachelor} ja ${
      masterLisentiate?.includes('lisensiaatin') ? 'lisensiaatin koulutusohjelma' : 'maisterin koulutusohjelma'
    }`
  if (language === 'en') return `${bachelor?.split(' ')[0]} and ${masterLisentiate}`
  if (language === 'sv') return `${bachelor?.split('programmet')[0]}- och ${masterLisentiate}`
  return bachelor
}

export const momentFromFormat = (date, format) => moment(date, format)

export const isFall = semester => semester % 2 === 1

export const reformatDate = (date, outputFormat) => {
  if (!date) {
    return 'Unavailable'
  }
  const parsedDate = moment(date).local().format(outputFormat)
  return parsedDate
}

export const getTimestamp = () => moment().format('YYYY-MM-DD')

export const getStudentTotalCredits = (student, includeTransferredCredits = true) => {
  const passedCourses = includeTransferredCredits
    ? student.courses.filter(course => course.passed && !course.isStudyModuleCredit)
    : student.courses.filter(course => course.passed && !course.isStudyModuleCredit && course.credittypecode !== 9)
  return passedCourses.reduce((a, b) => a + b.credits, 0)
}

const getGradedCourses = (student, includeTransferredCredits = true) =>
  includeTransferredCredits
    ? student.courses.filter(course => Number(course.grade) && !course.isStudyModuleCredit)
    : student.courses.filter(
        course => Number(course.grade) && !course.isStudyModuleCredit && course.credittypecode !== 9
      )

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

export const getTextInWithOpen = (course, getTextIn, isOpenCourse, isStudyModuleCredit) => {
  if (!course) return ''
  const openUniTexts = { fi: 'Avoin yo', en: 'Open uni', sv: 'Öppna uni' }
  let courseName = getTextIn(course.name)
  if (
    isOpenCourse &&
    !Object.values(openUniTexts).some(text => courseName.toLowerCase().startsWith(text.toLowerCase()))
  ) {
    courseName = `${getTextIn(openUniTexts)}: ${courseName}`
  }
  if (isStudyModuleCredit) {
    courseName += ` [${getTextIn({ en: 'Study module', fi: 'Opintokokonaisuus', sv: 'Studiehelhet' })}]`
  }
  courseName += ` (${course.code})`
  return courseName
}

export const getUnifyTextIn = unifyCourses => {
  switch (unifyCourses) {
    case 'regularStats':
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

  // eslint-disable-next-line no-async-promise-executor
  const wrappedPromise = new Promise(async (res, rej) => {
    try {
      await promise
      if (hasCanceled) res(false)
      res(true)
    } catch (error) {
      rej(error)
    }
  })

  return {
    promise: wrappedPromise,
    cancel: () => {
      hasCanceled = true
    },
  }
}

// Gives students course completion date
export const getStudentToTargetCourseDateMap = (students, codes) => {
  const codeSet = new Set(codes)
  return students.reduce((acc, student) => {
    const targetCourse = student.courses
      .filter(course => codeSet.has(course.course_code))
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
    acc[student.studentNumber] = targetCourse ? targetCourse.date : null
    return acc
  }, {})
}

export const getAllProgrammesOfStudent = (studyrights, studentNumber, studentToTargetCourseDateMap, elementDetails) => {
  const studyprogrammes = []
  studyrights
    // Bachelor's, master's, licentiate and doctoral programmes, also medicine, dentistry and veterinary specialization training
    .filter(studyright => studyright.extentcode < 5 || studyright.extentcode === 23)
    .forEach(studyright => {
      const facultyCode = studyright.faculty_code
      const studyrightElements = studyright.studyright_elements.filter(
        element =>
          elementDetails[element.code] &&
          elementDetails[element.code].type === 20 &&
          (studentToTargetCourseDateMap && studentNumber
            ? moment(studentToTargetCourseDateMap[studentNumber]).isBetween(
                element.startdate,
                element.enddate || moment(),
                'day',
                '[]'
              )
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
          graduated: studyright.graduated,
          active: studyright.active,
        })
      }
    })

  studyprogrammes.sort((a, b) => new Date(b.startdate) - new Date(a.startdate))

  if (studyprogrammes.length > 0) {
    return studyprogrammes
  }

  if (studentToTargetCourseDateMap) {
    return [
      {
        name: { en: 'No programme at the time of attainment', fi: 'Ei ohjelmaa suorituksen hetkellä' },
        startdate: '',
        code: '00000',
      },
    ]
  }

  return [{ name: { en: 'No programme', fi: 'Ei ohjelmaa' }, startdate: '', code: '00000' }]
}

export const getNewestProgramme = (studyrights, studentNumber, studentToTargetCourseDateMap, elementDetails) => {
  return getAllProgrammesOfStudent(studyrights, studentNumber, studentToTargetCourseDateMap, elementDetails)[0]
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

export const getHighestGradeOrEnrollmentOfCourseBetweenRange = (courses, enrollments, lowerBound, upperBound) => {
  const grade = getHighestGradeOfCourseBetweenRange(courses, lowerBound, upperBound)
  if (!grade) return enrollments.length ? { grade: 'No grade' } : undefined
  return grade
}

export const findStudyrightElementForClass = (studyrights, programme, year) => {
  return studyrights
    .flatMap(studyright => studyright.studyright_elements)
    .find(element => {
      if (element.code !== programme) return false
      if (year === 'All') return true
      const date = moment(new Date(`${year}-08-01`))
      const endDate = moment(new Date(element.enddate))
      return date.isBefore(endDate, undefined, '[]')
    })
}

const getEarliestStudyRightElement = studyright => {
  if (!studyright) return null
  return (
    studyright.studyright_elements
      // eslint-disable-next-line camelcase
      .filter(({ element_detail }) => element_detail.type === 20)
      .sort((a, b) => new Date(a.startdate) - new Date(b.startdate))[0]
  )
}

export const getTargetCreditsForProgramme = code => {
  if (code === 'MH30_001' || code === 'KH90_001-MH90_001') return 360
  if (code === 'MH30_003') return 330
  if (code === 'MH30_004') return 150
  if (code === 'MH90_001') return 180
  if (code.includes('MH')) return 120
  if (code.includes('T')) return 40
  return 180
  // Those codes begin with 'LIS' is it 40 credits or something else?
}

export const isMastersProgramme = programmeCode => programmeCode.startsWith('MH') || programmeCode.endsWith('-ma')

export const getMonthsForDegree = code => getTargetCreditsForProgramme(code) / (60 / 12)

export const calculatePercentage = (numerator, denominator, numberOfDecimals = 2) =>
  new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: numberOfDecimals,
    maximumFractionDigits: numberOfDecimals,
  }).format(numerator / denominator)

/**
 * Get start and end dates for study right element. For bachelor a 3 year target is used
 * and for masters a 2 year target. Any absences within the study right element extends the end date.
 * If any absence is in the start of study right element the start date is postponed.
 */
export const getStudyRightElementTargetDates = (studyRight, absences = []) => {
  const studyRightElement = getEarliestStudyRightElement(studyRight)
  if (!studyRightElement) return []
  const { code, startdate: sreStartDate } = studyRightElement
  const months = getMonthsForDegree(code)
  const end =
    code.includes('KH') || code.includes('ba') || ['MH30_001', 'MH30_003'].includes(code)
      ? moment(sreStartDate).add(months, 'months').set('month', 6).endOf('month')
      : moment(sreStartDate).add(months, 'months')

  if (!absences) return [new Date(sreStartDate), new Date(end)]
  const absencesWithinStudyRightElement = absences.filter(
    ({ startdate, enddate }) => startdate >= new Date(sreStartDate).getTime() && enddate <= new Date(end).getTime()
  )

  if (!absencesWithinStudyRightElement.length) return [new Date(sreStartDate), new Date(end)]

  const absenceInStartOfStudyRight = absencesWithinStudyRightElement.find(
    ({ startdate }) => new Date(sreStartDate).getTime() === startdate
  )
  const absentMonthsDuringStudy = Math.round(
    absencesWithinStudyRightElement
      .filter(({ startdate, enddate }) => {
        if (!absenceInStartOfStudyRight) return true
        return startdate !== absenceInStartOfStudyRight.startdate && enddate !== absenceInStartOfStudyRight.enddate
      })
      .filter(({ startdate }) => startdate < new Date(end).getTime())
      .reduce((acc, absent) => {
        const { startdate, enddate } = absent
        const diff = moment(startdate).diff(moment(enddate), 'days') / 30
        return acc + Math.abs(diff)
      }, 0)
  )
  const absentMonthsBeforeStudy = absenceInStartOfStudyRight
    ? Math.round(
        Math.abs(
          moment(absenceInStartOfStudyRight.startdate).diff(moment(absenceInStartOfStudyRight.enddate), 'days') / 30
        )
      )
    : 0
  return [
    new Date(moment(sreStartDate).add(absentMonthsBeforeStudy, 'months')),
    new Date(end.add(absentMonthsDuringStudy + absentMonthsBeforeStudy, 'months')),
  ]
}

export const TimeDivision = {
  ACADEMIC_YEAR: 'academic-year',
  CALENDAR_YEAR: 'calendar-year',
  SEMESTER: 'semester',
}

/* Returns an array of credit categories depending on parameters, shows the high limit
  of the category, for example [20, 40, 60, 80, 100, 120] where the first category is 0 - 20 */
export const getCreditCategories = (
  cumulative,
  timeDivision,
  programmeCredits,
  timeSlots,
  creditCategoryAmount,
  minCredits = 0
) => {
  // In calendar-year mode, minus 30 from target credits because programmes (usually) start in autumn,
  // also if current date is before august, minus 30
  const isCalendar = timeDivision === TimeDivision.CALENDAR_YEAR
  const isPastAugust = new Date().getMonth() > 6
  const calendarModifier = 30 + (isPastAugust ? 0 : 30)
  const creditsByTimeslots =
    timeSlots.length * (timeDivision === TimeDivision.SEMESTER ? 30 : 60) - (isCalendar ? calendarModifier : 0)
  const maxCredits = creditsByTimeslots > programmeCredits ? programmeCredits : creditsByTimeslots
  const creditCategoryArray = []
  for (let i = 1; i <= creditCategoryAmount; i++) creditCategoryArray.push(i)

  const limitBreaks = cumulative
    ? creditCategoryArray.map(num => Math.round(minCredits + (num * (maxCredits - minCredits)) / creditCategoryAmount))
    : [15, 30, 45, 60].map(limit => limit * (timeDivision === TimeDivision.SEMESTER ? 0.5 : 1))
  return range(0, limitBreaks.length + 1).map(i => [limitBreaks[i - 1], limitBreaks[i]])
}

export const validateInputLength = (input, minLength) => input && input.trim().length >= minLength

export const splitByEmptySpace = str => str.replace(/\s\s+/g, ' ').split(' ')

export const getCurrentSemester = allSemesters => {
  if (!allSemesters) return null
  return Object.values(allSemesters).find(
    semester => new Date(semester.startdate) <= new Date() && new Date(semester.enddate) >= new Date()
  )
}

/**
 * Returns a sorting function that can be used to sort strings so that Finnish alphabetical order is respected.
 *
 * @param {string} field - The field to sort by (optional: if not given, the function will sort by the strings themselves)
 */
export const createLocaleComparator = (field = null) => {
  if (!field) {
    return (val1, val2) => val1.localeCompare(val2, 'fi', { sensitivity: 'accent' })
  }
  return (val1, val2) => val1[field]?.localeCompare(val2[field], 'fi', { sensitivity: 'accent' })
}

export const createPinnedFirstComparator = pinnedProgrammes => {
  const localeComparator = createLocaleComparator('code')
  return (programmeA, programmeB) => {
    const pinnedA = pinnedProgrammes.includes(programmeA.code)
    const pinnedB = pinnedProgrammes.includes(programmeB.code)
    if (pinnedA && !pinnedB) {
      return -1
    }
    if (!pinnedA && pinnedB) {
      return 1
    }
    return localeComparator(programmeA, programmeB)
  }
}

const interpolateColor = (color1, color2, factor) =>
  color1.map((component, index) => Math.round(component + factor * (color2[index] - component)))

const convertRgbToHex = rgb => `#${rgb.map(x => x.toString(16).padStart(2, '0')).join('')}`

export const generateGradientColors = steps => {
  const startColor = [230, 96, 103] // red
  const midColor = [245, 233, 132] // yellow
  const endColor = [0, 140, 89] // green
  const gradientColors = []

  for (let i = 0; i < steps; i++) {
    const factor = i / (steps - 1)
    let color

    if (i <= (steps - 1) / 2) {
      color = interpolateColor(startColor, midColor, factor * 2)
    } else {
      color = interpolateColor(midColor, endColor, (factor - 0.5) * 2)
    }

    gradientColors.push(convertRgbToHex(color))
  }
  return gradientColors
}

export const getFullStudyProgrammeRights = programmeRights =>
  programmeRights ? programmeRights.filter(({ limited }) => !limited).map(({ code }) => code) : []

export const isNewStudyProgramme = programmeCode => ['MH', 'KH', 'T9'].includes(programmeCode.slice(0, 2))

// Naming follows convention from SIS API (e.g urn:code:admissiont-type:m for "Muu")
// Except changed Koepisteet to Valintakoe
export const ADMISSION_TYPES = {
  M: 'Muu',
  KM: 'Kilpailumenestys',
  TV: 'Todistusvalinta',
  AV: 'Avoin väylä',
  KP: 'Valintakoe',
  YP: 'Yhteispisteet',
  N: null,
}

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

// Basic modules from Sisu programme structures. All modules that
// can be found for the past years' structures taken into account
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

// Similarly intermediate modules from Sisu programme structures. All modules
// that can be found for the past years' structures taken into account
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

export const getAge = date => {
  const today = new Date()
  const birthDate = new Date(date)
  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDifference = today.getMonth() - birthDate.getMonth()
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age
}

export const getEnrollmentTypeTextForExcel = (type, statutoryAbsence) => {
  if (type === 1) return 'Present'
  if (type === 2 && statutoryAbsence) return 'Absent (statutory)'
  if (type === 2) return 'Absent'
  if (type === 3) return 'Not enrolled'
  return 'No study right'
}

export const isDefaultServiceProvider = () => {
  return serviceProvider && serviceProvider === 'Toska'
}
