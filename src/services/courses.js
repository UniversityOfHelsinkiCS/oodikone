const Sequelize = require('sequelize')
const moment = require('moment')
const redis = require('redis')
const conf = require('../conf-backend')
const { sequelize, Student, Credit, CourseInstance, Course, CourseTeacher } = require('../models')
const { arrayUnique } = require('../util')
const uuidv4 = require('uuid/v4')
const Op = Sequelize.Op
const _ = require('lodash')

const redisClient = redis.createClient(6379, conf.redis)
require('bluebird').promisifyAll(redis.RedisClient.prototype)

const byNameOrCode = (searchTerm) => Course.findAll({
  where: {
    [Op.or]: [
      {
        name: {
          [Op.iLike]: searchTerm
        }
      },
      {
        code: {
          [Op.like]: searchTerm
        }
      }
    ]
  }
})

const byCode = (code) => Course.findOne({
  where: {
    code: {
      [Op.eq]: code
    }
  }
})

const byCode = code => Course.findByPrimary(code)

const instanceStatistics = async (code, date) => CourseInstance.findOne({
  include: [
    {
      model: Credit,
      include: [Student]
    }
  ],
  where: {
    [Op.and]: [
      {
        course_code: {
          [Op.eq]: code
        }
      },
      {
        coursedate: {
          [Op.eq]: new Date(date)
        }
      }
    ]
  }
})

const instancesByCode = (code) => CourseInstance.findAll({
  include: [Credit, CourseTeacher],
  where: {
    course_code: {
      [Op.eq]: code
    }
  }
})

const byIds = (ids) => Student.findAll({
  include: [
    {
      model: Credit,
      include: [
        {
          model: CourseInstance,
        }
      ]
    }
  ],
  where: {
    studentnumber: {
      [Op.in]: ids
    }
  }
})

const bySearchTerm = async (term) => {
  const formatCourse = ({ name, code }) => ({ name, code })

  try {
    const result = await byNameOrCode(`%${term}%`)
    return result.map(formatCourse)
  } catch (e) {
    return {
      error: e
    }
  }
}

const statisticsOf = async (code, date, months) => {

  const getStudents = ({ credits }) => {
    const all = credits.map(c => c.student_studentnumber)
    const pass = credits.filter(Credit.passed).map(c => c.student_studentnumber)
    const fail = credits.filter(Credit.failed).map(c => c.student_studentnumber)
    return { all, pass, fail }
  }

  const starYearsOf = (students) => {
    const years = students.map(s => moment(s.dateofuniversityenrollment).year()).sort()
    return years.reduce((map, y) => { map[y] = map[y] ? map[y] + 1 : 1; return map }, {})
  }

  const currentCourse = (credit) => {
    return (credit.courseinstance.course_code !== code &&
      credit.courseinstance.coursedate !== date)
  }

  const studentStatsAfter = (studentsStats, date) => {
    const creditsAfter = (student) => {
      return student.credits
        .filter(Credit.inTimeRange(date, months))
        .filter(Credit.passed)
        .filter(currentCourse)
        .filter(Credit.notUnnecessary)
        .reduce((set, c) => set + c.credits, 0.0)
    }

    const toStudent = (set, student) => {
      set[uuidv4()] = creditsAfter(student, date)
      return set
    }

    return studentsStats.reduce(toStudent, {})
  }

  try {
    const instanceStats = await instanceStatistics(code, date)
    const students = getStudents(instanceStats)
    const studentStats = await byIds(students.all)
    const all = studentStatsAfter(studentStats.filter(s => students.all.includes(s.studentnumber)), date)
    const pass = studentStatsAfter(studentStats.filter(s => students.pass.includes(s.studentnumber)), date)
    const fail = studentStatsAfter(studentStats.filter(s => students.fail.includes(s.studentnumber)), date)
    return {
      all, pass, fail,
      startYear: starYearsOf(instanceStats.credits.map(c => c.student))
    }
  } catch (e) {
    console.log(e)
    return {
      error: e
    }
  }
}

