const Sequelize = require('sequelize')
const Op = Sequelize.Op
const _ = require('lodash')
const moment = require('moment')
const { studentNumbersWithAllStudyRightElements } = require('./studyrights')

const { Studyright, Student, Credit, CourseInstance, Course, sequelize, StudyrightElement } = require('../models')
const { formatStudent, formatStudentUnifyCodes } = require('../services/students')
const { getUnitFromElementDetail } = require('../services/units')

const enrolmentDates = () => {
  const query = 'SELECT DISTINCT s.dateOfUniversityEnrollment as date FROM Student s'
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT }
  )
}

const studyRightLike = (searchTerm) => {
  const query = `
    SELECT DISTINCT highLevelName 
      FROM StudyRight  
      WHERE LOWER(highLevelName) 
      LIKE LOWER ?`
  return sequelize.query(query,
    {
      replacements: ['%' + searchTerm + '%'],
      type: sequelize.QueryTypes.SELECT,
      model: Studyright
    })
}

// TODO refactor below two to one 
const studentsWithAllCourses = (student_numbers) => {
  return Student.findAll({
    include: [
      {
        model: Credit,
        include: [
          {
            model: CourseInstance,
            include: [Course]
          }
        ],
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: student_numbers
      }
    },
  })
}

const restrictWith = (withinTimerange) => (student) => {
  const creditsWithinTimelimit = student.credits.filter(withinTimerange)

  return {
    firstnames: student.firstnames,
    lastname: student.lastname,
    studentnumber: student.studentnumber,
    tag_students: student.tag_students,
    dateofuniversityenrollment: student.dateofuniversityenrollment,
    creditcount: student.creditcount,
    credits: creditsWithinTimelimit,
    sex: student.sex,
    matriculationexamination: !!Number(student.matriculationexamination),
    email: student.email
  }
}

const studyrightsByKeyword = async (searchTerm) => {
  const result = await studyRightLike(searchTerm)

  return result.map(s => s.highlevelname)
}

const universityEnrolmentDates = async () => {
  const [result] = await enrolmentDates()

  return result.map(r => r.date).filter(d => d).sort()
}

const semesterStart = {
  SPRING: '01-01',
  FALL: '07-31'
}

const semesterEnd = {
  SPRING: '07-31',
  FALL: '12-31'
}

const formatStudentForOldApi = (student, startDate, endDate) => {
  student = formatStudent(student)
  student.studyrightStart = startDate
  student.starting = moment(student.started).isBetween(startDate, endDate, null, '[]')
  return student
}

const dateMonthsFromNow = (date, months) => moment(date).add(months, 'months').format('YYYY-MM-DD')

const optimizedStatisticsOf = async (query) => {
  if (semesterStart[query.semester] === undefined) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }
  const { studyRights, semester, year, months } = query
  const startDate = `${year}-${semesterStart[semester]}`
  const endDate = `${year}-${semesterEnd[semester]}`
  const studentnumbers = await studentNumbersWithAllStudyRightElements(studyRights, startDate, endDate)
  const students = await Student.findAll({
    include: [
      {
        model: Credit,
        required: true,
        include: [
          {
            model: CourseInstance,
            include: [Course],
            required: true,
            where: {
              coursedate: {
                [Op.between]: [startDate, dateMonthsFromNow(startDate, months)]
              }
            }
          }
        ],
      }
    ],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers
      }
    }
  })
  return students.map(formatStudentForOldApi)
}

const getStudentsWithCodes = async (codes, startDate, endDate) => {
  const studentnumberlists = await Promise.all(codes.map(code => getStudentsWithStudyrightElement(code, startDate, endDate)))
  return _.intersection(...studentnumberlists)
}

const getStudentsWithStudyrightElement  = async (code, startedAfter, startedBefore) => {
  const studyrightelements = await StudyrightElement.findAll({
    distinct: 'studentnumber',
    where: {
      code: {
        [Op.eq]: code
      },
      startdate: {
        [Op.between]: [startedAfter, startedBefore]
      }
    }
  })
  return studyrightelements.map(element => element.studentnumber)
}

