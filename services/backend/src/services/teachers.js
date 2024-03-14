const { Op } = require('sequelize')
const { Teacher, Credit, Course, Semester, Organization } = require('../models')

const splitByEmptySpace = str => str.replace(/\s\s+/g, ' ').split(' ')

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
  studentnumber: credit.student_studentnumber,
  credits: credit.credits,
  transferred: credit.credittypecode === 9,
  grade: credit.grade,
  passed: Credit.passed(credit) || Credit.improved(credit),
  failed: Credit.failed(credit),
  course: credit.course,
  semester: credit.semester,
})

const markCredit = (stats, passed, failed, credits, transferred) => {
  if (!stats) {
    stats = {
      passed: 0,
      failed: 0,
      credits: 0,
      transferred: 0,
    }
  }
  if (passed) {
    return {
      ...stats,
      credits: transferred ? stats.credits : stats.credits + credits,
      passed: stats.passed + 1,
      transferred: transferred ? stats.transferred + credits : stats.transferred,
    }
  }
  if (failed) {
    return {
      ...stats,
      failed: stats.failed + 1,
    }
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

const activeTeachers = async (providers, semestercodeStart, semestercodeEnd) => {
  const teachers = await Teacher.findAll({
    attributes: ['id'],
    include: {
      model: Credit,
      attributes: [],
      required: true,
      include: [
        {
          model: Course,
          attributes: [],
          required: true,
          include: {
            model: Organization,
            attributes: [],
            required: true,
            where: {
              code: {
                [Op.in]: providers,
              },
            },
          },
        },
        {
          model: Semester,
          required: true,
          attributes: [],
          where: {
            semestercode: {
              [Op.between]: [semestercodeStart, semestercodeEnd],
            },
          },
        },
      ],
    },
    where: {
      id: {
        [Op.notLike]: '%hy-hlo-org%',
      },
    },
  })
  return teachers.map(({ id }) => id)
}

const getCredits = (teacherIds, semestercodeStart, semestercodeEnd) =>
  Teacher.findAll({
    attributes: ['name', 'id'],
    include: {
      model: Credit,
      attributes: ['credits', 'grade', 'id', 'student_studentnumber', 'credittypecode', 'isStudyModule'],
      include: [
        {
          model: Course,
          required: true,
        },
        {
          model: Semester,
          required: true,
          attributes: ['semestercode', 'name', 'yearname', 'yearcode'],
          where: {
            semestercode: {
              [Op.between]: [semestercodeStart, semestercodeEnd],
            },
          },
        },
      ],
    },
    where: {
      id: {
        [Op.in]: teacherIds,
      },
    },
  })

const calculateCreditStatistics = credits =>
  credits.reduce(
    (stats, credit) => {
      if (isRegularCourse(credit)) {
        const { passed, failed, credits, transferred } = parseCreditInfo(credit)
        return markCredit(stats, passed, failed, credits, transferred)
      }
      return stats
    },
    {
      passed: 0,
      failed: 0,
      credits: 0,
      transferred: 0,
    }
  )

const yearlyStatistics = async (providers, semestercodeStart, semestercodeEnd) => {
  const ids = await activeTeachers(providers, semestercodeStart, semestercodeEnd)
  const teachers = await getCredits(ids, semestercodeStart, semestercodeEnd)
  const statistics = teachers.reduce(
    (acc, teacher) => ({
      ...acc,
      [teacher.id]: {
        name: teacher.name,
        id: teacher.id,
        stats: calculateCreditStatistics(teacher.credits),
      },
    }),
    {}
  )
  return statistics
}

module.exports = {
  bySearchTerm,
  teacherStats,
  yearlyStatistics,
  getCredits,
  splitByEmptySpace,
}
