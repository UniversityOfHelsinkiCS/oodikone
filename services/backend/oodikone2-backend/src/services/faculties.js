const axios = require('axios')
const moment = require('moment')
const AsyncLock = require('async-lock')
const { USERSERVICE_URL } = require('../conf-backend')
const { Credit, StudyrightElement } = require('../models')

const client = axios.create({ baseURL: USERSERVICE_URL, headers: { 'secret': process.env.USERSERVICE_SECRET } })

const refreshFacultyYearlyStats = async () => {
  const { data: faculties } = await client.get('/faculty_programmes')
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
              credittypecode: 4,
              isStudyModule: false
            }
          })

          filteredStudentCredits.forEach((c) => {
            const attainmentYear = moment(c.attainment_date).year()
            if (!res[faculty_code][attainmentYear]) {
              lock.acquire(faculty_code, (done) => {
                if (!res[faculty_code][attainmentYear]) res[faculty_code][attainmentYear] = 0
                done()
              })
            }
            res[faculty_code][attainmentYear] += c.credits
          })
          studentRes()
        })
      )))
      facultyRes()
    })
  )))
}

const start = async () => {
  let stamp = new Date().getTime()
  await refreshFacultyYearlyStats()
  let now = new Date().getTime()
  console.log(now - stamp)
}

start()