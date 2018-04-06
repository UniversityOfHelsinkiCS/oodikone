const Sequelize = require('sequelize')
const moment = require('moment')
const { getDate } = require('./database_updater/oodi_data_mapper')
const { Student, Credit, CourseInstance, Course, TagStudent, Studyright, Unit } = require('../models')
const User = require('./users')
const Op = Sequelize.Op

const createStudent = (array) => {
  return Student.create({
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
}

const updateStudent = (array) => {
  return Student.update({
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
}

const byId = async (uid, id) => {
  const user = await User.byUsername(uid)
  const userId = user.dataValues.id
  const units = await User.getUnits(userId)
  const unitIds = units.map(unit => unit.dataValues.id)
  return Student.findOne({
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
        separate: true,
        model: Studyright,
        include: [
          {
            model: Unit,
            where: {
              id: { [Op.or]: unitIds }
            }
          }],
        where: {
          prioritycode: { [Op.eq]: 1 }
        }
      },
      TagStudent
    ],
    where: {
      studentnumber: {
        [Op.eq]: id
      }
    }
  })
}

const byAbreviatedNameOrStudentNumber = (uid, searchTerm) => {
  return Student.findAll({
    limit: 10,
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

const formatStudent = ({ studentnumber, dateofuniversityenrollment, creditcount, credits }) => {

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

  const byDate = (a, b) => {
    return moment(a.courseinstance.coursedate).isSameOrBefore(b.courseinstance.coursedate) ? -1 : 1
  }

  if (credits === undefined) {
    credits = []
  }

  return {
    studentNumber: studentnumber,
    started: dateofuniversityenrollment,
    credits: creditcount,
    courses: credits.sort(byDate).map(toCourse),
    tags: []
  }
}

const bySearchTerm = async (uid, term) => {
  try {
    const result = await byAbreviatedNameOrStudentNumber(uid, `%${term}%`)
    return result.map(formatStudent)
  } catch (e) {
    return {
      error: e
    }
  }
}

const withId = async (uid, id) => {
  try {
    const result = await byId(uid, id)

    return formatStudent(result)
  } catch (e) {
    console.log(e)
    return {
      error: e
    }
  }
}

module.exports = {
  withId, bySearchTerm, formatStudent, createStudent, byId, updateStudent
}