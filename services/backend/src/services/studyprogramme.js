const sequelize = require('sequelize')
const moment = require('moment')
const { Op } = sequelize
const {
  Credit,
  Course,
  Organization,
  Studyright,
  StudyrightElement,
  ElementDetail,
  Transfer,
  Student,
  SemesterEnrollment,
  Semester,
} = require('../models')
const { formatStudyright, formatStudent, formatTransfer } = require('./studyprogrammeHelpers')
const { getCurrentSemester } = require('./semesters')

const whereStudents = studentnumbers => {
  return studentnumbers ? studentnumbers : { [Op.not]: null }
}

const sinceDate = since => {
  return since ? { [Op.gte]: since } : { [Op.not]: null }
}

const studytrackStudents = async studentnumbers =>
  (
    await Student.findAll({
      where: {
        studentnumber: {
          [Op.in]: studentnumbers,
        },
      },
    })
  ).map(formatStudent)

const enrolledStudents = async (studytrack, since, studentnumbers) => {
  const currentSemester = await getCurrentSemester()

  const students = await Student.findAll({
    attributes: ['studentnumber'],
    include: [
      {
        model: Studyright,
        include: [
          {
            model: StudyrightElement,
            required: true,
            where: {
              code: studytrack,
            },
          },
        ],
        attributes: ['studyrightid'],
      },
      {
        model: SemesterEnrollment,
        attributes: ['semestercode'],
        include: [
          {
            model: Semester,
            required: true,
            where: {
              semestercode: currentSemester.semestercode,
            },
          },
        ],
        where: {
          enrollmenttype: 1,
        },
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
  })

  return students.filter(s => s.semester_enrollments?.length)
}

const absentStudents = async (studytrack, studentnumbers) => {
  const currentSemester = await getCurrentSemester()
  const students = await Student.findAll({
    attributes: ['studentnumber'],
    include: [
      {
        model: Studyright,
        include: [
          {
            model: StudyrightElement,
            required: true,
            where: {
              code: studytrack,
            },
          },
        ],
        attributes: ['studyrightid'],
      },
      {
        model: SemesterEnrollment,
        attributes: ['semestercode'],
        where: {
          enrollmenttype: 2,
          semestercode: currentSemester.semestercode,
        },
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
  })

  return students
}

const allStudyrights = async (studytrack, studentnumbers) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: StudyrightElement,
          required: true,
          include: {
            model: ElementDetail,
            required: true,
            where: {
              code: studytrack,
            },
          },
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        student_studentnumber: whereStudents(studentnumbers),
      },
    })
  ).map(formatStudyright)

const startedStudyrights = async (studytrack, since, studentnumbers) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: StudyrightElement,
          required: true,
          include: {
            model: ElementDetail,
            required: true,
            where: {
              code: studytrack,
            },
          },
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        studystartdate: {
          [Op.gte]: since,
        },
        student_studentnumber: whereStudents(studentnumbers),
      },
    })
  ).map(formatStudyright)

const graduatedStudyRights = async (studytrack, since, studentnumbers) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: StudyrightElement,
          required: true,
          include: {
            model: ElementDetail,
            required: true,
            where: {
              code: studytrack,
            },
          },
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        graduated: 1,
        enddate: sinceDate(since),
        student_studentnumber: whereStudents(studentnumbers),
      },
    })
  ).map(formatStudyright)

const inactiveStudyrights = async (studytrack, studentnumbers) => {
  const now = moment(new Date())
  const inactiveOrExpired = (
    await Studyright.findAll({
      include: [
        {
          model: StudyrightElement,
          required: true,
          include: {
            model: ElementDetail,
            required: true,
            where: {
              code: studytrack,
            },
          },
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        student_studentnumber: whereStudents(studentnumbers),
        graduated: 0,
      },
    })
  )
    .filter(s => s.active === 0 || (s.enddate && moment(s.enddate).isBefore(now)))
    .map(formatStudyright)

  return inactiveOrExpired
}

const followingStudyrights = async (since, programmes, studentnumbers) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: StudyrightElement,
          required: true,
          where: {
            code: {
              [Op.in]: programmes.map(p => p.code),
            },
          },
          include: [
            {
              model: ElementDetail,
              attributes: ['name'],
            },
          ],
          attributes: ['code'],
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        studystartdate: {
          [Op.gte]: since,
        },
        extentcode: 2,
        student_studentnumber: whereStudents(studentnumbers),
      },
    })
  ).map(formatStudyright)

const previousStudyrights = async (programmes, studentnumbers) =>
  (
    await Studyright.findAll({
      include: [
        {
          model: StudyrightElement,
          required: true,
          where: {
            code: {
              [Op.in]: programmes.map(p => p.code),
            },
          },
          include: [
            {
              model: ElementDetail,
              attributes: ['name'],
            },
          ],
          attributes: ['code'],
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
      where: {
        extentcode: 1,
        student_studentnumber: whereStudents(studentnumbers),
      },
      order: [[StudyrightElement, 'startdate', 'DESC']],
    })
  ).map(formatStudyright)

const transfersAway = async (studytrack, since) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.gte]: since,
        },
        sourcecode: studytrack,
      },
      distinct: true,
      col: 'studentnumber',
    })
  ).map(formatTransfer)

