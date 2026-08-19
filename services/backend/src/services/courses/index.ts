import crypto from 'crypto'
import { Op } from 'sequelize'

import { Credit, Enrollment } from '@oodikone/shared/models'
import { Name, EnrollmentState, Unification } from '@oodikone/shared/types'
import { enrollmentTimeDateThreshold, getSemesterCodeAt, yearCodeToYear, yearToYearCode } from '@oodikone/shared/util'
import { dateIsBetween } from '@oodikone/shared/util/datetime'
import logger from '../../../src/util/logger'
import { CourseModel, CreditModel, EnrollmentModel, OrganizationModel, SISStudyRightElementModel } from '../../models'
import { now } from '../../util/clock'
import { getSemestersAndYears, SemestersAndYears } from '../semesters'
import { CourseYearlyStatsCounter } from './courseYearlyStatsCounter'
import {
  getCreditsForCourses,
  getEnrollmentsForCourses,
  getStudentNumberToSrElementsMap,
} from './creditsAndEnrollmentsOfCourse'
import { FormattedProgramme } from './helpers'
import { CourseYearlyStats } from '@oodikone/shared/types/courseYearlyStats'

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

  // TODO: Calculate substitutions correctly once course_unit_realisation hits
  const attainment =
    creditGroup
      .sort((a, b) => b.attainment_date.getTime() - a.attainment_date.getTime()) // desc
      .find(credit => CreditModel.passed(credit)) ??
    creditGroup.find(credit => CreditModel.failed(credit)) ??
    creditGroup.at(0)!

  const courseCode = singleCourse ? attainment.course_code : mainCourseCode
  const grade = singleCourse ? attainment.grade : 'substituted'
  const credits = singleCourse ? attainment.credits : creditGroup.reduce((acc, credit) => acc + credit.credits, 0)

  const {
    semester,
    attainment_date: attainmentDate,
    student_studentnumber: studentNumber,
    studyright_id: studyRightId,
  } = attainment

  const { yearcode: yearCode, yearname: yearName, semestercode: semesterCode, name: semesterName } = semester

  const programmeOfCredit: SISStudyRightElementModel | undefined =
    studyRightElements.find(studyRightElement => studyRightElement.studyRightId === studyRightId) ??
    studyRightElements
      .filter(({ startDate, endDate }) => dateIsBetween(attainmentDate, startDate, endDate))
      .sort((a, b) => (b.endDate?.getTime() ?? 0) - (a.endDate?.getTime() ?? 0))
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
    passed: singleCourse ? !CreditModel.failed(attainment) : true,
    studentNumber: anonymizationSalt ? anonymizeStudentNumber(studentNumber, anonymizationSalt) : studentNumber,
    programme,
    credits,
  }
}

type FormattedEnrollment = {
  courseCode: string
  enrollmentDateTime: Date
  programme: FormattedProgramme
  studentNumber: string
}

const parseEnrollment = (
  enrollment: Enrollment,
  anonymizationSalt: string | null,
  studyRightElements: Array<SISStudyRightElementModel>
): FormattedEnrollment => {
  const {
    studentnumber: studentNumber,
    enrollment_date_time: enrollmentDateTime,
    course_code: courseCode,
    studyright_id: studyRightId,
  } = enrollment

  const programmeOfEnrollment: SISStudyRightElementModel | undefined =
    studyRightElements.find(studyRightElement => studyRightElement.studyRightId === studyRightId) ??
    studyRightElements
      .filter(({ startDate, endDate }) => dateIsBetween(enrollmentDateTime, startDate, endDate))
      .sort((a, b) => b.startDate?.getTime() - a.startDate?.getTime())
      .at(0) // The newest studyRightElement

  const programme = programmeOfEnrollment
    ? formatStudyRightElement(programmeOfEnrollment)
    : {
        code: 'OTHER',
        name: { en: 'Other', fi: 'Muu', sv: 'Andra' },
        facultyCode: 'OTHER',
        organization: { name: { en: 'Other', fi: 'Muu', sv: 'Andra' } },
      }

  return {
    courseCode,
    enrollmentDateTime,
    programme,
    studentNumber: anonymizationSalt ? anonymizeStudentNumber(studentNumber, anonymizationSalt) : studentNumber,
  }
}

