import crypto from 'crypto'
import { Op, fn as dbFn, col as dbCol } from 'sequelize'

import { Name, EnrollmentState, Unification } from '@oodikone/shared/types'
import { dateIsBetween } from '@oodikone/shared/util/datetime'
import { CourseModel, CreditModel, EnrollmentModel, OrganizationModel, SISStudyRightElementModel } from '../../models'
import { getOpenUniCourseCode } from '../../util'
import { getSortRank } from '../../util/sortRank'
import { CourseYearlyStatsCounter } from './courseYearlyStatsCounter'
import {
  getCreditsForCourses,
  getEnrollmentsForCourses,
  getStudentNumberToSrElementsMap,
} from './creditsAndEnrollmentsOfCourse'
import { FormattedProgramme, getIsOpen } from './helpers'

const sortMainCode = (codes: string[]) => {
  if (!codes) {
    return []
  }
  return codes.sort((a, b) => getSortRank(b) - getSortRank(a))
}

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

const parseCredit = (
  credit: CreditModel,
  anonymizationSalt: string | null,
  studyRightElements: Array<SISStudyRightElementModel>
): FormattedCredit => {
  const {
    semester,
    grade,
    course_code: courseCode,
    credits,
    attainment_date: attainmentDate,
    student_studentnumber: studentNumber,
    studyright_id: studyRightId,
  } = credit
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
    passed: !CreditModel.failed(credit),
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

const getYearlyStatsOfNew = async (
  courseCode: string,
  separate: boolean,
  unification: Unification,
  anonymizationSalt: string | null,
  combineSubstitutions: boolean,
  studentNumberToSrElementsMap: Record<string, SISStudyRightElementModel[]>
) => {
  const course: Pick<CourseModel, 'code' | 'name' | 'substitutions'> | null = await CourseModel.findOne({
    attributes: ['code', 'name', 'substitutions'],
    where: { code: courseCode },
  })

  const substitutedCodes =
    combineSubstitutions && course?.substitutions ? sortMainCode([...course.substitutions, courseCode]) : [courseCode]

  const codes =
    unification === Unification.REGULAR
      ? substitutedCodes.filter(course => !getOpenUniCourseCode(course))
      : substitutedCodes

  const [credits, enrollments] = await Promise.all([
    getCreditsForCourses(codes, unification),
    getEnrollmentsForCourses(codes, unification),
  ])

  const counter = new CourseYearlyStatsCounter()

  for (const credit of credits) {
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
      courseCode,
      credits,
    } = parseCredit(credit, anonymizationSalt, studentNumberToSrElementsMap[credit.student_studentnumber] ?? [])

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
    counter.markCreditToGroup(studentNumber, passed, grade, groupCode, groupName, courseCode, yearCode)
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

  const substitutionCourses: Pick<CourseModel, 'code' | 'name'>[] =
    combineSubstitutions && course?.substitutions?.length
      ? await CourseModel.findAll({
          where: {
            code: { [Op.in]: codes },
          },
          attributes: ['code', 'name'],
        })
      : [{ code: course!.code, name: course!.name }]

  return {
    ...statistics,
    coursecode: courseCode,
    alternatives: substitutionCourses,
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
      const [openStats, regularStats, unifyStats] = await Promise.all([
        getYearlyStatsOfNew(
          courseCode,
          separate,
          Unification.OPEN,
          anonymizationSalt,
          combineSubstitutions,
          studentNumberToSrElementsMap
        ),
        getYearlyStatsOfNew(
          courseCode,
          separate,
          Unification.REGULAR,
          anonymizationSalt,
          combineSubstitutions,
          studentNumberToSrElementsMap
        ),
        getYearlyStatsOfNew(
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
