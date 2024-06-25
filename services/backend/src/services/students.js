const { Op } = require('sequelize')

const {
  dbConnections: { sequelize },
} = require('../database/connection')
const {
  Student,
  Credit,
  Course,
  ElementDetail,
  SemesterEnrollment,
  Semester,
  Studyplan,
  SISStudyRight,
  SISStudyRightElement,
} = require('../models')
const { TagStudent, Tag } = require('../models/models_kone')
const { splitByEmptySpace } = require('../util')
const logger = require('../util/logger')

const byStudentNumber = async studentNumber => {
  const [student, tags] = await Promise.all([
    Student.findByPk(studentNumber, {
      attributes: [
        'firstnames',
        'lastname',
        'studentnumber',
        'dateofuniversityenrollment',
        'creditcount',
        'creditcount',
        'abbreviatedname',
        'email',
        'updatedAt',
        'createdAt',
        'sis_person_id',
      ],
      include: [
        {
          model: Credit,
          attributes: ['id', 'grade', 'credits', 'credittypecode', 'is_open', 'attainment_date', 'isStudyModule'],
          separate: true,
          include: {
            model: Course,
            attributes: ['code', 'name'],
          },
        },
        {
          model: SISStudyRight,
          as: 'studyRights',
          include: {
            required: true,
            model: SISStudyRightElement,
            as: 'studyRightElements',
          },
        },
        {
          model: SemesterEnrollment,
        },
        {
          model: Studyplan,
          attributes: ['id', 'included_courses', 'programme_code', 'completed_credits', 'sis_study_right_id'],
        },
      ],
      order: [
        [
          { model: SISStudyRight, as: 'studyRights' },
          { model: SISStudyRightElement, as: 'studyRightElements' },
          'endDate',
          'desc',
        ],
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
  studyRights,
  semester_enrollments,
  studyplans,
  updatedAt,
  createdAt,
  tags,
  sis_person_id,
}) => {
  const toCourse = ({ id, grade, credits, credittypecode, is_open, attainment_date, course, isStudyModule }) => {
    if (course) course = course.toJSON()

    return {
      course: {
        code: course ? course.code : id,
        name: course ? course.name : `credit-${id}-no-course-attached`,
      },
      date: attainment_date,
      passed: Credit.passed({ credittypecode }) || Credit.improved({ credittypecode }),
      grade,
      credits,
      credittypecode,
      isStudyModuleCredit: isStudyModule,
      isOpenCourse: is_open,
    }
  }

  studyRights = studyRights || []
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

  return {
    firstnames,
    lastname,
    studyRights,
    studentNumber: studentnumber,
    started: dateofuniversityenrollment,
    credits: creditcount || 0,
    courses: formattedCredits,
    name: abbreviatedname,
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
      attributes: ['studentnumber', 'firstnames', 'lastname', 'creditcount', 'dateofuniversityenrollment'],
      include: {
        model: SISStudyRight,
        as: 'studyRights',
        attributes: ['id'],
        include: {
          model: SISStudyRightElement,
          as: 'studyRightElements',
          attributes: ['name'],
          required: true,
          where: {
            endDate: {
              [Op.gte]: new Date(),
            },
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
        model: SISStudyRight,
        as: 'studyRights',
        required: true,
        include: {
          model: SISStudyRightElement,
          as: 'studyRightElements',
          where: {
            code: {
              [Op.in]: codes,
            },
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
        model: SISStudyRight,
        as: 'studyRights',
        required: true,
        include: {
          model: SISStudyRightElement,
          as: 'studyRightElements',
          where: {
            code: {
              [Op.in]: codes,
            },
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
