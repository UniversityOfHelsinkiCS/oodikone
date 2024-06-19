const { orderBy } = require('lodash')
const { Op } = require('sequelize')

const { Course, Credit, Enrollment, Studyright, StudyrightElement } = require('../models')
const { redisClient } = require('./redis')

const LANGUAGE_CENTER_REDIS_KEY = 'LANGUAGE_CENTER_DATA'

const isBetween = (start, date, end) => {
  return new Date(start).getTime() <= new Date(date).getTime() && new Date(date).getTime() <= new Date(end).getTime()
}

const findStudyright = (studyrights, date) => {
  return studyrights?.find(studyright => isBetween(studyright.startdate, date, studyright.enddate))
}

const getDifference = stats => {
  const value = stats.enrollments - stats.completions
  return value < 0 ? 0 : value
}

const getLanguageCenterCourses = async () => {
  const courses = await Course.findAll({
    attributes: ['code', 'name'],
    where: {
      [Op.or]: [{ code: { [Op.like]: 'KK%' } }, { code: { [Op.like]: 'AYKK%' } }],
    },
    raw: true,
  })
  return courses
}

const createArrayOfCourses = async (attempts, courses) => {
  const fields = { completions: 0, enrollments: 0, difference: 0, rejected: 0 }
  const semestersObject = {}
  const facultyObject = {}
  const semesterStatsMap = attempts.reduce((obj, cur) => {
    const semester = cur.semestercode
    facultyObject[cur.faculty] = true
    semestersObject[semester] = true
    if (!obj[cur.courseCode]) {
      obj[cur.courseCode] = {}
    }
    if (!obj[cur.courseCode][semester]) {
      obj[cur.courseCode][semester] = { ...fields }
    }
    if (cur.faculty && !obj[cur.courseCode][semester][cur.faculty]) {
      obj[cur.courseCode][semester][cur.faculty] = { ...fields }
    }
    const allFacultiesTotal = obj[cur.courseCode][semester]
    const allStats = [allFacultiesTotal]
    if (cur.faculty) {
      const semesterFacultyStats = obj[cur.courseCode][semester][cur.faculty]
      allStats.push(semesterFacultyStats)
    }
    for (const stats of allStats) {
      if (cur.completed) {
        stats.completions += 1
      } else if (cur.enrolled) {
        stats.enrollments += 1
      } else {
        stats.rejected += 1
      }
    }
    return obj
  }, {})

  const courseList = courses
    .map(course => ({ ...course, bySemesters: { ...semesterStatsMap[course.code], cellStats: {} } }))
    .filter(course => course.bySemesters)

  courseList.forEach(course => {
    Object.keys(semestersObject).forEach(semester => {
      const stats = course.bySemesters[semester]
      if (!stats) return
      stats.difference = getDifference(stats)
      Object.keys(facultyObject).forEach(faculty => {
        const stats = course.bySemesters[semester]?.[faculty]
        if (!stats) return
        stats.difference = getDifference(stats)
      })
    })
  })

  return courseList
}

