const { Op } = require('sequelize')
const {
  dbConnections: { sequelize },
} = require('../database/connection')
const moment = require('moment')
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

const createStudent = student => Student.create(student)

const updateStudent = student => {
  return Student.update(student, {
    where: {
      studentnumber: {
        [Op.eq]: student.studentnumber,
      },
    },
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
      include: [
        {
          model: Tag,
        },
      ],
      where: {
        studentnumber: id,
      },
    }),
  ])
  const studyrights = await Studyright.findAll({
    where: {
      student_studentnumber: id,
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
    const semester = semesters.find(sem => sem.semestercode === enrollment.semestercode)
    return {
      ...enrollment.dataValues,
      name: semester.name,
      yearname: semester.yearname,
      startYear: semester.startYear,
    }
  })
  student.semester_enrollments = mappedEnrollments

  student.tags = tags.map(t => ({
    ...t.get(),
    programme: tagprogrammes.find(p => p.code === t.tag.studytrack),
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

const formatStudent = async ({
  firstnames,
  lastname,
  studentnumber,
  dateofuniversityenrollment,
  creditcount,
  gender,
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
    } catch (e) {
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

  const courseByDate = (a, b) => {
    return moment(a.attainment_date).isSameOrBefore(b.attainment_date) ? -1 : 1
  }

  if (credits === undefined) {
    credits = []
  }

  const formattedCredits = credits
    .sort(courseByDate)
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
    gender,
    email,
    semesterenrollments,
    updatedAt: updatedAt || createdAt,
    studyplans,
    tags,
    sis_person_id,
  }
}

const withId = async id => {
  try {
    const result = await byId(id)
    const formattedStudent = await formatStudent(result)
    return formattedStudent
  } catch (e) {
    logger.error(`Error when fetching single student ${e}`)
    return {
      error: e,
    }
  }
}

const removeEmptySpaces = str => str.replace(/\s\s+/g, ' ')

const splitByEmptySpace = str => removeEmptySpaces(str).split(' ')

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

const bySearchTerm = async searchterm => {
  const terms = splitByEmptySpace(searchterm)
  const matches = await Student.findAll({
    include: {
      model: Studyright,
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
      where: {
        prioritycode: {
          [Op.not]: 6,
        },
      },
    },
    where: {
      [Op.or]: [nameLike(terms), studentnumberLike(terms)],
    },
  })
  return await Promise.all(matches.map(async s => await formatStudent(s)))
}

const bySearchTermAndStudentNumbers = async (searchterm, studentnumbers) => {
  const terms = splitByEmptySpace(searchterm)
  const matches = await Student.findAll({
    include: {
      model: Studyright,
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
    },
    where: {
      [Op.and]: {
        [Op.or]: [nameLike(terms), studentnumberLike(terms)],
        studentnumber: {
          [Op.in]: studentnumbers,
        },
      },
    },
  })
  return await Promise.all(matches.map(async s => await formatStudent(s)))
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
  withId,
  bySearchTerm,
  createStudent,
  updateStudent,
  bySearchTermAndStudentNumbers,
  filterStudentnumbersByAccessrights,
  findByCourseAndSemesters,
  findByTag,
  splitByEmptySpace,
  getStudentnumbersByElementdetails,
}
