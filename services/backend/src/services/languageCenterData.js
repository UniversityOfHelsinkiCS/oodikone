const { Course, Credit, Enrollment, StudyrightElement } = require('../models')
const { Op } = require('sequelize')

const getLanguageCenterData = async () => {
  const courses = await Course.findAll({
    attributes: ['code', 'name'],
    where: {
      [Op.or]: [{ code: { [Op.like]: 'KK%' } }, { code: { [Op.like]: 'AYKK%' } }],
    },
  })

  const credits = await Credit.findAll({
    attributes: ['course_code', 'credittypecode', 'student_studentnumber', 'semestercode', 'createdate'],
    where: {
      [Op.or]: [{ course_code: { [Op.like]: 'KK%' } }, { course_code: { [Op.like]: 'AYKK%' } }],
    },
  })

  const enrollments = await Enrollment.findAll({
    attributes: ['studentnumber', 'semestercode', 'course_code', 'enrollment_date_time'],
    where: {
      [Op.or]: [{ course_code: { [Op.like]: 'KK%' } }, { course_code: { [Op.like]: 'AYKK%' } }],
    },
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
    attemptsByStudents[sn].push({ studentNumber: sn, courseCode: c.course_code, completed: true, date: c.createdate })
  })

  enrollments.forEach(e => {
    const sn = e.studentnumber
    if (attemptsByStudents[sn] && attemptsByStudents[sn].find(att => att.courseCode === e.course_code)) return
    studentList.add(sn)
    if (!attemptsByStudents[sn]) {
      attemptsByStudents[sn] = []
    }
    attemptsByStudents[sn].push({
      studentNumber: sn,
      courseCode: e.course_code,
      completed: false,
      date: e.enrollment_date_time,
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
    const faculty = getFaculty(item.studentNumber, item.date)
    if (faculty?.startsWith('MH') || faculty?.startsWith('KH')) {
      item.faculty = faculty.substring(1, 4)
    } else {
      item.faculty = faculty
    }
  })
  return { attempts: attemptsArray, courses }
}

module.exports = { getLanguageCenterData }
