const Sequelize = require('sequelize')
const moment = require('moment')
const redis = require('redis')
const conf = require('../conf-backend')
const { sequelize, Student, Credit, CourseInstance, Course, CourseType, ElementDetails, StudyrightElement } = require('../models')
const uuidv4 = require('uuid/v4')
const Op = Sequelize.Op
const _ = require('lodash')

let redisClient

if (process.env.NODE_ENV !== 'test') {
  redisClient = redis.createClient(6379, conf.redis)
  require('bluebird').promisifyAll(redis.RedisClient.prototype)
}

const byNameOrCode = (searchTerm, language) => Course.findAll({
  where: {
    [Op.or]: [
      {
        name: {
          [language]: {
            [Op.iLike]: searchTerm
          }
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
  include: [
    {
      model: Credit,
      include:
      {
        model: Student,
        attributes: ['studentnumber'],
        include:
        {
          model: StudyrightElement,
          attributes: ['code'],
          include:
          {
            model: ElementDetails,
            attributes: ['name', 'type'],
            where: {
              type: {
                [Op.eq]: 20
              }
            }
          }

        }

      },

    }
  ],
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

const bySearchTerm = async (term, language) => {
  const formatCourse = (course) => ({ name: course.name[language], code: course.code })

  try {
    const result = await byNameOrCode(`%${term}%`, language)
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
    const studentsThatPassedThisYear = _.uniq(_.flattenDeep(thisSemester.map(inst => inst.credits.filter(Credit.passed).map(c => {
      return c.student
    }))))
    const gradeDistribution = _.groupBy(_.uniq(_.flattenDeep(thisSemester.map(inst => inst.credits))), 'grade')
    const studentsThatFailedThisYear = _.uniq(_.flattenDeep(thisSemester.map(inst => inst.credits.filter(Credit.failed).map(c => c.student))))
    const allStudentsThatFailedEver = _.flattenDeep(allInstancesUntilSemester.map(inst => inst.credits.filter(Credit.failed).map(c => c.student)))
    const passedStudentsThatFailedBefore = _.uniq(studentsThatPassedThisYear.filter(student => {
      return allStudentsThatFailedEver.map(s => s.studentnumber).includes(student.studentnumber)
    }))
    const passedStudentsOnFirstTry = _.difference(studentsThatPassedThisYear, passedStudentsThatFailedBefore)
    const failedStudentsThatFailedBefore = _.uniq(_.flattenDeep(studentsThatFailedThisYear.filter(student =>
      Object.entries(_.countBy(allStudentsThatFailedEver, 'studentnumber')).some(([number, count]) => number === student.studentnumber && count > 1))))
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
    const passedF = fallInstances.reduce((a, b) => b.pass ? a = a.concat(b.credits[0].student) : a, [])
    const failedF = fallInstances.reduce((a, b) => b.fail ? a = a.concat(b.credits[0].student) : a, [])

    const passedS = springInstances.reduce((a, b) => b.pass ? a = a.concat(b.credits[0].student) : a, [])
    const failedS = springInstances.reduce((a, b) => b.fail ? a = a.concat(b.credits[0].student) : a, [])

    if (fallStatistics.studentsThatPassedThisYear.length + fallStatistics.studentsThatFailedThisYear.length > 0)
      stats.push({
        studentsThatPassedThisYear: fallStatistics.studentsThatPassedThisYear || 0,
        studentsThatFailedThisYear: fallStatistics.studentsThatFailedThisYear || 0,
        passedStudentsThatFailedBefore: fallStatistics.passedStudentsThatFailedBefore || 0,
        passedStudentsOnFirstTry: fallStatistics.passedStudentsOnFirstTry || 0,
        failedStudentsThatFailedBefore: fallStatistics.failedStudentsThatFailedBefore || 0,
        failedStudentsOnFirstTry: fallStatistics.failedStudentsOnFirstTry || 0,
        courseLevelPassed: passedF,
        courseLevelFailed: failedF,
        gradeDistribution: fallStatistics.gradeDistribution,
        time: String(year) + ' Fall'
      })
    if (springStatistics.studentsThatPassedThisYear.length + springStatistics.studentsThatFailedThisYear > 0)
      stats.push({
        studentsThatPassedThisYear: springStatistics.studentsThatPassedThisYear || 0,
        studentsThatFailedThisYear: springStatistics.studentsThatFailedThisYear || 0,
        passedStudentsThatFailedBefore: springStatistics.passedStudentsThatFailedBefore || 0,
        passedStudentsOnFirstTry: springStatistics.passedStudentsOnFirstTry || 0,
        failedStudentsThatFailedBefore: springStatistics.failedStudentsThatFailedBefore || 0,
        failedStudentsOnFirstTry: springStatistics.failedStudentsOnFirstTry || 0,
        courseLevelPassed: passedS,
        courseLevelFailed: failedS,
        gradeDistribution: springStatistics.gradeDistribution,
        time: String(year + 1) + ' Spring'
      })

  } else {
    const yearInst = instances.filter(inst => moment(inst.date).isBetween(String(year) + '-08-01', String(year + 1) + '-06-01'))
    let statistics = calculateStats(yearInst, allInstancesUntilYear)
    const passed = yearInst.reduce((a, b) => b.pass ? a = a.concat(b.credits[0].student) : a, [])
    const failed = yearInst.reduce((a, b) => b.fail ? a = a.concat(b.credits[0].student) : a, [])

    stats.push({
      studentsThatPassedThisYear: statistics.studentsThatPassedThisYear || 0,
      studentsThatFailedThisYear: statistics.studentsThatFailedThisYear || 0,
      passedStudentsThatFailedBefore: statistics.passedStudentsThatFailedBefore || 0,
      passedStudentsOnFirstTry: statistics.passedStudentsOnFirstTry || 0,
      failedStudentsThatFailedBefore: statistics.failedStudentsThatFailedBefore || 0,
      failedStudentsOnFirstTry: statistics.failedStudentsOnFirstTry || 0,
      courseLevelPassed: passed,
      courseLevelFailed: failed,
      gradeDistribution: statistics.gradeDistribution,
      time: String(year) + '-' + String(year + 1)
    })
  }
  const programmes = _.uniqBy(_.flattenDeep(stats.map(year => _.union(year.courseLevelPassed, year.courseLevelFailed).map(s => s.studyright_elements.map(e => e)))), 'code')
  return { stats: stats, programmes: programmes }
}

const yearlyStatsOf = async (code, year, separate, language) => {
  const alternatives = await getDuplicateCodes(code)
  let alternativeCodes = []
  const codes = alternatives ? [code, ...Object.keys(alternatives.alt)] : [code]
  const allInstances = _.flatten((await Promise.all(codes.map(code => instancesOf(code)))))

  const yearInst = allInstances.filter(inst => moment(new Date(inst.date)).isBetween(year.start + '-08-01', year.end + '-06-01'))
  const allInstancesUntilYear = allInstances.filter(inst => moment(new Date(inst.date)).isBefore(year.end + '-06-01'))
  const name = (await Course.findOne({ where: { code: { [Op.eq]: code } } })).dataValues.name[language]
  const start = Number(year.start)
  const end = Number(year.end)
  const resultStats = []
  const resultProgrammes = []
  let stats
  if (yearInst) {
    for (let year = start; year < end; year++) {
      stats = oneYearStats(yearInst, year, separate, allInstancesUntilYear)
      if (stats.stats.length > 0) {
        resultStats.push(...stats.stats)
        resultProgrammes.push(stats.programmes)
      }
    }
    return { code, alternativeCodes, start, end, separate, stats: resultStats, programmes: resultProgrammes, name }
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

const createCourse = async (code, name, latest_instance_date) => Course.create({
  code,
  name,
  latest_instance_date
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

  const course = await byCode(code)
  const duplCourse = await byCode(duplicate)
  if (!course || !duplCourse) {
    return
  }

  // If an old code is mapped to another, select first alphabetically
  const selectMain = (code, dupl) => {
    const codes = [code, ...Object.keys(dupl.alt)]
    return codes.sort()[0]
  }

  if (code !== duplicate) {
    const all = await getAllDuplicates()
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

    if (Object.keys(all[code].alt).length === 0) delete all[code]
    await redisClient.setAsync('duplicates', JSON.stringify(all))
  }
  const res = await getAllDuplicates()
  return res
}

const getAllCourseTypes = () => CourseType.findAll()

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
  getMainCode,
  getAllCourseTypes
}