import { Op, QueryTypes } from 'sequelize'

import { Credit } from '@oodikone/shared/models'
import { Name, CreditTypeCode } from '@oodikone/shared/types'
import { splitByEmptySpace } from '@oodikone/shared/util'
import { dbConnections } from '../../database/connection'
import { CreditModel, CourseModel, SemesterModel, TeacherModel } from '../../models'
import { isRegularCourse, TeacherStats } from './helpers'

export const getTeachersBySearchTerm = async (searchTerm: string) => {
  if (!searchTerm) {
    return []
  }
  const searchTerms = splitByEmptySpace(searchTerm).filter(term => !!term.length)
  return TeacherModel.findAll({
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
    },
    where: {
      name: {
        [Op.and]: searchTerms.map(term => ({ [Op.iLike]: `%${term}%` })),
      },
    },
  })
}

const findTeacherCredits = async (teacherId: string) => {
  return await TeacherModel.findByPk(teacherId, {
    attributes: ['name', 'id'],
    include: {
      model: CreditModel,
      attributes: ['credits', 'grade', 'id', 'student_studentnumber', 'credittypecode', 'isStudyModule'],
      include: [
        {
          model: CourseModel,
          attributes: ['name', 'code'],
          required: true,
        },
        {
          model: SemesterModel,
          attributes: ['semestercode', 'name', 'yearname', 'yearcode'],
        },
      ],
    },
  })
}

const parseCreditInfo = (credit: Credit) => ({
  credits: credit.credits,
  transferred: credit.credittypecode === CreditTypeCode.APPROVED,
  passed: CreditModel.passed(credit) || CreditModel.improved(credit),
  failed: CreditModel.failed(credit),
  course: credit.course,
  semester: credit.semester,
})

type Stats = { credits: number; passed: number; failed: number; transferred: number }

const markCredit = (paramStats: Stats, credits: number, passed: boolean, failed: boolean, transferred: boolean) => {
  const stats = paramStats ?? { credits: 0, passed: 0, failed: 0, transferred: 0 }
  if (passed) {
    stats.credits = transferred ? stats.credits : stats.credits + credits
    stats.passed += 1
    stats.transferred = transferred ? stats.transferred + credits : stats.transferred
  } else if (failed) {
    stats.failed += 1
  }
  return stats
}

const parseAndMarkCredit = (stats: Record<number, any>, semesterCode: number, credit: Credit) => {
  const { passed, failed, credits, transferred } = parseCreditInfo(credit)
  return {
    ...stats,
    [semesterCode]: markCredit(stats[semesterCode], credits, passed, failed, transferred),
  }
}

const markCreditForSemester = (semesters: Record<string, { id: number; name: Name; stats: Stats }>, credit: Credit) => {
  const { passed, failed, credits, semester, transferred } = parseCreditInfo(credit)
  const { semestercode, name } = semester
  const { stats, ...rest } = semesters[semestercode] || { id: semestercode, name }
  return {
    ...semesters,
    [semestercode]: {
      ...rest,
      stats: markCredit(stats, credits, passed, failed, transferred),
    },
  }
}

const markCreditForYear = (years: Record<number, any>, credit: Credit) => {
  const { passed, failed, credits, semester, transferred } = parseCreditInfo(credit)
  const { yearcode, yearname } = semester
  const { stats, ...rest } = years[yearcode] ?? { id: yearcode, name: yearname }
  return {
    ...years,
    [yearcode]: {
      ...rest,
      stats: markCredit(stats, credits, passed, failed, transferred),
    },
  }
}

const markCreditForCourse = (courses: Record<string, any>, credit: Credit) => {
  const { passed, failed, credits, course, semester, transferred } = parseCreditInfo(credit)
  const { code, name } = course
  const { semestercode } = semester
  const { stats, semesters = {}, ...rest } = courses[code] ?? { id: code, name }
  return {
    ...courses,
    [code]: {
      ...rest,
      semesters: parseAndMarkCredit(semesters, semestercode, credit),
      stats: markCredit(stats, credits, passed, failed, transferred),
    },
  }
}

export const getTeacherStatistics = async (teacherId: string) => {
  const teacher = await findTeacherCredits(teacherId)
  if (!teacher) {
    return null
  }
  const statistics = teacher.credits.filter(isRegularCourse).reduce(
    ({ semesters, years, courses, ...rest }, credit) => ({
      ...rest,
      semesters: markCreditForSemester(semesters, credit),
      courses: markCreditForCourse(courses, credit),
      years: markCreditForYear(years, credit),
    }),
    {
      semesters: {},
      courses: {},
      years: {},
    }
  )
  return {
    name: teacher.name,
    id: teacher.id,
    statistics,
  }
}

const getActiveTeachers = async (providers: string[], startSemester: number, endSemester: number) => {
  const queryResult: Array<{ id: string }> = await dbConnections.sequelize.query(
    `
    SELECT DISTINCT teacher.id
    FROM teacher
    JOIN credit_teachers ON teacher.id = credit_teachers.teacher_id
    JOIN credit ON credit.id = credit_teachers.credit_id
    JOIN course ON credit.course_id = course.id
    JOIN course_providers ON course.id = course_providers.coursecode
    JOIN organization ON organization.id = course_providers.organizationcode
    WHERE credit.semestercode BETWEEN :startSemester AND :endSemester
      AND organization.code IN (:providers)
      AND teacher.id NOT LIKE 'hy-hlo-org%'
    `,
    {
      replacements: { providers, startSemester, endSemester },
      type: QueryTypes.SELECT,
    }
  )
  return queryResult.map(({ id }) => id)
}

type TeacherCredits = Record<
  string,
  {
    name: string
    id: string
    stats: {
      passed: number
      failed: number
      transferred: number
      credits: number
    }
  }
>

const getTeacherCredits = async (teacherIds: string[], startSemester: number, endSemester: number) => {
  const queryResult: Array<TeacherStats> = await dbConnections.sequelize.query(
    `
    SELECT teacher.name,
      teacher.id,
      COUNT(CASE WHEN credit.credittypecode IN (4, 7, 9) THEN 1 END)::INTEGER AS passed,
      COUNT(CASE WHEN credit.credittypecode = 10 THEN 1 END)::INTEGER AS failed,
      SUM(CASE WHEN credit.credittypecode = 9 THEN credit.credits ELSE 0 END)::INTEGER AS transferred,
      SUM(CASE WHEN credit.credittypecode IN (4, 7) THEN credit.credits ELSE 0 END)::INTEGER AS credits
    FROM teacher
    JOIN credit_teachers ON teacher.id = credit_teachers.teacher_id
    JOIN credit ON credit.id = credit_teachers.credit_id
    WHERE credit.semestercode BETWEEN :startSemester AND :endSemester
      AND credit."isStudyModule" = false
      AND teacher.id IN (:teacherIds)
    GROUP BY teacher.name,
      teacher.id
    `,
    {
      replacements: { teacherIds, startSemester, endSemester },
      type: QueryTypes.SELECT,
    }
  )
  return queryResult.reduce((acc, { name, id, passed, failed, transferred, credits }) => {
    acc[id] = { name, id, stats: { passed, failed, transferred, credits } }
    return acc
  }, {} as TeacherCredits)
}

export const getYearlyStatistics = async (
  providers: string[],
  startSemester: number,
  endSemester: number = startSemester + 1
) => {
  const teacherIds = await getActiveTeachers(providers, startSemester, endSemester)
  if (!teacherIds || teacherIds.length === 0) {
    return {}
  }
  const teacherCredits = await getTeacherCredits(teacherIds, startSemester, endSemester)
  return teacherCredits
}
