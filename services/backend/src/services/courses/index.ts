import crypto from 'crypto'
import { Op, fn as dbFn, col as dbCol } from 'sequelize'

import { Name, EnrollmentState, Unification } from '@oodikone/shared/types'
import { dateIsBetween } from '@oodikone/shared/util/datetime'
import { CourseModel, CreditModel, EnrollmentModel, OrganizationModel, SISStudyRightElementModel } from '../../models'
import { isOpenUniCourseCode } from '../../util'
import { getSortRank } from '../../util/sortRank'
import { CourseYearlyStatsCounter } from './courseYearlyStatsCounter'
import {
  getCreditsForCourses,
  getEnrollmentsForCourses,
  getStudentNumberToSrElementsMap,
} from './creditsAndEnrollmentsOfCourse'
import { FormattedProgramme, getIsOpen } from './helpers'
import { Credit } from '@oodikone/shared/models'

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

const isSingleCredit = (creditGroup: Credit[]): boolean => creditGroup.length === 1

const parseCredit = (
  creditGroup: Credit[],
  anonymizationSalt: string | null,
  mainCourseCode: string,
  studyRightElements: Array<SISStudyRightElementModel>
): FormattedCredit => {
  // if (creditGroup.length === 0)
  //   return null

  // The first credit by attainment_date which is used to derive semester, student number and studyright
  const credit = isSingleCredit(creditGroup) ? creditGroup.at(0)! : creditGroup.sort((a, b) => b.attainment_date > a.attainment_date ? 1 : -1).at(0)!

  const {
    semester,
    course_code: courseCode, // HACK: this might not work
    attainment_date: attainmentDate,
    student_studentnumber: studentNumber,
    studyright_id: studyRightId,
  } = credit

  const credits = isSingleCredit(creditGroup) ? credit.credits : creditGroup.reduce((acc, credit) => acc + credit.credits, 0)
  const grade = isSingleCredit(creditGroup) ? credit.grade : "substituted" // HACK: Not sure if this will work

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
    passed: isSingleCredit(creditGroup) ? CreditModel.passed(credit) : true,
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

const parseEnrollment = (enrollment: EnrollmentModel, anonymizationSalt: string | null): FormattedEnrollment => {
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
    attributes: ["code", "name"],
    where: {
      code: { [Op.in]: codeGroups.flatMap(group => group) }
    },
    raw: true
  })

  return codeGroups.map(group => group.map(code => substitutionGroupDetails.find(subCourse => subCourse.code === code)!))
}

const getYearlyStatsOfNew = async (
  course: Pick<CourseModel, 'code' | 'name' | 'substitutions' | 'substitution_groups'> | null,
  courseCode: string,
  separate: boolean,
  unification: Unification,
  anonymizationSalt: string | null,
  combineSubstitutions: boolean,
  studentNumberToSrElementsMap: Record<string, SISStudyRightElementModel[]>
) => {
  // Includes main course code and substitutions (if enabled)
  const creditGroupCodes = (combineSubstitutions && course?.substitution_groups) ? course.substitution_groups.concat([[courseCode]]) : [[courseCode]]

  let filteredCreditGroupCodes: string[][]
  switch (unification) {
    case Unification.REGULAR:
      // Include only course codes / group of course codes WITHOUT ANY AY prefix
      filteredCreditGroupCodes = creditGroupCodes.filter(group => !group.some(course => isOpenUniCourseCode(course)))
      break
    case Unification.OPEN:
      // Include only courses / group of courses WITH ONLY AY  prefix
      filteredCreditGroupCodes = creditGroupCodes.filter(group => group.every(course => isOpenUniCourseCode(course)))
      break
    case Unification.UNIFY:
    default:
      filteredCreditGroupCodes = creditGroupCodes
      break
  }

  const [creditGroups, enrollments] = await Promise.all([
    getCreditsForCourses(filteredCreditGroupCodes, unification),
    getEnrollmentsForCourses(courseCode, unification),
  ])

  const counter = new CourseYearlyStatsCounter()

  for (const creditGroup of creditGroups) {
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
    } = parseCredit(creditGroup, anonymizationSalt, courseCode, studentNumberToSrElementsMap[creditGroup.at(0)?.student_studentnumber ?? 0] ?? [])

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

  for (const enrollment of enrollments) {
    const { studentNumber, semesterCode, semesterName, yearCode, yearName, courseCode, enrollmentDateTime } =
      parseEnrollment(enrollment, anonymizationSalt)

    const groupCode = separate ? semesterCode : yearCode
    const groupName = separate ? semesterName : yearName

    counter.markEnrollmentToGroup(studentNumber, enrollmentDateTime, groupCode, groupName, courseCode, yearCode)
  }

  const statistics = await counter.getFinalStatistics(anonymizationSalt)

  const substitutionGroups: Pick<CourseModel, 'code' | 'name'>[][] =
    combineSubstitutions && course?.substitution_groups.length
      ? (await getSubstitutionGroupDetails(course.substitution_groups))
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

  if (lastAttainmentDate === null) return 0

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
      const course: Pick<CourseModel, 'code' | 'name' | 'substitutions' | 'substitution_groups'> | null = await CourseModel.findOne({
        attributes: ['code', 'name', 'substitutions', 'substitution_groups'],
        where: { code: courseCode },
      })

      if (!course) {
        return null
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

export const getCourseDetails = async (code: string) =>
  CourseModel.findOne({
    attributes: ['code', 'name'],
    where: { code },
    raw: true,
  })