const instancesOf = async (code) => {
  const byDate = (a, b) => {
    return moment(a.coursedate).isSameOrBefore(b.coursedate) ? -1 : 1
  }



  const formatInstance = (instance) => {
    return {
      id: instance.id,
      date: instance.coursedate,
      credits: instance.credits,
      fail: instance.credits.filter(Credit.failed).length,
      pass: instance.credits.filter(Credit.passed).length,
      students: instance.credits.length,
      teachers: instance.courseteachers.map(t => t.teacher_id).filter(arrayUnique).length
    }
  }

  try {
    const result = await instancesByCode(code)
    return result.sort(byDate).map(formatInstance)
  } catch (e) {
    console.log(e)
    return {
      error: e
    }
  }
}

const oneYearStats = (instances, year, separate, allInstancesUntilYear) => {

  const calculateStats = (thisSemester, allInstancesUntilSemester) => {
    const studentsThatPassedThisYear = _.uniq(_.flattenDeep(thisSemester.map(inst => inst.credits.filter(Credit.passed).map(c => c.student_studentnumber))))
    const gradeDistribution = _.groupBy(_.uniq(_.flattenDeep(thisSemester.map(inst => inst.credits))), 'grade')
    const studentsThatFailedThisYear = _.uniq(_.flattenDeep(thisSemester.map(inst => inst.credits.filter(Credit.failed).map(c => c.student_studentnumber))))
    const allStudentsThatFailedEver = _.flattenDeep(allInstancesUntilSemester.map(inst => inst.credits.filter(Credit.failed).map(c => c.student_studentnumber)))
    const passedStudentsThatFailedBefore = _.uniq(studentsThatPassedThisYear.filter(student => allStudentsThatFailedEver.includes(student)))
    const passedStudentsOnFirstTry = _.difference(studentsThatPassedThisYear, passedStudentsThatFailedBefore)
    const failedStudentsThatFailedBefore = _.uniq(_.flattenDeep(Object.values(_.groupBy(allStudentsThatFailedEver)).filter(group => group.length > 1)).filter(student => studentsThatFailedThisYear.includes(student)))
    const failedStudentsOnFirstTry = _.difference(studentsThatFailedThisYear, failedStudentsThatFailedBefore)

    return { studentsThatPassedThisYear, studentsThatFailedThisYear, allStudentsThatFailedEver, passedStudentsThatFailedBefore, passedStudentsOnFirstTry, failedStudentsThatFailedBefore, failedStudentsOnFirstTry, gradeDistribution }
  }

  const stats = []
  if (separate === 'true') {
    const fallInstances = instances.filter(inst => moment(inst.date).isBetween(String(year) + '-08-01', String(year + 1) + '-01-15'))
    const allInstancesUntilFall = allInstancesUntilYear.filter(inst => moment(inst.date).isBefore(String(year + 1) + '-01-15'))
    const springInstances = instances.filter(inst => moment(inst.date).isBetween(String(year + 1) + '-01-15', String(year + 1) + '-06-01'))

    let fallStatistics = calculateStats(fallInstances, allInstancesUntilFall)
    let springStatistics = calculateStats(springInstances, allInstancesUntilYear)
    const passedF = fallInstances.reduce((a, b) => a + b.pass, 0)	
    const failedF = fallInstances.reduce((a, b) => a + b.fail, 0)

    const passedS = springInstances.reduce((a, b) => a + b.pass, 0)
    const failedS = springInstances.reduce((a, b) => a + b.fail, 0)

    if (fallStatistics.studentsThatPassedThisYear.length + fallStatistics.studentsThatFailedThisYear.length > 0)
      stats.push({
        studentsThatPassedThisYear: fallStatistics.studentsThatPassedThisYear.length || 0,
        studentsThatFailedThisYear: fallStatistics.studentsThatFailedThisYear.length || 0,
        passedStudentsThatFailedBefore: fallStatistics.passedStudentsThatFailedBefore.length || 0,
        passedStudentsOnFirstTry: fallStatistics.passedStudentsOnFirstTry.length || 0,
        failedStudentsThatFailedBefore: fallStatistics.failedStudentsThatFailedBefore.length || 0,
        failedStudentsOnFirstTry: fallStatistics.failedStudentsOnFirstTry.length || 0,
        courseLevelPassed: passedF,
        courseLevelFailed: failedF,
        gradeDistribution: fallStatistics.gradeDistribution,
        time: String(year) + ' Fall'
      })
    if (springStatistics.studentsThatPassedThisYear.length + springStatistics.studentsThatFailedThisYear.length > 0)
      stats.push({
        studentsThatPassedThisYear: springStatistics.studentsThatPassedThisYear.length || 0,
        studentsThatFailedThisYear: springStatistics.studentsThatFailedThisYear.length || 0,
        passedStudentsThatFailedBefore: springStatistics.passedStudentsThatFailedBefore.length || 0,
        passedStudentsOnFirstTry: springStatistics.passedStudentsOnFirstTry.length || 0,
        failedStudentsThatFailedBefore: springStatistics.failedStudentsThatFailedBefore.length || 0,
        failedStudentsOnFirstTry: springStatistics.failedStudentsOnFirstTry.length || 0,
        courseLevelPassed: passedS,
        courseLevelFailed: failedS,
        gradeDistribution: springStatistics.gradeDistribution,
        time: String(year + 1) + ' Spring'
      })

  } else {
    const yearInst = instances.filter(inst => moment(inst.date).isBetween(String(year) + '-08-01', String(year + 1) + '-06-01'))
    let statistics = calculateStats(yearInst, allInstancesUntilYear)
    const passed = yearInst.reduce((a, b) => a + b.pass, 0)
    const failed = yearInst.reduce((a, b) => a + b.fail, 0)

    stats.push({
      studentsThatPassedThisYear: statistics.studentsThatPassedThisYear.length || 0,
      studentsThatFailedThisYear: statistics.studentsThatFailedThisYear.length || 0,
      passedStudentsThatFailedBefore: statistics.passedStudentsThatFailedBefore.length || 0,
      passedStudentsOnFirstTry: statistics.passedStudentsOnFirstTry.length || 0,
      failedStudentsThatFailedBefore: statistics.failedStudentsThatFailedBefore.length || 0,
      failedStudentsOnFirstTry: statistics.failedStudentsOnFirstTry.length || 0,
      courseLevelPassed: passed,
      courseLevelFailed: failed,
      gradeDistribution: statistics.gradeDistribution,
      time: String(year) + '-' + String(year + 1)
    })
  }
  return stats
}

