const Sequelize = require('sequelize')
const moment = require('moment')
const { Student, Credit, Course, Studyright, StudyrightElement, ElementDetails } = require('../models')
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

const byId = async (id) => Student.findByPrimary(id, {
  include: [
    {
      model: Credit,
      required: true,
      include: {
        model: Course,
        required: true
      }
    },
    {
      model: Studyright,
      include: {
        model: StudyrightElement,
        required: true,
        include: {
          model: ElementDetails,
          required: true,
          where: {
            type: {
              [Op.in]: [10, 20]
            }
          }
        }
      }
    }
  ]
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

const formatStudent = ({ firstnames, lastname, studentnumber, dateofuniversityenrollment, creditcount, matriculationexamination, gender, credits, abbreviatedname, email, studyrights, semester_enrollments, transfers, updatedAt, createdAt }) => {
  const toCourse = ({ grade, credits, credittypecode, attainment_date, course }) => {
    course = course.get()
    return {
      course: {
        code: course.course_code,
        name: course.name,
        coursetypecode: course.coursetypecode
      },
      date: attainment_date,
      passed: Credit.passed({ credittypecode }),
      grade,
      credits,
      isStudyModuleCredit: course.is_study_module
    }
  }

  studyrights = studyrights === undefined ? [] : studyrights.map(({ studyrightid, highlevelname, startdate, enddate, extentcode, graduated, graduation_date, studyright_elements }) => ({
    studyrightid,
    highlevelname,
    extentcode,
    startdate,
    graduationDate: graduation_date,
    studyrightElements: studyright_elements,
    enddate,
    graduated: Boolean(graduated)
  }))
  semester_enrollments = semester_enrollments || []
  const semesterenrollments = semester_enrollments.map(({ semestercode, enrollmenttype }) => ({ semestercode, enrollmenttype }))

  const courseByDate = (a, b) => {
    return moment(a.attainment_date).isSameOrBefore(b.attainment_date) ? -1 : 1
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
    credits: creditcount || 0,
    courses: credits.sort(courseByDate).map(toCourse),
    name: abbreviatedname,
    transfers: transfers || [],
    matriculationexamination,
    gender,
    email,
    semesterenrollments,
    updatedAt: updatedAt || createdAt,
    tags: []
  }
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

module.exports = {
  withId, bySearchTerm, createStudent, updateStudent, bySearchTermAndElements
}