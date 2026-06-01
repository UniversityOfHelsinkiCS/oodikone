import crypto from 'crypto'
import { Op, fn as dbFn, col as dbCol } from 'sequelize'

import { Credit, Enrollment } from '@oodikone/shared/models'
import { Name, EnrollmentState, Unification } from '@oodikone/shared/types'
import { dateIsBetween } from '@oodikone/shared/util/datetime'
import logger from '../../../src/util/logger'
import { CourseModel, CreditModel, EnrollmentModel, OrganizationModel, SISStudyRightElementModel } from '../../models'
import { isOpenUniCourseCode } from '../../util'
import { CourseYearlyStatsCounter } from './courseYearlyStatsCounter'
import {
  getCreditsForCourses,
  getEnrollmentsForCourses,
  getStudentNumberToSrElementsMap,
} from './creditsAndEnrollmentsOfCourse'
import { FormattedProgramme, getIsOpen } from './helpers'

const formatStudyRightElement = (studyRightElement: SISStudyRightElementModel): FormattedProgramme => ({
  code: studyRightElement.code,
  name: studyRightElement.name,
  startDate: studyRightElement.startDate,
  facultyCode: studyRightElement.studyRight.facultyCode,
  organization: studyRightElement.studyRight.organization,
})

const anonymizeStudentNumber = (studentNumber: string, anonymizationSalt: string) => {
  return crypto.createHash('sha256').update(`${studentNumber}${anonymizationSalt}`).digest('hex')
}

type FormattedCredit = {
  yearCode: number
  yearName: string
  semesterCode: number
  semesterName: Name
  attainmentDate: Date
  courseCode: string
  grade: string
  passed: boolean
  studentNumber: string
  programme: FormattedProgramme
  credits: number
}

// Is group in question for a single course (original or 1-to-1 substitution) or a substitution group with multiple courses
const isSingleCourse = (group: Credit[] | Enrollment[]): boolean =>
  group?.length === 1 || [...new Set(group?.map((course: Credit | Enrollment) => course.course_code))].length === 1

const parseCredit = (
  creditGroup: Credit[],
  anonymizationSalt: string | null,
  mainCourseCode: string,
  studyRightElements: Array<SISStudyRightElementModel>
): FormattedCredit => {
  const singleCourse = isSingleCourse(creditGroup)
  // Latest attainment for a course
  const credit =
    creditGroup
      .sort((a, b) => b.attainment_date.getTime() - a.attainment_date.getTime())
      .find(credit => !CreditModel.failed(credit)) ?? creditGroup.at(0)!

  const courseCode = singleCourse ? credit.course_code : mainCourseCode
  const grade = singleCourse ? credit.grade : 'substituted'
  const credits = singleCourse ? credit.credits : creditGroup.reduce((acc, credit) => acc + credit.credits, 0)

  // Take the first attainment for the course (see Student statistics info-box)
  // TODO: Substitution groups should be marked for the semester when
  // the group was first finished eg. when was the first time the last missing
  // course of the group was passed
  const {
    semester,
    attainment_date: attainmentDate,
    student_studentnumber: studentNumber,
    studyright_id: studyRightId,
  } = creditGroup.at(-1)!

  const { yearcode: yearCode, yearname: yearName, semestercode: semesterCode, name: semesterName } = semester

  const programmeOfCredit: SISStudyRightElementModel | undefined =
    studyRightElements.find(studyRightElement => studyRightElement.studyRightId === studyRightId) ??
    studyRightElements
      .filter(({ startDate, endDate }) => dateIsBetween(attainmentDate, startDate, endDate))
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
      .at(0) // The newest studyRightElement

  const programme = programmeOfCredit
    ? formatStudyRightElement(programmeOfCredit)
    : {
        code: 'OTHER',
        name: { en: 'Other', fi: 'Muu', sv: 'Andra' },
        facultyCode: 'OTHER',
        organization: { name: { en: 'Other', fi: 'Muu', sv: 'Andra' } },
      }

  return {
    yearCode,
    yearName,
    semesterCode,
    semesterName,
    attainmentDate,
    courseCode,
    grade,
    passed: singleCourse ? !CreditModel.failed(credit) : true,
    studentNumber: anonymizationSalt ? anonymizeStudentNumber(studentNumber, anonymizationSalt) : studentNumber,
    programme,
    credits,
  }
}

type FormattedEnrollment = {
  yearCode: number
  yearName: string
  semesterCode: number
  semesterName: Name
  courseCode: string
  enrollmentDateTime: Date
  studentNumber: string
}

