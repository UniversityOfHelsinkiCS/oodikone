const { Op } = require('sequelize')
const moment = require('moment')
const { studentNumbersWithAllStudyRightElements } = require('./studyrights')
const { Student, Credit, CourseInstance, Course, sequelize, Studyright, StudyrightExtent } = require('../models')
const { formatStudent } = require('../services/students')
const { getAllDuplicates } = require('./courses')

const enrolmentDates = () => {
  const query = 'SELECT DISTINCT s.dateOfUniversityEnrollment as date FROM Student s'
  return sequelize.query(query, { type: sequelize.QueryTypes.SELECT }
  )
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
      },
      {
        model: Studyright,
        required: true,
        attributes: ['studyrightid', 'highlevelname', 'extentcode', 'graduated'],
        include: {
          model: StudyrightExtent
        }
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

const studentnumbersWithAllStudyrightElementsAndCreditsBetween = async (studyRights, startDate, endDate, months) => {
  const creditBeforeDate = dateMonthsFromNow(startDate, months)
  const query = `
    SELECT
        DISTINCT credit.student_studentnumber
    FROM
        credit
    INNER JOIN
            studyright_elements
        ON
            credit.student_studentnumber = studyright_elements.studentnumber
        AND
        studyright_elements.code IN(:studyRights)
        AND
        studyright_elements.startdate BETWEEN :startDate AND :endDate
    INNER JOIN
            courseinstance
        ON
            credit.courseinstance_id = courseinstance.id
        AND
            courseinstance.coursedate BETWEEN :startDate AND :creditBeforeDate
    GROUP BY
        credit.student_studentnumber
    HAVING
        COUNT(DISTINCT(studyright_elements.code)) = :studyRightsLength;
    ;
  `
  const result = await sequelize.query(query, {
    replacements: {
      studyRights,
      startDate,
      endDate,
      creditBeforeDate,
      studyRightsLength: studyRights.length
    },
    type: sequelize.QueryTypes.SELECT
  })
  return result.map(student => student.student_studentnumber)
}

const parseQueryParams = query => {
  const { semester, year, studyRights, months } = query
  const startDate = `${year}-${semesterStart[semester]}`
  const endDate = `${year}-${semesterEnd[semester]}`
  return {
    studyRights,
    months,
    startDate, 
    endDate
  }
}

const formatStudentsForApi = (students, startDate, endDate) => {
  const result = students.reduce((stats, student) => {
    student.studyrights.forEach(studyright => {
      if (studyright.studyright_extent) {
        const { extentcode, name } = studyright.studyright_extent
        stats.extents[extentcode] = { extentcode, name }
      }
    })
    stats.students.push(formatStudentForOldApi(student, startDate, endDate))
    return stats
  },{
    students: [],
    extents: {}
  })
  return {
    students: result.students,
    extents: Object.values(result.extents)
  }
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
  return formatStudentsForApi(students, startDate, endDate)
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
  },
  grades: {
  }
})

const parseCredit = credit => ({
  coursecode: credit.courseinstance.course_code,
  coursenames: credit.courseinstance.course.name,
  studentnumber: credit.student_studentnumber,
  grade: credit.grade,
  passed: Credit.passed({ grade: credit.grade })
})

const updateStudentStatistics = (coursestats, studentnumber, isPassingGrade, grade) => {
  const { students, stats, grades } = coursestats

  const gradecount = grades[grade] || 0
  grades[grade] = gradecount + 1

  const isFirstEntry = !students.all.has(studentnumber)
  const hasFailedBefore = !isFirstEntry && students.failed.has(studentnumber)
  const hasPassedBefore = !isFirstEntry && students.passed.has(studentnumber)


  stats.attempts += 1

  students.notParticipated.delete(studentnumber)
  students.all.add(studentnumber)

  if (isFirstEntry) {
    students.all.add(studentnumber)
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

const bottlenecksOf = async (query) => {
  if (semesterStart[query.semester] === undefined) {
    return { error: 'Semester should be either SPRING OR FALL' }
  }
  const { studyRights, startDate, endDate, months } = parseQueryParams(query)
  const codeduplicates = await getAllDuplicates()
  let studentnumbers = await studentnumbersWithAllStudyrightElementsAndCreditsBetween(studyRights, startDate, endDate, months)
  const students = await getStudentsIncludeCreditsBefore(studentnumbers, dateMonthsFromNow(startDate, months))
  const coursestudentstatistics = students.reduce((coursemap, student) => {
    student.credits.forEach(credit => {
      const { coursecode, coursenames, studentnumber, passed, grade } = parseCredit(credit)
      const unifiedcode = getUnifiedCode(coursecode, codeduplicates)
      let coursestats = coursemap.get(unifiedcode) || newCourseStatsObject(coursecode, coursenames, studentnumbers)
      if (!coursemap.has(unifiedcode)) {
        coursemap.set(unifiedcode, coursestats)
      }
      updateStudentStatistics(coursestats, studentnumber, passed, grade)
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


module.exports = {
  universityEnrolmentDates,
  optimizedStatisticsOf, bottlenecksOf
}