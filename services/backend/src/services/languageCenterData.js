const { Course, Credit, Enrollment, StudyrightElement } = require('../models')
const { Op } = require('sequelize')
const { customLogger } = require('../util/utils')

const getLanguageCenterData = async () => {
  customLogger.start('lcdata')
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
  customLogger.log('lcdata', 'first stop')
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
  customLogger.log('lcdata', 'second stop')

  const studyrightElements = await StudyrightElement.findAll({
    attributes: ['studentnumber', 'startdate', 'enddate', 'code'],
    where: {
      studentnumber: { [Op.in]: studentList },
    },
  })

  const getFaculty = (studentNumber, date) =>
    studyrightElements.find(sr => sr.studentnumber === studentNumber && sr.startdate < date && sr.enddate > date)?.code

  const attempts = Object.values(attemptsByStudents)
    .flat(1)
    .reduce((acc, cur) => [...acc, { ...cur, faculty: getFaculty(cur.studentNumber, cur.date) }], [])
  customLogger.end('lcdata', true)
  return { attempts, courses }
}

module.exports = { getLanguageCenterData }