const parseEnrollment = (enrollment: Enrollment, anonymizationSalt: string | null): FormattedEnrollment => {
  const {
    studentnumber: studentNumber,
    semester,
    enrollment_date_time: enrollmentDateTime,
    course_code: courseCode,
  } = enrollment
  const { yearcode: yearCode, yearname: yearName, semestercode: semesterCode, name: semesterName } = semester

  return {
    yearCode,
    yearName,
    semesterCode,
    semesterName,
    courseCode,
    enrollmentDateTime,
    studentNumber: anonymizationSalt ? anonymizeStudentNumber(studentNumber, anonymizationSalt) : studentNumber,
  }
}

const getSubstitutionGroupDetails = async (codeGroups: string[][]) => {
  const substitutionGroupDetails = await CourseModel.findAll({
    attributes: ['code', 'name'],
    where: {
      code: { [Op.in]: codeGroups.flatMap(group => group) },
    },
    raw: true,
  })

  return codeGroups.map(group =>
    group.map(code => substitutionGroupDetails.find(subCourse => subCourse.code === code)!)
  )
}

const getYearlyStatsOfNew = async (
  course: Pick<CourseModel, 'code' | 'name' | 'substitution_groups'> | null,
  courseCode: string,
  separate: boolean,
  unification: Unification,
  anonymizationSalt: string | null,
  combineSubstitutions: boolean,
  studentNumberToSrElementsMap: Record<string, SISStudyRightElementModel[]>
) => {
  // Includes main course code and substitutions (if enabled)
  const creditGroupCodes =
    combineSubstitutions && course?.substitution_groups
      ? [[courseCode]].concat(course.substitution_groups)
      : [[courseCode]]

  let filteredCreditGroupCodes: string[][]
  switch (unification) {
    // Include only course codes / group of course codes WITHOUT ANY AY prefix
    case Unification.REGULAR:
      filteredCreditGroupCodes = creditGroupCodes.filter(group => group.every(course => !isOpenUniCourseCode(course)))
      break
    // Include all courses / group of courses
    case Unification.OPEN:
    case Unification.UNIFY:
    default:
      filteredCreditGroupCodes = creditGroupCodes
      break
  }

  const [creditGroups, enrollmentGroups] = await Promise.all([
    getCreditsForCourses(filteredCreditGroupCodes, unification),
    getEnrollmentsForCourses(filteredCreditGroupCodes, unification),
  ])

  const counter = new CourseYearlyStatsCounter()

  for (const creditGroup of creditGroups) {
    if (!creditGroup?.length) continue

    const {
      studentNumber,
      grade,
      passed,
      semesterCode,
      semesterName,
      yearCode,
      yearName,
      attainmentDate,
      programme,
      courseCode: creditCourseCode,
      credits,
    } = parseCredit(
      creditGroup,
      anonymizationSalt,
      courseCode,
      studentNumberToSrElementsMap[creditGroup.at(0)?.student_studentnumber ?? 0] ?? []
    )

    counter.markStudyProgramme(
      studentNumber,
      yearCode,
      passed,
      credits,
      programme.code,
      programme.name,
      programme.facultyCode,
      programme.organization
    )

    const groupCode = separate ? semesterCode : yearCode
    const groupName = separate ? semesterName : yearName
    counter.markCreditToGroup(studentNumber, passed, grade, groupCode, groupName, creditCourseCode, yearCode)
    counter.markCreditToStudentCategories(studentNumber, attainmentDate, groupCode)
  }

  for (const enrollments of enrollmentGroups) {
    if (!enrollments?.length) continue

    for (const enrollment of enrollments) {
      const {
        studentNumber,
        semesterCode,
        semesterName,
        yearCode,
        yearName,
        courseCode: enrollmentCourseCode,
        enrollmentDateTime,
      } = parseEnrollment(enrollment, anonymizationSalt)

      const groupCode = separate ? semesterCode : yearCode
      const groupName = separate ? semesterName : yearName

      counter.markEnrollmentToGroup(
        studentNumber,
        enrollmentDateTime,
        groupCode,
        groupName,
        enrollmentCourseCode,
        yearCode
      )
    }
  }

  const statistics = await counter.getFinalStatistics(anonymizationSalt)

  const substitutionGroups: Pick<CourseModel, 'code' | 'name'>[][] =
    combineSubstitutions && course?.substitution_groups?.length
      ? await getSubstitutionGroupDetails(course.substitution_groups)
      : [[{ code: course!.code, name: course!.name }]]

  return {
    ...statistics,
    coursecode: courseCode,
    alternatives: substitutionGroups,
    name: course?.name,
  }
}

