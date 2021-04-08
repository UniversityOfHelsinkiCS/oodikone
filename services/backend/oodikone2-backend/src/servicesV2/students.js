const Sequelize = require('sequelize')
const {
  dbConnections: { sequelize }
} = require('../databaseV2/connection')
const moment = require('moment')
const {
  Student,
  Credit,
  Course,
  Studyright,
  StudyrightElement,
  ElementDetail,
  SemesterEnrollment
} = require('../modelsV2')
const { TagStudent, Tag } = require('../models/models_kone')
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

const byId = async id => {
  const [student, tags] = await Promise.all([
    Student.findByPk(id, {
      include: [
        {
          model: Credit,
          separate: true,
          include: {
            model: Course
          }
        },
        {
          model: Studyright,
          include: {
            model: StudyrightElement,
            include: {
              model: ElementDetail,
              where: {
                type: {
                  [Op.in]: [10, 20, 30]
                }
              }
            }
          }
        },
        {
          model: SemesterEnrollment
        }
      ]
    }),
    TagStudent.findAll({
      include: [
        {
          model: Tag
        }
      ],
      where: {
        studentnumber: id
      }
    })
  ])
  const tagprogrammes = await ElementDetail.findAll({
    where: {
      code: {
        [Op.in]: tags.map(t => t.tag.studytrack)
      }
    }
  })
  student.tags = tags.map(t => ({
    ...t.get(),
    programme: tagprogrammes.find(p => p.code === t.tag.studytrack)
  }))
  return student
}

const findByCourseAndSemesters = async (coursecodes, from, to, separate) =>
  sequelize
    .query(
      `
  SELECT
    studentnumber
  FROM student
  INNER JOIN credit ON
    student.studentnumber=credit.student_studentnumber
  WHERE
    course_code IN (:coursecodes) AND
    attainment_date
  BETWEEN
    (select startdate FROM semesters where ${
      separate ? 'semestercode' : 'yearcode'
    }=:minYearCode ORDER BY semestercode LIMIT 1) AND
    (select enddate FROM semesters where ${
      separate ? 'semestercode' : 'yearcode'
    }=:maxYearCode ORDER BY semestercode DESC LIMIT 1);
`,
      {
        replacements: { coursecodes, minYearCode: from, maxYearCode: to },
        type: sequelize.QueryTypes.SELECT,
        raw: true
      }
    )
    .map(st => st.studentnumber)

const findByTag = tag => {
  return TagStudent.findAll({
    attributes: ['studentnumber'],
    where: {
      tag_id: {
        [Op.eq]: tag
      }
    }
  }).map(st => st.studentnumber)
}

const formatStudent = ({
  firstnames,
  lastname,
  studentnumber,
  dateofuniversityenrollment,
  gender,
  credits,
  abbreviatedname,
  email,
  studyrights,
  semester_enrollments,
  transfers,
  updatedAt,
  createdAt,
  tags
}) => {
  const toCourse = ({ id, grade, credits, credittypecode, attainment_date, course, isStudyModule }) => {
    try {
      course = course.get()
    } catch (e) {
      // TODO: this should not be here 1.6.2021
      course = {
        code: '99999 - MISSING FROM SIS',
        name: 'missing',
        coursetypecode: 'missing'
      }
    }

    return {
      id,
      course: {
        code: course.code,
        name: course.name,
        coursetypecode: course.coursetypecode
      },
      date: attainment_date,
      course_code: course.code,
      passed: Credit.passed({ credittypecode }),
      grade,
      credits,
      isStudyModuleCredit: isStudyModule
    }
  }

  studyrights = studyrights || []
  semester_enrollments = semester_enrollments || []
  const semesterenrollments = semester_enrollments.map(({ semestercode, enrollmenttype }) => ({
    semestercode,
    enrollmenttype
  }))

  const courseByDate = (a, b) => {
    return moment(a.attainment_date).isSameOrBefore(b.attainment_date) ? -1 : 1
  }

  if (credits === undefined) {
    credits = []
  }

  const courses = credits.sort(courseByDate).map(toCourse)
  const totalCredits = courses.map(course => course.credits).reduce((total, courseCredits) => total + courseCredits, 0)

  return {
    firstnames,
    lastname,
    studyrights,
    studentNumber: studentnumber,
    started: dateofuniversityenrollment,
    credits: totalCredits,
    courses,
    name: abbreviatedname,
    transfers: transfers || [],
    gender,
    email,
    semesterenrollments,
    updatedAt: updatedAt || createdAt,
    tags
  }
}

const withId = async id => {
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

const removeEmptySpaces = str => str.replace(/\s\s+/g, ' ')

const splitByEmptySpace = str => removeEmptySpaces(str).split(' ')

const likefy = term => `%${term}%`

const columnLike = (column, term) => ({
  [column]: {
    [Op.iLike]: likefy(term)
  }
})

const nameLike = terms => {
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

const bySearchTerm = async searchterm => {
  const terms = splitByEmptySpace(searchterm)
  const matches = await Student.findAll({
    where: {
      [Op.or]: [nameLike(terms), studentnumberLike(terms)]
    }
  })
  return matches.map(formatStudent)
}

const bySearchTermAndElements = async (searchterm, codes) => {
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
      [Op.or]: [nameLike(terms), studentnumberLike(terms)]
    }
  })
  return matches.map(formatStudent)
}

const filterStudentnumbersByAccessrights = async (studentnumbers, codes) => {
  const students = await Student.findAll({
    attributes: ['studentnumber'],
    include: {
      attributes: [],
      model: StudyrightElement,
      required: true,
      where: {
        code: {
          [Op.in]: codes
        }
      }
    },
    where: {
      studentnumber: {
        [Op.in]: studentnumbers
      }
    },
    raw: true
  })
  return students.map(student => student.studentnumber)
}

const hasEnrolledForSemester = async (studentnumber, semestercode) => {
  const enrollment = await SemesterEnrollment.findOne({
    where: {
      studentnumber,
      semestercode
    }
  })
  return !!(enrollment && enrollment.enrollmenttype === 1)
}

module.exports = {
  withId,
  bySearchTerm,
  createStudent,
  updateStudent,
  bySearchTermAndElements,
  filterStudentnumbersByAccessrights,
  findByCourseAndSemesters,
  findByTag,
  splitByEmptySpace,
  hasEnrolledForSemester
}
