const Sequelize = require('sequelize')
const Op = Sequelize.Op
const _ = require('lodash')
const moment = require('moment')

const { Studyright, Student, Credit, CourseInstance, Course, sequelize } = require('../models')
const { formatStudent, formatStudentUnifyCodes } = require('../services/students')
const StudyRights = require('../services/studyrights')
const { byId } = require('../services/units')


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

const studentsWithCoursesAfterStudyrightStart = (student_numbers, conf) => {
  return Student.findAll({
    include: [
      {
        model: Credit,
        include: [
          {
            model: CourseInstance,
            include: [Course],
            where: { // Only course instances that are from between the dates selected
              coursedate: {
                [Op.gte]: conf.enrollmentDates.startDate
              }
            }
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
    credits: creditsWithinTimelimit
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
  FALL: '08-01'
}

const semesterEnd = {
  SPRING: '07-31',
  FALL: '12-31'
}

const optimizedStatisticsOf = async (query) => {
  if (semesterStart[query.semester] === undefined) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }

  const startDate = `${query.year}-${semesterStart[query.semester]}`
  const endDate = `${query.year}-${semesterEnd[query.semester]}`

  const withStudyrighStart = (student) => {
    student.studyrightStart = startDate
    student.starting = moment(student.started).isBetween(startDate, endDate, null, '[]')
    return student
  }

  try {
    const studyRights = await Promise.all(query.studyRights.map(async r => byId(r)))

    const conf = {
      enrollmentDates: {
        startDate, 
        endDate
      },
      studyRights
    }

    const student_numbers = await StudyRights.ofPopulations(conf).map(s => s.student_studentnumber)
    
    const students = await studentsWithCoursesAfterStudyrightStart(student_numbers, conf)
      .map(restrictWith(Credit.inTimeRange(conf.enrollmentDates.startDate, query.months)))

    return students
      .map(formatStudent)
      .map(withStudyrighStart)
    
  } catch (e) {
    console.log(e)
    return { error: `No such study rights: ${query.studyRights}` }
  }
}

const bottlenecksOf = async (query) => {
  if (semesterStart[query.semester] === undefined) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }

  const startDate = `${query.year}-${semesterStart[query.semester]}`
  const endDate = `${query.year}-${semesterEnd[query.semester]}`

  try {
    const studyRights = await Promise.all(query.studyRights.map(async r => byId(r)))
    const conf = {
      enrollmentDates: {
        startDate,
        endDate
      },
      studyRights
    }
    const student_numbers = await StudyRights
      .ofPopulations(conf).map(s => s.student_studentnumber)

    const students = await studentsWithAllCourses(student_numbers)
      .map(restrictWith(Credit.notLaterThan(conf.enrollmentDates.startDate, query.months)))

    const populationSize = students.length

    const toCourses = (student) => {
      const courses = _.groupBy(formatStudentUnifyCodes(student).courses, c => c.course.code)
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

    const courses = _.flatten(students.map(toCourses))

    const toNameMap = (object, { course }) => {
      if (!object[course.code] || (object[course.code].startsWith('Avoin yo') && !course.name.startsWith('Avoin yo')) ) {
        object[course.code] = course.name
      } 

      return object
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
      return {
        all: passed.concat(failed),
        passed,
        failed,
        retryPassed: nTimes.filter(passedStudents).map(studentNumber),
        failedMany: nTimes.filter(failedStudents).map(studentNumber)
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