const getSubstitutionGroupDetails = async (
  groupIdGroups: string[][]
): Promise<Pick<CourseModel, 'code' | 'name' | 'groupId'>[][]> => {
  const substitutionGroupDetails = await CourseModel.findAll({
    attributes: ['code', 'name', 'groupId'],
    where: {
      groupId: { [Op.in]: groupIdGroups.flatMap(group => group) },
      isPrimary: true,
    },
    raw: true,
  })

  return groupIdGroups.map(group =>
    group.map(groupId => substitutionGroupDetails.find(subCourse => subCourse.groupId === groupId)!)
  )
}

const getSemesterAndYearByDate = (
  date: Date,
  semesters: SemestersAndYears['semesters'],
  years: SemestersAndYears['years']
) => {
  const semesterCode = getSemesterCodeAt(semesters, date) ?? getSemesterCodeAt(semesters, now())!

  const semester = semesters[semesterCode]
  const year = years[semester.yearcode]

  return { year, semester }
}

const getYearlyStatsOfNew =
  (
    primaryCourse: Pick<CourseModel, 'id' | 'groupId' | 'code' | 'name' | 'substitutionGroups'>,
    separate: boolean,
    anonymizationSalt: string | null,
    substitutions: boolean,
    studentNumberToSrElementsMap: Record<string, SISStudyRightElementModel[]>,
    from: Date,
    to: Date
  ) =>
  async (unification: Unification): Promise<CourseYearlyStats['openStats']> => {
    const { groupId, name, code: courseCode } = primaryCourse

    // Includes main course code and substitutions (if enabled)
    const creditGroupIds = substitutions ? [[groupId]].concat(primaryCourse.substitutionGroups ?? []) : [[groupId]]

    const allCourseIds = (
      await CourseModel.findAll({
        raw: true,
        attributes: ['id'],
        where: { groupId: { [Op.in]: creditGroupIds.flat() } },
      })
    ).map(({ id }) => id)

    const { semesters, years } = await getSemestersAndYears()

    const [creditGroups, enrollmentGroups] = await Promise.all([
      getCreditsForCourses(creditGroupIds, allCourseIds, unification, from, to),
      getEnrollmentsForCourses(creditGroupIds, allCourseIds, unification, from, to),
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
      } = parseCredit(
        creditGroup,
        anonymizationSalt,
        primaryCourse.code,
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

      // Credits/attainments have quaranteed matching attainment_date and semesters/years
      const groupCode = separate ? semesterCode : yearCode
      const groupName = separate ? semesterName : yearName
      counter.markCreditToGroup(studentNumber, passed, grade, groupCode, groupName, creditCourseCode, yearCode)
      counter.markCreditToStudentCategories(studentNumber, attainmentDate, groupCode)
    }

    for (const enrollments of enrollmentGroups) {
      for (const enrollment of enrollments) {
        const {
          studentNumber,
          courseCode: enrollmentCourseCode,
          enrollmentDateTime,
          programme,
        } = parseEnrollment(
          enrollment,
          anonymizationSalt,
          studentNumberToSrElementsMap[enrollment.studentnumber ?? 0] ?? []
        )

        // Enrollments can have conflicting enrollment_date_time and semestercode, so we need to manually select
        // semestercode matching enrollment_date_time
        const { semester, year } = getSemesterAndYearByDate(enrollment.enrollment_date_time, semesters, years)

        counter.markStudyProgramme(
          studentNumber,
          year.yearcode,
          false, // passed
          0, // credits
          programme.code,
          programme.name,
          programme.facultyCode,
          programme.organization
        )

        const groupCode = separate ? semester.semestercode : year.yearcode
        const groupName = separate ? semester.name : year.yearname

        counter.markEnrollmentToGroup(
          studentNumber,
          enrollmentDateTime,
          groupCode,
          groupName,
          enrollmentCourseCode,
          year.yearcode
        )
      }
    }

    const statistics = await counter.getFinalStatistics(anonymizationSalt)

    const substitutionGroups =
      substitutions && primaryCourse.substitutionGroups?.length
        ? await getSubstitutionGroupDetails(primaryCourse.substitutionGroups)
        : [[{ code: courseCode, name, groupId }]]

    return {
      ...statistics,
      courseCode,
      groupId,
      substitutionGroups,
      name,
    }
  }

export const getCourseYearlyStats = async (
  courseGroupIds: string[],
  separate: boolean,
  anonymizationSalt: string | null,
  substitutions: boolean,
  fromYearCode = yearToYearCode(1950).toString(),
  toYearCode: string = yearToYearCode(now().getFullYear()).toString()
) => {
  // Default to 1900 - currentYear+1 so that without parameters the api returns stats for all years
  const from = new Date(`${yearCodeToYear(fromYearCode)}-08-01`) // FALL
  const to = new Date(`${yearCodeToYear(toYearCode) + 1}-07-31`) // SPRING next year

  const relevantCourseIds = (
    await CourseModel.findAll({
      attributes: ['id'],
      raw: true,
      where: {
        groupId: { [Op.in]: courseGroupIds },
      },
    })
  ).map(({ id }) => id)

  const [credits, enrollments] = await Promise.all([
    CreditModel.findAll({
      attributes: ['student_studentnumber'],
      raw: true,
      where: {
        course_id: { [Op.in]: relevantCourseIds },
        attainment_date: { [Op.between]: [from, to] },
      },
    }),
    EnrollmentModel.findAll({
      attributes: ['studentnumber'],
      raw: true,
      where: {
        course_id: {
          [Op.in]: relevantCourseIds,
        },
        state: EnrollmentState.ENROLLED,
        enrollment_date_time: {
          [Op.between]: [from, to],
          [Op.gte]: enrollmentTimeDateThreshold,
        },
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

  const stats = await Promise.all(
    courseGroupIds.map(async groupId => {
      const primaryCourse: Pick<CourseModel, 'id' | 'groupId' | 'code' | 'name' | 'substitutionGroups'> | null =
        await CourseModel.findOne({
          raw: true,
          attributes: ['groupId', 'id', 'code', 'name', 'substitutionGroups'],
          where: { groupId, isPrimary: true },
        })

      if (!primaryCourse) {
        logger.error(`Primary course for course stats not found for: ${groupId}`)
        return {}
      }

      const getYearlyStatsOfUnification = getYearlyStatsOfNew(
        primaryCourse,
        separate,
        anonymizationSalt,
        substitutions,
        studentNumberToSrElementsMap,
        from,
        to
      )

      const [openStats, regularStats, unifyStats] = await Promise.all([
        getYearlyStatsOfUnification(Unification.OPEN),
        getYearlyStatsOfUnification(Unification.REGULAR),
        getYearlyStatsOfUnification(Unification.UNIFY),
      ])

      return { unifyStats, regularStats, openStats }
    })
  )

  return stats as CourseYearlyStats[]
}

export const getCourseProvidersForCourses = async (courseIds: string[]) =>
  (
    await OrganizationModel.findAll({
      attributes: ['code'],
      include: {
        model: CourseModel,
        where: {
          id: {
            [Op.in]: courseIds,
          },
        },
      },
      raw: true,
    })
  ).map(({ code }) => code)

export const getCourseDetails = async (courseGroupIds: string[]) =>
  CourseModel.findAll({
    attributes: ['id', 'groupId', 'code', 'name', 'substitutionGroups', 'isStudyModule'],
    where: { groupId: { [Op.in]: courseGroupIds }, isPrimary: true },
    raw: true,
  })

/** First gets all unique groupIds from main course and substitutions (if enabled)
 * Then returns an id-groupId map for all courses that match above groupId
 */
export const getRelevantCourseIdMap = async (courseGroupIds: string[], substitutions: boolean) => {
  const combinedGroupIds = substitutions
    ? [
        ...new Set(
          (
            await CourseModel.findAll({
              raw: true,
              attributes: ['groupId', 'substitutionGroups'],
              where: {
                groupId: { [Op.in]: courseGroupIds },
              },
            })
          )
            .flatMap(({ groupId, substitutionGroups }) => [groupId, substitutionGroups])
            .flat(2)
        ),
      ]
    : courseGroupIds

  const idToGroupIdMap = (
    await CourseModel.findAll({
      raw: true,
      attributes: ['id', 'groupId'],
      where: {
        groupId: { [Op.in]: combinedGroupIds },
      },
    })
  ).reduce<Record<string, string>>((acc, { id, groupId }) => {
    acc[id] = groupId
    return acc
  }, {})

  return idToGroupIdMap
}