const bottlenecksOf = async (query) => {
  if (semesterStart[query.semester] === undefined) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }

  const startDate = `${query.year}-${semesterStart[query.semester]}`
  const endDate = `${query.year}-${semesterEnd[query.semester]}`

  try {
    const units = await Promise.all(query.studyRights.map(getUnitFromElementDetail))
    const conf = {
      enrollmentDates: {
        startDate,
        endDate
      },
      units
    }

    const codes = units.map(unit => unit.id)
    const student_numbers = await getStudentsWithCodes(codes, startDate, endDate)
    const students = await studentsWithAllCourses(student_numbers)
      .map(restrictWith(Credit.notLaterThan(conf.enrollmentDates.startDate, query.months)))

    const populationSize = students.length

    const toCourses = async (student) => {
      const formattedStudent = await formatStudentUnifyCodes(student)
      const courses = _.groupBy(formattedStudent.courses, c => c.course.code)
      return Object.keys(courses).map(code=>{
        const instances = courses[code]
        return {
          course: courses[code][0].course,
          attempts: instances.length,
          passed: instances.some(c=>c.passed), 
          student: student.studentnumber
        }
      })
    }

    const courses = _.flatten(await Promise.all(students.map(toCourses)))

    const toNameMap = (names, { course }) => {
      const { code, name } = course
      if (!names[code] || (names[code].fi.startsWith('Avoin yo') && !name.fi.startsWith('Avoin yo')) ) {
        names[code] = name
      }
      return names
    }

    const courseNames = courses.reduce(toNameMap, {})
    const groupedCourses = _.groupBy(courses, c => c.course.code)

    // TODO: refactor to reduce
    const studentsOf = (instances) => {
      const studentNumber = i => i.student
      const passedStudents = i => i.passed
      const failedStudents = i => !i.passed
      const passed = instances.filter(passedStudents).map(studentNumber)
      const failed = instances.filter(failedStudents).map(studentNumber)
      const nTimes = instances.filter(i => i.attempts > 1)
      const retryPassed = nTimes.filter(passedStudents).map(studentNumber)
      const failedMany = nTimes.filter(failedStudents).map(studentNumber)
      const all = passed.concat(failed)
      const notParticipated = _.difference(student_numbers, all)
      const notParticipatedOrFailed = _.union(notParticipated, failed)
      const toObject = (passed) => 
        passed.length > 0 ? passed.reduce((o, s) => { o[s] = true; return o }, {}) : {} 

      return {
        all: toObject(all),
        passed: toObject(passed),
        failed: toObject(failed),
        retryPassed: toObject(retryPassed),
        failedMany: toObject(failedMany),
        notParticipated: toObject(notParticipated),
        notParticipatedOrFailed: toObject(notParticipatedOrFailed)
      }
    }


    const statsOf = (instances) => {
      const passed = instances.reduce((sum, i) => sum + (i.passed ? 1 : 0), 0)
      const failed = instances.reduce((sum, i) => sum + (i.passed ? 0 : 1), 0)
      const students = instances.length

      return {
        students,
        passed,
        failed,
        percentage: Number((100*passed/students).toFixed(2)),
        failedMany: instances.reduce((sum, i) => sum + (i.passed ? 0 : (i.attempts>1)? 1 : 0 ), 0),
        retryPassed: instances.reduce((sum, i) => sum + (i.passed && i.attempts>1? 1 : 0), 0),
        attempts: instances.reduce((sum, i) => sum + i.attempts, 0),
        passedOfPopulation: Number((100 * passed / populationSize).toFixed(2)),
        triedOfPopulation: Number((100 * (passed + failed) / populationSize).toFixed(2)),
      }
    }

    const stats = Object.keys(groupedCourses).map(courseCode => {
      return {
        course: {
          name: courseNames[courseCode],
          code: courseCode
        },
        stats: statsOf(groupedCourses[courseCode]),
        students: studentsOf(groupedCourses[courseCode])
      }
    })

    return stats.sort((c1, c2) => c2.stats.attempts - c1.stats.attempts)

  } catch (e) {
    console.log(e)
    return { error: `No such study rights: ${query.studyRights}` }
  }
}

module.exports = {
  studyrightsByKeyword, universityEnrolmentDates,
  optimizedStatisticsOf, bottlenecksOf
}