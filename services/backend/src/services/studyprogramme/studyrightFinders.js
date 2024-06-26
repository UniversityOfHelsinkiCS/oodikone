const { Op } = require('sequelize')

const {
  dbConnections: { sequelize },
} = require('../../database/connection')
const {
  ElementDetail,
  SemesterEnrollment,
  Studyright,
  Student,
  StudyrightElement,
  SISStudyRight,
  SISStudyRightElement,
} = require('../../models')
const { getCurrentSemester } = require('../semesters')
const { formatStudyright } = require('./studyprogrammeHelpers')
const { whereStudents, sinceDate } = require('.')

const getStudyRightsInProgramme = async (programmeCode, onlyGraduated) => {
  const where = { code: programmeCode }
  if (onlyGraduated) where.graduated = true

  const studyRights = await SISStudyRight.findAll({
    attributes: ['id'],
    include: {
      model: SISStudyRightElement,
      as: 'studyRightElements',
      attributes: [],
      where,
    },
    where: {
      studentNumber: {
        [Op.not]: null,
      },
      extentCode: 5,
    },
  })

  return (
    await SISStudyRight.findAll({
      attributes: ['id', 'studentNumber'],
      include: {
        model: SISStudyRightElement,
        as: 'studyRightElements',
        attributes: ['phase', 'code', 'name', 'startDate', 'endDate'],
      },
      where: {
        id: {
          [Op.in]: studyRights.map(studyRight => studyRight.toJSON().id),
        },
      },
    })
  ).map(studyRight => studyRight.toJSON())
}

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

const graduatedStudyRightsByStartDate = async (studytrack, startDate, endDate, combined) => {
  const query = {
    include: [
      {
        model: StudyrightElement,
        required: true,
        include: {
          model: ElementDetail,
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
      student_studentnumber: {
        [Op.not]: null,
      },
    },
  }
  if (!combined) {
    // This logic is based on function studentnumbersWithAllStudyrightElements from ./populations.js as the goal is to find the students
    // who have started their studies in the programme between startDate and endDate (i.e. the same logic as in class statistics)
    query.where[Op.and] = [
      sequelize.where(
        sequelize.fn('GREATEST', sequelize.col('studyright_elements.startdate'), sequelize.col('studyright.startdate')),
        { [Op.between]: [startDate, endDate] }
      ),
    ]
  } else {
    query.where.startdate = { [Op.between]: [startDate, endDate] }
  }
  return (await Studyright.findAll(query)).map(formatStudyright)
}

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
  const currentSemester = await getCurrentSemester()
  const students = await Student.findAll({
    attributes: ['studentnumber'],
    include: [
      {
        model: Studyright,
        required: true,
        include: [
          {
            model: StudyrightElement,
            required: true,
            where: {
              code: studytrack,
            },
          },
        ],
        attributes: ['studyrightid', 'enddate'],
        where: {
          graduated: 0,
          active: 0,
        },
      },
      {
        model: SemesterEnrollment,
        attributes: ['semestercode', 'enrollmenttype'],
      },
    ],
    where: {
      studentnumber: {
        [Op.in]: studentnumbers,
      },
    },
  })

  return students.filter(
    student =>
      student.studyrights[0].enddate <= new Date() ||
      !student.semester_enrollments.find(enrollment => enrollment.semestercode === currentSemester) ||
      student.semester_enrollments.find(enrollment => enrollment.semestercode === currentSemester).enrollmenttype === 3
  )
}

const getStudyRights = async students =>
  (
    await Studyright.findAll({
      attributes: [
        'studyrightid',
        'startdate',
        'studystartdate',
        'enddate',
        'graduated',
        'prioritycode',
        'extentcode',
        'cancelled',
        'facultyCode',
        'actual_studyrightid',
        'semesterEnrollments',
      ],
      where: {
        studentStudentnumber: students,
      },
      include: [
        {
          model: StudyrightElement,
          include: {
            model: ElementDetail,
            where: {
              type: 20,
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

module.exports = {
  getStudyRightsInProgramme,
  startedStudyrights,
  graduatedStudyRights,
  graduatedStudyRightsByStartDate,
  inactiveStudyrights,
  getStudyRights,
}
