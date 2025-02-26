import { filter, maxBy, orderBy, range } from 'lodash'
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

export const isFall = semester => semester % 2 === 1

export const getStudentTotalCredits = (student, includeTransferredCredits = true) => {
  const passedCourses = includeTransferredCredits
    ? student.courses.filter(course => [4, 9].includes(course.credittypecode) && !course.isStudyModuleCredit)
    : student.courses.filter(course => course.credittypecode === 4 && !course.isStudyModuleCredit)
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

const programmeIsActive = (studyRight, hasGraduated, currentSemesterCode) =>
  !studyRight.cancelled &&
  !hasGraduated &&
  (currentSemesterCode == null ||
    studyRight.semesterEnrollments?.find(
      enrollment => enrollment.semester === currentSemesterCode && [1, 2].includes(enrollment.type)
    ) != null)

export const getAllProgrammesOfStudent = (studyRights, currentSemester) =>
  orderBy(
    studyRights?.flatMap(studyRight =>
      studyRight.studyRightElements
        .filter(element => element.degreeProgrammeType !== null)
        .map(element => ({ ...element, studyRight }))
    ),
    ['startDate'],
    ['desc']
  ).map(({ code, name, graduated, studyRight, startDate }) => ({
    code,
    name,
    graduated,
    startDate,
    active: programmeIsActive(studyRight, graduated, currentSemester),
    facultyCode: studyRight.facultyCode,
  }))

export const getNewestProgrammeOfStudentAt = (studyRights, currentSemester, date) => {
  const programmes = getAllProgrammesOfStudent(studyRights, currentSemester)
  if (!programmes.length) return null
  if (!date) return programmes[0]
  return programmes.find(programme => moment(date).isSameOrAfter(programme.startDate)) ?? null
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

export const findStudyRightForClass = (studyRights, programmeCode, year) =>
  studyRights.find(studyRight =>
    studyRight.studyRightElements.some(
      element =>
        element.code === programmeCode &&
        (year == null ||
          year === 'All' ||
          moment(element.startDate).isBetween(`${year}-08-01`, `${Number(year) + 1}-07-31`, 'day', '[]'))
    )
  )

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
export const getStudyRightElementTargetDates = (studyRightElement, absences = []) => {
  if (!studyRightElement) return []
  const { code, startDate } = studyRightElement
  const months = getMonthsForDegree(code)
  const end =
    code.includes('KH') || code.includes('ba') || ['MH30_001', 'MH30_003'].includes(code)
      ? moment(startDate).add(months, 'months').set('month', 6).endOf('month')
      : moment(startDate).add(months, 'months')

  if (!absences) return [new Date(startDate), new Date(end)]
  const absencesWithinStudyRightElement = absences.filter(
    ({ startdate, enddate }) => startdate >= new Date(startDate).getTime() && enddate <= new Date(end).getTime()
  )

  if (!absencesWithinStudyRightElement.length) return [new Date(startDate), new Date(end)]

  const absenceInStartOfStudyRight = absencesWithinStudyRightElement.find(
    ({ startdate }) => new Date(startDate).getTime() === startdate
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
    new Date(moment(startDate).add(absentMonthsBeforeStudy, 'months')),
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

export const validateInputLength = (input, minLength) => input?.trim().length >= minLength

export const splitByEmptySpace = str => str.replace(/\s\s+/g, ' ').split(' ')

export const getCurrentSemester = allSemesters => {
  if (!allSemesters) return null
  return Object.values(allSemesters).find(
    semester => new Date(semester.startdate) <= new Date() && new Date(semester.enddate) >= new Date()
  )
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

export const isNewStudyProgramme = programmeCode => ['MH', 'KH', 'T9'].includes(programmeCode.slice(0, 2))

/**
 * Extracts items from a string separated by commas, semicolons, spaces, or newlines.
 * @param {string} input - The input string containing items.
 * @returns An array of extracted items.
 */
export const extractItems = input => {
  const items = input.match(/[^\s,;]+/g) ?? []
  return [...items]
}

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

// These are the Bachelor's programmes in Matlu, that have BH possibility
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
  KH50_001: ['MAT217', 'MAT210', 'MAT220', 'MAT240', 'MAT213', 'MAT230', 'MAT218', 'MAT011'],
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

export const getEnrollmentTypeTextForExcel = (type, statutoryAbsence) => {
  if (type === 1) return 'Present'
  if (type === 2 && statutoryAbsence) return 'Absent (statutory)'
  if (type === 2) return 'Absent'
  if (type === 3) return 'Not enrolled'
  return 'No study right'
}

export const isDefaultServiceProvider = () => {
  if (!serviceProvider) {
    return false
  }
  return serviceProvider === 'toska'
}

export const formatContent = content => content.replace(/\n +/g, '\n')

export const getCalendarYears = years => {
  return years.reduce((all, year) => {
    if (year === 'Total') {
      return all
    }
    return all.concat(Number(year.slice(0, 4)))
  }, [])
}

export const filterInternalReleases = release => !release.title.startsWith('Internal:')

export const getDescription = description => {
  const lines = description.split('\n')
  const internalIndex = lines.findIndex(line => line.toLowerCase().includes('internal'))
  if (internalIndex === -1 || internalIndex === 0) {
    return description
  }
  return lines.slice(0, internalIndex).join('\n')
}
