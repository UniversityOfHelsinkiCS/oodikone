const axios = require('axios')
const moment = require('moment')
const AsyncLock = require('async-lock')
const { USERSERVICE_URL } = require('../conf-backend')
const { Credit, StudyrightElement } = require('../models')

const client = axios.create({ baseURL: USERSERVICE_URL, headers: { 'secret': process.env.USERSERVICE_SECRET } })

const calculateFacultyYearlyStats = async () => {
  const { data: faculties } = await client.get('/faculty_programmes')
  const res = {}
  const lock = new AsyncLock()

  await Promise.all(faculties.map(({ faculty_code, programme_code }) => (
    new Promise(async (facultyRes) => {
      if (!res[faculty_code]) res[faculty_code] = {}

      const facultyStudents = await StudyrightElement.findAll({
        where: {
          code: programme_code
        },
        attributes: ['studentnumber']
      })

      await Promise.all(facultyStudents.map((student) => (
        new Promise(async (studentRes) => {
          const filteredStudentCredits = await Credit.findAll({
            where: {
              student_studentnumber: student.studentnumber,
              credittypecode: [4, 10],
              isStudyModule: false
            }
          })

          filteredStudentCredits.forEach((c) => {
            const attainmentYear = moment(c.attainment_date).year()
            if (!res[faculty_code][attainmentYear]) {
              lock.acquire(faculty_code, (done) => {
                if (!res[faculty_code][attainmentYear]) {
                  const facultyYearStats = {}
                  facultyYearStats.studentCredits = 0
                  facultyYearStats.coursesPassed = 0
                  facultyYearStats.coursesFailed = 0
                  res[faculty_code][attainmentYear] = facultyYearStats
                }
                done()
              })
            }
            const facultyYearStats = res[faculty_code][attainmentYear]
            if (c.credittypecode === 4) {
              facultyYearStats.studentCredits += c.credits
              facultyYearStats.coursesPassed += 1
            } else {
              facultyYearStats.coursesFailed += 1
            }
          })
          studentRes()
        })
      )))
      facultyRes()
    })
  )))
  return res
}

module.exports = {
  calculateFacultyYearlyStats
}