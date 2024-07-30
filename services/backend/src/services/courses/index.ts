/* eslint-disable @typescript-eslint/naming-convention */
import crypto from 'crypto'
import { Op } from 'sequelize'

import { Course, Credit, Enrollment, Organization, SISStudyRightElement } from '../../models'
import { isOpenUniCourseCode } from '../../util'
import { getSortRank } from '../../util/sortRank'
import { CourseYearlyStatsCounter } from './courseYearlyStatsCounter'
import {
  creditsForCourses,
  enrollmentsForCourses,
  getStudentNumberToSrElementsMap,
} from './creditsAndEnrollmentsOfCourse'
import { getIsOpen, Unification } from './helpers'

const sortMainCode = (codes: string[]) => {
  if (!codes) {
    return []
  }
  return codes.sort((a, b) => getSortRank(b) - getSortRank(a))
}

const formatStudyRightElement = ({ code, name, startDate, studyRight }) => ({
  code,
  name,
  startDate,
  facultyCode: studyRight.facultyCode || null,
  organization: studyRight.organization
    ? {
        name: studyRight.organization.name,
        code: studyRight.organization.code,
      }
    : null,
})

const anonymizeStudentNumber = (studentNumber: string, anonymizationSalt: string) => {
  return crypto.createHash('sha256').update(`${studentNumber}${anonymizationSalt}`).digest('hex')
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

  const formattedCredit: Record<string, any> = {
    yearCode,
    yearName,
    semesterCode,
    semesterName,
    attainmentDate,
    courseCode,
    grade,
    passed: !Credit.failed(credit) || Credit.passed(credit) || Credit.improved(credit),
    studentNumber,
    programmes: studyRightElements.map(formatStudyRightElement),
    credits,
  }

  if (anonymizationSalt) {
    formattedCredit.obfuscated = true
    formattedCredit.studentnumber = anonymizeStudentNumber(studentNumber, anonymizationSalt)
  }

  return formattedCredit
}

const parseEnrollment = (
  enrollment: Enrollment,
  anonymizationSalt: string | null,
  studentNumberToSrElementsMap: Record<string, SISStudyRightElement[]>
) => {
  const {
    studentnumber: studentNumber,
    semester,
    state,
    enrollment_date_time: enrollmentDateTime,
    course_code: courseCode,
  } = enrollment
  const { yearcode: yearCode, yearname: yearName, semestercode: semesterCode, name: semesterName } = semester

  const studyRightElements = studentNumberToSrElementsMap[studentNumber] || []

  const formattedEnrollment: Record<string, any> = {
    yearCode,
    yearName,
    semesterCode,
    semesterName,
    courseCode,
    state,
    enrollmentDateTime,
    studentNumber,
    programmes: studyRightElements.map(formatStudyRightElement),
  }

  if (anonymizationSalt) {
    formattedEnrollment.obfuscated = true
    formattedEnrollment.studentnumber = anonymizeStudentNumber(studentNumber, anonymizationSalt)
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
    creditsForCourses(codes, unification),
    enrollmentsForCourses(codes, unification),
    Course.findOne({
      where: {
        code: courseCode,
      },
    }),
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
      programmes,
      courseCode,
      credits,
    } = parseCredit(credit, anonymizationSalt, studentNumberToSrElementsMap)

    const groupCode = separate ? semesterCode : yearCode
    const groupName = separate ? semesterName : yearName
    const unknownProgramme = [
      {
        code: 'OTHER',
        name: {
          en: 'Other',
          fi: 'Muu',
          sv: 'Andra',
        },
        faculty_code: 'OTHER',
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
    counter.markCreditToStudentCategories(studentNumber, passed, attainmentDate, groupCode)
  }

  enrollments.forEach(enrollment => {
    const { studentNumber, semesterCode, semesterName, yearCode, yearName, courseCode, state, enrollmentDateTime } =
      parseEnrollment(enrollment, anonymizationSalt, studentNumberToSrElementsMap)

    const groupCode = separate ? semesterCode : yearCode
    const groupName = separate ? semesterName : yearName

    counter.markEnrollmentToGroup(studentNumber, state, enrollmentDateTime, groupCode, groupName, courseCode, yearCode)
  })

  const statistics = counter.getFinalStatistics(anonymizationSalt)

  return {
    ...statistics,
    courseCode,
    alternatives: codes,
    name: course?.name,
  }
}

export const maxYearsToCreatePopulationFrom = async (courseCodes: string[], unification: Unification) => {
  const is_open = getIsOpen(unification)

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
      is_open,
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
    where: { course_code: { [Op.in]: courseCodes } },
  })

  const studentNumbers = {}

  credits.forEach(credit => {
    studentNumbers[credit.student_studentnumber] = true
  })
  enrollments.forEach(enrollment => {
    studentNumbers[enrollment.studentnumber] = true
  })

  const studentNumberToSrElementsMap = await getStudentNumberToSrElementsMap(Object.keys(studentNumbers))

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
