const { Course, Credit, Enrollment, StudyrightElement, Studyright } = require('../models')
const { Op } = require('sequelize')
const { redisClient } = require('./redis')
const { orderBy } = require('lodash')
const LANGUAGE_CENTER_REDIS_KEY = 'LANGUAGE_CENTER_DATA'

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
    if (!cur.actual_studyrightid) return obj
    // ^The studyright id should exist, but there was once a faulty row temporarily in studyright-table,
    // which screwed up the faculties due to null getting a value to this map
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
      semestercode: c.semestercode,
    })
  })

  enrollments.forEach(e => {
    const sn = e.studentnumber
    if (!attemptsByStudents[sn]) {
      attemptsByStudents[sn] = []
    }
    studentList.add(sn)
    if (
      attemptsByStudents[sn].find(
        att => !att.completed && att.semestercode === e.semestercode && att.courseCode === e.course_code
      )
    )
      return
    attemptsByStudents[sn].push({
      studentNumber: sn,
      courseCode: e.course_code,
      completed: false,
      date: e.enrollment_date_time,
      faculty: studyrightToFacultyMap[e.studyright_id],
      semestercode: e.semestercode,
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
  const faculties = [...new Set(filteredAttempts.map(({ faculty }) => faculty))]
  const unorderedTableData = await createArrayOfCourses(filteredAttempts, courses)

  const tableData = orderBy(unorderedTableData, 'code')

  return { tableData, faculties }
}

const createArrayOfCourses = async (attempts, courses) => {
  const fields = { completions: 0, enrollments: 0, ratio: 0 }
  const semesterStatsMap = attempts.reduce((obj, cur) => {
    const semester = cur.semestercode
    if (!obj[cur.courseCode]) {
      obj[cur.courseCode] = { ...fields }
    }
    if (!obj[cur.courseCode][semester]) {
      obj[cur.courseCode][semester] = { ...fields }
    }
    if (!obj[cur.courseCode][semester][cur.faculty]) {
      obj[cur.courseCode][semester][cur.faculty] = { ...fields }
    }
    if (!obj[cur.courseCode].byFaculties?.[cur.faculty]) {
      if (!obj[cur.courseCode].byFaculties) obj[cur.courseCode].byFaculties = { ...fields }
      obj[cur.courseCode].byFaculties[cur.faculty] = { ...fields }
    }
    const semesterFacultyStats = obj[cur.courseCode][semester][cur.faculty]
    const allFacultiesTotal = obj[cur.courseCode][semester]
    const allSemestersTotal = obj[cur.courseCode]
    const facultyTotalStats = obj[cur.courseCode].byFaculties[cur.faculty]
    const allStats = [semesterFacultyStats, allFacultiesTotal, allSemestersTotal, facultyTotalStats]
    for (const stats of allStats) {
      if (cur.completed) {
        stats.completions += 1
      } else {
        stats.enrollments += 1
      }
      stats.ratio = stats.enrollments === 0 ? 1 : stats.completions / stats.enrollments
      if (stats.ratio > 1) stats.ratio = 1
    }
    return obj
  }, {})

  return courses
    .map(c => ({ ...c.dataValues, bySemesters: { ...semesterStatsMap[c.code], cellStats: {} } }))
    .filter(course => course.bySemesters)
}

module.exports = {
  getLanguageCenterData,
  getLanguageCenterCourses,
  LANGUAGE_CENTER_REDIS_KEY,
  computeLanguageCenterData,
}
