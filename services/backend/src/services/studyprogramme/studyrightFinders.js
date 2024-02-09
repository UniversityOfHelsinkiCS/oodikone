const { Op } = require('sequelize')
const { whereStudents, sinceDate } = require('.')
const { ElementDetail, Studyright, SemesterEnrollment } = require('../../models')
const { StudyrightElement, Student } = require('../../models')
const { formatStudyright } = require('./studyprogrammeHelpers')
const {
  dbConnections: { sequelize },
} = require('../../database/connection')
const { getCurrentSemester } = require('../semesters')

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
              attributes: ['name', 'code', 'type'],
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
              attributes: ['name', 'code', 'type'],
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
  allStudyrights,
  startedStudyrights,
  graduatedStudyRights,
  graduatedStudyRightsByStartDate,
  inactiveStudyrights,
  previousStudyrights,
  followingStudyrights,
  getStudyRights,
}
