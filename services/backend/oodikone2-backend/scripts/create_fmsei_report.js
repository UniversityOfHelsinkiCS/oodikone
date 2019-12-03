/* eslint-disable no-console */

const { Student, Credit, Studyright } = require('../src/models')
const Sequelize = require('sequelize')
const Op = Sequelize.Op

const startDate = new Date(2019, 1, 1, 0, 0, 0, 0)

const wasFMSEIStudent = (student, date) => {
  const degreeright = student.studyrights.find(sr => sr.extentcode !== 9 && sr.startdate <= date && sr.enddate >= date)
  return !degreeright
}

const courseCodes = [
  'AYTKT200041',
  'AYTKT21007',
  'TKT21007',
  'AYTKT21025en',
  'AYTKT21009',
  'TKT21009',
  'AYTKT21010',
  'TKT21010',
  'AYTKT21018',
  'AYTKT21018fi',
  'AYTKT21018sv',
  'AY5823951',
  'AY5823952',
  'AY5823953',
  'AY5823954',
  'AY5823955',
  'AY5823956'
]

const createReport = async () => {
  console.log('SPLIT')
  const { fmseiStudentnumbers, otherStudentnumbers } = await courseCodes.reduce(
    async (accPromise, courseCode) => {
      const credits = await Credit.findAll({
        where: {
          course_code: courseCode,
          attainment_date: {
            [Op.gte]: startDate
          }
        }
      })

      const { fmseiStudentnumbers, otherStudentnumbers } = await credits.reduce(
        async (accPromise, credit) => {
          const student = await Student.findOne({
            where: { studentnumber: credit.student_studentnumber },
            include: [{ model: Studyright }]
          })
          const acc = await accPromise

          if (wasFMSEIStudent(student, credit.attainment_date)) {
            // FMSEI student fmsei credits
            console.log(
              `${credit.student_studentnumber};${credit.course_code};${credit.grade};${credit.credits};${new Date(
                credit.attainment_date
              ).toISOString()}`
            )
            return {
              fmseiStudentnumbers: acc.fmseiStudentnumbers.concat(student.studentnumber),
              otherStudentnumbers: acc.otherStudentnumbers
            }
          }
          return {
            fmseiStudentnumbers: acc.fmseiStudentnumbers,
            otherStudentnumbers: acc.otherStudentnumbers.concat(student.studentnumber)
          }
        },
        { fmseiStudentnumbers: [], otherStudentnumbers: [] }
      )

      const acc = await accPromise

      return {
        courseStats: acc.courseStats.concat({
          courseCode: courseCode,
          fmsei: fmseiStudentnumbers.length,
          other: otherStudentnumbers.length
        }),
        fmseiStudentnumbers: acc.fmseiStudentnumbers.concat(fmseiStudentnumbers),
        otherStudentnumbers: acc.otherStudentnumbers.concat(otherStudentnumbers)
      }
    },
    { courseStats: [], fmseiStudentnumbers: [], otherStudentnumbers: [] }
  )
  const fmseiStudents = await Student.findAll({
    where: { studentnumber: fmseiStudentnumbers },
    include: [
      {
        model: Credit,
        separate: true
      }
    ]
  })

  const otherStudents = await Student.findAll({
    where: { studentnumber: otherStudentnumbers }
  })
  console.log('SPLIT')
  otherStudents.forEach(s => console.log(`${new Date(s.birthdate).getFullYear()};${s.gender_fi}`))
  console.log('SPLIT')

  const getFirstName = namestring => {
    const names = namestring.split(' ')
    const i = names.findIndex(n => n.substring(0, 1) === '*')
    return i != -1 ? names[i].substring(1) : names[0]
  }

  fmseiStudents.forEach(s =>
    console.log(
      `${s.studentnumber};${s.email || ''};${s.zipcode || ''};${s.city_fi || ''};${new Date(
        s.birthdate
      ).getFullYear()};${s.country_fi || ''};${s.home_country_fi || ''};${s.gender_fi};${getFirstName(s.firstnames)}`
    )
  )
  console.log('SPLIT')
  // FMSEI all credits
  fmseiStudents.forEach(s => {
    s.credits.forEach(c =>
      console.log(
        `${c.student_studentnumber};${c.course_code};${c.grade};${c.credits};${new Date(
          c.attainment_date
        ).toISOString()}`
      )
    )
  })
}

createReport()