const computeLanguageCenterData = async () => {
  const courses = await getLanguageCenterCourses()
  const autumnSemester2017 = 135

  const credits = await Credit.findAll({
    attributes: ['course_code', 'student_studentnumber', 'semestercode', 'attainment_date', 'studyright_id'],
    where: {
      [Op.or]: [{ course_code: { [Op.like]: 'KK%' } }, { course_code: { [Op.like]: 'AYKK%' } }],
      semestercode: { [Op.gte]: autumnSemester2017 },
      credittypecode: 4,
    },
    raw: true,
  })

  const enrollments = await Enrollment.findAll({
    attributes: ['studentnumber', 'semestercode', 'course_code', 'enrollment_date_time', 'studyright_id', 'state'],
    where: {
      [Op.or]: [{ course_code: { [Op.like]: 'KK%' } }, { course_code: { [Op.like]: 'AYKK%' } }],
      semestercode: { [Op.gte]: autumnSemester2017 },
      state: { [Op.in]: ['ENROLLED', 'REJECTED'] },
    },
    raw: true,
  })

  const studyrights = await Studyright.findAll({ raw: true })

  const attemptStudyrightToFacultyMap = studyrights.reduce((obj, cur) => {
    if (!cur.actual_studyrightid) return obj
    // ^The studyright id should exist, but there was once a faulty row temporarily in studyright-table,
    // which screwed up the faculties due to null getting a value to this map
    obj[cur.actual_studyrightid] = cur.facultyCode
    return obj
  }, {})

  const studentnumberToStudyrightsMap = studyrights.reduce((obj, cur) => {
    if (!obj[cur.studentStudentnumber]) obj[cur.studentStudentnumber] = []
    obj[cur.studentStudentnumber].push(cur)
    return obj
  }, {})

  const elementStudyrightIdToStudyrightMap = studyrights.reduce((obj, cur) => {
    obj[cur.studyrightid] = cur
    return obj
  }, {})

  credits.forEach(credit => {
    credit.faculty = attemptStudyrightToFacultyMap[credit.studyright_id]
  })
  enrollments.forEach(enrollment => {
    enrollment.faculty = attemptStudyrightToFacultyMap[enrollment.studyright_id]
  })

  const studentNumbers = new Set()
  const attemptsByStudents = {}

  credits.forEach(credit => {
    const studentNumber = credit.student_studentnumber
    studentNumbers.add(studentNumber)
    if (!attemptsByStudents[studentNumber]) {
      attemptsByStudents[studentNumber] = []
    }
    attemptsByStudents[studentNumber].push({
      studentNumber,
      courseCode: credit.course_code,
      completed: true,
      date: credit.attainment_date,
      faculty: attemptStudyrightToFacultyMap[credit.studyright_id],
      semestercode: credit.semestercode,
    })
  })

  enrollments.forEach(enrollment => {
    const studentNumber = enrollment.studentnumber
    if (!attemptsByStudents[studentNumber]) {
      attemptsByStudents[studentNumber] = []
    }
    studentNumbers.add(studentNumber)
    if (
      attemptsByStudents[studentNumber].find(
        attempt =>
          !attempt.completed &&
          attempt.semestercode === enrollment.semestercode &&
          attempt.courseCode === enrollment.course_code
      )
    ) {
      return
    }
    attemptsByStudents[studentNumber].push({
      studentNumber,
      courseCode: enrollment.course_code,
      completed: false,
      date: enrollment.enrollment_date_time,
      faculty: attemptStudyrightToFacultyMap[enrollment.studyright_id],
      semestercode: enrollment.semestercode,
      enrolled: enrollment.state === 'ENROLLED',
    })
  })

  const studyrightElements = await StudyrightElement.findAll({
    attributes: ['studentnumber', 'startdate', 'enddate', 'code', 'studyrightid'],
    where: {
      studentnumber: { [Op.in]: Array.from(studentNumbers.values()) },
    },
    raw: true,
  })

  const studyrightElementsMap = studyrightElements.reduce((obj, cur) => {
    if (!obj[cur.studentnumber]) {
      obj[cur.studentnumber] = []
    }
    obj[cur.studentnumber].push({
      startdate: cur.startdate,
      enddate: cur.enddate,
      code: elementStudyrightIdToStudyrightMap[cur.studyrightid]?.facultyCode,
    })
    return obj
  }, {})

  const getFaculty = (studentNumber, date) =>
    findStudyright(studyrightElementsMap[studentNumber], date)?.code ||
    findStudyright(studentnumberToStudyrightsMap[studentNumber], date)?.facultyCode

  const attempts = []
  studentNumbers.forEach(studentNumber => attempts.push(...attemptsByStudents[studentNumber]))
  // 93033 Avoin yliopisto, yhteistyöoppilaitokset
  // 93034 Kesäyliopistot
  const isOpenUni = code => ['9301', 'H930', '93033', '93034'].includes(code)
  const isMisc = code => ['H906', 'H401'].includes(code) // Language center, Alexander institute (very few numbers)

  attempts.forEach(attempt => {
    if (attempt.faculty) {
      if (isOpenUni(attempt.faculty)) {
        attempt.faculty = 'OPEN'
      } else if (isMisc(attempt.faculty) || !attempt.faculty.substring(0, 3).match('^H\\d')) {
        attempt.faculty = 'OTHER'
      }
      return
    }

    // Credit or enrollment did not have studyright_id. Find based on date,
    // and if studyrightElement is not found, check studyrights because open uni rights
    // do not have studyrightelements
    const faculty = getFaculty(attempt.studentNumber, attempt.date)
    if (isOpenUni(faculty)) {
      attempt.faculty = 'OPEN'
    } else if (faculty?.substring(0, 3).match('^H\\d')) {
      attempt.faculty = !isMisc(faculty) ? faculty : 'OTHER'
    } else {
      attempt.faculty = 'OTHER'
    }
  })

  const faculties = [...new Set(attempts.map(({ faculty }) => faculty))]

  const unorderedTableData = await createArrayOfCourses(attempts, courses)

  const tableData = orderBy(unorderedTableData, 'code')

  return { tableData, faculties }
}

const getLanguageCenterData = async () => {
  const dataOnRedis = await redisClient.getAsync(LANGUAGE_CENTER_REDIS_KEY)
  if (dataOnRedis) return JSON.parse(dataOnRedis)
  const freshData = await computeLanguageCenterData()
  redisClient.setAsync(LANGUAGE_CENTER_REDIS_KEY, JSON.stringify(freshData))
  return freshData
}

module.exports = {
  getLanguageCenterData,
  LANGUAGE_CENTER_REDIS_KEY,
  computeLanguageCenterData,
  createArrayOfCourses,
}
