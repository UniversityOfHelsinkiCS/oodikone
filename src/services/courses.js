const Sequelize = require('sequelize')
const moment = require('moment')
const { sequelize, Student, Credit, Course, CourseType, Discipline, ElementDetails, StudyrightElement, Studyright, Semester } = require('../models')
const { redisClient } = require('../services/redis')
const Op = Sequelize.Op
const { CourseYearlyStatsCounter } = require('../services/course_yearly_stats_counter')
const _ = require('lodash')

const codes = require('../util/medicalcodes.js')

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

const byName = (name, language) => Course.findAll({
  where: {
    name: {
      [language]: {
        [Op.eq]: name
      }
    }
  }
})

const byNameOrCodeTypeAndDiscipline = (searchTerm, type, discipline, language) => {
  const includeDiscipline = discipline ? {
    include: {
      model: Discipline,
      where: {
        discipline_id: {
          [Op.eq]: discipline
        }
      }
    }
  } : null

  const whereNameOrCode = searchTerm ? {
    [Op.or]: [
      {
        name: {
          [language]: {
            [Op.iLike]: `%${searchTerm}%`
          }
        }
      },
      {
        code: {
          [Op.iLike]: `%${searchTerm}%`
        }
      }
    ],

  } : null

  const whereType = type ? {
    [Op.and]: [
      {
        coursetypecode: {
          [Op.eq]: type
        }
      }
    ]
  } : null

  return Course.findAll({
    ...includeDiscipline,
    where: {
      ...whereNameOrCode,
      ...whereType
    }
  })
}

const byCode = code => Course.findByPrimary(code)

const creditsForCourses = (codes) => Credit.findAll({
  include: [
    {
      model: Student,
      attributes: ['studentnumber'],
      include: {
        model: StudyrightElement,
        attributes: ['code'],
        include: [
          {
            model: ElementDetails,
            attributes: ['name', 'type'],
            where: {
              type: {
                [Op.eq]: 20
              }
            }
          },
          {
            model: Studyright,
            attributes: ['prioritycode'],
            where: {
              prioritycode: {
                [Op.eq]: 1
              }
            }
          }
        ],
      }
    }, {
      model: Semester,
      attributes: ['semestercode', 'name', 'yearcode', 'yearname']
    }],
  where: {
    course_code: {
      [Op.in]: codes
    }
  },
  order: [
    ['attainment_date', 'ASC']
  ]
})

const bySearchTerm = async (term, language) => {
  const formatCourse = (course) => ({ name: course.name[language], code: course.code, date: course.latest_instance_date })

  try {
    const result = await byNameOrCode(`%${term}%`, language)
    return result.map(formatCourse)
  } catch (e) {
    return {
      error: e
    }
  }
}

const bySearchTermTypeAndDiscipline = async (term, type, discipline, language) => {
  const formatCourse = (course) => ({ name: course.name[language], code: course.code, date: course.latest_instance_date })
  const removeDuplicates = (courses) => {
    let newList = []
    courses.map(course => {
      const nameDuplicates = courses.filter(c => course.name === c.name)
      if (nameDuplicates.length === 1 || !newList.find(c => c.name === course.name)) {
        newList.push(course)
      }
      newList = newList.map(cor => {
        if (cor.name === course.name) {
          return cor.date > course.date ? cor : course
        }
        return cor
      })
    })
    return newList
  }
  try {
    const result = await byNameOrCodeTypeAndDiscipline(term, type, discipline, language)
    return removeDuplicates(result.map(formatCourse))
  } catch (e) {
    return {
      error: e
    }
  }
}

const creditsOf = async (codes) => {

  const formatCredit = (credit) => {
    const credits = [credit]
    return {
      id: credit.id,
      date: credit.attainment_date,
      credits,
      fail: credits.filter(Credit.failed).length,
      pass: credits.filter(Credit.passed).length,
      students: credits.length,
    }
  }

  try {
    const credits = await creditsForCourses(codes)
    return credits.map(formatCredit)
  } catch (e) {
    console.log(e)
    return {
      error: e
    }
  }
}