const transfersTo = async (studytrack, since) =>
  (
    await Transfer.findAll({
      where: {
        transferdate: {
          [Op.gte]: since,
        },
        targetcode: studytrack,
      },
      distinct: true,
      col: 'studentnumber',
    })
  ).map(formatTransfer)

const allTransfers = async (studytrack, since) => {
  const transferredTo = await transfersTo(studytrack, since)
  const transferredAway = await transfersAway(studytrack, since)
  return [...transferredTo, ...transferredAway]
}

const getProgrammesStudyrights = async studyprogramme =>
  (
    await Studyright.findAll({
      attributes: ['studyrightid', 'studystartdate', 'enddate', 'graduated', 'prioritycode', 'extentcode'],
      include: [
        {
          model: StudyrightElement,
          required: true,
          where: {
            code: {
              [Op.in]: [studyprogramme],
            },
          },
        },
        {
          model: Student,
          attributes: ['studentnumber'],
          required: true,
        },
      ],
    })
  ).map(formatStudyright)

const getCreditsForStudyProgramme = async (provider, since) => {
  const res = await Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'student_studentnumber'],
    include: {
      model: Course,
      attributes: ['code'],
      required: true,
      where: {
        is_study_module: false,
      },
      include: {
        model: Organization,
        required: true,
        where: {
          code: provider,
        },
      },
    },
    where: {
      credittypecode: {
        [Op.notIn]: [10, 9, 7],
      },
      isStudyModule: {
        [Op.not]: true,
      },
      attainment_date: {
        [Op.gte]: since,
      },
    },
  })
  return res
}

/* const getStudentsForProgrammeCourses = async provider => {
  console.log('provider: ', provider)
  const res = await Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'student_studentnumber'],
    include: [
      {
        model: Course,
        attributes: ['code'],
        required: true,
        where: {
          is_study_module: false,
        },
        include: {
          model: Organization,
          required: true,
          where: {
            code: provider,
          },
        },
      },
      { model: Student, required: true, attributes: ['firstnames', 'lastname'] },
    ],
    where: {
      credittypecode: {
        [Op.notIn]: [10, 9, 7],
      },
      isStudyModule: {
        [Op.not]: true,
      },
      attainment_date: {
        [Op.between]: ['2020-08-01 00:00:00+00', '2021-07-31 00:00:00+00'],
      },
    },
  })
  return res
} */

const getStudentsForProgrammeCourses = async provider => {
  const res = await Course.findAll({
    attributes: ['code'],
    include: [
      {
        model: Organization,
        attributes: [],
        required: true,
        where: {
          code: provider,
        },
      },
      {
        model: Credit,
        attributes: ['student_studentnumber'],
        include: { model: Student, required: true, attributes: ['studentnumber', 'firstnames', 'lastname'] },
        where: {
          credittypecode: {
            [Op.notIn]: [10, 9, 7],
          },
          isStudyModule: {
            [Op.not]: true,
          },
          attainment_date: {
            [Op.between]: ['2020-08-01 00:00:00+00', '2021-07-31 00:00:00+00'],
          },
        },
      },
    ],
  })
  return res
}

const getTransferredCredits = async (provider, since) =>
  await Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date'],
    include: {
      model: Course,
      attributes: ['code'],
      required: true,
      include: {
        model: Organization,
        required: true,
        where: {
          code: provider,
        },
      },
    },
    where: {
      credittypecode: {
        [Op.eq]: [9],
      },
      isStudyModule: {
        [Op.not]: true,
      },
      attainment_date: {
        [Op.gte]: since,
      },
    },
  })

const getThesisCredits = async (provider, since, thesisType, studentnumbers) =>
  await Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'student_studentnumber'],
    include: {
      model: Course,
      attributes: ['code'],
      required: true,
      where: {
        course_unit_type: {
          [Op.in]: thesisType,
        },
      },
      include: {
        model: Organization,
        required: true,
        where: {
          code: provider,
        },
      },
    },
    where: {
      credittypecode: {
        [Op.notIn]: [10, 9, 7],
      },
      isStudyModule: {
        [Op.not]: true,
      },
      attainment_date: {
        [Op.gte]: since,
      },
      student_studentnumber: whereStudents(studentnumbers),
    },
  })

module.exports = {
  studytrackStudents,
  enrolledStudents,
  absentStudents,
  allStudyrights,
  startedStudyrights,
  graduatedStudyRights,
  inactiveStudyrights,
  previousStudyrights,
  followingStudyrights,
  transfersAway,
  transfersTo,
  allTransfers,
  getProgrammesStudyrights,
  getCreditsForStudyProgramme,
  getTransferredCredits,
  getThesisCredits,
  getStudentsForProgrammeCourses,
}