const yearlyStatsOf = async (code, year, separate) => {
  const allInstances = await instancesOf(code)
  const alternatives = await getDuplicateCodes(code)
  const alternativeCodes = Object.keys(alternatives.alt)
  if (alternativeCodes) {
    const alternativeInstances = await Promise.all(alternativeCodes.map(code => instancesOf(code)))
    alternativeInstances.forEach(inst => allInstances.push(...inst))
  }

  const yearInst = allInstances.filter(inst => moment(new Date(inst.date)).isBetween(year.start + '-08-01', year.end + '-06-01'))
  const allInstancesUntilYear = allInstances.filter(inst => moment(new Date(inst.date)).isBefore(year.end + '-06-01'))
  const name = (await Course.findOne({ where: { code: { [Op.eq]: code } } })).dataValues.name
  const start = Number(year.start)
  const end = Number(year.end)
  const results = []
  let stats
  if (yearInst) {
    for (let year = start; year < end; year++) {
      stats = oneYearStats(yearInst, year, separate, allInstancesUntilYear)
      if (stats.length > 0) results.push(...stats)
    }
    return { code, alternativeCodes, start, end, separate, stats: results, name }
  }
  return
}

const courseInstanceByCodeAndDate = (code, date) => {
  return CourseInstance.findOne({
    where: {
      [Op.and]: [
        {
          course_code: {
            [Op.eq]: code
          }
        },
        {
          coursedate: {
            [Op.eq]: new Date(date)
          }
        }
      ]
    }
  })
}

const createCourse = async (code, name) => Course.create({
  code: code,
  name: name
})

