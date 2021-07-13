const axios = require('axios')
const moment = require('moment')
const eachLimit = require('async/eachLimit')
const { USERSERVICE_URL, DB_MAX_CRON_CONNECTIONS } = require('../conf-backend')
const { Credit, StudyrightElement } = require('../models')
const { lruMemoize } = require('../util')

const client = axios.create({ baseURL: USERSERVICE_URL, headers: { secret: process.env.USERSERVICE_SECRET } })

const calculateFacultyYearlyStats = async () => {
  const { data: facultyProgrammes } = await client.get('/faculty_programmes')

  const getFilteredStudentCredits = lruMemoize(
    studentNumber =>
      Credit.findAll({
        where: {
          student_studentnumber: studentNumber,
          credittypecode: [4, 10],
          isStudyModule: false,
        },
      }),
    args => args[0],
    {
      max: 10000,
    }
  )

  const res = {}
  const studentSets = {}

  let amountDone = 0
  // Don't try to make this fast with Promise.all without taking into consideration that
  // we only have a limited amount of database connections
  for (const { faculty_code, programme_code } of facultyProgrammes) {
    if (!res[faculty_code]) {
      res[faculty_code] = {}
      studentSets[faculty_code] = {}
    }
    if (!res[faculty_code][programme_code]) {
      res[faculty_code][programme_code] = {}
      studentSets[faculty_code][programme_code] = {}
    }

    const facultyStudents = await StudyrightElement.findAll({
      where: {
        code: programme_code,
      },
      attributes: ['studentnumber'],
    })

    await eachLimit(facultyStudents, DB_MAX_CRON_CONNECTIONS, async student => {
      const filteredStudentCredits = await getFilteredStudentCredits(student.studentnumber)

      filteredStudentCredits.forEach(c => {
        const attainmentYear = moment(c.attainment_date).year()
        if (!res[faculty_code][attainmentYear] && !res[faculty_code][programme_code][attainmentYear]) {
          const facultyYearStats = {}
          facultyYearStats.studentCredits = 0
          facultyYearStats.coursesPassed = 0
          facultyYearStats.coursesFailed = 0
          facultyYearStats.students = 0
          facultyYearStats.studentArray = []
          res[faculty_code][programme_code][attainmentYear] = facultyYearStats
          studentSets[faculty_code][programme_code][attainmentYear] = new Set()
        }
        const facultyYearStats = res[faculty_code][programme_code][attainmentYear]
        const studentSet = studentSets[faculty_code][programme_code][attainmentYear]
        if (!studentSet.has(c.student_studentnumber)) {
          facultyYearStats.students++
          facultyYearStats.studentArray.push(c.student_studentnumber)
          studentSet.add(c.student_studentnumber)
        }
        if (c.credittypecode === 4) {
          facultyYearStats.studentCredits += c.credits
          facultyYearStats.coursesPassed += 1
        } else {
          facultyYearStats.coursesFailed += 1
        }
      })
    })

    amountDone += 1
    console.log(`Faculty programmes done ${amountDone}/${facultyProgrammes.length}`)
  }

  return res
}

module.exports = {
  calculateFacultyYearlyStats,
}
