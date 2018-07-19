const Sequelize = require('sequelize')
const moment = require('moment')
const { Student, Credit, CourseInstance, Course, Studyright, StudyrightElement } = require('../models')
const { getAllDuplicates } = require('./courses')
const Op = Sequelize.Op

const createStudent = student => Student.create(student)

const updateStudent = student => {
  return Student.update(student, {
    where: {
      studentnumber: {
        [Op.eq]: student.studentnumber
      }
    }
  })
}

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

const formatStudent = ({ firstnames, lastname, studentnumber, dateofuniversityenrollment, creditcount,matriculationexamination, gender, credits, abbreviatedname, email, studyrights }) => {
  const toCourse = ({ grade, credits, courseinstance, isStudyModuleCredit }) => {
    return {
      course: {
        code: courseinstance.course_code,
        name: courseinstance.course.name
      },
      date: courseinstance.coursedate,
      passed: Credit.passed({ grade }),
      grade,
      credits,
      isStudyModuleCredit,
    }
  }

  studyrights = studyrights === undefined ? [] : studyrights.map(({ studyrightid, highlevelname, extentcode, graduated }) => ({
    studyrightid,
    highlevelname,
    extentcode,
    graduated: Boolean(graduated)
  }))

  const courseByDate = (a, b) => {
    return moment(a.courseinstance.coursedate).isSameOrBefore(b.courseinstance.coursedate) ? -1 : 1
  }

  if (credits === undefined) {
    credits = []
  }
  return {
    firstnames,
    lastname,
    studyrights,
    studentNumber: studentnumber,
    started: dateofuniversityenrollment,
    credits: creditcount,
    courses: credits.sort(courseByDate).map(toCourse),
    name: abbreviatedname,
    matriculationexamination,
    gender,
    email,
    tags: []
  }
}

const formatStudentUnifyCodes = async ({ studentnumber, dateofuniversityenrollment, creditcount, credits }, duplicates) => {
  const unifyOpenUniversity = (code) => {
    if (code[0] === 'A') {
      return code.substring(code[1] === 'Y' ? 2 :1 )
    } 
    return code
  }

  const getUnifiedCode = async (code) => {
    const unifiedcodes = duplicates[code]
    return !unifiedcodes ? code : unifiedcodes.main
  }

  const toCourse = async ({ grade, credits, courseinstance }) => {
    const code = await getUnifiedCode(unifyOpenUniversity(`${courseinstance.course_code}`))
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

const bySearchTermAndElements = (searchterm, elementcodes) => {
  const likeSearchTerm = `%${searchterm}%`
  return Student.findAll({
    where: {
      [Op.or]: [
        {
          studentnumber: {
            [Op.like]: likeSearchTerm
          }
        },
        {
          abbreviatedname: {
            [Op.iLike]: likeSearchTerm
          }
        }
      ]
    },
    include: {
      model: StudyrightElement,
      where: {
        code: {
          [Op.in]: elementcodes
        }
      }
    }
  })
}

const formatStudentsUnifyCourseCodes = async students => {
  const duplicates = await getAllDuplicates()
  return await Promise.all(students.map(student => formatStudentUnifyCodes(student, duplicates)))
}

module.exports = {
  withId, bySearchTerm, formatStudent, createStudent, byId, updateStudent, formatStudentUnifyCodes, bySearchTermAndElements, formatStudentsUnifyCourseCodes
}