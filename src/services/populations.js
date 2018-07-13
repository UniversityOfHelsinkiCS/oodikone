const Sequelize = require('sequelize')
const { Op } = Sequelize
const _ = require('lodash')
const moment = require('moment')
const { studentNumbersWithAllStudyRightElements } = require('./studyrights')
const { Studyright, Student, Credit, CourseInstance, Course, sequelize } = require('../models')
const { formatStudent, formatStudentsUnifyCourseCodes } = require('../services/students')
const { getAllDuplicates } = require('./courses')

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

const getStudentsIncludeCoursesBetween = async (studentnumbers, startDate, endDate) => {
  const students = await Student.findAll({
    attributes: ['firstnames', 'lastname', 'studentnumber', 'dateofuniversityenrollment', 'creditcount', 'matriculationexamination', 'abbreviatedname', 'email'],
    include: [
      {
        model: Credit,
        attributes: ['grade', 'credits', 'isStudyModuleCredit'],
        required: true,
        include: [
          {
            model: CourseInstance,
            attributes: ['coursedate', 'course_code'],
            include: {
              model: Course,
              attributes: ['name']
            },
            required: true,
            where: {
              coursedate: {
                [Op.between]: [startDate, endDate]
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
  return students
}

const getStudentsIncludeCreditsBefore = (studentnumbers, endDate) => {
  return Student.findAll({
    attributes: ['studentnumber'],
    include: [
      {
        model: Credit,
        attributes: ['grade', 'student_studentnumber'],
        required: true,
        include: [
          {
            model: CourseInstance,
            attributes: ['course_code'],
            include: {
              model: Course,
              attributes: ['name']
            },
            where: {
              coursedate: {
                [Op.lt]: endDate
              }
            },
          }
        ]
      }
    ],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers
      }
    },
  })
}

// This query is extremely slow for some reason, fix it. 
const getCreditsBeforeForStudents = (studentnumbers, endDate) => {
  return Credit.findAll({
    attributes: ['grade', 'student_studentnumber'],
    include: [
      {
        model: CourseInstance,
        attributes: [],
        include: {
          model: Course,
          attributes: ['name']
        },
        where: {
          coursedate: {
            [Op.lt]: endDate
          }
        }
      }
    ],
    where: {
      student_studentnumber: {
        [Op.in]: studentnumbers
      }
    }
  })
}

const optimizedStatisticsOf = async (query) => {
  if (semesterStart[query.semester] === undefined) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }
  const { studyRights, semester, year, months } = query
  const startDate = `${year}-${semesterStart[semester]}`
  const endDate = `${year}-${semesterEnd[semester]}`
  const studentnumbers = await studentNumbersWithAllStudyRightElements(studyRights, startDate, endDate)
  const students = await getStudentsIncludeCoursesBetween(studentnumbers, startDate, dateMonthsFromNow(startDate, months))
  return students.map(formatStudentForOldApi)
}

const getStudentCourseStatistics = student => {
  const courses = _.groupBy(student.courses, c => c.course.code)
  const result = Object.keys(courses).map(code=>{
    const instances = courses[code]
    return {
      course: courses[code][0].course,
      attempts: instances.length,
      passed: instances.some(c=>c.passed), 
      student: student.studentNumber
    }
  })
  return result
}

const bottlenecksOfOld = async (query) => {
  const { semester, year, studyRights, months } = query
  if (semesterStart[semester] === undefined) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }

  const startDate = `${year}-${semesterStart[semester]}`
  const endDate = `${year}-${semesterEnd[semester]}`

  try {
    const studentnumbers = await studentNumbersWithAllStudyRightElements(studyRights, startDate, endDate)
    const students = await getStudentsIncludeCreditsBefore(studentnumbers, dateMonthsFromNow(startDate, months))
    const formattedstudents = await formatStudentsUnifyCourseCodes(students)
    const courses = _.flatten(formattedstudents.map(getStudentCourseStatistics))
    const toNameMap = (names, { course }) => {
      const { code, name } = course
      if (!names[code] || (names[code].fi.startsWith('Avoin yo') && !name.fi.startsWith('Avoin yo')) ) {
        names[code] = name
      }
      return names
    }
    const courseNames = courses.reduce(toNameMap, {})
    const groupedCourses = _.groupBy(courses, c => c.course.code)
    const stats = Object.keys(groupedCourses).map(courseCode => {
      return {
        course: {
          name: courseNames[courseCode],
          code: courseCode
        },
        stats: statsOfNew(groupedCourses[courseCode], students.length),
        students: studentsOfNew(groupedCourses[courseCode], studentnumbers)
      }
    })
    return stats.sort((c1, c2) => c2.stats.attempts - c1.stats.attempts)
  } catch (e) {
    console.log(e)
    return { error: `No such study rights: ${query.studyRights}` }
  }
}

const studentsOfNew = (instances, studentnumbers) => {
  const studentNumber = i => i.student
  const passedStudents = i => i.passed
  const failedStudents = i => !i.passed
  const passed = instances.filter(passedStudents).map(studentNumber)
  const failed = instances.filter(failedStudents).map(studentNumber)
  const nTimes = instances.filter(i => i.attempts > 1)
  const retryPassed = nTimes.filter(passedStudents).map(studentNumber)
  const failedMany = nTimes.filter(failedStudents).map(studentNumber)
  const all = passed.concat(failed)
  const notParticipated = _.difference(studentnumbers, all)
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

const statsOfNew = (instances, populationSize) => {
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

const unifyOpenUniversity = (code) => {
  if (code[0] === 'A') {
    return code.substring(code[1] === 'Y' ? 2 :1 )
  } 
  return code
}

const getUnifiedCode = (code, codeduplicates) => {
  const formattedcode = unifyOpenUniversity(code)
  const unifiedcodes = codeduplicates[formattedcode]
  return !unifiedcodes ? formattedcode : unifiedcodes.main
}

const newCourseStatsObject = (code, name, studentnumbers) => ({
  course: { 
    code,
    name,
  },
  students: {
    all: new Set(),
    passed: new Set(),
    failed: new Set(),
    retryPassed: new Set(),
    failedMany: new Set(),
    notParticipated: new Set(studentnumbers),
    notParticipatedOrFailed: new Set(studentnumbers)
  },
  stats: { 
    students: 0,
    passed: 0,
    failed: 0,
    percentage: undefined,
    failedMany: 0,
    retryPassed: 0,
    attempts: 0,
    passedOfPopulation: undefined,
    triedOfPopulation: undefined
  }
})

const parseCredit = credit => ({
  coursecode: credit.courseinstance.course_code,
  coursenames: credit.courseinstance.course.name,
  studentnumber: credit.student_studentnumber,
  passed: Credit.passed({ grade: credit.grade })
})

const updateStudentStatistics = (coursestats, studentnumber, isPassingGrade) => {
  const { students, stats } = coursestats
  const isFirstEntry = !students.all.has(studentnumber)
  const hasFailedBefore = !isFirstEntry && students.failed.has(studentnumber)
  const hasPassedBefore = !isFirstEntry && students.passed.has(studentnumber)

  stats.attempts += 1

  if (isFirstEntry) {
    students.all.add(studentnumber)
    students.notParticipated.delete(studentnumber)
    stats.students += 1
  }

  if (isPassingGrade) {
    if (!hasPassedBefore) {
      students.passed.add(studentnumber)
      students.notParticipatedOrFailed.delete(studentnumber)    
      stats.passed += 1
    }
    if (hasFailedBefore) {
      students.retryPassed.add(studentnumber)
      stats.retryPassed += 1
      students.failed.delete(studentnumber)
      stats.failed -= 1
    }
  } else if (hasFailedBefore) {
    students.failedMany.add(studentnumber)
    stats.failedMany += 1
  } else {
    students.failed.add(studentnumber)
    stats.failed += 1
  }
}

const percentageOf = (num, denom) => Number((100 * num / denom).toFixed(2))

const setToOldApiObject = snumberset => [...snumberset.values()].reduce((numbers, studentnumber) => {
  numbers[studentnumber] = true
  return numbers
}, {})

const formatStudentsForOldApi = students => {
  Object.keys(students).forEach(key => {
    const studentnumberset = students[key]
    students[key] = setToOldApiObject(studentnumberset)
  })
  return students
}

const bottlenecksOfNew = async (query) => {
  const { semester, year, studyRights, months } = query
  if (semesterStart[semester] === undefined) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }
  const codeduplicates = await getAllDuplicates()
  const startDate = `${year}-${semesterStart[semester]}`
  const endDate = `${year}-${semesterEnd[semester]}`
  let studentnumbers = await studentNumbersWithAllStudyRightElements(studyRights, startDate, endDate)
  const students = await getStudentsIncludeCreditsBefore(studentnumbers, dateMonthsFromNow(startDate, months))
  const coursestudentstatistics = students.reduce((coursemap, student) => {
    student.credits.forEach(credit => {
      const { coursecode, coursenames, studentnumber, passed } = parseCredit(credit)
      const unifiedcode = getUnifiedCode(coursecode, codeduplicates)
      let coursestats = coursemap.get(unifiedcode) || newCourseStatsObject(coursecode, coursenames, studentnumbers)
      if (!coursemap.has(unifiedcode)) {
        coursemap.set(unifiedcode, coursestats)
      }
      updateStudentStatistics(coursestats, studentnumber, passed)  
    })
    return coursemap
  }, new Map())
  const statsarray = [ ...coursestudentstatistics.values() ].map(courseStats => {
    const { stats } = courseStats
    stats.percentage = percentageOf(stats.passed, stats.students) 
    stats.passedOfPopulation = percentageOf(stats.passed, studentnumbers.length)
    stats.triedOfPopulation = percentageOf(stats.students, studentnumbers.length)
    formatStudentsForOldApi(courseStats.students)
    return courseStats
  })
  return statsarray
}

const useNew = false
const bottlenecksOf = useNew ? bottlenecksOfNew : bottlenecksOfOld

module.exports = {
  studyrightsByKeyword, universityEnrolmentDates,
  optimizedStatisticsOf, bottlenecksOf, bottlenecksOfNew, bottlenecksOfOld
}