const createCourseInstance = async (creditDate, courseCode) => {
  const maxId = await CourseInstance.max('id') || 0
  const id = parseInt(maxId) + 1
  return CourseInstance.create({
    id: id,
    coursedate: creditDate,
    course_code: courseCode
  })
}

const findDuplicates = async (oldPrefixes, newPrefixes) => {
  let oldPrefixQuery = ''
  let newPrefixQuery = ''
  oldPrefixes.forEach(prefix => {
    oldPrefixQuery += `ou.code like '${prefix}%' OR\n`
  })
  oldPrefixQuery = oldPrefixQuery.slice(0, -4)

  newPrefixes.forEach(prefix => {
    newPrefixQuery += `inr.code like '${prefix}%' OR\n`
  })

  newPrefixQuery = newPrefixQuery.slice(0, -4)

  return sequelize.query(`select ou.code as code1,  inr.code as code2, ou.name from course ou
  inner join course inr on
  (
    select count(*) from course inr
  where inr.name = ou.name) > 1 
   AND inr.name = ou.name
   where(
    (${oldPrefixQuery})
    AND (${newPrefixQuery})
    AND ou.name not like 'Kandidaatin%'
    AND ou.name not like 'Muualla suoritetut%'
    AND ou.name not like 'Tutkimusharjoittelu%'
    AND ou.name not like 'Väitöskirja%'
    AND ou.name not like '%erusopinnot%'
    AND ou.name not like '%ineopinnot%'
    AND ou.name not like '%Pro gradu -tutkielma%'
  )
  order by name`)
}

const getAllDuplicates = async () => {

  let results = await redisClient.getAsync('duplicates')
  if (!results) {
    await redisClient.setAsync('duplicates', '{}')
    results = await redisClient.getAsync('duplicates')
  }
  return JSON.parse(results)
}

const getDuplicateCodes = async (code) => {
  const allCodes = await getAllDuplicates()
  const results = allCodes[code]
  if (results) return results
  return null
}

const getMainCode = async (code) => {
  const codes = await getDuplicateCodes(code)
  if (!codes) return code
  return codes.main
}


const setDuplicateCode = async (code, duplicate) => {
  // TODO: decide main code by choosing a course that has been held most recently  
  const isMainCode = (code) => code.slice(0, 2).split('').filter(c => Number(c)).length === 0

  // If an old code is mapped to another, select first alphabetically
  const selectMain = (code, dupl) => {
    const codes = [code, ...Object.keys(dupl.alt)]
    return codes.sort()[0]
  }

  if (code !== duplicate) {
    const all = await getAllDuplicates()
    const course = await byCode(code)
    let main = ''
    if (!all[code]) {
      if (isMainCode(code)) {
        if (isMainCode(duplicate)) {
          main = code.localeCompare(duplicate) ? code : duplicate
        } else {
          main = course.code
        }
      }
      all[code] = {
        main: main,
        name: course.name,
        alt: {}
      }
    }

    if (!Object.keys(all[code].alt).includes(duplicate)) {
      const duplCourse = await byCode(duplicate)
      if (isMainCode(duplicate)) {
        all[code].main = duplCourse.code
      }
      all[code].alt[duplicate] = duplCourse.name
      if (!all[code].main) {
        all[code].main = selectMain(code, all[code])
        all[code].name = course.name
      }
      await redisClient.setAsync('duplicates', JSON.stringify(all))
    }
  }

  const res = await getAllDuplicates()
  return res
}

const removeDuplicateCode = async (code, duplicate) => {
  let all = await getAllDuplicates(code)
  if (all[code] && Object.keys(all[code].alt).includes(duplicate)) {
    delete all[code].alt[duplicate]
    if (all[code].alt.length === 0) delete all[code]
    await redisClient.setAsync('duplicates', JSON.stringify(all))
  }
  const res = await getAllDuplicates()
  return res
}

module.exports = {
  byCode,
  bySearchTerm,
  instancesOf,
  statisticsOf,
  createCourse,
  createCourseInstance,
  courseInstanceByCodeAndDate,
  yearlyStatsOf,
  findDuplicates,
  getDuplicateCodes,
  setDuplicateCode,
  removeDuplicateCode,
  getAllDuplicates,
  getMainCode
}