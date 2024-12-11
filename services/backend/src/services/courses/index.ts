import crypto from 'crypto'
import { Op } from 'sequelize'

import { Name } from '@shared/types'
import { serviceProvider } from '../../config'
import { Course, Credit, Enrollment, Organization, SISStudyRightElement } from '../../models'
import { EnrollmentState, Unification } from '../../types'
import { isOpenUniCourseCode } from '../../util'
import logger from '../../util/logger'
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

const formatStudyRightElement = (studyRightElement: SISStudyRightElement): FormattedProgramme => ({
  code: studyRightElement.code,
  name: studyRightElement.name,
  startDate: studyRightElement.startDate,
  facultyCode: studyRightElement.studyRight.facultyCode || null,
  organization: studyRightElement.studyRight.organization
    ? {
        name: studyRightElement.studyRight.organization.name,
        code: studyRightElement.studyRight.organization.code,
      }
    : null,
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
  programmes: FormattedProgramme[]
  credits: number
  obfuscated?: boolean
}

const parseCredit = (
  credit: Credit,
  anonymizationSalt: string | null,
  studentNumberToSrElementsMap: Record<string, Array<SISStudyRightElement>>
) => {
  const {
    semester,
    grade,
    course_code: courseCode,
    credits,
    attainment_date: attainmentDate,
    student_studentnumber: studentNumber,
  } = credit
  const { yearcode: yearCode, yearname: yearName, semestercode: semesterCode, name: semesterName } = semester

  const studyRightElements = studentNumberToSrElementsMap[studentNumber] || []
  const programmes = studyRightElements.map(formatStudyRightElement)

  const formattedCredit: FormattedCredit = {
    yearCode,
    yearName,
    semesterCode,
    semesterName,
    attainmentDate,
    courseCode,
    grade,
    passed: !Credit.failed(credit) || Credit.passed(credit) || Credit.improved(credit),
    studentNumber,
    programmes,
    credits,
  }

  if (anonymizationSalt) {
    formattedCredit.obfuscated = true
    formattedCredit.studentNumber = anonymizeStudentNumber(studentNumber, anonymizationSalt)
  }

  return formattedCredit
}

type FormattedEnrollment = {
  yearCode: number
  yearName: string
  semesterCode: number
  semesterName: Name
  courseCode: string
  enrollmentDateTime: Date
  studentNumber: string
  programmes: Array<Record<string, any>>
  obfuscated?: boolean
}

const parseEnrollment = (
  enrollment: Enrollment,
  anonymizationSalt: string | null,
  studentNumberToSrElementsMap: Record<string, SISStudyRightElement[]>
) => {
  const {
    studentnumber: studentNumber,
    semester,
    enrollment_date_time: enrollmentDateTime,
    course_code: courseCode,
  } = enrollment
  const { yearcode: yearCode, yearname: yearName, semestercode: semesterCode, name: semesterName } = semester

  const studyRightElements = studentNumberToSrElementsMap[studentNumber] || []

  const formattedEnrollment: FormattedEnrollment = {
    yearCode,
    yearName,
    semesterCode,
    semesterName,
    courseCode,
    enrollmentDateTime,
    studentNumber,
    programmes: studyRightElements.map(formatStudyRightElement),
  }

  if (anonymizationSalt) {
    formattedEnrollment.obfuscated = true
    formattedEnrollment.studentNumber = anonymizeStudentNumber(studentNumber, anonymizationSalt)
  }

  return formattedEnrollment
}

const getYearlyStatsOfNew = async (
  courseCode: string,
  separate: boolean,
  unification: Unification,
  anonymizationSalt: string | null,
  combineSubstitutions: boolean,
  studentNumberToSrElementsMap: Record<string, SISStudyRightElement[]>
) => {
  if (serviceProvider === 'fd')
    logger.info(
      `Debugging c.y.s.: entered getYearlyStatsOfNew with courseCode ${courseCode} and unification ${unification}`
    )
  const courseForSubs = await Course.findOne({
    where: { code: courseCode },
  })

  let codes =
    combineSubstitutions && courseForSubs?.substitutions
      ? sortMainCode([...courseForSubs.substitutions, courseCode])
      : [courseCode]

  if (unification === Unification.REGULAR) {
    codes = codes.filter(course => !isOpenUniCourseCode(course))
  }

  const [credits, enrollments, course] = await Promise.all([
    getCreditsForCourses(codes, unification),
    getEnrollmentsForCourses(codes, unification),
    Course.findOne({
      where: {
        code: courseCode,
      },
    }),
  ])

  if (serviceProvider === 'fd')
    logger.info(
      `Debugging c.y.s., getYearlyStatsOfNew, courseCode ${courseCode} unification ${unification}: got credits ${credits.length}, enrollments ${enrollments.length} and course ${course ? 'yes' : 'no'}`
    )

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
      programmes,
      courseCode,
      credits,
    } = parseCredit(credit, anonymizationSalt, studentNumberToSrElementsMap)

    const groupCode = separate ? semesterCode : yearCode
    const groupName = separate ? semesterName : yearName
    const unknownProgramme: FormattedProgramme[] = [
      {
        code: 'OTHER',
        name: {
          en: 'Other',
          fi: 'Muu',
          sv: 'Andra',
        },
        facultyCode: 'OTHER',
        organization: {
          name: {
            en: 'Other',
            fi: 'Muu',
            sv: 'Andra',
          },
        },
      },
    ]
    counter.markStudyProgrammes(
      studentNumber,
      programmes.length === 0 ? unknownProgramme : programmes,
      yearCode,
      passed,
      credits
    )
    counter.markCreditToGroup(studentNumber, passed, grade, groupCode, groupName, courseCode, yearCode)
    counter.markCreditToStudentCategories(studentNumber, attainmentDate, groupCode)
  }

  enrollments.forEach(enrollment => {
    const { studentNumber, semesterCode, semesterName, yearCode, yearName, courseCode, enrollmentDateTime } =
      parseEnrollment(enrollment, anonymizationSalt, studentNumberToSrElementsMap)

    const groupCode = separate ? semesterCode : yearCode
    const groupName = separate ? semesterName : yearName

    counter.markEnrollmentToGroup(studentNumber, enrollmentDateTime, groupCode, groupName, courseCode, yearCode)
  })
  if (serviceProvider === 'fd')
    logger.info(
      `Debugging c.y.s., getYearlyStatsOfNew, code ${courseCode} unification ${unification}: finished looping through credits.`
    )

  const statistics = counter.getFinalStatistics(anonymizationSalt)

  if (serviceProvider === 'fd')
    logger.info(
      `Debugging c.y.s., getYearlyStatsOfNew, code ${courseCode} unification ${unification}: got final statistics.`
    )

  let substitutionCourses: Course[] | undefined
  if (combineSubstitutions && courseForSubs?.substitutions && courseForSubs.substitutions.length > 0) {
    substitutionCourses = await Course.findAll({
      where: {
        code: {
          [Op.in]: codes,
        },
      },
      attributes: ['code', 'name'],
    })
  }

  if (serviceProvider === 'fd')
    logger.info(
      `Debugging c.y.s., getYearlyStatsOfNew, code ${courseCode} unification ${unification}: got substitutionCourses ${substitutionCourses?.length} items.`
    )

  return {
    ...statistics,
    coursecode: courseCode,
    alternatives: substitutionCourses ?? [{ code: courseForSubs!.code, name: courseForSubs!.name }],
    name: course?.name,
  }
}