const oneYearStats = (instances, year, separate, allInstancesUntilYear) => {

  const calculateStats = (thisSemester, allInstancesUntilSemester) => {
    const studentsThatPassedThisYear = _.uniq(_.flattenDeep(thisSemester.map(inst => inst.credits.filter(Credit.passed).map(c => c.student))))
    const gradeDistribution = _.groupBy(_.uniq(_.flattenDeep(thisSemester.map(inst => inst.credits))), 'grade')
    const studentsThatFailedThisYear = _.uniq(_.flattenDeep(thisSemester.map(inst => inst.credits.filter(Credit.failed).map(c => c.student))))
    const allStudentsThatFailedEver = _.flattenDeep(allInstancesUntilSemester.map(inst => inst.credits.filter(Credit.failed).map(c => c.student)))
    const passedStudentsThatFailedBefore = _.uniq(studentsThatPassedThisYear.filter(student => allStudentsThatFailedEver.map(s => s.studentnumber).includes(student.studentnumber)))
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
    const springInstances = instances.filter(inst => moment(inst.date).isBetween(String(year + 1) + '-01-15', String(year + 1) + '-08-01'))
    let fallStatistics = calculateStats(fallInstances, allInstancesUntilFall)

    let springStatistics = calculateStats(springInstances, allInstancesUntilYear)

    const passedF = fallInstances.reduce((a, b) => b.pass ? a = a.concat(b.credits[0].student) : a, [])
    const failedF = fallInstances.reduce((a, b) => b.fail ? a = a.concat(b.credits[0].student) : a, [])

    const passedS = springInstances.reduce((a, b) => b.pass ? a = a.concat(b.credits[0].student) : a, [])
    const failedS = springInstances.reduce((a, b) => b.fail ? a = a.concat(b.credits[0].student) : a, [])

    if (fallStatistics.studentsThatPassedThisYear.length + fallStatistics.studentsThatFailedThisYear.length > 0) {
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
    }
    if (springStatistics.studentsThatPassedThisYear.length + springStatistics.studentsThatFailedThisYear.length > 0) {
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
    }

  } else {
    const yearInst = instances.filter(inst => moment(inst.date).isBetween(String(year) + '-08-01', String(year + 1) + '-08-01'))
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

  return stats
}

const yearlyStatsOf = async (code, year, separate, language) => {
  const getProgrammesFromStats = (stats) => _.flattenDeep(stats
    .map(year =>
      _.union(year.courseLevelPassed, year.courseLevelFailed)
        .map(s => s.studyright_elements
          .map(e => e))))
    .reduce((b, a) => {
      b[a.code] = b[a.code] ?
        { ...b[a.code], amount: b[a.code].amount + 1 } :
        { name: a.element_detail.name, amount: 1 }
      return b
    }, resultProgrammes)

  const alternatives = await getDuplicateCodes(code)
  const codes = alternatives ? [code, ...Object.keys(alternatives.alt)] : [code]
  const allInstances = await creditsOf(codes)
  const yearInst = allInstances.filter(inst => moment(new Date(inst.date)).isBetween(year.start + '-09-01', year.end + '-08-01'))
  const allInstancesUntilYear = allInstances.filter(inst => moment(new Date(inst.date)).isBefore(year.end + '-08-01'))
  const name = (await Course.findOne({ where: { code: { [Op.eq]: code } } })).dataValues.name[language]
  const start = Number(year.start)
  const end = Number(year.end)
  const resultStats = []
  let resultProgrammes = {}
  let stats
  if (yearInst) {
    for (let year = start; year < end; year++) {
      stats = oneYearStats(yearInst, year, separate, allInstancesUntilYear)
      if (stats.length > 0) {
        resultStats.push(...stats)
        resultProgrammes = getProgrammesFromStats(stats)
      }
    }
    return { code, alternativeCodes: codes.filter(cd => cd !== code), start, end, separate, stats: resultStats, programmes: resultProgrammes, name }
  }
  return
}

const createCourse = async (code, name, latest_instance_date) => Course.create({
  code,
  name,
  latest_instance_date
})

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
const getAllDisciplines = () => Discipline.findAll()

const alternativeCodes = async code => {
  const alternatives = await getDuplicateCodes(code)
  return alternatives ? [code, ...Object.keys(alternatives.alt)] : [code]
}

const formatStudyrightElement = ({ code, element_detail }) => ({
  code,
  name: element_detail.name
})

const parseCredit = credit => {
  const { student, semester, grade } = credit
  const { studentnumber, studyright_elements: elements } = student
  const { yearcode, yearname, semestercode, name: semestername } = semester
  return {
    student,
    yearcode,
    yearname,
    semestercode,
    semestername,
    grade,
    passed: !Credit.failed(credit) || Credit.passed(credit) || Credit.improved(credit),
    studentnumber,
    programmes: elements.map(formatStudyrightElement)
  }
}

const yearlyStatsOfNew = async (coursecode, separate, startyearcode, endyearcode) => {
  const codes = await alternativeCodes(coursecode)
  const [credits, course] = await Promise.all([creditsForCourses(codes), Course.findById(coursecode)])
  const counter = new CourseYearlyStatsCounter()
  for (let credit of credits) {
    const { studentnumber, grade, passed, semestercode, semestername, yearcode, yearname, programmes } = parseCredit(credit)
    if (startyearcode <= yearcode && yearcode <= endyearcode) {
      const groupcode = separate ? semestercode : yearcode
      const groupname = separate ? semestername : yearname
      counter.markStudyProgrammes(studentnumber, programmes)
      counter.markCreditToGroup(studentnumber, passed, grade, groupcode, groupname)
    } else {
      counter.markCreditToHistory(studentnumber, passed)
    }
  }
  const statistics = counter.getFinalStatistics()
  return {
    ...statistics,
    coursecode,
    alternatives: codes,
    name: course.name.fi
  }
}

const courseYearlyStats = async (coursecodes, separate, startyearcode, endyearcode) => {
  const stats = await Promise.all(coursecodes.map(code => yearlyStatsOfNew(code, separate, startyearcode, endyearcode||startyearcode)))
  return stats
}

const nameLikeTerm = (name) => {
  if (!name) {
    return undefined
  }
  const term = `%${name.trim()}%`
  return {
    name: {
      [Op.or]: {
        fi: {
          [Op.iLike]: term
        },
        sv: {
          [Op.iLike]: term
        },
        en: {
          [Op.iLike]: term
        }
      }
    }
  }
}

const codeLikeTerm = (code) => !code ? undefined : {
  code: {
    [Op.iLike]: `${code.trim()}%`
  }
}

const byNameAndOrCodeLike = (name, code) => {
  return Course.findAll({
    attributes: ['name', 'code', ['latest_instance_date', 'date'], 'startdate', 'enddate', 'max_attainment_date', 'min_attainment_date'],
    where: {
      ...nameLikeTerm(name),
      ...codeLikeTerm(code)
    }
  })
}

const byCodes = (codes) => {
  return Course.findAll({
    where: {
      code: {
        [Op.in]: codes
      }
    }
  })
}

const getMandatoryCourses = async (id) => {
  if (id === 'MH30_001') return codes
  return []
}

module.exports = {
  getMandatoryCourses,
  byCode,
  byName,
  bySearchTerm,
  bySearchTermTypeAndDiscipline,
  createCourse,
  yearlyStatsOf,
  findDuplicates,
  getDuplicateCodes,
  setDuplicateCode,
  removeDuplicateCode,
  getAllDuplicates,
  getMainCode,
  getAllCourseTypes,
  getAllDisciplines,
  yearlyStatsOfNew,
  courseYearlyStats,
  byNameAndOrCodeLike,
  byCodes
}