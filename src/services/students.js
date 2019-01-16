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
      separate: true,
      include: {
        model: Course,
      }
    },
    {
      model: Studyright,
      include: {
        model: StudyrightElement,
        include: {
          model: ElementDetails,
          where: {
            type: {
              [Op.in]: [10, 20, 30]
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
  const toCourse = ({ grade, credits, credittypecode, attainment_date, course, isStudyModule}) => {
    course = course.get()
    return {
      course: {
        code: course.code,
        name: course.name,
        coursetypecode: course.coursetypecode
      },
      date: attainment_date,
      passed: Credit.passed({ credittypecode }),
      grade,
      credits,
      isStudyModuleCredit: isStudyModule
    }
  }

  studyrights = studyrights === undefined ? [] : studyrights.map(({ studyrightid, highlevelname, startdate, enddate, canceldate, extentcode, graduated, graduation_date, studyright_elements }) => ({
    studyrightid,
    highlevelname,
    extentcode,
    startdate,
    graduationDate: graduation_date,
    studyrightElements: studyright_elements,
    enddate,
    canceldate,
    graduated: Boolean(graduated)
  }))
  semester_enrollments = semester_enrollments || []
  const semesterenrollments = semester_enrollments.map(({ semestercode, enrollmenttype }) => ({ semestercode, enrollmenttype }))

  const courseByDate = (a, b) => {
    return moment(a.attainment_date).isSameOrBefore(b.attainment_date) ? -1 : 1
  }

  if (credits === undefined) {
    credits = []
  } return {
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

const bySearchTermOld = async (term) => {
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

const bySearchTermAndElementsOld = async (searchterm, elementcodes) => {
  const likeSearchTerm = `%${searchterm}%`
  const students = await Student.findAll({
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
  return students.map(formatStudent)
}

const splitByEmptySpace = str => str.replace(/\s\s+/g, ' ').split(' ')

const likefy = term => `%${term}%`

const columnLike = (column, term) => ({
  [column]: {
    [Op.iLike]: likefy(term)
  }
})

const nameLike = (terms) => {
  const [first, second] = terms
  if (!second) {
    return columnLike('abbreviatedname', first)
  } else {
    return {
      [Op.or]: [
        columnLike('abbreviatedname', `%${first}%${second}%`),
        columnLike('abbreviatedname', `%${second}%${first}%`)
      ]
    }
  }
}

const studentnumberLike = terms => {
  if (terms.length !== 1) {
    return undefined
  }
  return {
    studentnumber: {
      [Op.iLike]: likefy(terms[0])
    }
  }
}

const bySearchTermNew = async (searchterm) => {
  const terms = splitByEmptySpace(searchterm)
  const matches = await Student.findAll({
    where: {
      [Op.or]: [
        nameLike(terms),
        studentnumberLike(terms)
      ]
    }
  })
  return matches.map(formatStudent)
}

const bySearchTermAndElementsNew = async (searchterm, codes) => {
  const terms = splitByEmptySpace(searchterm)
  const matches = await Student.findAll({
    include: {
      model: StudyrightElement,
      required: true,
      where: {
        code: {
          [Op.in]: codes
        }
      }
    },
    where: {
      [Op.or]: [
        nameLike(terms),
        studentnumberLike(terms)
      ]
    }
  })
  return matches.map(formatStudent)
}

const NEW_SEARCH = true
const bySearchTerm = NEW_SEARCH ? bySearchTermNew : bySearchTermOld
const bySearchTermAndElements = NEW_SEARCH ? bySearchTermAndElementsNew : bySearchTermAndElementsOld

module.exports = {
  withId, bySearchTerm, createStudent, updateStudent, bySearchTermAndElements
}