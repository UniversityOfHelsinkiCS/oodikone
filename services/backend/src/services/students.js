const { Op } = require('sequelize')

const {
  dbConnections: { sequelize },
} = require('../database/connection')
const {
  Student,
  Credit,
  Course,
  Studyright,
  StudyrightElement,
  ElementDetail,
  SemesterEnrollment,
  Semester,
  Studyplan,
  Transfer,
} = require('../models')
const { TagStudent, Tag } = require('../models/models_kone')
const logger = require('../util/logger')
const { splitByEmptySpace } = require('../util/utils')

const byStudentNumber = async studentNumber => {
  const [student, tags] = await Promise.all([
    Student.findByPk(studentNumber, {
      include: [
        {
          model: Credit,
          separate: true,
          include: {
            model: Course,
          },
        },
        {
          model: SemesterEnrollment,
        },
        {
          model: Studyplan,
          attributes: ['included_courses', 'programme_code', 'completed_credits', 'studyrightid'],
        },
        {
          model: Transfer,
        },
      ],
    }),
    TagStudent.findAll({
      include: {
        model: Tag,
      },
      where: {
        studentnumber: studentNumber,
      },
    }),
  ])
  const studyrights = await Studyright.findAll({
    where: {
      student_studentnumber: studentNumber,
      [Op.not]: { prioritycode: 6 },
    },
    include: {
      model: StudyrightElement,
      include: {
        model: ElementDetail,
        where: {
          type: {
            [Op.in]: [10, 20, 30],
          },
        },
      },
    },
  })
  student.studyrights = studyrights
  const tagprogrammes = await ElementDetail.findAll({
    where: {
      code: {
        [Op.in]: tags.map(t => t.tag.studytrack),
      },
    },
  })
  const semesters = await Semester.findAll()
  const mappedEnrollments = student.semester_enrollments.map(enrollment => {
    const semester = semesters.find(semester => semester.semestercode === enrollment.semestercode)
    return {
      ...enrollment.dataValues,
      name: semester.name,
      yearname: semester.yearname,
      startYear: semester.startYear,
    }
  })
  student.semester_enrollments = mappedEnrollments

  student.tags = tags.map(tag => ({
    ...tag.get(),
    programme: tagprogrammes.find(programme => programme.code === tag.tag.studytrack),
  }))
  return student
}

const getUnifyStatus = unifyCourses => {
  switch (unifyCourses) {
    case 'unifyStats':
      return [true, false]

    case 'openStats':
      return [true]

    case 'regularStats':
      return [false]

    default:
      return [true, false]
  }
}

const findByCourseAndSemesters = async (coursecodes, from, to, separate, unifyCourses = 'unifyStats') => {
  const { startdate, semestercode: fromSemester } = await Semester.findOne({
    where: {
      [separate ? 'semestercode' : 'yearcode']: from,
    },
    order: ['semestercode'],
    limit: 1,
    raw: true,
  })
  const { enddate, semestercode: toSemester } = await Semester.findOne({
    where: {
      [separate ? 'semestercode' : 'yearcode']: to,
    },
    order: [['semestercode', 'DESC']],
    limit: 1,
    raw: true,
  })
  return (
    await sequelize.query(
      `
  SELECT
    studentnumber
  FROM
    student s
  WHERE
    EXISTS (
      SELECT
        1
      FROM
        credit c
      WHERE
        c.student_studentnumber = s.studentnumber
        AND c.course_code IN (:coursecodes)
        AND c.is_open IN (:isOpen)
        AND c.attainment_date BETWEEN '${startdate.toISOString()}' AND '${enddate.toISOString()}'
    )
    OR EXISTS (
      SELECT
        1
      FROM
        enrollment e
      WHERE
        e.studentnumber = s.studentnumber
        AND e.course_code IN (:coursecodes)
        AND e.semestercode BETWEEN ${fromSemester} AND ${toSemester}
        AND e.enrollment_date_time >= '2021-05-31'
        AND e.state IN ('ENROLLED', 'CONFIRMED')
    );
`,
      {
        replacements: { coursecodes, minYearCode: from, maxYearCode: to, isOpen: getUnifyStatus(unifyCourses) },
        type: sequelize.QueryTypes.SELECT,
        raw: true,
      }
    )
  ).map(st => st.studentnumber)
}

const findByTag = async tag => {
  return (
    await TagStudent.findAll({
      attributes: ['studentnumber'],
      where: {
        tag_id: {
          [Op.eq]: tag,
        },
      },
    })
  ).map(st => st.studentnumber)
}

