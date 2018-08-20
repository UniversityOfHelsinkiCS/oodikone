const { Teacher, Credit, Course, Semester } = require('../models/index')
const { Op } = require('sequelize')

const splitByEmptySpace = str => str.replace(/\s\s+/g, ' ').split(' ')

const likefy = term => `%${term}%`

const nameLike = terms => ({
  name: {
    [Op.and]: terms.map(term => ({ [Op.iLike]: likefy(term) }))
  }
})

const codeLike = terms => {
  if (terms.length !== 1) {
    return undefined
  }
  return {
    code: {
      [Op.iLike]: likefy(terms[0])
    }
  }
}

const invalidTerm = searchTerm => !searchTerm.trim()

const bySearchTerm = async searchTerm => {
  if (invalidTerm(searchTerm)) {
    return []
  }
  const terms = splitByEmptySpace(searchTerm)
  return Teacher.findAll({
    attributes: {
      exclude: ['createdAt', 'updatedAt']
    },
    where: {
      [Op.or]: [
        nameLike(terms),
        codeLike(terms)
      ]
    }
  })
}

const findTeacherCredits = teacherid => Teacher.findByPrimary(teacherid, {
  attributes: ['name', 'code', 'id'],
  include: {
    model: Credit,
    attributes: ['credits', 'grade', 'id', 'student_studentnumber', 'credittypecode'],
    include: [
      {
        model: Course,
        attributes: ['name', 'code'],
        required: true
      },
      {
        model: Semester,
        attributes: ['semestercode', 'name', 'yearname', 'yearcode']
      }
    ]
  }
})

const parseCreditInfo = credit => ({
  studentnumber: credit.student_studentnumber,
  credits: credit.credits,
  grade: credit.grade,
  passed: Credit.passed(credit) || Credit.improved(credit),
  failed: Credit.failed(credit),
  course: credit.course,
  semester: credit.semester
})


const reduceStats = (stats, code, name, credits, passed, failed) => {
  const course = stats[code] ? {...stats[code]} : {
    code,
    name,
    passed: {
      credits: 0,
      attainments: 0
    },
    failed: {
      credits: 0,
      attainments: 0
    }
  }
  if (passed) {
    course.passed.credits += credits
    course.passed.attainments += 1
  }
  if(failed) {
    course.failed.credits += credits
    course.failed.attainments += 1
  }
  return {
    ...stats,
    [code]: course
  }
}

const reducer = (stats, credit) => {
  const { course, credits, passed, failed, semester } = parseCreditInfo(credit)
  return {
    ...stats,
    courses: reduceStats(stats.courses, course.code, course.name, credits, passed, failed),
    semesters: reduceStats(stats.semesters, semester.semestercode, semester.name, credits, passed, failed),
    years: reduceStats(stats.years, semester.yearcode, { 'en' : semester.yearname }, credits, passed, failed)
  }
}

const teacherStats = async teacherid => {
  const teacher = await findTeacherCredits(teacherid)
  const stats = teacher.credits.reduce(reducer, {
    courses: {},
    semesters: {},
    years: {}
  })
  const res = {
    name: teacher.name,
    code: teacher.code,
    id: teacher.id,
    ...stats
  }
  return res
}

module.exports = {
  bySearchTerm,
  teacherStats
}