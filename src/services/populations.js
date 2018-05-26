const Sequelize = require('sequelize')
const _ = require('lodash')
const { Studyright, Student, Credit, CourseInstance, Course, TagStudent, sequelize } = require('../models')
const { formatStudent, formatStudentUnifyCodes } = require('../services/students')
const StudyRights = require('../services/studyrights')
const { byId } = require('../services/units')
const Op = Sequelize.Op

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

const withStudents = (student_numbers, conf) => {
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
    //logging: console.log
  })
}

// TODO: remove
const byCriteria = (conf) => {
  const terms = []

  if (conf.minBirthDate || conf.maxBirthDate) {
    const minBirthDate = conf.minBirthDate || '1900-01-01'
    const maxBirthDate = conf.maxBirthDate || `${new Date().getFullYear()}-01-01`
    terms.push({
      birthdate: {
        [Op.between]: [minBirthDate, maxBirthDate]
      }
    })
  }

  if (conf.sex && ['male', 'female'].includes(conf.sex)) {
    terms.push({
      sex: {
        [Op.eq]: conf.sex
      }
    })
  }

  if (conf.matriculationExamination && ['true', 'false'].includes(conf.matriculationExamination)) {
    terms.push({
      matriculationexamination: {
        [Op.eq]: conf.matriculationExamination === 'true' ? '1' : '0'
      }
    })
  }

  if (conf.studentNumbers && conf.studentNumbers.length > 0) {
    terms.push({
      studentnumber: {
        [Op.in]: conf.studentNumbers
      }
    })
  }

  let tagWithConstraint = {
    model: TagStudent
  }

  if (conf.tags && conf.tags.length > 0) {
    const tagRules = conf.tags.map(tag => ({ [Op.eq]: tag['text'] }))

    tagWithConstraint.where = {
      tags_tagname: {
        [Op.or]: tagRules
      }
    }
  }

  let studyrightWithConstraint = {
    model: Studyright
  }
  if (conf.studyRights && conf.studyRights.length > 0) {
    const studyrightRules = conf.studyRights.map(sr => ({ [Op.eq]: sr.name }))
    studyrightWithConstraint.where = {
      highlevelname: {
        [Op.or]: studyrightRules
      },
      prioritycode: {
        [Op.or]: [1, 30]
      },
      studystartdate: {
        [Op.between]: [conf.enrollmentDates[0], conf.enrollmentDates[1]]
      }
    }
  }

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
                [Op.gte]: conf.enrollmentDates[0]
              }
            }
          }
        ],
      },
      tagWithConstraint,
      studyrightWithConstraint
    ],
    where: {
      [Op.and]: terms
    }, 
    //logging: console.log
  }, )

}

const bySelectedCourses = (courses) => (student) => {
  if (courses.length === 0) {
    return true
  } else {
    const passedCourses = student.credits.filter(Credit.passed).map(c => c.courseinstance.course_code)
    return courses.every(c => passedCourses.includes(c))
  }
}

const notAmongExcludes = (conf) => (student) => {
  if (conf.excludeStudentsThatHaveNotStartedStudies &&
    student.credits.length === 0) {
    return false
  }

  if (conf.excludeStudentsWithZeroCredits &&
    student.creditcount === 0) {  // if (conf.enrollmentDates && conf.enrollmentDates.length > 0) {
    return false
  }

  if (conf.excludeStudentsWithPreviousStudies &&
    Student.hasNoPreviousStudies(student.dateofuniversityenrollment)(student)) {
    return false
  }

  if (conf.excludedTags && conf.excludedTags.length > 0) {
    const noExcludedTags = student.tag_students.every(tag =>
      conf.excludedTags.includes(tag.tags_tagname) === false
    )
    if (!noExcludedTags) {
      return false
    }
  }

  if (conf.excludedStudentNumbers &&
    conf.excludedStudentNumbers.includes(student.studentnumber)) {
    return false
  }

  return true
}

const restrictToMonths = (months) => (student) => {
  if (months === undefined || months === null || months.length === 0) {
    return student
  }

  const withinTimerange = Credit.inTimeRange(student.dateofuniversityenrollment, months)
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

// TODO: not used anymore?
const statisticsOf = async (conf) => {
  const students = (await byCriteria(conf))
    .filter(bySelectedCourses(conf.courses))
    .filter(notAmongExcludes(conf))
    .map(restrictToMonths(conf.monthsToStudy))

  return students.map(formatStudent)
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
    
    const students = await withStudents(student_numbers, conf).map(restrictToMonths(query.months)) 

    return students.map(formatStudent)
    
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

    const student_numbers = await StudyRights.ofPopulations(conf).map(s => s.student_studentnumber)

    const students = await withStudents(student_numbers, conf).map(restrictToMonths(query.months))

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
      if (object[course.code] === undefined) {
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
  studyrightsByKeyword, universityEnrolmentDates, statisticsOf,
  optimizedStatisticsOf, bottlenecksOf
}