const formatStudent = ({
  firstnames,
  lastname,
  studentnumber,
  dateofuniversityenrollment,
  creditcount,
  credits,
  abbreviatedname,
  email,
  studyrights,
  semester_enrollments,
  transfers,
  studyplans,
  updatedAt,
  createdAt,
  tags,
  sis_person_id,
}) => {
  const toCourse = ({ id, grade, credits, credittypecode, is_open, attainment_date, course, isStudyModule }) => {
    try {
      course = course.get()
    } catch (error) {
      // TODO: this should not be here 1.6.2021
      course = {
        code: '99999 - MISSING FROM SIS',
        name: 'missing',
        coursetypecode: 'missing',
      }
    }

    return {
      id,
      course: {
        code: course.code,
        name: course.name,
        coursetypecode: course.coursetypecode,
      },
      date: attainment_date,
      course_code: course.code,
      passed: Credit.passed({ credittypecode }) || Credit.improved({ credittypecode }),
      grade,
      credits,
      credittypecode,
      isStudyModuleCredit: isStudyModule,
      isOpenCourse: is_open,
    }
  }

  studyrights = studyrights || []
  semester_enrollments = semester_enrollments || []
  studyplans = studyplans || []
  const semesterenrollments = semester_enrollments.map(
    ({ semestercode, enrollmenttype, name, yearname, startYear, statutory_absence: statutoryAbsence }) => ({
      yearname,
      name,
      startYear,
      semestercode,
      enrollmenttype,
      statutoryAbsence,
    })
  )

  if (credits === undefined) {
    credits = []
  }

  const formattedCredits = credits
    .sort((a, b) => new Date(a.attainment_date) - new Date(b.attainment_date))
    .map(toCourse)
    .filter(c => c.course.name !== 'missing')

  return {
    firstnames,
    lastname,
    studyrights,
    studentNumber: studentnumber,
    started: dateofuniversityenrollment,
    credits: creditcount || 0,
    courses: formattedCredits,
    name: abbreviatedname,
    transfers: transfers || [],
    email,
    semesterenrollments,
    updatedAt: updatedAt || createdAt,
    studyplans,
    tags,
    sis_person_id,
  }
}

const withStudentNumber = async studentNumber => {
  try {
    const student = await byStudentNumber(studentNumber)
    return formatStudent(student)
  } catch (error) {
    logger.error(`Error when fetching single student ${error}`)
    return {
      error,
    }
  }
}

const likefy = term => `%${term}%`

const columnLike = (column, term) => ({
  [column]: {
    [Op.iLike]: likefy(term),
  },
})

const nameLike = terms => {
  const [first, second] = terms
  if (!second) {
    return columnLike('abbreviatedname', first)
  }
  return {
    [Op.or]: [
      columnLike('abbreviatedname', `%${first}%${second}%`),
      columnLike('abbreviatedname', `%${second}%${first}%`),
    ],
  }
}

const studentnumberLike = terms => {
  if (terms.length !== 1) {
    return undefined
  }
  return {
    studentnumber: {
      [Op.iLike]: likefy(terms[0]),
    },
  }
}

const bySearchTermAndStudentNumbers = async (searchterm, studentNumbers) => {
  const terms = splitByEmptySpace(searchterm)
  return (
    await Student.findAll({
      include: {
        model: Studyright,
        include: {
          model: StudyrightElement,
          include: {
            model: ElementDetail,
            where: {
              type: 20,
            },
          },
        },
        where: {
          prioritycode: {
            [Op.not]: 6,
          },
        },
      },
      where: studentNumbers
        ? {
            [Op.and]: {
              [Op.or]: [nameLike(terms), studentnumberLike(terms)],
              studentnumber: {
                [Op.in]: studentNumbers,
              },
            },
          }
        : { [Op.or]: [nameLike(terms), studentnumberLike(terms)] },
    })
  ).map(formatStudent)
}

const filterStudentnumbersByAccessrights = async (studentnumbers, codes) =>
  (
    await Student.findAll({
      attributes: ['studentnumber'],
      include: {
        attributes: [],
        model: StudyrightElement,
        required: true,
        where: {
          code: {
            [Op.in]: codes,
          },
        },
      },
      where: {
        studentnumber: {
          [Op.in]: studentnumbers,
        },
      },
      raw: true,
    })
  ).map(({ studentnumber }) => studentnumber)

const getStudentnumbersByElementdetails = async codes =>
  (
    await Student.findAll({
      attributes: ['studentnumber'],
      include: {
        attributes: [],
        model: StudyrightElement,
        required: true,
        where: {
          code: {
            [Op.in]: codes,
          },
        },
      },
      raw: true,
    })
  ).map(({ studentnumber }) => studentnumber)

module.exports = {
  withStudentNumber,
  bySearchTermAndStudentNumbers,
  filterStudentnumbersByAccessrights,
  findByCourseAndSemesters,
  findByTag,
  getStudentnumbersByElementdetails,
}