export const maxYearsToCreatePopulationFrom = async (courseCodes: string[], unification: Unification) => {
  const maxAttainmentDate = new Date(
    Math.max(
      ...(
        await Course.findAll({
          where: {
            code: {
              [Op.in]: courseCodes,
            },
          },
          attributes: ['max_attainment_date'],
        })
      ).map(course => new Date(course.max_attainment_date).getTime())
    )
  )

  const attainmentThreshold = new Date(maxAttainmentDate.getFullYear(), 0, 1)
  attainmentThreshold.setFullYear(attainmentThreshold.getFullYear() - 6)

  const credits = await Credit.findAll({
    where: {
      course_code: {
        [Op.in]: courseCodes,
      },
      attainment_date: {
        [Op.gt]: attainmentThreshold,
      },
      is_open: getIsOpen(unification),
    },
    order: [['attainment_date', 'ASC']],
  })

  const yearlyStudents = Object.values(
    credits.reduce(
      (res, credit) => {
        const attainmentYear = new Date(credit.attainment_date).getFullYear()
        if (!res[attainmentYear]) {
          res[attainmentYear] = 0
        }
        res[attainmentYear]++
        return res
      },
      {} as Record<number, number>
    )
  )

  // ? What should this be called?
  const magicNumber = 1200 // * Lower this value to get a smaller result if necessary
  const maxYearsToCreatePopulationFrom = Math.max(
    Math.floor(magicNumber / (yearlyStudents.reduce((acc, curr) => acc + curr, 0) / yearlyStudents.length)),
    1
  )

  return maxYearsToCreatePopulationFrom
}

export const getCourseYearlyStats = async (
  courseCodes: string[],
  separate: boolean,
  anonymizationSalt: string | null,
  combineSubstitutions: boolean
) => {
  const credits = await Credit.findAll({
    attributes: ['student_studentnumber'],
    where: { course_code: { [Op.in]: courseCodes } },
  })
  const enrollments = await Enrollment.findAll({
    attributes: ['studentnumber'],
    where: {
      course_code: {
        [Op.in]: courseCodes,
      },
      state: EnrollmentState.ENROLLED,
    },
  })

  if (serviceProvider === 'fd')
    logger.info(`Debugging c.y.s.: got credits ${credits.length} items and enrollments ${enrollments.length} items`)

  const studentNumbers = {}

  credits.forEach(credit => {
    studentNumbers[credit.student_studentnumber] = true
  })
  enrollments.forEach(enrollment => {
    studentNumbers[enrollment.studentnumber] = true
  })

  const studentNumberToSrElementsMap = await getStudentNumberToSrElementsMap(Object.keys(studentNumbers))

  if (serviceProvider === 'fd')
    logger.info(
      `Debugging c.y.s.: got a studentNumberToSrElementsMap of size ${Object.keys(studentNumberToSrElementsMap).length}`
    )

  const statsRegular = await Promise.all(
    courseCodes.map(async courseCode => {
      const unifyStats = await getYearlyStatsOfNew(
        courseCode,
        separate,
        Unification.UNIFY,
        anonymizationSalt,
        combineSubstitutions,
        studentNumberToSrElementsMap
      )
      const regularStats = await getYearlyStatsOfNew(
        courseCode,
        separate,
        Unification.REGULAR,
        anonymizationSalt,
        combineSubstitutions,
        studentNumberToSrElementsMap
      )
      const openStats = await getYearlyStatsOfNew(
        courseCode,
        separate,
        Unification.OPEN,
        anonymizationSalt,
        combineSubstitutions,
        studentNumberToSrElementsMap
      )

      return { unifyStats, regularStats, openStats }
    })
  )

  if (serviceProvider === 'fd') logger.info('Debugging c.y.s.: finished creating statsRegular')

  return statsRegular
}

export const getCourseProvidersForCourses = async (codes: string[]) => {
  return (
    await Organization.findAll({
      attributes: ['code'],
      include: {
        model: Course,
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
