import dayjs, { extend as dayjsExtend } from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import { maxBy, orderBy, range } from 'lodash'

import { serviceProvider } from '@/conf'
import { SemestersData } from '@/redux/semesters'
import type { Absence } from '@/types/students'
import type { SISStudyRightElement } from '@oodikone/shared/models'
import {
  FormattedStudent,
  Release,
  CreditTypeCode,
  Name,
  Unarray,
  SemesterEnrollment,
  EnrollmentType,
} from '@oodikone/shared/types'
import { StudentStudyRight } from '@oodikone/shared/types/studentData'

dayjsExtend(isBetween)

export const isFall = (semester: number) => semester % 2 === 1

/**
 * @param currentSemester semesterCode for wanted semester
 * @param semesterEnrollments fetched from within a studyRight
 * @returns boolean depicting if registration for given semester is "absent"
 */
const semesterEnrollmentAbsence = (
  currentSemester: number,
  semesterEnrollments: SemesterEnrollment[] | undefined | null
) => {
  const relevantSemesterEnrollment = semesterEnrollments?.find(se => se.semester === currentSemester)
  return relevantSemesterEnrollment?.type === EnrollmentType.ABSENT
}

// NB: statutory absence is named just "absent"
export const getStudyRightStatusText = (
  programme: { active: boolean; graduated: boolean; cancelled: boolean } | undefined,
  studyRight: StudentStudyRight | undefined,
  semestercode: number | undefined
) => {
  if (!programme) return null
  if (programme.graduated) return 'Graduated'
  if (programme.cancelled) return 'Cancelled'
  if (semesterEnrollmentAbsence(semestercode ?? NaN, studyRight?.semesterEnrollments)) return 'Absent'
  if (programme.active) return 'Active'
  return 'Inactive'
}

export const getStudentTotalCredits = (
  student: Pick<FormattedStudent, 'courses'>,
  includeTransferredCredits = true
) => {
  const passedCourses = includeTransferredCredits
    ? student.courses.filter(
        course =>
          [CreditTypeCode.PASSED, CreditTypeCode.APPROVED].includes(course.credittypecode) &&
          !course.isStudyModuleCredit
      )
    : student.courses.filter(course => course.credittypecode === CreditTypeCode.PASSED && !course.isStudyModuleCredit)
  return passedCourses.reduce((a, b) => a + b.credits, 0)
}

const getGradedCourses = (student: FormattedStudent, includeTransferredCredits = true) =>
  includeTransferredCredits
    ? student.courses.filter(course => Number(course.grade) && !course.isStudyModuleCredit)
    : student.courses.filter(
        course =>
          Number(course.grade) && !course.isStudyModuleCredit && course.credittypecode !== CreditTypeCode.APPROVED
      )

export const getStudentGradeMean = (student: FormattedStudent, includeTransferredCredits = true) => {
  const courses = getGradedCourses(student, includeTransferredCredits)
  const gradeTotal = courses.reduce((a, b) => a + Number(b.grade), 0)
  const mean = gradeTotal / courses.length || 0
  return mean
}

export const getStudentGradeMeanWeightedByCredits = (student: FormattedStudent, includeTransferredCredits = true) => {
  const courses = getGradedCourses(student, includeTransferredCredits)
  const gradeTotal = courses.reduce((a, b) => a + Number(b.grade) * Number(b.credits), 0)
  const sumWeights = courses.reduce((a, b) => a + Number(b.credits), 0)
  const mean = gradeTotal / sumWeights || 0
  return mean
}

