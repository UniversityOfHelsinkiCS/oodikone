const sequelize = require('sequelize')
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
const { formatStudyright, formatStudent } = require('./studyprogrammeHelpers')

const whereStudents = studentnumbers => {
  return studentnumbers ? studentnumbers : { [Op.not]: null }
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

const enrolledStudyrights = async studytrack => {
  const studyrights = await Studyright.findAll({
    attributes: ['studyrightid', 'studystartdate', 'enddate', 'prioritycode'],
    include: [
      {
        model: StudyrightElement,
        required: true,
        where: { code: studytrack },
      },
      {
        model: Student,
        attributes: ['studentnumber'],
        required: true,
      },
    ],
  })

  const studentnumbers = studyrights.map(s => s.student.studentnumber)

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

  let enrollments = new Set()

  students.forEach(student => {
    student.semester_enrollments.forEach(e => {
      const enrollmentStartDate = e.semester.startdate
      const enrollmentEndDate = e.semester.enddate
      const correctStudyRight = studyrights.find(
        s =>
          student.studentnumber === s.student.studentnumber &&
          s.studystartdate <= enrollmentStartDate && // Studying in the programme should have started on the same day or earlier than the enrollment
          s.enddate >= enrollmentEndDate && // Studying in the programme should have ended on the same day or later than the enrollment
          (!s.canceldate || s.canceldate > enrollmentStartDate) && // Studyright should not be canceled OR the possible canceldate should be after the enrollmentStartDate
          (s.prioritycode === 1 || s.prioritycode === 30) // Studyright should be primary or the student should have graduated
      )
      if (correctStudyRight) {
        enrollments.add({
          studentnumber: student.studentnumber,
          startdate: e.semester.startdate,
        })
      }
    })
  })

  return enrollments
}

const allStudyrights = async (studytrack, since, studentnumbers) =>
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
  await Studyright.findAll({
    include: {
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
    where: {
      graduated: 1,
      enddate: {
        [Op.gte]: since,
      },
      student_studentnumber: whereStudents(studentnumbers),
    },
  })

const cancelledStudyRights = async (studytrack, since) => {
  return await Studyright.findAll({
    include: {
      model: StudyrightElement,
      required: true,
      where: {
        code: {
          [Op.eq]: studytrack,
        },
      },
    },
    where: {
      canceldate: {
        [Op.gte]: since,
      },
    },
  })
}

const transfersAway = async (studytrack, since) => {
  return await Transfer.findAll({
    where: {
      transferdate: {
        [Op.gte]: since,
      },
      sourcecode: studytrack,
    },
    distinct: true,
    col: 'studentnumber',
  })
}

const transfersTo = async (studytrack, since) => {
  return await Transfer.findAll({
    where: {
      transferdate: {
        [Op.gte]: since,
      },
      targetcode: studytrack,
    },
    distinct: true,
    col: 'studentnumber',
  })
}

const getProgrammesStudents = async studyprogramme =>
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

const getCreditsForStudyProgramme = async (provider, since) =>
  await Credit.findAll({
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

const getTransferredCredits = async (provider, since) =>
  await Credit.findAll({
    attributes: ['id', 'course_code', 'credits', 'attainment_date', 'credittypecode', 'student_studentnumber'],
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
        [Op.eq]: [9],
      },
      attainment_date: {
        [Op.gte]: since,
      },
    },
  })

const getThesisCredits = async (provider, since, thesisType) =>
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
    },
  })

module.exports = {
  studytrackStudents,
  enrolledStudyrights,
  allStudyrights,
  startedStudyrights,
  graduatedStudyRights,
  cancelledStudyRights,
  transfersAway,
  transfersTo,
  getProgrammesStudents,
  getCreditsForStudyProgramme,
  getTransferredCredits,
  getThesisCredits,
}
