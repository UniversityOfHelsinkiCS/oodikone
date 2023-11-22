const { Course, Credit, Enrollment, StudyrightElement, Studyright } = require('../models')
const { Op } = require('sequelize')
const { redisClient } = require('./redis')
const { orderBy } = require('lodash')
const LANGUAGE_CENTER_REDIS_KEY = 'LANGUAGE_CENTER_DATA'

const isBetween = (start, date, end) =>
  new Date(start).getTime() <= new Date(date).getTime() && new Date(date).getTime() <= new Date(end).getTime()

const findStudyright = (studyrights, date) => studyrights?.find(sr => isBetween(sr.startdate, date, sr.enddate))

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
    attributes: ['course_code', 'student_studentnumber', 'semestercode', 'credit_date_time', 'studyright_id'],
    where: {
      [Op.or]: [{ course_code: { [Op.like]: 'KK%' } }, { course_code: { [Op.like]: 'AYKK%' } }],
      credittypecode: 4,
    },
    raw: true,
  })

  const enrollments = await Enrollment.findAll({
    attributes: ['studentnumber', 'semestercode', 'course_code', 'enrollment_date_time', 'studyright_id'],
    where: {
      [Op.or]: [{ course_code: { [Op.like]: 'KK%' } }, { course_code: { [Op.like]: 'AYKK%' } }],
      state: 'ENROLLED',
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

  credits.forEach(c => {
    c.faculty = attemptStudyrightToFacultyMap[c.studyright_id]
  })
  enrollments.forEach(c => {
    c.faculty = attemptStudyrightToFacultyMap[c.studyright_id]
  })

  const studentList = new Set()
  const attemptsByStudents = {}

  credits.forEach(c => {
    const sn = c.student_studentnumber
    studentList.add(sn)
    if (!attemptsByStudents[sn]) {
      attemptsByStudents[sn] = []
    }
    attemptsByStudents[sn].push({
      studentNumber: sn,
      courseCode: c.course_code,
      completed: true,
      date: c.createdate,
      faculty: attemptStudyrightToFacultyMap[c.studyright_id],
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
      faculty: attemptStudyrightToFacultyMap[e.studyright_id],
      semestercode: e.semestercode,
    })
  })

  const studyrightElements = await StudyrightElement.findAll({
    attributes: ['studentnumber', 'startdate', 'enddate', 'code', 'studyrightid'],
    where: {
      studentnumber: { [Op.in]: Array.from(studentList.values()) },
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

  const attemptsArray = []
  studentList.forEach(sn => attemptsArray.push(...attemptsByStudents[sn]))
  // 93033 Avoin yliopisto, yhteistyöoppilaitokset"
  // 93034 Kesäyliopistot
  const isOpenUni = code => ['9301', 'H930', '93033', '93034'].includes(code)
  const isMisc = code => ['H906', 'H401'].includes(code) // Language center, Alexander institute (very few numbers)

  attemptsArray.forEach(item => {
    if (item.faculty) {
      if (isOpenUni(item.faculty)) {
        item.faculty = 'OPEN'
      } else if (isMisc(item.faculty) || !item.faculty.substring(0, 3).match(`^H\\d`)) {
        item.faculty = 'OTHER'
      }
      return
    }

    // Credit or enrollment did not have studyright_id. Find based on date,
    // and if studyrightElement is not found, check studyrights because open uni rights
    // do not have studyrightelements
    const faculty = getFaculty(item.studentNumber, item.date)
    if (isOpenUni(faculty)) {
      item.faculty = 'OPEN'
    } else if (faculty?.substring(0, 3).match(`^H\\d`)) {
      item.faculty = !isMisc(faculty) ? faculty : 'OTHER'
    } else {
      item.faculty = 'OTHER'
    }
  })

  const faculties = [...new Set(attemptsArray.map(({ faculty }) => faculty))]

  const unorderedTableData = await createArrayOfCourses(attemptsArray, courses)

  const tableData = orderBy(unorderedTableData, 'code')

  return { tableData, faculties }
}

const createArrayOfCourses = async (attempts, courses) => {
  const fields = { completions: 0, enrollments: 0, difference: 0 }
  const semestersObject = {}
  const facultyObject = {}
  const semesterStatsMap = attempts.reduce((obj, cur) => {
    const semester = cur.semestercode
    facultyObject[cur.faculty] = true
    semestersObject[semester] = true
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
    }
    return obj
  }, {})

  const courseList = courses
    .map(c => ({ ...c, bySemesters: { ...semesterStatsMap[c.code], cellStats: {} } }))
    .filter(course => course.bySemesters)

  courseList.forEach(course => {
    Object.keys(semestersObject).forEach(sem => {
      const stats = course.bySemesters[sem]
      if (!stats) return
      stats.difference = getDifference(stats)
      Object.keys(facultyObject).forEach(fac => {
        const stats = course.bySemesters[sem]?.[fac]
        if (!stats) return
        stats.difference = getDifference(stats)
      })
    })
  })

  return courseList
}

module.exports = {
  getLanguageCenterData,
  LANGUAGE_CENTER_REDIS_KEY,
  computeLanguageCenterData,
}