export const getTextInWithOpen = (
  course: { code: string; name: Name },
  getTextIn: any,
  isOpenCourse: boolean,
  isStudyModuleCredit: boolean
) => {
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

export const getUnifyTextIn = (unifyCourses: string) => {
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
export const getStudentToTargetCourseDateMap = (
  students: Pick<FormattedStudent, 'studentNumber' | 'courses'>[],
  codes: string[]
) => {
  const codeSet = new Set(codes)
  return students.reduce((acc, student) => {
    const targetCourse = student.courses
      .filter(course => codeSet.has(course.course_code))
      .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0]
    acc[student.studentNumber] = targetCourse ? targetCourse.date : null
    return acc
  }, {})
}

/**
 * Only accounts for semester enrollments
 * Cancelled study right or graduation not accounted for
 */
const programmeIsActive = (studyRight: Unarray<FormattedStudent['studyRights']>, currentSemesterCode: number) =>
  !!studyRight.semesterEnrollments?.some(
    enrollment =>
      enrollment.semester === currentSemesterCode &&
      [EnrollmentType.PRESENT, EnrollmentType.ABSENT].includes(enrollment.type)
  )

/**
* @param semester "active" is according to the provided semester

* NB: Will show graduated/canceled even if semester is in the past, and student
* had not graduated / been cancelled at the time.
*/
export const getAllProgrammesOfStudent = (studyRights: FormattedStudent['studyRights'], targetSemester: number) =>
  orderBy(
    studyRights?.flatMap(studyRight =>
      studyRight.studyRightElements
        .filter(element => element.degreeProgrammeType !== null)
        .map(element => ({
          code: element.code,
          name: element.name,
          graduated: element.graduated,
          startDate: element.startDate,
          cancelled: studyRight.cancelled,
          active: programmeIsActive(studyRight, targetSemester),
          facultyCode: studyRight.facultyCode,
        }))
    ),
    ['active', 'startDate'],
    ['desc', 'desc']
  )

/**
 * @param targetSemester used for checking if study right was active at the time
 * @param filterInactive filters out programmes associated with inactive study rights
 * @param date only consider programmes that the student had started in prior to the date
 */
export const getNewestProgrammeOfStudentAt = (
  studyRights: FormattedStudent['studyRights'],
  targetSemester: number | undefined,
  filterInactive?: boolean,
  date?: string
) => {
  if (!targetSemester) return null

  const allProgrammes = getAllProgrammesOfStudent(studyRights, targetSemester)
  const programmes = filterInactive ? allProgrammes.filter(prog => prog.active) : allProgrammes

  if (!date) return programmes.at(0) ?? null

  return programmes.find(programme => dayjs(date).isSameOrAfter(programme.startDate)) ?? null
}

export const getHighestGradeOfCourseBetweenRange = (
  courses: FormattedStudent['courses'],
  lowerBound: string,
  upperBound: string
) => {
  const grades = courses
    .filter(course => new Date(lowerBound) <= new Date(course.date) && new Date(course.date) <= new Date(upperBound))
    .map(course => {
      if (course.grade === 'HT') return { grade: course.grade, sortValue: 2 }
      if (course.grade === 'Hyv.' || course.grade === 'TT') return { grade: course.grade, sortValue: 1 }
      if (!Number(course.grade)) return { grade: course.grade, sortValue: 0 }
      return { grade: course.grade, sortValue: Number(course.grade) }
    })

  return maxBy(grades, grade => grade.sortValue)?.grade
}

export const getTargetCreditsForProgramme = (code: string) => {
  if (code === 'MH30_001' || code === 'KH90_001-MH90_001') return 360
  if (code === 'MH30_003') return 330
  if (code === 'MH30_004') return 150
  if (code === 'MH90_001') return 180
  if (code.includes('MH')) return 120
  if (code.includes('T')) return 40
  return 180
  // Those codes begin with 'LIS' is it 40 credits or something else?
}

export const isMastersProgramme = (programmeCode: string) =>
  programmeCode.startsWith('MH') || programmeCode.endsWith('-ma')

export const getMonthsForDegree = (code: string) => getTargetCreditsForProgramme(code) / (60 / 12)

export const calculatePercentage = (numerator: number, denominator: number, numberOfDecimals = 2) =>
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
export const getStudyRightElementTargetDates = (
  studyRightElement: Pick<SISStudyRightElement, 'code' | 'startDate'> | undefined,
  absences: Absence[]
) => {
  if (!studyRightElement) return []
  const { code, startDate: sreStartDate } = studyRightElement
  const months = getMonthsForDegree(code)
  const sreEndDateTarget =
    code.includes('KH') || code.includes('ba') || ['MH30_001', 'MH30_003'].includes(code)
      ? dayjs(sreStartDate).add(months, 'months').set('month', 6).endOf('month').toDate()
      : dayjs(sreStartDate).add(months, 'months').toDate()

  if (!absences) return [new Date(sreStartDate), sreEndDateTarget]

  const absencesWithinStudyRightElement = absences.filter(
    ({ startDate, endDate }) => startDate >= sreStartDate && endDate <= sreEndDateTarget
  )

  if (!absencesWithinStudyRightElement.length) return [sreStartDate, sreEndDateTarget]

  const absenceInStartOfStudyRight = absencesWithinStudyRightElement.find(({ startDate }) => sreStartDate === startDate)

  const absentMonthsDuringStudy = Math.round(
    absencesWithinStudyRightElement
      .filter(({ startDate, endDate }) => {
        if (!absenceInStartOfStudyRight) return true
        return startDate !== absenceInStartOfStudyRight.startDate && endDate !== absenceInStartOfStudyRight.endDate
      })
      .filter(({ startDate }) => startDate < sreEndDateTarget)
      .reduce((acc, absence) => {
        const { startDate, endDate } = absence
        const diff = dayjs(startDate).diff(endDate, 'days') / 30
        return acc + Math.abs(diff)
      }, 0)
  )

  const absentMonthsBeforeStudy = absenceInStartOfStudyRight
    ? Math.round(
        Math.abs(dayjs(absenceInStartOfStudyRight.startDate).diff(absenceInStartOfStudyRight.endDate, 'days') / 30)
      )
    : 0
  return [
    dayjs(sreStartDate).add(absentMonthsBeforeStudy, 'months').toDate(),
    dayjs(sreEndDateTarget)
      .add(absentMonthsDuringStudy + absentMonthsBeforeStudy, 'months')
      .toDate(),
  ]
}

export enum TimeDivision {
  ACADEMIC_YEAR = 'Academic year',
  CALENDAR_YEAR = 'Calendar year',
  SEMESTER = 'Semester',
}

/* Returns an array of credit categories depending on parameters, shows the high limit
  of the category, for example [20, 40, 60, 80, 100, 120] where the first category is 0 - 20 */
export const getCreditCategories = (
  cumulative: boolean,
  timeDivision: TimeDivision,
  programmeCredits: number,
  timeSlotsLength: number,
  creditCategoryAmount: number,
  minCredits = 0
) => {
  // In calendar-year mode, minus 30 from target credits because programmes (usually) start in autumn,
  // also if current date is before august, minus 30
  const isCalendar = timeDivision === TimeDivision.CALENDAR_YEAR
  const isPastAugust = new Date().getMonth() > 6
  const calendarModifier = 30 + (isPastAugust ? 0 : 30)
  const creditsByTimeslots =
    timeSlotsLength * (timeDivision === TimeDivision.SEMESTER ? 30 : 60) - (isCalendar ? calendarModifier : 0)
  const maxCredits = creditsByTimeslots > programmeCredits ? programmeCredits : creditsByTimeslots
  const creditCategoryArray: number[] = []
  for (let i = 1; i <= creditCategoryAmount; i++) creditCategoryArray.push(i)

  const limitBreaks = cumulative
    ? creditCategoryArray.map(num => Math.round(minCredits + (num * (maxCredits - minCredits)) / creditCategoryAmount))
    : [15, 30, 45, 60].map(limit => limit * (timeDivision === TimeDivision.SEMESTER ? 0.5 : 1))
  return range(0, limitBreaks.length + 1).map(i => [limitBreaks[i - 1], limitBreaks[i]])
}

export const validateInputLength = (input: string, minLength: number) => input?.trim().length >= minLength

export const getCurrentSemester = (allSemesters: SemestersData['semesters']) => {
  if (!allSemesters) return null
  return Object.values(allSemesters).find(
    semester => new Date(semester.startdate) <= new Date() && new Date(semester.enddate) >= new Date()
  )
}

/**
 * @returns semestercode that was active during the targetDate
 */
export const getSemesterCodeAt = (allSemesters?: SemestersData['semesters'], targetDate?: Date | string) => {
  if (!targetDate) return undefined

  return Object.values(allSemesters ?? {}).find(
    semester =>
      new Date(semester.startdate) <= new Date(targetDate) && new Date(semester.enddate) >= new Date(targetDate)
  )?.semestercode
}

export const isNewStudyProgramme = (programmeCode: string) => ['MH', 'KH', 'T9'].includes(programmeCode.slice(0, 2))

/**
 * Extracts items from a string separated by commas, semicolons, spaces, or newlines.
 * @param {string} input - The input string containing items.
 * @returns An array of extracted items.
 */
export const extractItems = (input: string) => {
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

export const getEnrollmentTypeTextForExcel = (type: number, statutoryAbsence?: boolean) => {
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

export const formatContent = (content: string) => content.replace(/\n +/g, '\n')

export const filterInternalReleases = (release: Release) => !release.title.startsWith('Internal:')

export const getDescription = (description: string) => {
  const lines = description.split('\n')
  const internalIndex = lines.findIndex(line => line.toLowerCase().includes('internal'))
  if (internalIndex === -1 || internalIndex === 0) {
    return description
  }
  return lines.slice(0, internalIndex).join('\n')
}
