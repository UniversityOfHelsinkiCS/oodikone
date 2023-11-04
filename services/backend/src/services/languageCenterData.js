const { Course, Credit, Enrollment, StudyrightElement, Studyright } = require('../models')
const { Op } = require('sequelize')
const { redisClient } = require('./redis')
const { getSemestersAndYears } = require('./semesters')
const LANGUAGE_CENTER_REDIS_KEY = 'LANGUAGE_CENTER_DATA'

const isBetween = (start, date, end) =>
  new Date(start).getTime() <= new Date(date).getTime() && new Date(date).getTime() <= new Date(end).getTime()

const getLanguageCenterCourses = async () => {
  const courses = await Course.findAll({
    attributes: ['code', 'name'],
    where: {
      [Op.or]: [{ code: { [Op.like]: 'KK%' } }, { code: { [Op.like]: 'AYKK%' } }],
    },
  })
  return courses
}

const getLanguageCenterData = async () => {
  const dataOnRedis = await redisClient.getAsync(LANGUAGE_CENTER_REDIS_KEY)
  if (dataOnRedis) return JSON.parse(dataOnRedis)
  const freshData = await computeLanguageCenterData()
  redisClient.setAsync(LANGUAGE_CENTER_REDIS_KEY, JSON.stringify(freshData))
  return freshData
}

const computeLanguageCenterData = async () => {
  const courses = await getLanguageCenterCourses()

  const credits = await Credit.findAll({
    attributes: [
      'course_code',
      'credittypecode',
      'student_studentnumber',
      'semestercode',
      'createdate',
      'studyright_id',
    ],
    where: {
      [Op.or]: [{ course_code: { [Op.like]: 'KK%' } }, { course_code: { [Op.like]: 'AYKK%' } }],
    },
  })

  const enrollments = await Enrollment.findAll({
    attributes: ['studentnumber', 'semestercode', 'course_code', 'enrollment_date_time', 'studyright_id'],
    where: {
      [Op.or]: [{ course_code: { [Op.like]: 'KK%' } }, { course_code: { [Op.like]: 'AYKK%' } }],
      state: 'ENROLLED',
    },
  })

  const studyrights = await Studyright.findAll({})

  const studyrightToFacultyMap = studyrights.reduce((obj, cur) => {
    // Filter out: Kielikeskus (?), Aleksanteri-instituutti
    if (['H906', 'H401'].includes(cur.facultyCode)) return obj
    obj[cur.actual_studyrightid] = cur.facultyCode
    return obj
  }, {})

  credits.forEach(c => {
    c.faculty = studyrightToFacultyMap[c.studyright_id]
  })
  enrollments.forEach(c => {
    c.faculty = studyrightToFacultyMap[c.studyright_id]
  })

  const studentList = new Set()
  const attemptsByStudents = {}

  credits.forEach(c => {
    const sn = c.student_studentnumber

    // ignoring 7 (improved), 9 (transferred) and 10 (failed)
    if (c.credittypecode !== 4) return
    studentList.add(sn)
    if (!attemptsByStudents[sn]) {
      attemptsByStudents[sn] = []
    }
    attemptsByStudents[sn].push({
      studentNumber: sn,
      courseCode: c.course_code,
      completed: true,
      date: c.createdate,
      faculty: studyrightToFacultyMap[c.studyright_id],
    })
  })

  enrollments.forEach(e => {
    const sn = e.studentnumber
    if (!attemptsByStudents[sn]) {
      attemptsByStudents[sn] = []
    }
    if (attemptsByStudents[sn].find(att => att.courseCode === e.course_code)) return
    studentList.add(sn)
    attemptsByStudents[sn].push({
      studentNumber: sn,
      courseCode: e.course_code,
      completed: false,
      date: e.enrollment_date_time,
      faculty: studyrightToFacultyMap[e.studyright_id],
    })
  })

  const studyrightElements = await StudyrightElement.findAll({
    attributes: ['studentnumber', 'startdate', 'enddate', 'code'],
    where: {
      studentnumber: { [Op.in]: Array.from(studentList.values()) },
    },
  })

  const studyrightMap = studyrightElements.reduce((obj, cur) => {
    if (!obj[cur.studentnumber]) {
      obj[cur.studentnumber] = [{ startdate: cur.startdate, enddate: cur.enddate, code: cur.code }]
    } else {
      obj[cur.studentnumber].push({ startdate: cur.startdate, enddate: cur.enddate, code: cur.code })
    }
    return obj
  }, {})

  const getFaculty = (studentNumber, date) =>
    studyrightMap[studentNumber]?.find(sr => sr.startdate <= date && sr.enddate >= date)?.code

  const attemptsArray = []
  studentList.forEach(sn => attemptsArray.push(...attemptsByStudents[sn]))

  attemptsArray.forEach(item => {
    if (item.faculty) return
    const faculty = getFaculty(item.studentNumber, item.date)
    if (faculty?.startsWith('MH') || faculty?.startsWith('KH')) {
      item.faculty = faculty.substring(1, 4)
    } else {
      item.faculty = faculty
    }
  })

  const filteredAttempts = attemptsArray.filter(attempt => attempt.faculty?.substring(0, 3).match(`^H\\d`))

  const formattedByFaculties = await formatByFaculties({ attempts: filteredAttempts, courses })

  const faculties = [...new Set(filteredAttempts.map(({ faculty }) => faculty))]

  return { attempts: filteredAttempts, courses, formattedByFaculties, faculties }
}

const formatByFaculties = async ({ attempts, courses }) => {
  const semestersAndYears = await getSemestersAndYears()
  const semesters = Object.values(semestersAndYears.semesters)
  const semesterStatsMap = attempts.reduce((obj, cur) => {
    const semester = semesters.find(s => isBetween(s.startdate, cur.date, s.enddate)).semestercode
    if (!obj[cur.courseCode]) {
      obj[cur.courseCode] = { completed: 0, notCompleted: 0, total: 0 }
    }
    if (!obj[cur.courseCode][semester]) {
      obj[cur.courseCode][semester] = { completed: 0, notCompleted: 0, total: 0 }
    }
    if (!obj[cur.courseCode][semester][cur.faculty]) {
      obj[cur.courseCode][semester][cur.faculty] = { completed: 0, notCompleted: 0, total: 0 }
    }
    const stats = obj[cur.courseCode][semester][cur.faculty]
    const allFacultiesTotal = obj[cur.courseCode][semester]
    const allSemestersTotal = obj[cur.courseCode]
    if (cur.completed) {
      stats.completed += 1
      allFacultiesTotal.completed += 1
      allSemestersTotal.completed += 1
    } else {
      stats.notCompleted += 1
      allFacultiesTotal.notCompleted += 1
      allSemestersTotal.notCompleted += 1
    }
    stats.total += 1
    allFacultiesTotal.total += 1
    allSemestersTotal.total += 1
    return obj
  }, {})

  return courses
    .map(c => ({ ...c.dataValues, bySemesters: semesterStatsMap[c.code] }))
    .filter(course => course.bySemesters)
}

module.exports = {
  getLanguageCenterData,
  getLanguageCenterCourses,
  LANGUAGE_CENTER_REDIS_KEY,
  computeLanguageCenterData,
}
