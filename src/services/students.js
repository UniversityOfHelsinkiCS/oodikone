const Sequelize = require('sequelize')
const moment = require('moment')
const { getDate } = require('./database_updater/oodi_data_mapper')
const { Student, Credit, CourseInstance, Course, Studyright } = require('../models')
const { getMainCode } = require('./courses')
const Op = Sequelize.Op


const createStudent = (array) => Student.create({
  studentnumber: array[0],
  lastname: array[4],
  firstnames: array[5],
  abbreviatedname: array[6],
  birthdate: getDate(array[2]),
  communicationlanguage: array[22],
  country: array[15],
  creditcount: array[18],
  dateoffirstcredit: getDate(array[20]),
  dateoflastcredit: getDate(array[21]),
  dateofuniversityenrollment: getDate(array[19]),
  gradestudent: array[25],
  matriculationexamination: array[24],
  nationalities: array[23],
  semesterenrollmenttypecode: array[16],
  sex: array[3],
  studentstatuscode: array[17]
})

const updateStudent = (array) => Student.update({
  studentnumber: array[0],
  lastname: array[4],
  firstnames: array[5],
  abbreviatedname: array[6],
  birthdate: getDate(array[2]),
  communicationlanguage: array[22],
  country: array[15],
  creditcount: array[18],
  dateoffirstcredit: getDate(array[20]),
  dateoflastcredit: getDate(array[21]),
  dateofuniversityenrollment: getDate(array[19]),
  gradestudent: array[25],
  matriculationexamination: array[24],
  nationalities: array[23],
  semesterenrollmenttypecode: array[16],
  sex: array[3],
  studentstatuscode: array[17]
},
{
  where: {
    studentnumber: {
      [Op.eq]: array[0]
    }
  }
})

const byId = async (id) => Student.findOne({
  include: [
    {
      model: Credit,
      include: [
        {
          model: CourseInstance,
          include: [Course]
        }
      ]
    },
    {
      model:Studyright
    }
  ],
  where: {
    studentnumber: {
      [Op.eq]: id
    }
  }
})

const byAbreviatedNameOrStudentNumber = (searchTerm) => {
  return Student.findAll({
    where: {
      [Op.or]: [
        {
          studentnumber: {
            [Op.like]: searchTerm
          }
        },
        {
          abbreviatedname: {
            [Op.iLike]: searchTerm
          }
        }
      ]

    }
  })
}

const formatStudent = ({ firstnames, lastname, studentnumber, dateofuniversityenrollment, creditcount,matriculationexamination,sex, credits, abbreviatedname, studyrights }) => {
  const toCourse = ({ grade, credits, courseinstance }) => {
    return {
      course: {
        code: courseinstance.course_code,
        name: courseinstance.course.name
      },
      date: courseinstance.coursedate,
      passed: Credit.passed({ grade }),
      grade,
      credits
    }
  }
  const toStudyright = ( { studyrightid, highlevelname, enddate, canceldate, givendate, graduated, startdate, studystartdate, organization_code, prioritycode }) => {
    return {studyrightid, highlevelname, enddate, canceldate, givendate, graduated, startdate, studystartdate, organization_code, prioritycode}
  }

  const courseByDate = (a, b) => {
    return moment(a.courseinstance.coursedate).isSameOrBefore(b.courseinstance.coursedate) ? -1 : 1
  }
  const studyRightByDate = (a, b) => {
    let rank = moment(a.enddate).isSameOrBefore(b.enddate) ? -1 : 1
    if (a.canceldate || b.canceldate) {
      rank = moment(a.canceldate).isBefore(b.enddate) ? -1 : 1
    }
    if (!a.canceldate && !b.canceldate && moment(a.enddate).isSame(b.enddate)) {
      rank = a.prioritycode !== 1 ? -1 : 1
    }
    return rank
  }

  if (credits === undefined) {
    credits = []
  }
  if(studyrights) {
    studyrights = studyrights.map(toStudyright).sort(studyRightByDate)
  }
  return {
    firstnames,
    lastname,
    studentNumber: studentnumber,
    started: dateofuniversityenrollment,
    credits: creditcount,
    courses: credits.sort(courseByDate).map(toCourse),
    name: abbreviatedname,
    studyrights,
    matriculationexamination,
    sex,
    tags: []
  }
}

const formatStudentUnifyCodes = async ({ studentnumber, dateofuniversityenrollment, creditcount, credits }) => {
  const unifyOpenUniversity = (code) => {
    if (code[0] === 'A') {
      return code.substring(code[1] === 'Y' ? 2 :1 )
    } 
    return code
  }

  const toCourse = async ({ grade, credits, courseinstance }) => {
    const code = await getMainCode(unifyOpenUniversity(`${courseinstance.course_code}`))
    return {
      course: {
        code,
        name: courseinstance.course.name
      },
      date: courseinstance.coursedate,
      passed: Credit.passed({ grade }),
      grade,
      credits
    }
  }

  const byDate = (a, b) => {
    return moment(a.courseinstance.coursedate).isSameOrBefore(b.courseinstance.coursedate) ? -1 : 1
  }

  if (credits === undefined) {
    credits = []
  }

  const student = {
    studentNumber: studentnumber,
    started: dateofuniversityenrollment,
    credits: creditcount,
    courses: await Promise.all(credits.sort(byDate).map(toCourse)),
    tags: []
  }
  return student
}

const bySearchTerm = async (term) => {
  try {
    const result = await byAbreviatedNameOrStudentNumber(`%${term}%`)
    return result.map(formatStudent)
  } catch (e) {
    return {
      error: e
    }
  }
}

const withId = async (id) => {
  try {
    const result = await byId(id)
    return formatStudent(result)
  } catch (e) {
    console.log(e)
    return {
      error: e
    }
  }
}

module.exports = {
  withId, bySearchTerm, formatStudent, createStudent, byId, updateStudent, formatStudentUnifyCodes
}