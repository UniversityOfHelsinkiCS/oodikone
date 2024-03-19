import { filter, intersection, maxBy, range } from 'lodash'
import moment from 'moment'

import irtomikko from '@/assets/irtomikko.png'
import toskaLogo from '@/assets/toska.png'

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

export const getStudentToStudyrightStartMap = (students, programmeCode) => {
  return students.reduce((res, student) => {
    const currentStudyright = student.studyrights?.find(studyright =>
      studyright.studyright_elements.some(element => element.code === programmeCode)
    )
    if (currentStudyright?.studyrightid && currentStudyright.studyrightid.slice(-2) === '-2') {
      const bachelorId = currentStudyright.studyrightid.replace(/-2$/, '-1')
      const bacherlorStudyright = student.studyrights.find(studyright => studyright.studyrightid === bachelorId)
      res[student.studentNumber] = bacherlorStudyright?.startdate || null
    } else {
      res[student.studentNumber] = currentStudyright?.startdate || null
    }
    return res
  }, {})
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

export const containsOnlyNumbers = str => str.match('^\\d+$')

export const momentFromFormat = (date, format) => moment(date, format)

export const reformatDate = (date, outputFormat) => (!date ? 'Unavailable' : moment(date).local().format(outputFormat))

export const byDateDesc = (a, b) => new Date(b.date) - new Date(a.date)

export const getTimestamp = () => moment().format('YYYY-MM-DD')

export const getStudentTotalCredits = (student, includeTransferredCredits = true) => {
  const passedCourses = includeTransferredCredits
    ? student.courses.filter(course => course.passed && !course.isStudyModuleCredit)
    : student.courses.filter(course => course.passed && !course.isStudyModuleCredit && course.credittypecode !== 9)
  return Math.round(100 * passedCourses.reduce((a, b) => a + b.credits, 0)) / 100
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

export const getTextInWithOpen = (texts, language, isOpenCourse) => {
  const prefixes = ['Avoin', 'Öppna', 'Open']
  if (texts) {
    const lanText = texts[language] || texts.fi || texts.en || texts.sv || Object.values(texts)[0]
    const splitText = lanText.split(':')
    if (prefixes.some(word => splitText[0].startsWith(word))) {
      splitText.shift()
    }
    const newText = [...splitText].join()

    if (isOpenCourse) {
      switch (language) {
        case 'fi':
          return `${prefixes[0]} yo: ${newText}`

        case 'sv':
          return `${prefixes[1]} uni: ${newText}`

        case 'en':
          return `${prefixes[2]} uni: ${newText}`

        default:
          return `${prefixes[0]} yo: ${newText}`
      }
    }
    return newText
  }
  return null
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
    .filter(studyright => studyright.extentcode < 5)
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

export const findStudyrightElementForClass = (studyrights, programme, year) =>
  studyrights
    .flatMap(studyright => studyright.studyright_elements)
    .find(element => {
      if (element.code !== programme) return false
      const date = moment(new Date(`${year}-08-01`))
      const endDate = moment(new Date(element.enddate))
      return date.isBefore(endDate, undefined, '[]')
    })

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
      ? moment(sreStartDate).add(months, 'months').set('month', 7).endOf('month')
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

export const resolveStudyPlan = (studyPlans, studyRight) => {
  if (!studyRight) return null
  const { code } =
    studyRight.studyright_elements
      .filter(element => element.element_detail.type === 20)
      .sort((a, b) => new Date(a.startdate) - new Date(b.startdate))[0] || {}
  if (!code) return null
  return studyPlans.find(p => p.programme_code === code && p.studyrightid === studyRight.studyrightid)
}

export const getCurrentSemester = allSemesters => {
  if (!allSemesters) return null
  return Object.values(allSemesters).find(
    sem => new Date(sem.startdate) <= new Date() && new Date(sem.enddate) >= new Date()
  )
}

/** Returns a sorting function that can be used to sort strings so that Finnish alphabetical order is respected.
 * @param {string} field - The field to sort by (optional: if not given, the function will sort by the strings themselves)
 */
export const createLocaleComparator = (field = null) => {
  if (!field) return (val1, val2) => val1.localeCompare(val2, 'fi', { sensitivity: 'accent' })
  return (val1, val2) => val1[field]?.localeCompare(val2[field], 'fi', { sensitivity: 'accent' })
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
