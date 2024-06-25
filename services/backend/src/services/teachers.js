const { Op } = require('sequelize')

const {
  dbConnections: { sequelize },
} = require('../database/connection')
const { Credit, Course, Semester, Teacher } = require('../models')
const { splitByEmptySpace } = require('../util')

const likefy = term => `%${term}%`

const nameLike = terms => ({
  name: {
    [Op.and]: terms.map(term => ({ [Op.iLike]: likefy(term) })),
  },
})

const matchesId = searchTerm => ({ id: { [Op.eq]: searchTerm } })

const bySearchTerm = async rawTerm => {
  const searchTerm = rawTerm.trim()
  if (!searchTerm) {
    return []
  }
  const terms = splitByEmptySpace(searchTerm)
  return Teacher.findAll({
    attributes: {
      exclude: ['createdAt', 'updatedAt'],
    },
    where: {
      [Op.or]: [nameLike(terms), matchesId(searchTerm)],
    },
  })
}

const findTeacherCredits = teacherid =>
  Teacher.findByPk(teacherid, {
    attributes: ['name', 'id'],
    include: {
      model: Credit,
      attributes: ['credits', 'grade', 'id', 'student_studentnumber', 'credittypecode', 'isStudyModule'],
      include: [
        {
          model: Course,
          attributes: ['name', 'code'],
          required: true,
        },
        {
          model: Semester,
          attributes: ['semestercode', 'name', 'yearname', 'yearcode'],
        },
      ],
    },
  })

const parseCreditInfo = credit => ({
  credits: credit.credits,
  transferred: credit.credittypecode === 9,
  passed: Credit.passed(credit) || Credit.improved(credit),
  failed: Credit.failed(credit),
  course: credit.course,
  semester: credit.semester,
})

const markCredit = (stats, passed, failed, credits, transferred) => {
  if (!stats) {
    stats = { passed: 0, failed: 0, credits: 0, transferred: 0 }
  }
  if (passed) {
    stats.credits = transferred ? stats.credits : stats.credits + credits
    stats.passed += 1
    stats.transferred = transferred ? stats.transferred + credits : stats.transferred
  } else if (failed) {
    stats.failed += 1
  }

  return stats
}

const parseAndMarkCredit = (stats, key, credit) => {
  const { passed, failed, credits, transferred } = parseCreditInfo(credit)
  return {
    ...stats,
    [key]: markCredit(stats[key], passed, failed, credits, transferred),
  }
}

const markCreditForSemester = (semesters, credit) => {
  const { passed, failed, credits, semester, transferred } = parseCreditInfo(credit)
  const { semestercode, name } = semester
  const { stats, ...rest } = semesters[semestercode] || { id: semestercode, name }
  return {
    ...semesters,
    [semestercode]: {
      ...rest,
      stats: markCredit(stats, passed, failed, credits, transferred),
    },
  }
}

const markCreditForYear = (years, credit) => {
  const { passed, failed, credits, semester, transferred } = parseCreditInfo(credit)
  const { yearcode, yearname } = semester
  const { stats, ...rest } = years[yearcode] || { id: yearcode, name: yearname }
  return {
    ...years,
    [yearcode]: {
      ...rest,
      stats: markCredit(stats, passed, failed, credits, transferred),
    },
  }
}

const markCreditForCourse = (courses, credit) => {
  const { passed, failed, credits, course, semester, transferred } = parseCreditInfo(credit)
  const { code, name } = course
  const { semestercode } = semester
  const { stats, semesters = {}, ...rest } = courses[code] || { id: code, name }
  return {
    ...courses,
    [code]: {
      ...rest,
      semesters: parseAndMarkCredit(semesters, semestercode, credit, transferred),
      stats: markCredit(stats, passed, failed, credits, transferred),
    },
  }
}

const isRegularCourse = credit => !credit.isStudyModule

const teacherStats = async teacherid => {
  const teacher = await findTeacherCredits(teacherid)
  const statistics = teacher.credits.filter(isRegularCourse).reduce(
    ({ semesters, years, courses, ...rest }, credit) => ({
      ...rest,
      semesters: markCreditForSemester(semesters, credit),
      years: markCreditForYear(years, credit),
      courses: markCreditForCourse(courses, credit),
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

const getActiveTeachers = async (providers, startSemester, endSemester) => {
  const [result] = await sequelize.query(
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
    { replacements: { providers, startSemester, endSemester } }
  )
  return result.map(({ id }) => id)
}

const getTeacherCredits = async (teacherIds, startSemester, endSemester) => {
  const [result] = await sequelize.query(
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
    { replacements: { teacherIds, startSemester, endSemester } }
  )
  return result.reduce((acc, { name, id, passed, failed, transferred, credits }) => {
    acc[id] = { name, id, stats: { passed, failed, transferred, credits } }
    return acc
  }, {})
}

const yearlyStatistics = async (providers, startSemester, endSemester) => {
  const ids = await getActiveTeachers(providers, startSemester, endSemester)
  const teacherCredits = await getTeacherCredits(ids, startSemester, endSemester)
  return teacherCredits
}

module.exports = {
  bySearchTerm,
  teacherStats,
  yearlyStatistics,
}