export const maxYearsToCreatePopulationFrom = async (courseCodes: string[], unification: Unification) => {
  const lastAttainmentDate = (await CourseModel.findOne({
    attributes: [[dbFn('MAX', dbCol('max_attainment_date')), 'date']],
    where: {
      code: { [Op.in]: courseCodes },
    },
    raw: true,
  })) as { date: Date } | null

  if (lastAttainmentDate?.date == null) return 0

  const newestAttainmentDate = lastAttainmentDate?.date.getFullYear()
  const attainmentDateThreshold = new Date(newestAttainmentDate - 6, 0, 1)

  const attainmentsWithinThreshold = await CreditModel.count({
    where: {
      course_code: { [Op.in]: courseCodes },
      attainment_date: { [Op.gt]: attainmentDateThreshold },
      is_open: getIsOpen(unification),
    },
  })

  // MAGIC NUMBER
  const maxAllowedAttainments = 1000000 // * Lower this value to get a smaller result if necessary
  return Math.max(1, maxAllowedAttainments / attainmentsWithinThreshold)
}

export const getCourseYearlyStats = async (
  courseCodes: string[],
  separate: boolean,
  anonymizationSalt: string | null,
  combineSubstitutions: boolean
) => {
  const [credits, enrollments] = await Promise.all([
    CreditModel.findAll({
      attributes: ['student_studentnumber'],
      where: { course_code: { [Op.in]: courseCodes } },
    }),
    EnrollmentModel.findAll({
      attributes: ['studentnumber'],
      where: {
        course_code: {
          [Op.in]: courseCodes,
        },
        state: EnrollmentState.ENROLLED,
      },
    }),
  ])

  const studentNumbers = new Set<string>()

  credits.forEach(credit => {
    studentNumbers.add(credit.student_studentnumber)
  })

  enrollments.forEach(enrollment => {
    studentNumbers.add(enrollment.studentnumber)
  })

  const studentNumberToSrElementsMap = await getStudentNumberToSrElementsMap([...studentNumbers])

  const statsRegular = await Promise.all(
    courseCodes.map(async courseCode => {
      const course: Pick<CourseModel, 'code' | 'name' | 'substitution_groups'> | null = await CourseModel.findOne({
        attributes: ['code', 'name', 'substitution_groups'],
        where: { code: courseCode },
      })

      if (!course) {
        logger.error('Course for course stats not found with code' + courseCode)
        return []
      }

      const [openStats, regularStats, unifyStats] = await Promise.all([
        getYearlyStatsOfNew(
          course,
          courseCode,
          separate,
          Unification.OPEN,
          anonymizationSalt,
          combineSubstitutions,
          studentNumberToSrElementsMap
        ),
        getYearlyStatsOfNew(
          course,
          courseCode,
          separate,
          Unification.REGULAR,
          anonymizationSalt,
          combineSubstitutions,
          studentNumberToSrElementsMap
        ),
        getYearlyStatsOfNew(
          course,
          courseCode,
          separate,
          Unification.UNIFY,
          anonymizationSalt,
          combineSubstitutions,
          studentNumberToSrElementsMap
        ),
      ])

      return { unifyStats, regularStats, openStats }
    })
  )

  return statsRegular
}

export const getCourseProvidersForCourses = async (codes: string[]) => {
  return (
    await OrganizationModel.findAll({
      attributes: ['code'],
      include: {
        model: CourseModel,
        where: {
          code: {
            [Op.in]: codes,
          },
        },
      },
      raw: true,
    })
  ).map(({ code }) => code)
}

export const getCourseDetails = async (codes: string[]) =>
  CourseModel.findAll({
    attributes: ['code', 'name', 'substitution_groups'],
    where: { code: { [Op.in]: codes } },
    raw: true,
  })

// Add all substitution_groups and coursecodes together
export const searchAndCombineSubstitutionGroupsToCodes = async (coursecodes: string[]) => {
  const substitutionGroups = await CourseModel.findAll({
    raw: true,
    attributes: ['substitution_groups'],
    where: {
      code: { [Op.in]: coursecodes },
    },
  })

  return [
    ...new Set(
      coursecodes.concat(
        substitutionGroups.flatMap(({ substitution_groups }) => substitution_groups.flatMap(code => code))
      )
    ),
  ]
}
